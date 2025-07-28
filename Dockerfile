# -------- Base Image --------
FROM node:18 as builder

# -------- Set Working Directory --------
WORKDIR /app

# -------- Copy Files --------
COPY package*.json ./
COPY prisma ./prisma
COPY tsconfig.json ./
COPY .env ./

# -------- Install Dependencies --------
RUN npm install

# -------- Prisma Generate --------
RUN npx prisma generate

# -------- Copy Source Code --------
COPY src ./src

# -------- Build TypeScript --------
RUN npm run build

# -------- Production Image --------
FROM node:18 as production

# -------- Set Working Directory --------
WORKDIR /app

# -------- Copy Files from Builder --------
COPY --from=builder /app/node_modules ./node_modules
COPY --from=builder /app/dist ./dist
COPY --from=builder /app/package.json ./package.json
COPY --from=builder /app/.env ./

# -------- Expose Port --------
EXPOSE 4000

# -------- Start App --------
CMD ["node", "dist/index.js"]
