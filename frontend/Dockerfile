# Frontend Dockerfile - Fixed
FROM node:20-slim

# Install curl for health checks
RUN apt-get update && apt-get install -y \
    curl \
    && rm -rf /var/lib/apt/lists/* \
    && apt-get clean

# Create non-root user
RUN groupadd -r nodeuser && useradd -r -g nodeuser nodeuser

WORKDIR /app

# Copy package files first for better caching
COPY package.json package-lock.json ./

# Install ALL dependencies (including dev dependencies for Vite)
RUN npm ci && npm cache clean --force

# Copy source code
COPY . .

# Change ownership to non-root user
RUN chown -R nodeuser:nodeuser /app

# Switch to non-root user  
USER nodeuser

# Health check with curl now available
HEALTHCHECK --interval=30s --timeout=10s --start-period=90s --retries=3 \
  CMD curl -f http://localhost:5173 || exit 1

EXPOSE 5173

# Start the development server
CMD ["npm", "run", "dev"]