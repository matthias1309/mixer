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
