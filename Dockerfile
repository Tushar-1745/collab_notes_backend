# ---------- Base Builder Image ----------
FROM node:18-alpine AS builder

# Create app directory
WORKDIR /app

# Install app dependencies
COPY package*.json ./
COPY prisma ./prisma
RUN npm install

# Copy the full app source
COPY . .

# Generate Prisma client with explicit node call
RUN node_modules/.bin/prisma generate

# Build the TypeScript code
RUN npm run build

# ---------- Final Production Image ----------
FROM node:18-alpine

WORKDIR /app

# Copy built app and dependencies
COPY --from=builder /app/dist ./dist
COPY --from=builder /app/node_modules ./node_modules
COPY --from=builder /app/package*.json ./
COPY --from=builder /app/prisma ./prisma
COPY --from=builder /app/.env .env

# Generate Prisma client with explicit node call
RUN node_modules/.bin/prisma generate

# Start the app
CMD ["node", "dist/index.js"]