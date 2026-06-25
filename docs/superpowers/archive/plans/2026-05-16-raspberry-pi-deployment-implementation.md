# Raspberry Pi Deployment Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Enable the Recipe Manager application to run in production on a Raspberry Pi with PostgreSQL, with a fully automated deployment script.

**Architecture:** Multi-stage Docker build with production optimization, docker-compose orchestration on PI with PostgreSQL persistence, and automated deployment script that builds locally, transfers image via Docker, and starts services.

**Tech Stack:** Docker, Docker Compose, Next.js, Node.js, PostgreSQL, Bash scripting, SSH

---

## File Structure

### New Files
- `Dockerfile` - Multi-stage production build
- `docker-compose.production.yml` - PI production configuration
- `scripts/deploy-pi.sh` - Automated deployment script
- `docs/deployment/raspberry-pi-setup.md` - Manual initialization guide
- `docs/deployment/raspberry-pi-troubleshooting.md` - Troubleshooting reference

### Modified Files
- `src/lib/db/init.ts` - Add PostgreSQL support via DATABASE_URL
- `package.json` - Add `pg` dependency

---

## Task Breakdown

### Task 1: Create Production Dockerfile

**Files:**
- Create: `Dockerfile`

- [ ] **Step 1: Create Dockerfile with multi-stage build**

Create file `Dockerfile`:

```dockerfile
# Stage 1: Builder
FROM node:20-alpine AS builder

WORKDIR /app

# Copy package files
COPY package.json package-lock.json ./

# Install dependencies (all, including devDependencies for build)
RUN npm ci

# Copy source code
COPY . .

# Build Next.js
RUN npm run build

# Stage 2: Runtime
FROM node:20-alpine

WORKDIR /app

# Set production environment
ENV NODE_ENV=production
ENV PORT=3001

# Copy package files
COPY package.json package-lock.json ./

# Install only production dependencies
RUN npm ci --only=production

# Copy built application from builder
COPY --from=builder /app/.next ./.next
COPY --from=builder /app/public ./public

# Expose port
EXPOSE 3001

# Health check
HEALTHCHECK --interval=30s --timeout=10s --retries=3 \
  CMD node -e "require('http').get('http://localhost:3001', (r) => {if (r.statusCode !== 200) throw new Error(r.statusCode)})"

# Start application
CMD ["npm", "run", "start"]
```

- [ ] **Step 2: Test Dockerfile builds successfully**

Run from repo root:
```bash
docker build -f Dockerfile -t mixer-app:test .
```

Expected: Build completes with "Successfully tagged mixer-app:test"

- [ ] **Step 3: Verify built image size**

Run:
```bash
docker images mixer-app:test
```

Expected: Size should be ~200-250MB (not 500MB+). If larger, build may be including devDependencies.

- [ ] **Step 4: Test running the image locally**

Run:
```bash
docker run -it --rm -p 3001:3001 \
  -e DATABASE_URL="sqlite:///.data/app.db" \
  -e NODE_ENV=production \
  mixer-app:test
```

Expected: App starts on port 3001 without errors. Press Ctrl+C to stop.

- [ ] **Step 5: Commit**

```bash
git add Dockerfile
git commit -m "build: add production dockerfile with multi-stage build"
```

---

### Task 2: Create docker-compose.production.yml

**Files:**
- Create: `docker-compose.production.yml`

- [ ] **Step 1: Create docker-compose.production.yml**

Create file `docker-compose.production.yml`:

```yaml
version: '3.8'

services:
  mixer-app:
    image: mixer-app:latest
    container_name: mixer-app
    ports:
      - "3001:3001"
    environment:
      DATABASE_URL: postgresql://${DB_USER}:${DB_PASSWORD}@mixer-db:5432/${DB_NAME}
      NODE_ENV: production
      JWT_SECRET: ${JWT_SECRET}
    depends_on:
      mixer-db:
        condition: service_healthy
    restart: unless-stopped
    healthcheck:
      test: ["CMD", "node", "-e", "require('http').get('http://localhost:3001', (r) => {if (r.statusCode !== 200) throw new Error(r.statusCode)})"]
      interval: 30s
      timeout: 10s
      retries: 3
      start_period: 10s

  mixer-db:
    image: postgres:16-alpine
    container_name: mixer-db
    environment:
      POSTGRES_USER: ${DB_USER}
      POSTGRES_PASSWORD: ${DB_PASSWORD}
      POSTGRES_DB: ${DB_NAME}
    volumes:
      - ./data/postgres:/var/lib/postgresql/data
    ports:
      - "5432:5432"
    restart: unless-stopped
    healthcheck:
      test: ["CMD-SHELL", "pg_isready -U ${DB_USER}"]
      interval: 10s
      timeout: 5s
      retries: 5
```

- [ ] **Step 2: Validate docker-compose syntax**

Run from repo root:
```bash
docker-compose -f docker-compose.production.yml config > /dev/null
```

Expected: No errors, validates the YAML syntax.

- [ ] **Step 3: Create a test .env.production file locally**

