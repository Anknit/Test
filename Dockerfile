# Use Node.js LTS version
FROM node:20-slim

# Install minimal system dependencies
RUN apt-get update && apt-get install -y \
    ca-certificates \
    && rm -rf /var/lib/apt/lists/*

# Create app directory
WORKDIR /app

# Copy package files
COPY package*.json ./

# Install dependencies
RUN npm install --production

# Copy application files
COPY kite.js ./
COPY api-server.js ./
COPY supervisor.js ./
COPY public ./public

# Create necessary directories
RUN mkdir -p logs cache enctoken_backups

# Set environment variables
ENV NODE_ENV=production
ENV PORT=3000

# Expose API port
EXPOSE 3000

# Health check
HEALTHCHECK --interval=30s --timeout=10s --start-period=5s --retries=3 \
  CMD node -e "require('http').get('http://localhost:3000/health', (r) => {process.exit(r.statusCode === 200 ? 0 : 1)})"

# Run API server
CMD ["node", "api-server.js"]
