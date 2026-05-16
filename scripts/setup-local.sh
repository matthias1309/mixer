#!/bin/bash
set -e

echo "========================================="
echo "Recipe Manager - Local Development Setup"
echo "========================================="
echo ""

# Check if docker is available
if ! command -v docker &> /dev/null; then
    echo "❌ Docker is not installed. Please install Docker first."
    exit 1
fi

# Get the directory where this script is located
SCRIPT_DIR="$( cd "$( dirname "${BASH_SOURCE[0]}" )" && pwd )"
PROJECT_ROOT="$( cd "$SCRIPT_DIR/.." && pwd )"

cd "$PROJECT_ROOT"

echo "[1/4] Stopping any existing containers..."
docker compose -f docker-compose.local.yml down -v 2>/dev/null || true

echo "[2/4] Starting PostgreSQL container..."
docker compose -f docker-compose.local.yml up -d

echo "[3/4] Waiting for PostgreSQL to be ready..."
for i in {1..30}; do
    if docker compose -f docker-compose.local.yml exec -T postgres pg_isready -U recipe_user -d recipe_manager &> /dev/null; then
        echo "    ✓ PostgreSQL is ready"
        break
    fi
    if [ $i -eq 30 ]; then
        echo "❌ PostgreSQL failed to start after 30 seconds"
        exit 1
    fi
    echo -n "."
    sleep 1
done

echo "[4/4] Running database migrations..."
MIGRATIONS_DIR="$PROJECT_ROOT/src/lib/db/migrations"

if [ ! -d "$MIGRATIONS_DIR" ]; then
    echo "❌ Migrations directory not found at $MIGRATIONS_DIR"
    exit 1
fi

# Read migrations as ordered files and execute them
for migration_file in "$MIGRATIONS_DIR"/*.sql; do
    if [ -f "$migration_file" ]; then
        filename=$(basename "$migration_file")
        echo "    Running: $filename"

        docker compose -f docker-compose.local.yml exec -T postgres psql \
            -U recipe_user \
            -d recipe_manager \
            -f /dev/stdin < "$migration_file" > /dev/null 2>&1 || true
    fi
done

echo ""
echo "========================================="
echo "✓ Setup Complete!"
echo "========================================="
echo ""
echo "Next steps:"
echo "1. Install dependencies (if needed): npm install"
echo "2. Seed test data: npm run db:seed"
echo "3. Start development server: npm run dev"
echo ""
echo "Database credentials:"
echo "  Host: localhost:5432"
echo "  User: recipe_user"
echo "  Password: local_password"
echo "  Database: recipe_manager"
echo ""
echo "PostgreSQL is running in Docker."
echo "Stop it with: npm run db:stop"
echo "========================================="