Run:
```bash
cat > .env.production.test << EOF
DB_USER=test_user
DB_PASSWORD=test_password
DB_NAME=mixer_test
JWT_SECRET=test-jwt-secret-key
EOF
```

- [ ] **Step 4: Test docker-compose with test environment file**

Run from repo root:
```bash
docker-compose -f docker-compose.production.yml --env-file .env.production.test up -d
```

Expected: Services start successfully. Check:
```bash
docker-compose -f docker-compose.production.yml ps
```

Should show both `mixer-app` and `mixer-db` as running.

- [ ] **Step 5: Verify database is accessible**

Run:
```bash
docker-compose -f docker-compose.production.yml exec mixer-db psql -U test_user -d mixer_test -c "\dt"
```

Expected: Shows "Did not find any relations" (or empty table list), confirming PostgreSQL is running.

- [ ] **Step 6: Clean up test containers**

Run:
```bash
docker-compose -f docker-compose.production.yml down
rm .env.production.test
```

- [ ] **Step 7: Commit**

```bash
git add docker-compose.production.yml
git commit -m "build: add docker-compose configuration for production"
```

---

### Task 3: Update src/lib/db/init.ts to Support PostgreSQL

**Files:**
- Modify: `src/lib/db/init.ts`

- [ ] **Step 1: Read current implementation**

Read current file to understand structure:
```bash
head -50 src/lib/db/init.ts
```

Note the current SQLite initialization logic.

- [ ] **Step 2: Install pg dependency**

Run:
```bash
npm install pg
npm install --save-dev @types/pg
```

Verify package.json has:
- `"pg": "^8.11.0"` (or latest)
- `"@types/pg": "^8.11.0"` (in devDependencies)

- [ ] **Step 3: Update src/lib/db/init.ts to support both databases**

Replace entire file with:

```typescript
import Database from 'better-sqlite3';
import { Pool } from 'pg';
import path from 'path';
import fs from 'fs';

let db: Database.Database;
let pgPool: Pool | null = null;

export type DbClient = Database.Database | Pool;

export function getDb(): DbClient {
  if (pgPool) {
    return pgPool;
  }
  if (db) {
    return db;
  }
  throw new Error('Database not initialized');
}

export function isPostgres(): boolean {
  return !!pgPool;
}

export async function initializeDatabase(): Promise<void> {
  const databaseUrl = process.env.DATABASE_URL;

  if (databaseUrl) {
    // Initialize PostgreSQL
    pgPool = new Pool({
      connectionString: databaseUrl,
    });

    // Test connection
    try {
      const client = await pgPool.connect();
      console.log('Connected to PostgreSQL');
      client.release();
    } catch (error) {
      console.error('Failed to connect to PostgreSQL:', error);
      throw error;
    }

    // Run migrations
    await runMigrations(pgPool);
  } else {
    // Initialize SQLite (development)
    const dbPath = path.join(process.cwd(), '.data', 'app.db');
    const dbDir = path.dirname(dbPath);

    if (!fs.existsSync(dbDir)) {
      fs.mkdirSync(dbDir, { recursive: true });
    }

    db = new Database(dbPath);
    db.pragma('journal_mode = WAL');

    console.log('Connected to SQLite');

    // Run migrations
    runMigrationsSync(db);
  }
}

function runMigrationsSync(database: Database.Database): void {
  const migrationsDir = path.join(process.cwd(), 'src', 'lib', 'db', 'migrations');

  if (!fs.existsSync(migrationsDir)) {
    console.log('No migrations directory found');
    return;
  }

  const migrationFiles = fs
    .readdirSync(migrationsDir)
    .filter((f) => f.endsWith('.sql'))
    .sort();

  for (const file of migrationFiles) {
    const filePath = path.join(migrationsDir, file);
    const sql = fs.readFileSync(filePath, 'utf-8');

    try {
      database.exec(sql);
      console.log(`Migration executed: ${file}`);
    } catch (error) {
      console.error(`Migration failed: ${file}`, error);
      throw error;
    }
  }
}

async function runMigrations(pool: Pool): Promise<void> {
  const migrationsDir = path.join(process.cwd(), 'src', 'lib', 'db', 'migrations');

  if (!fs.existsSync(migrationsDir)) {
    console.log('No migrations directory found');
    return;
  }

  const migrationFiles = fs
    .readdirSync(migrationsDir)
    .filter((f) => f.endsWith('.sql'))
    .sort();

  for (const file of migrationFiles) {
    const filePath = path.join(migrationsDir, file);
    const sql = fs.readFileSync(filePath, 'utf-8');

    try {
      await pool.query(sql);
      console.log(`Migration executed: ${file}`);
    } catch (error) {
      console.error(`Migration failed: ${file}`, error);
      throw error;
    }
  }
}

export function closeDatabase(): void {
  if (db) {
    db.close();
  }
  if (pgPool) {
    pgPool.end();
  }
}
```

- [ ] **Step 4: Verify TypeScript compiles**

Run:
```bash
npm run type-check
```

Expected: No TypeScript errors.

- [ ] **Step 5: Test locally with SQLite**

