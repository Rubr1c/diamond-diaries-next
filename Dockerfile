FROM node:20-alpine AS base

# Add dependencies needed for node-gyp and other native modules
RUN apk add --no-cache libc6-compat python3 make g++

# Install dependencies only when needed
FROM base AS deps
WORKDIR /app

# Copy package files
COPY package.json package-lock.json* ./

# Clean install dependencies, including dev dependencies for the build process
RUN npm ci

# Rebuild the source code only when needed
FROM base AS builder
WORKDIR /app

# Copy node modules and all source files
COPY --from=deps /app/node_modules ./node_modules
COPY . .

# Set environment variables
ENV NEXT_TELEMETRY_DISABLED 1
ENV NODE_ENV production
# Add this to ensure the image domains work correctly
ENV NEXT_IMAGE_DOMAINS lh3.googleusercontent.com

# Debug: List files to ensure everything is copied correctly
RUN ls -la

# Build the application with explicit NODE_ENV
RUN npm run build

# Production image, copy all the files and run next
FROM base AS runner
WORKDIR /app

ENV NODE_ENV production
ENV NEXT_TELEMETRY_DISABLED 1
# Ensure image domains are also available at runtime
ENV NEXT_IMAGE_DOMAINS lh3.googleusercontent.com

# Create a non-root user
RUN addgroup --system --gid 1001 nodejs && \
    adduser --system --uid 1001 nextjs

# Copy necessary files
COPY --from=builder /app/public ./public

# Check if standalone directory exists and copy it if it does
# This handles both standalone and non-standalone output modes
COPY --from=builder /app/.next ./.next
COPY --from=builder /app/node_modules ./node_modules
COPY --from=builder /app/package.json ./package.json
COPY --from=builder /app/next.config.ts ./

USER nextjs

# Expose the listening port
EXPOSE 3000

ENV PORT 3000
ENV HOSTNAME "0.0.0.0"

# Run the application
CMD ["npm", "start"]