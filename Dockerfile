FROM node:20-alpine

WORKDIR /app

# Copy package files first (better layer caching)
COPY package*.json tsconfig.json ./

# Install all dependencies (including devDependencies for TypeScript)
RUN npm install

# Copy source code
COPY . .

# Build TypeScript
RUN npm run build

# Remove devDependencies to keep production image small
RUN npm prune --production

# Set environment variable for Redlib URL (default: Redlib's default port 8080)
# Set environment variable for Redlib URL (default: Redlib's default port 8080)
ENV REDLIB_URL=http://localhost:8080
# Start the server
CMD ["node", "dist/index.js"]
