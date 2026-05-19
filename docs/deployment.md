# Deployment Guide for Raspberry Pi

## Prerequisites

### Hardware
- Raspberry Pi 4 Model B (recommended) or later
- Minimum 4GB RAM
- Micro SD card (32GB or larger, Class 10)
- Power supply (5V, 3A minimum)
- Network connectivity (Ethernet or WiFi)

### Software
- Raspberry Pi OS (Bullseye or later, 64-bit)
- Docker (v20.10+)
- Docker Compose (v1.29+)
- Git (for pulling repository)

### Network Requirements
- Static IP address or DHCP reservation recommended
- Port 3000 exposed (application)
- Port 5432 accessible locally (PostgreSQL)

### Access
- SSH access to Raspberry Pi
- Sudo privileges for user account

## Prerequisites Check

Before deployment, verify your environment:

```bash
# Check Raspberry Pi OS
cat /etc/os-release

# Check Docker installation
docker --version
# Expected: Docker version 20.10 or later

# Check Docker Compose
docker-compose --version
# Expected: Docker Compose version 1.29 or later

# Check available disk space (need 5GB minimum)
df -h

# Check RAM (need 2GB free for comfortable operation)
free -h

# Check network connectivity
ping -c 3 8.8.8.8
```

## Environment Configuration

### Create Environment File

1. Copy the example environment file:

```bash
cp .env.local.example .env.production
```

2. Edit the production configuration:

```bash
nano .env.production
```

3. Set the following variables for Raspberry Pi deployment:

```bash
# Application
NODE_ENV=production
NEXT_PUBLIC_API_URL=http://raspberrypi.local:3000

# Database (PostgreSQL)
DATABASE_URL=postgresql://recipe_user:your_secure_password@localhost:5432/recipe_manager
DB_HOST=postgres
DB_PORT=5432
DB_NAME=recipe_manager
DB_USER=recipe_user
DB_PASSWORD=your_secure_password  # Change this to a strong password!

# JWT
JWT_SECRET=your_secure_jwt_secret_key_here  # Generate with: openssl rand -base64 32

# Logging
LOG_LEVEL=info
```

### Security Considerations

- **JWT_SECRET**: Generate a strong secret using `openssl rand -base64 32`
- **DB_PASSWORD**: Use a strong password (minimum 16 characters, mixed case, numbers, symbols)
- **Never commit** `.env.production` to version control
- Store credentials securely on the Raspberry Pi

### Environment Variables Reference

| Variable | Purpose | Example |
|----------|---------|---------|
| NODE_ENV | Node.js environment | production |
| NEXT_PUBLIC_API_URL | Frontend API endpoint | http://raspberrypi.local:3000 |
| DATABASE_URL | Full connection string | postgresql://recipe_user:pass@localhost:5432/recipe_manager |
| JWT_SECRET | Token signing key | (generated with openssl) |
| LOG_LEVEL | Logging detail | info, debug, error |

## Pre-Deployment Setup

### 1. Clone Repository

```bash
# Create a directory for the application
mkdir -p /home/pi/apps
cd /home/pi/apps

# Clone the repository
git clone https://github.com/yourusername/mixer.git
cd mixer
```

### 2. Install Node.js Dependencies

```bash
npm install
```

This installs all required npm packages listed in `package.json`.

### 3. Build Application for Production

```bash
npm run build
```

This creates an optimized production build in the `.next` directory.

### 4. Verify Build Success

```bash
# Check that build artifacts exist
ls -la .next/
# You should see: standalone, static, server, etc/
```

### 5. Test Application Locally

Before Docker deployment, optionally test locally:

```bash
npm start
# Open browser to http://localhost:3000
```

Press Ctrl+C to stop.

## Docker Deployment

### Docker Images

The deployment uses two containers:

- **app**: Next.js application (Node.js)
- **postgres**: PostgreSQL database

### Initial Deployment Steps

#### Step 1: Prepare Docker Environment

```bash
# Ensure Docker and Docker Compose are running
sudo systemctl start docker
sudo systemctl enable docker  # Enable auto-start on boot

# Verify Docker is accessible
docker ps
```

#### Step 2: Initialize Database

The first deployment initializes PostgreSQL:

```bash
# Create database and schema
docker-compose up -d postgres

# Wait 10 seconds for PostgreSQL to start
sleep 10

# Run database migrations (if applicable)
docker-compose exec postgres psql -U recipe_user -d recipe_manager -f /docker-entrypoint-initdb.d/init.sql
```

#### Step 3: Build and Start Application

```bash
# Build the application Docker image
docker-compose build

# Start all containers
docker-compose up -d

# Verify containers are running
docker-compose ps
```

