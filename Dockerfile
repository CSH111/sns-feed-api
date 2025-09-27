# Multi-stage build for production optimization
FROM node:20-alpine AS base

# Set working directory
WORKDIR /usr/src/app

# Copy package.json and package-lock.json (if available)
COPY package*.json ./

# Install dependencies
RUN npm ci --only=production && npm cache clean --force

########### Development stage
FROM node:20-alpine AS development

WORKDIR /usr/src/app

# Copy package files
COPY package*.json ./
COPY prisma ./prisma/

# Install all dependencies (including dev dependencies)
RUN npm ci && npm cache clean --force

# Generate Prisma client
RUN npx prisma generate

# Copy source code
COPY . .

# Expose port
EXPOSE 5656

# Start in development mode with auto migration and seed
CMD ["sh", "-c", "npx prisma migrate deploy && npm run prisma:seed && npm run start:dev"]

############# Production build stage
FROM base AS build

WORKDIR /usr/src/app

# Copy all files for building
COPY . .

# Install dev dependencies temporarily for build
RUN npm ci

# Generate Prisma client
RUN npx prisma generate

# Build the application
RUN npm run build

# Production stage
FROM node:20-alpine AS production

WORKDIR /usr/src/app

# Create non-root user
RUN addgroup -g 1001 -S nodejs && \
    adduser -S nestjs -u 1001

# Copy package files
COPY package*.json ./

# Install only production dependencies
RUN npm ci --only=production && npm cache clean --force

# Copy built application from build stage
COPY --from=build --chown=nestjs:nodejs /usr/src/app/dist ./dist
COPY --from=build --chown=nestjs:nodejs /usr/src/app/node_modules/.prisma ./node_modules/.prisma
COPY --from=build --chown=nestjs:nodejs /usr/src/app/prisma ./prisma

# Switch to non-root user
USER nestjs

# Expose port
EXPOSE 5656

# Health check
HEALTHCHECK --interval=30s --timeout=3s --start-period=5s --retries=3 \
  CMD node dist/src/main.js --health-check || exit 1

# Start the application with auto migration and seed (using compiled JS)
CMD ["sh", "-c", "npx prisma migrate deploy && npm run prisma:seed:prod && npm run start:prod"]