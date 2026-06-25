# Raspberry Pi Setup Guide

> **⚠️ DEPRECATED (MAINT-003):** Production has moved from the self-hosted
> Raspberry Pi to Uberspace (`https://matt-maxx.de/rezepte`), with an
> automated GitHub Actions deploy and a SQLite production database. This
> guide and the related Pi files (`docker-compose.production.yml`,
> `docker-compose.yml`, `Caddyfile`, `scripts/deploy-pi.sh`) are kept for
> reference but are no longer used for deployments. See
> `docs/deployment/uberspace-setup.md` for the current setup.

## See Implementation Plan

Complete setup instructions are documented in:
`docs/superpowers/plans/2026-05-16-raspberry-pi-deployment-implementation.md` → **Task 5**

## Quick Start

1. **Verify Prerequisites:**
   ```bash
   ssh dockerhome
   docker ps
   docker compose version
   exit
   ```

2. **Create Application Directory:**
   ```bash
   ssh dockerhome
   mkdir -p /opt/containers/apps/mixer/data/postgres
   chmod 755 /opt/containers/apps/mixer
   exit
   ```

3. **Generate Secrets:**
   ```bash
   JWT_SECRET=$(openssl rand -hex 32)
   DB_PASSWORD=$(openssl rand -hex 16)
   ```

4. **Deploy Application:**
   ```bash
   ./scripts/deploy-pi.sh \
     --db-password "YOUR_PASSWORD" \
     --jwt-secret "YOUR_JWT_SECRET"
   ```

5. **Verify Deployment:**
   ```bash
   ssh dockerhome 'cd /opt/containers/apps/mixer && docker compose ps'
   ```

## Full Documentation

For detailed setup instructions, prerequisites, and troubleshooting, see the full setup guide in the implementation plan.
