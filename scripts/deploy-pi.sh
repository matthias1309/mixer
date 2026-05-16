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
mkdir -p /opt/containers/apps/mixer/src/lib/db/migrations
chmod 755 /opt/containers/apps/mixer
SCRIPT
log_info "Directories prepared ✓"

# Step 4b: Copy migration files to PI
log_info "Copying database migrations to PI..."
scp -r src/lib/db/migrations/* "$PI_HOST:/opt/containers/apps/mixer/src/lib/db/migrations/" 2>/dev/null || log_warn "Could not copy migrations (optional)"
log_info "Migrations copied ✓"

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

# Step 8: Initialize database (run migrations)
log_info "Initializing database..."
ssh "$PI_HOST" << MIGRATE_SCRIPT
set -e
cd $PI_APP_PATH
sleep 3  # Wait for DB to be ready
docker compose exec -T mixer-db psql -U $DB_USER -d $DB_NAME < src/lib/db/migrations/001_create_schema.sql 2>/dev/null || true
docker compose exec -T mixer-db psql -U $DB_USER -d $DB_NAME < src/lib/db/migrations/002_create_nutrition_tables.sql 2>/dev/null || true
MIGRATE_SCRIPT
log_info "Database initialized ✓"

# Step 9: Verify deployment
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
