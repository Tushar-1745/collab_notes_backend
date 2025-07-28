# Stage 1: Build TypeScript
FROM node:18 AS builder

WORKDIR /app

COPY package*.json ./
RUN npm install

COPY . .

# Make tsc executable to avoid permission issues
RUN chmod +x ./node_modules/.bin/tsc

RUN npm run build

# Stage 2: Run built app
FROM node:18

WORKDIR /app

COPY --from=builder /app/dist ./dist
COPY package*.json ./
RUN npm ci --omit=dev

EXPOSE 4000

CMD ["node", "dist/index.js"]