Run development server:
```bash
npm run dev
```

Expected: App starts normally on port 3000, using SQLite database.

- [ ] **Step 6: Test with DATABASE_URL environment variable**

Stop the dev server, then run:
```bash
DATABASE_URL="postgresql://localhost/test" npm run dev
```

Expected: App attempts to connect to PostgreSQL (will fail if DB doesn't exist, but shows correct behavior). Stop with Ctrl+C.

- [ ] **Step 7: Commit**

```bash
git add src/lib/db/init.ts package.json package-lock.json
git commit -m "feat: add postgresql support via DATABASE_URL environment variable"
```

---

### Task 4: Create Deployment Script (deploy-pi.sh)

**Files:**
- Create: `scripts/deploy-pi.sh`

- [ ] **Step 1: Create deploy-pi.sh script**

Create file `scripts/deploy-pi.sh`:

```bash
#!/bin/bash

set -e

# Color output
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
NC='\033[0m' # No Color

# Configuration
DOCKER_IMAGE="mixer-app:latest"
PI_HOST="dockerhome"
PI_APP_PATH="/opt/containers/apps/mixer"
COMPOSE_FILE="docker-compose.production.yml"

# Default values
DB_USER="mixer_user"
DB_NAME="mixer"
DB_PASSWORD=""
JWT_SECRET=""
PI_IP=""

# Function to print colored output
log_info() {
  echo -e "${GREEN}[INFO]${NC} $1"
}

log_warn() {
  echo -e "${YELLOW}[WARN]${NC} $1"
}

log_error() {
  echo -e "${RED}[ERROR]${NC} $1"
}

# Function to print usage
usage() {
  cat << EOF
Usage: $0 [OPTIONS]

OPTIONS:
  --db-password PASSWORD    PostgreSQL password (required)
  --jwt-secret SECRET       JWT secret for auth (required)
  --db-user USERNAME        PostgreSQL user (default: mixer_user)
  --db-name DBNAME          PostgreSQL database name (default: mixer)
  --pi-ip IP                PI IP address for verification (optional)
  --help                    Show this help message

EXAMPLE:
  $0 --db-password "secure123" --jwt-secret "jwt-secret-key"
EOF
  exit 1
}

# Parse arguments
while [[ $# -gt 0 ]]; do
  case $1 in
    --db-password)
      DB_PASSWORD="$2"
      shift 2
      ;;
    --jwt-secret)
      JWT_SECRET="$2"
      shift 2
      ;;
    --db-user)
      DB_USER="$2"
      shift 2
      ;;
    --db-name)
      DB_NAME="$2"
      shift 2
      ;;
    --pi-ip)
      PI_IP="$2"
      shift 2
      ;;
    --help)
      usage
      ;;
    *)
      log_error "Unknown option: $1"
      usage
      ;;
  esac
done

# Validate required arguments
if [[ -z "$DB_PASSWORD" || -z "$JWT_SECRET" ]]; then
  log_error "Missing required arguments"
  usage
fi

# Step 1: Validate prerequisites
log_info "Validating prerequisites..."

if ! command -v docker &> /dev/null; then
  log_error "Docker is not installed or not in PATH"
  exit 1
fi

if ! docker ps > /dev/null 2>&1; then
  log_error "Docker daemon is not running"
  exit 1
fi

if ! ssh -o ConnectTimeout=5 "$PI_HOST" "exit" > /dev/null 2>&1; then
  log_error "Cannot connect to PI at $PI_HOST via SSH"
  exit 1
fi

log_info "Prerequisites validated ✓"

# Step 2: Build Docker image locally
log_info "Building Docker image locally..."
docker build -f Dockerfile -t "$DOCKER_IMAGE" .
log_info "Docker image built ✓"

# Step 3: Save and load image on PI
log_info "Transferring Docker image to PI..."
docker save "$DOCKER_IMAGE" | ssh "$PI_HOST" 'docker load'
log_info "Docker image transferred ✓"

# Step 4: Prepare PI directory
log_info "Preparing directories on PI..."
ssh "$PI_HOST" << 'SCRIPT'
mkdir -p /opt/containers/apps/mixer/data/postgres
chmod 755 /opt/containers/apps/mixer
SCRIPT
log_info "Directories prepared ✓"

# Step 5: Generate .env.production file
log_info "Generating .env.production file..."
ENV_FILE=$(mktemp)
cat > "$ENV_FILE" << EOF
DB_USER=$DB_USER
DB_PASSWORD=$DB_PASSWORD
DB_NAME=$DB_NAME
JWT_SECRET=$JWT_SECRET
EOF

log_info ".env.production generated ✓"

# Step 6: Copy configuration files to PI
log_info "Copying configuration to PI..."
scp "$COMPOSE_FILE" "$PI_HOST:$PI_APP_PATH/$COMPOSE_FILE"
scp "$ENV_FILE" "$PI_HOST:$PI_APP_PATH/.env.production"
rm "$ENV_FILE"
log_info "Configuration copied ✓"

# Step 7: Stop old containers and start new ones
log_info "Deploying application..."
ssh "$PI_HOST" << DEPLOY_SCRIPT
set -e
cd $PI_APP_PATH
docker compose -f $COMPOSE_FILE down || true
docker compose -f $COMPOSE_FILE up -d
DEPLOY_SCRIPT
log_info "Application deployed ✓"

# Step 8: Verify deployment
log_info "Verifying deployment..."
sleep 5

# Try to verify with curl if IP provided
if [[ -n "$PI_IP" ]]; then
  if curl -s -m 5 "http://$PI_IP:3001" > /dev/null; then
    log_info "Application is responding on http://$PI_IP:3001 ✓"
  else
    log_warn "Could not verify application response. Check logs manually:"
    log_warn "  ssh $PI_HOST 'cd $PI_APP_PATH && docker compose logs mixer-app'"
  fi
else
  log_info "Application deployed. Verify with:"
  log_info "  ssh $PI_HOST 'cd $PI_APP_PATH && docker compose ps'"
  log_info "  ssh $PI_HOST 'cd $PI_APP_PATH && docker compose logs mixer-app'"
fi

# Step 9: Print summary
log_info "========================================"
log_info "Deployment complete!"
log_info "========================================"
log_info "App location: $PI_APP_PATH"
log_info "Database: PostgreSQL ($DB_USER@$DB_NAME)"
log_info ""
log_info "Useful commands:"
log_info "  View status:     ssh $PI_HOST 'cd $PI_APP_PATH && docker compose ps'"
log_info "  View logs:       ssh $PI_HOST 'cd $PI_APP_PATH && docker compose logs -f mixer-app'"
log_info "  Enter database:  ssh $PI_HOST 'cd $PI_APP_PATH && docker compose exec mixer-db psql -U $DB_USER -d $DB_NAME'"
log_info "  Stop services:   ssh $PI_HOST 'cd $PI_APP_PATH && docker compose down'"
log_info ""
```

Make script executable:
```bash
chmod +x scripts/deploy-pi.sh
```

- [ ] **Step 2: Test script help and validation**

Run:
```bash
./scripts/deploy-pi.sh --help
```

Expected: Shows usage information.

Run without arguments:
```bash
./scripts/deploy-pi.sh
```

Expected: Shows error about missing arguments.

- [ ] **Step 3: Verify script syntax**

Run:
```bash
bash -n scripts/deploy-pi.sh
```

Expected: No syntax errors.

- [ ] **Step 4: Commit**

```bash
git add scripts/deploy-pi.sh
git commit -m "build: add automated deployment script for raspberry pi"
```

---

### Task 5: Create Raspberry Pi Setup Guide

**Files:**
- Create: `docs/deployment/raspberry-pi-setup.md`

- [ ] **Step 1: Create setup documentation**

Create file `docs/deployment/raspberry-pi-setup.md`:

```markdown
# Raspberry Pi Setup Guide

## Overview

This guide walks through the one-time setup required to deploy the Recipe Manager application to a Raspberry Pi.

## Prerequisites

- Raspberry Pi with Docker and Docker Compose already installed
- SSH access configured (tested: `ssh dockerhome` works)
- Network connectivity between your local machine and PI
- Sufficient disk space on PI (~5GB recommended for images + database)

## One-Time Setup

### Step 1: Verify SSH Access

Confirm you can SSH to the PI:

\`\`\`bash
ssh dockerhome
exit
\`\`\`

If this fails, configure SSH access first:
- Ensure your SSH key is in \`~/.ssh/id_rsa\` (or configured in \`~/.ssh/config\`)
- PI hostname should resolve to an IP or be configured in \`/etc/hosts\` or \`~/.ssh/config\`

### Step 2: Verify Docker on PI

SSH to the PI and check Docker is running:

\`\`\`bash
ssh dockerhome
docker ps
docker compose version
exit
\`\`\`

Both commands should work without errors.

### Step 3: Create Application Directory

SSH to PI and create the application directory:

\`\`\`bash
ssh dockerhome
mkdir -p /opt/containers/apps/mixer/data/postgres
chmod 755 /opt/containers/apps/mixer
ls -la /opt/containers/apps/
exit
\`\`\`

Expected output shows \`mixer\` directory with \`data/postgres\` subdirectory.

### Step 4: Test SSH Key-Based Authentication

Ensure you can run commands on PI without password prompts (required by deploy script):

\`\`\`bash
ssh dockerhome "echo 'SSH works!'"
\`\`\`

If this prompts for a password, configure SSH key:
1. On local machine: \`ssh-keygen -t ed25519 -f ~/.ssh/id_rsa\`
2. Copy key to PI: \`ssh-copy-id -i ~/.ssh/id_rsa.pub dockerhome\`

## First Deployment

### Prerequisites

Generate strong secrets:

\`\`\`bash
# Generate JWT secret
JWT_SECRET=\$(openssl rand -hex 32)
echo "JWT_SECRET=\$JWT_SECRET"

# Generate DB password
DB_PASSWORD=\$(openssl rand -hex 16)
echo "DB_PASSWORD=\$DB_PASSWORD"
\`\`\`

Note these values—you'll need them for deployment.

### Run Deployment Script

From repository root on your local machine:

\`\`\`bash
./scripts/deploy-pi.sh \\
  --db-password "YOUR_DB_PASSWORD" \\
  --jwt-secret "YOUR_JWT_SECRET" \\
  --pi-ip "192.168.X.X"  # Optional: IP of PI for verification
\`\`\`

Expected output:
- ✓ Prerequisites validated
- ✓ Docker image built
- ✓ Docker image transferred
- ✓ Directories prepared
- ✓ .env.production generated
- ✓ Configuration copied
- ✓ Application deployed
- ✓ Application responding

### Verify Deployment

Check that services are running on PI:

\`\`\`bash
ssh dockerhome 'cd /opt/containers/apps/mixer && docker compose ps'
\`\`\`

Expected output:

\`\`\`
NAME                  IMAGE                      COMMAND                  SERVICE      STATUS      PORTS
mixer-app             mixer-app:latest           "npm run start"           mixer-app    Up (healthy)   0.0.0.0:3001->3001/tcp
mixer-db              postgres:16-alpine         "postgres"               mixer-db     Up (healthy)   0.0.0.0:5432->5432/tcp
\`\`\`

Both services should show "Up (healthy)".

### Access the Application

Open browser and navigate to:

\`\`\`
http://YOUR_PI_IP:3001
\`\`\`

You should see the Recipe Manager login page.

## Subsequent Deployments

After initial setup, deploying code updates is simple:

\`\`\`bash
./scripts/deploy-pi.sh \\
  --db-password "SAME_AS_BEFORE" \\
  --jwt-secret "SAME_AS_BEFORE"
\`\`\`

Script will:
1. Rebuild with latest code
2. Stop old containers
3. Start new containers
4. Preserve database (no data loss)

**Note:** App will be offline for ~30 seconds during redeploy.

## Troubleshooting

### SSH Connection Fails

\`\`\`bash
# Test SSH connection with verbose output
ssh -v dockerhome "exit"
\`\`\`

**Common issues:**
- Host not in DNS/hosts file → Add to \`~/.ssh/config\` or \`/etc/hosts\`
- SSH key not configured → Run \`ssh-keygen\` and \`ssh-copy-id\`
- Wrong username → Verify with \`ssh USER@HOSTNAME\`

### Containers Won't Start

SSH to PI and check logs:

\`\`\`bash
ssh dockerhome 'cd /opt/containers/apps/mixer && docker compose logs'
\`\`\`

**Common issues:**
- Port 3001 already in use → Check \`lsof -i :3001\` or change port
- Out of disk space → Check \`df -h\`
- Missing .env.production → Re-run deploy script

### Database Connection Fails

Check app logs:

\`\`\`bash
ssh dockerhome 'cd /opt/containers/apps/mixer && docker compose logs mixer-app | grep -i database'
\`\`\`

Verify database is running:

\`\`\`bash
ssh dockerhome 'cd /opt/containers/apps/mixer && docker compose logs mixer-db'
\`\`\`

### Manual Database Access

If you need to access PostgreSQL directly:

\`\`\`bash
ssh dockerhome 'cd /opt/containers/apps/mixer && docker compose exec mixer-db psql -U mixer_user -d mixer'
\`\`\`

(Adjust \`-U\` username and \`-d\` database name if you used different values)

## Maintenance

### Viewing Application Logs

\`\`\`bash
ssh dockerhome 'cd /opt/containers/apps/mixer && docker compose logs -f mixer-app'
\`\`\`

Press Ctrl+C to exit log stream.

### Restarting Services

\`\`\`bash
ssh dockerhome 'cd /opt/containers/apps/mixer && docker compose restart'
\`\`\`

### Stopping Services

\`\`\`bash
ssh dockerhome 'cd /opt/containers/apps/mixer && docker compose down'
\`\`\`

Services can be restarted later with:

\`\`\`bash
ssh dockerhome 'cd /opt/containers/apps/mixer && docker compose up -d'
\`\`\`

### Backup Database

Backup PostgreSQL data:

\`\`\`bash
ssh dockerhome 'tar -czf ~/mixer-db-backup-\$(date +%Y%m%d).tar.gz /opt/containers/apps/mixer/data/postgres'
\`\`\`

## Support

For issues not covered in troubleshooting:

1. Check app logs: \`docker compose logs mixer-app\`
2. Check database logs: \`docker compose logs mixer-db\`
3. Check Docker Compose status: \`docker compose ps\`
4. Review design spec: \`docs/superpowers/specs/2026-05-16-raspberry-pi-deployment-design.md\`
```

- [ ] **Step 2: Create docs/deployment directory if needed**

Run:
```bash
mkdir -p docs/deployment
```

- [ ] **Step 3: Verify markdown syntax**

Run:
```bash
grep -E '^\[|^#{1,6} |^-|^\*' docs/deployment/raspberry-pi-setup.md | head -20
```

Expected: Shows markdown structure (headings, lists, links).

- [ ] **Step 4: Commit**

```bash
git add docs/deployment/raspberry-pi-setup.md
git commit -m "docs: add raspberry pi setup guide"
```

---

### Task 6: Create Raspberry Pi Troubleshooting Guide

**Files:**
- Create: `docs/deployment/raspberry-pi-troubleshooting.md`

- [ ] **Step 1: Create troubleshooting documentation**

Create file `docs/deployment/raspberry-pi-troubleshooting.md`:

```markdown
# Raspberry Pi Deployment Troubleshooting

## Common Issues & Solutions

### Deployment Script Issues

#### Deploy script hangs when building image

**Problem:** \`docker build\` takes a very long time or appears to hang.

**Solutions:**
1. Check disk space on local machine: \`df -h /\`
2. Check Docker disk usage: \`docker system df\`
3. Check if Docker process is running: \`docker ps\`
4. Kill and restart script, allow more time for Raspberry Pi to build image (slower than modern CPUs)

#### "Cannot connect to PI" error

**Problem:** \`Cannot connect to PI at dockerhome via SSH\`

**Solutions:**
1. Verify PI is reachable:
   \`\`\`bash
   ping dockerhome
   \`\`\`

2. Verify SSH works:
   \`\`\`bash
   ssh dockerhome "exit"
   \`\`\`

3. If still fails, check \`~/.ssh/config\` or \`/etc/hosts\` contains PI hostname
4. Test with explicit IP:
   \`\`\`bash
   ssh user@192.168.X.X "exit"
   \`\`\`

#### "docker load" fails during image transfer

**Problem:** \`Cannot load image on PI, command not found\`

**Solutions:**
1. Verify Docker is installed on PI:
   \`\`\`bash
   ssh dockerhome "docker --version"
   \`\`\`

2. Verify docker daemon is running:
   \`\`\`bash
   ssh dockerhome "docker ps"
   \`\`\`

3. If user doesn't have Docker permissions:
   \`\`\`bash
   ssh dockerhome "sudo usermod -aG docker $USER"
   \`\`\`
   (Requires PI login, then user must log out and back in)

#### "compose up" fails after deployment

**Problem:** Containers start but immediately exit or don't respond.

**Solutions:**
1. Check which service failed:
   \`\`\`bash
   ssh dockerhome 'cd /opt/containers/apps/mixer && docker compose ps'
   \`\`\`

2. View logs of failing service:
   \`\`\`bash
   ssh dockerhome 'cd /opt/containers/apps/mixer && docker compose logs mixer-app'
   ssh dockerhome 'cd /opt/containers/apps/mixer && docker compose logs mixer-db'
   \`\`\`

3. Check if .env.production exists:
   \`\`\`bash
   ssh dockerhome 'ls -la /opt/containers/apps/mixer/.env.production'
   \`\`\`

4. Verify variables are set:
   \`\`\`bash
   ssh dockerhome 'cat /opt/containers/apps/mixer/.env.production'
   \`\`\`

### Application Runtime Issues

#### Application crashes or restarts repeatedly

**Problem:** \`docker compose ps\` shows mixer-app restarting.

**Solutions:**
1. Check app logs:
   \`\`\`bash
   ssh dockerhome 'cd /opt/containers/apps/mixer && docker compose logs mixer-app | tail -50'
   \`\`\`

2. Common causes:
   - Missing DATABASE_URL → Check \`.env.production\` exists and has \`DB_*\` variables
   - Invalid JWT_SECRET → Verify it's set in \`.env.production\`
   - Port 3001 in use → Check \`lsof -i :3001\` or change port in compose file
   - Out of memory → Check \`free -h\` on PI

3. Manually restart:
   \`\`\`bash
   ssh dockerhome 'cd /opt/containers/apps/mixer && docker compose restart mixer-app'
   \`\`\`

#### Application returns 500 errors

**Problem:** App responds but returns Internal Server Error (500).

**Solutions:**
1. Check app logs for error details:
   \`\`\`bash
   ssh dockerhome 'cd /opt/containers/apps/mixer && docker compose logs mixer-app | grep -i error'
   \`\`\`

2. Common causes:
   - Database not ready → Wait 10 seconds, refresh page
   - Query timeout → Check database performance with \`docker compose logs mixer-db\`
   - Missing tables → Verify migrations ran (check app startup logs)

#### Application not responding on port 3001

**Problem:** \`curl http://PI_IP:3001\` times out or refuses connection.

**Solutions:**
1. Verify app is running:
   \`\`\`bash
   ssh dockerhome 'cd /opt/containers/apps/mixer && docker compose ps mixer-app'
   \`\`\`

2. Verify port is exposed:
   \`\`\`bash
   ssh dockerhome 'docker port mixer-app'
   \`\`\`

3. Check for firewall:
   \`\`\`bash
   ssh dockerhome 'sudo ufw status'
   \`\`\`
   If active, allow port:
   \`\`\`bash
   ssh dockerhome 'sudo ufw allow 3001'
   \`\`\`

4. Test from PI locally:
   \`\`\`bash
   ssh dockerhome 'curl http://localhost:3001'
   \`\`\`

### Database Issues

#### Database fails to start

**Problem:** \`docker compose logs mixer-db\` shows errors.

**Solutions:**
1. Check PostgreSQL logs:
   \`\`\`bash
   ssh dockerhome 'cd /opt/containers/apps/mixer && docker compose logs mixer-db | tail -50'
   \`\`\`

2. Common causes:
   - Corrupted data → Delete volume and restart:
     \`\`\`bash
     ssh dockerhome 'rm -rf /opt/containers/apps/mixer/data/postgres/*'
     ssh dockerhome 'cd /opt/containers/apps/mixer && docker compose up -d mixer-db'
     \`\`\`
     **Warning:** This deletes all data. Only do if backups exist.

   - Wrong password in .env.production → Re-run deploy script with correct password

   - Port 5432 in use → Change port in docker-compose or kill process:
     \`\`\`bash
     ssh dockerhome 'lsof -i :5432'
     \`\`\`

#### Cannot connect to database from app

**Problem:** App logs show "connection refused" or "host not found".

**Solutions:**
1. Verify database is running:
   \`\`\`bash
   ssh dockerhome 'cd /opt/containers/apps/mixer && docker compose exec mixer-db pg_isready'
   \`\`\`

2. Verify app can resolve hostname:
   \`\`\`bash
   ssh dockerhome 'cd /opt/containers/apps/mixer && docker compose exec mixer-app ping mixer-db'
   \`\`\`

3. Verify DATABASE_URL in .env.production:
   \`\`\`bash
   ssh dockerhome 'cat /opt/containers/apps/mixer/.env.production | grep DATABASE_URL'
   \`\`\`
   Should show: \`DATABASE_URL=postgresql://USER:PASSWORD@mixer-db:5432/DBNAME\`

#### Migrations fail or tables don't exist

**Problem:** App starts but recipes/users tables don't exist.

**Solutions:**
1. Check app logs for migration errors:
   \`\`\`bash
   ssh dockerhome 'cd /opt/containers/apps/mixer && docker compose logs mixer-app | grep -i migration'
   \`\`\`

2. Manually run migrations:
   \`\`\`bash
   ssh dockerhome 'cd /opt/containers/apps/mixer && docker compose restart mixer-app'
   \`\`\`
   Wait 10 seconds for app to boot and run migrations.

3. Verify tables exist:
   \`\`\`bash
   ssh dockerhome 'cd /opt/containers/apps/mixer && docker compose exec mixer-db psql -U mixer_user -d mixer -c "\\dt"'
   \`\`\`
   Should list tables like \`recipes\`, \`users\`, \`ingredients\`, etc.

### Performance Issues

#### App is slow or unresponsive

**Problem:** Pages load slowly or time out.

**Solutions:**
1. Check CPU/memory on PI:
   \`\`\`bash
   ssh dockerhome 'top -b -n 1 | head -20'
   ssh dockerhome 'free -h'
   \`\`\`

2. Check Docker stats:
   \`\`\`bash
   ssh dockerhome 'docker stats --no-stream'
   \`\`\`

3. Check database performance:
   \`\`\`bash
   ssh dockerhome 'cd /opt/containers/apps/mixer && docker compose logs mixer-db | grep -i slow'
   \`\`\`

4. Increase resource limits in docker-compose if possible:
   Edit \`docker-compose.production.yml\` and add under services:
   \`\`\`yaml
   services:
     mixer-app:
       mem_limit: 512m
       cpus: 1.0
   \`\`\`

#### Database disk space full

**Problem:** \`docker compose ps\` shows mixer-db unhealthy, logs mention disk space.

**Solutions:**
1. Check disk usage on PI:
   \`\`\`bash
   ssh dockerhome 'df -h /opt/containers/apps/mixer'
   \`\`\`

2. Check database size:
   \`\`\`bash
   ssh dockerhome 'du -sh /opt/containers/apps/mixer/data/postgres'
   \`\`\`

3. Solutions:
   - Expand PI storage (add external USB drive)
   - Clean up old data (if applicable)
   - Increase Raspberry Pi SD card size

### Recovery & Reset

#### Full reset (nuclear option)

**Problem:** Services are completely broken and you want to start fresh.

**Warning:** This deletes all application data. Only do if you have backups.

**Steps:**
\`\`\`bash
ssh dockerhome << 'RESET'
cd /opt/containers/apps/mixer
docker compose down
rm -rf data/postgres/*
docker compose up -d
RESET
\`\`\`

Wait 30 seconds for services to initialize. Then re-run deploy script.

#### Restore from backup

**Problem:** You have a database backup and want to restore.

\`\`\`bash
ssh dockerhome << 'RESTORE'
cd /opt/containers/apps/mixer
docker compose down
rm -rf data/postgres/*
tar -xzf /path/to/backup.tar.gz -C /
docker compose up -d
RESTORE
\`\`\`

## Debug Commands Reference

```bash
# View all services and their status
ssh dockerhome 'cd /opt/containers/apps/mixer && docker compose ps'

# View last 50 lines of app logs
ssh dockerhome 'cd /opt/containers/apps/mixer && docker compose logs -n 50 mixer-app'

# Follow app logs in real-time (Ctrl+C to exit)
ssh dockerhome 'cd /opt/containers/apps/mixer && docker compose logs -f mixer-app'

# Check app resource usage
ssh dockerhome 'docker stats mixer-app --no-stream'

# Execute command in app container
ssh dockerhome 'cd /opt/containers/apps/mixer && docker compose exec mixer-app ls -la'

# Execute psql in database container
ssh dockerhome 'cd /opt/containers/apps/mixer && docker compose exec mixer-db psql -U mixer_user -d mixer'

# View docker-compose configuration
ssh dockerhome 'cd /opt/containers/apps/mixer && docker compose config'

# Restart all services
ssh dockerhome 'cd /opt/containers/apps/mixer && docker compose restart'

# Restart specific service
ssh dockerhome 'cd /opt/containers/apps/mixer && docker compose restart mixer-app'
```

## Still Having Issues?

1. Review the [Setup Guide](./raspberry-pi-setup.md)
2. Check the [Deployment Design](../superpowers/specs/2026-05-16-raspberry-pi-deployment-design.md)
3. Verify prerequisites are met
4. Collect logs and review them carefully
5. Try the debug commands above
```

- [ ] **Step 2: Commit**

```bash
git add docs/deployment/raspberry-pi-troubleshooting.md
git commit -m "docs: add raspberry pi troubleshooting guide"
```

---

### Task 7: Update .gitignore for Deployment Files

**Files:**
- Modify: `.gitignore`

- [ ] **Step 1: Read current .gitignore**

Run:
```bash
cat .gitignore
```

Note what's already ignored.

- [ ] **Step 2: Ensure deployment artifacts are ignored**

Edit `.gitignore` and add these lines if not already present:

```
# Environment files (never commit production secrets)
.env.production
.env.production.local
.env.production.test

# Deployment temporary files
.deploy-tmp*

# Docker local volumes (created by deployment)
/opt/containers/
```

- [ ] **Step 3: Verify .env.production is ignored**

Run:
```bash
# Create test file
touch .env.production.test

# Check git status
git status

# Should show: nothing to commit (unless .env.production is in repo already)
```

If \`.env.production\` appears in output, it's already in repo—you may want to remove it:
```bash
git rm --cached .env.production
git commit -m "chore: remove .env.production from repo"
```

- [ ] **Step 4: Commit .gitignore changes**

```bash
git add .gitignore
git commit -m "chore: add deployment artifacts to .gitignore"
```

---

### Task 8: Final Integration Test

**Files:**
- No new files, verify existing setup

- [ ] **Step 1: Verify all files exist and are committed**

Run:
```bash
git log --oneline | head -10
git status
```

Expected: Clean working tree (nothing to commit).

Verify files exist:
```bash
ls -la Dockerfile docker-compose.production.yml scripts/deploy-pi.sh
ls -la docs/deployment/
```

- [ ] **Step 2: Test the full deployment script locally (dry run)**

Run:
```bash
./scripts/deploy-pi.sh --help
```

Expected: Shows usage with all options.

- [ ] **Step 3: Verify TypeScript and linting**

Run:
```bash
npm run type-check
npm run lint
```

Expected: No errors.

- [ ] **Step 4: Verify tests still pass**

Run:
```bash
npm run test -- --passWithNoTests
```

Expected: All tests pass or skip gracefully.

- [ ] **Step 5: Build Docker image locally one more time**

Run:
```bash
docker build -f Dockerfile -t mixer-app:final-test .
```

Expected: Builds successfully, size ~200-250MB.

- [ ] **Step 6: Create final commit with summary**

Run:
```bash
git log --oneline | head -5
```

Should show:
- Add raspberry pi troubleshooting guide
- Add raspberry pi setup guide
- Add automated deployment script
- Update src/lib/db/init.ts for PostgreSQL
- Add production docker-compose configuration
- Add production dockerfile
(in reverse chronological order)

- [ ] **Step 7: Summary**

All tasks complete. System is ready for deployment to Raspberry Pi.

**Next Steps:**
1. Follow [raspberry-pi-setup.md](../docs/deployment/raspberry-pi-setup.md) for one-time PI initialization
2. Run \`./scripts/deploy-pi.sh\` with proper secrets to deploy
3. Refer to [raspberry-pi-troubleshooting.md](../docs/deployment/raspberry-pi-troubleshooting.md) if issues arise

---

## Summary

Implementation plan covers 8 tasks:

1. ✅ Dockerfile with multi-stage build
2. ✅ docker-compose.production.yml configuration
3. ✅ PostgreSQL support in application code
4. ✅ Automated deployment script
5. ✅ Raspberry Pi setup guide
6. ✅ Troubleshooting reference
7. ✅ .gitignore updates
8. ✅ Final integration verification

**Files Created:** 6  
**Files Modified:** 3  
**Total Commits:** 8  
**Estimated Time:** 2-3 hours
