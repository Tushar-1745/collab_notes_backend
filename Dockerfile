# Use official Node.js image as base
FROM node:18

# Set working directory
WORKDIR /app

# Copy package.json and lock file first (for caching)
COPY package*.json ./

# Install dependencies
RUN npm install

# Copy the rest of the code
COPY . .

# Generate Prisma client
RUN npx prisma generate

# Build TypeScript
RUN npm run build

# Expose the port your app runs on
EXPOSE 4000

# Start the app
CMD ["npm", "start"]
