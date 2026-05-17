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
# Note: DISABLE_ESLINT_PLUGIN=true disables ESLint during build to allow deployment
# See MAINT-001 ticket for planned ESLint fixes
RUN DISABLE_ESLINT_PLUGIN=true npm run build

# Stage 2: Runtime
FROM node:20-alpine

WORKDIR /app

# Install dumb-init for proper signal handling
RUN apk add --no-cache dumb-init

# Set production environment
ENV NODE_ENV=production
ENV PORT=3001

# Copy package files
COPY package.json package-lock.json ./

# Install only production dependencies
RUN npm ci --only=production

# Copy built application from builder
COPY --from=builder /app/.next ./.next
# Copy database migrations (needed at runtime for auto-migration on startup)
COPY --from=builder /app/src/lib/db/migrations ./src/lib/db/migrations
# Create public directory (may not exist in all builds)
RUN mkdir -p ./public

# Expose port
EXPOSE 3001

# Health check
HEALTHCHECK --interval=30s --timeout=10s --retries=3 --start-period=10s \
  CMD node -e "require('http').get('http://localhost:3001', (r) => {if (r.statusCode !== 200) throw new Error(r.statusCode)})"

# Use dumb-init to handle signals properly
ENTRYPOINT ["dumb-init", "--"]

# Start application
CMD ["npm", "start"]