Expected output:
```
NAME                COMMAND                  SERVICE             STATUS
mixer-postgres-1    "docker-entrypoint.s…"   postgres            Up 10 seconds
mixer-app-1         "node server.js"         app                 Up 5 seconds
```

#### Step 4: Verify Deployment

```bash
# Check application logs
docker-compose logs -f app

# Test application is responding
curl http://localhost:3000

# Expected: HTML response (home page)
```

Access the application:
- **Local network**: `http://raspberrypi.local:3000`
- **Direct IP**: `http://<your-pi-ip>:3000`

### Docker Compose Configuration

The deployment uses `docker-compose.yml`:

```yaml
version: '3.8'

services:
  postgres:
    image: postgres:15-alpine
    environment:
      POSTGRES_USER: recipe_user
      POSTGRES_PASSWORD: ${DB_PASSWORD}
      POSTGRES_DB: recipe_manager
    volumes:
      - postgres_data:/var/lib/postgresql/data
    ports:
      - "5432:5432"
    healthcheck:
      test: ["CMD-SHELL", "pg_isready -U recipe_user -d recipe_manager"]
      interval: 10s
      timeout: 5s
      retries: 5

  app:
    build: .
    environment:
      NODE_ENV: production
      DATABASE_URL: postgresql://recipe_user:${DB_PASSWORD}@postgres:5432/recipe_manager
      JWT_SECRET: ${JWT_SECRET}
    ports:
      - "3000:3000"
    depends_on:
      postgres:
        condition: service_healthy
    restart: always

volumes:
  postgres_data:

## Container Management

### Starting/Stopping Services

```bash
# Start all containers
docker-compose up -d

# Stop all containers (graceful shutdown)
docker-compose stop

# Stop and remove containers
docker-compose down

# Stop and remove everything including volumes
docker-compose down -v  # WARNING: Deletes database data!
```

### View Container Status

```bash
# Show running containers
docker-compose ps

# Show all containers (including stopped)
docker ps -a

# Show resource usage
docker stats
```

### Accessing Containers

```bash
# Execute command in app container
docker-compose exec app sh

# Execute command in postgres container
docker-compose exec postgres psql -U recipe_user -d recipe_manager

# Example: Connect to database directly
docker-compose exec postgres psql -U recipe_user -d recipe_manager -c "SELECT version();"
```

### Restart Services

```bash
# Restart all services
docker-compose restart

# Restart specific service
docker-compose restart app

# Restart with zero downtime (most applications)
docker-compose up -d --no-deps --build app
```

### Remove Images and Cleanup

```bash
# Remove unused images
docker image prune

# Remove all unused objects (images, containers, networks, volumes)
docker system prune

# Force remove containers
docker-compose rm -f
```

## Updating the Application

### Update Procedure

When new code is deployed, follow these steps:

```bash
# 1. Pull latest code
cd /home/pi/apps/mixer
git pull origin main

# 2. Check for environment variable changes
git log --oneline -10
# Review commit messages for configuration changes

# 3. Install any new dependencies
npm install

# 4. Build application
npm run build

# 5. Rebuild Docker image
docker-compose build

# 6. Restart application (zero-downtime for most cases)
docker-compose up -d --no-deps --build app

# 7. Verify deployment
docker-compose logs -f app
curl http://localhost:3000
```

### Zero-Downtime Updates

For production deployments requiring zero downtime:

```bash
# This command updates the app service without affecting other services
docker-compose up -d --no-deps --build app

# Verify the new version is running
docker-compose logs app | head -20
```

### Rollback Procedure

If an update causes issues:

```bash
# Revert to previous commit
git revert HEAD

# Rebuild and restart
docker-compose build
docker-compose up -d --no-deps --build app

# Monitor logs
docker-compose logs -f app
```

### Database Migrations

If a deployment includes database migrations:

```bash
# Before restarting app, run migrations
docker-compose exec postgres psql -U recipe_user -d recipe_manager -f migrations/latest.sql

# Then restart application
docker-compose restart app
```

## Logging and Monitoring

### View Application Logs

```bash
# View application logs (last 50 lines)
docker-compose logs app

# View database logs
docker-compose logs postgres

# View all service logs
docker-compose logs

# Follow logs in real-time
docker-compose logs -f app

# View logs from specific time
docker-compose logs --since 10m app

# View last N lines
docker-compose logs --tail 100 app
```

### Application Log Levels

Configure logging detail in `.env.production`:

```bash
LOG_LEVEL=info    # Standard production (info, warn, error)
LOG_LEVEL=debug   # Detailed troubleshooting (includes debug messages)
LOG_LEVEL=error   # Errors only
```

### Database Logs

```bash
# View PostgreSQL logs
docker-compose logs postgres

