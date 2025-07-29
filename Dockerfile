# ---------- Base Builder Image ----------
FROM node:18-alpine AS builder

WORKDIR /app

# Copy dependency files first for cache
COPY package*.json ./
COPY prisma ./prisma

# Install dependencies
RUN npm install

# Copy source files
COPY . .

# ✅ Fix permission issues
RUN chmod +x node_modules/.bin/prisma && chmod +x node_modules/.bin/tsc

# Generate Prisma client
RUN npx prisma generate

# Build TypeScript code
RUN npm run build

# ---------- Final Production Image ----------
FROM node:18-alpine

WORKDIR /app

# Copy only production files
COPY --from=builder /app/dist ./dist
COPY --from=builder /app/node_modules ./node_modules
COPY --from=builder /app/package*.json ./
COPY --from=builder /app/.env .env

# Start server
CMD ["node", "dist/index.js"]
