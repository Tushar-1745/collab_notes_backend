# ---------- Base Builder Image ----------
FROM node:18-alpine AS builder

# Create app directory
WORKDIR /app

# Copy dependencies first
COPY package*.json ./
COPY prisma ./prisma

# Install dependencies
RUN npm install

# Copy full source
COPY . .

# Generate Prisma client
RUN npx prisma generate

# Build TypeScript code
RUN npm run build

# ---------- Final Production Image ----------
FROM node:18-alpine

WORKDIR /app

# Copy only required files
COPY --from=builder /app/dist ./dist
COPY --from=builder /app/node_modules ./node_modules
COPY --from=builder /app/package*.json ./
COPY --from=builder /app/.env .env

# Start the app
CMD ["node", "dist/index.js"]