# Connect to database and check logs
docker-compose exec postgres psql -U recipe_user -d recipe_manager -c "SELECT * FROM pg_log;"
```

### Persisting Logs

By default, Docker logs are stored in:
```
/var/lib/docker/containers/<container-id>/<container-id>-json.log
```

To enable persistent logging, add to `docker-compose.yml`:

```yaml
services:
  app:
    logging:
      driver: "json-file"
      options:
        max-size: "100m"
        max-file: "10"
```

This limits logs to 100MB per file, keeping maximum 10 files.

### Health Checks

The PostgreSQL service includes a health check:

```bash
# View health status
docker-compose ps

# Health check is automatically performed every 10 seconds
# Failing health checks trigger automatic restart
```

## Troubleshooting

### Application won't start

**Symptom**: `docker-compose up` fails or app container exits immediately

**Solution**:
```bash
# Check application logs for errors
docker-compose logs app

# Common issues:
# 1. Environment variables not set
# Check .env.production exists and has all required variables

# 2. Database connection failed
# Verify PostgreSQL is running and healthy
docker-compose ps
docker-compose logs postgres

# 3. Port already in use
# Change port in docker-compose.yml or kill existing process
sudo lsof -i :3000
kill -9 <PID>
```

### Database connection errors

**Symptom**: "Unable to connect to database" in application logs

**Solution**:
```bash
# Verify PostgreSQL is running and healthy
docker-compose ps
# Status should show "Up (healthy)"

# Check database credentials match environment variables
cat .env.production | grep DATABASE_URL

# Connect directly to test database
docker-compose exec postgres psql -U recipe_user -d recipe_manager -c "SELECT 1;"

# Check PostgreSQL logs
docker-compose logs postgres

# Restart PostgreSQL container
docker-compose restart postgres
```

### High memory usage

**Symptom**: Application or database consuming too much memory

**Solution**:
```bash
# Monitor resource usage
docker stats

# Check for memory leaks in application
docker-compose logs app | grep -i memory

# Restart containers to clear memory
docker-compose restart

# Consider increasing Raspberry Pi swap:
# Check current swap
free -h

# Add swap if needed
sudo fallocate -l 2G /swapfile
sudo chmod 600 /swapfile
sudo mkswap /swapfile
sudo swapon /swapfile
```

### Slow performance

**Symptom**: Application responds slowly

**Solution**:
```bash
# Check database performance
docker-compose exec postgres psql -U recipe_user -d recipe_manager -c "\\dt"

# Review application logs for slow queries
docker-compose logs app | grep -i slow

# Check system resources
free -h
df -h
top

# Check network connectivity
ping -c 5 8.8.8.8

# Consider optimizing:
# 1. Database indexes
# 2. Application caching
# 3. Raspberry Pi thermal throttling (ensure good cooling)
```

### Port conflicts

**Symptom**: "Port 3000 already in use" or similar error

**Solution**:
```bash
# Find process using port 3000
sudo lsof -i :3000

# Kill the process
sudo kill -9 <PID>

# Or change port in docker-compose.yml
# Change "3000:3000" to "8080:3000"

# Restart services
docker-compose down
docker-compose up -d
```

### Network not accessible

**Symptom**: Cannot reach application from other devices

**Solution**:
```bash
# Verify container is running
docker-compose ps

# Test from Raspberry Pi locally
curl http://localhost:3000

# Check Raspberry Pi IP address
hostname -I

# From other device, try:
curl http://<raspberry-pi-ip>:3000

# Check firewall (if enabled)
sudo ufw status
sudo ufw allow 3000

# Verify network connectivity
ping <raspberry-pi-ip>
```

### Container keeps restarting

**Symptom**: Container exits and restarts in a loop

**Solution**:
```bash
# Check container logs
docker-compose logs app

# Look for crash reasons in logs

# If database health check is failing:
docker-compose logs postgres

# Disable auto-restart temporarily to debug
docker-compose stop
docker-compose up app  # Without -d flag to see live output

# Check environment variables
docker-compose config | grep -A 20 "environment:"
```

### Disk space issues

**Symptom**: "No space left on device" errors

**Solution**:
```bash
# Check disk usage
df -h

# Check Docker usage
docker system df

# Clean up unused Docker objects
docker system prune -a

# Check and clean old logs
sudo journalctl --vacuum=100M

# Move database to larger storage if available
# This requires backup and restore procedure
```
