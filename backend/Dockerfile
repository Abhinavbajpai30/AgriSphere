# Multi-stage build for production optimization
FROM node:16-alpine AS base

# Set working directory
WORKDIR /app

# Install system dependencies for native modules
RUN apk add --no-cache \
    python3 \
    make \
    g++ \
    && rm -rf /var/cache/apk/*

# Copy package files
COPY package*.json ./

# Development stage
FROM base AS development
RUN npm ci --include=dev
COPY . .
EXPOSE 5000
CMD ["npm", "run", "dev"]

# Production dependencies stage
FROM base AS dependencies
RUN npm ci --only=production --no-audit --no-fund

# Production stage
FROM node:16-alpine AS production

# Create app user for security
RUN addgroup -g 1001 -S nodejs
RUN adduser -S backend -u 1001

# Set working directory
WORKDIR /app

# Copy production dependencies
COPY --from=dependencies --chown=backend:nodejs /app/node_modules ./node_modules

# Copy application code
COPY --chown=backend:nodejs . .

# Create necessary directories
RUN mkdir -p logs && chown backend:nodejs logs

# Switch to non-root user
USER backend

# Expose port
EXPOSE 5000

# Health check
HEALTHCHECK --interval=30s --timeout=3s --start-period=5s --retries=3 \
    CMD node healthcheck.js

# Start the application
CMD ["npm", "start"]