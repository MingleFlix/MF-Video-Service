FROM node:21 as builder

WORKDIR /usr/src/app

COPY package*.json ./

RUN npm install

COPY . .

RUN npm run build

# Step 2: Use a lighter base image for the production build
FROM node:21-slim

WORKDIR /usr/src/app

# Set NODE_ENV to production by default
ENV NODE_ENV=production

COPY package*.json ./

# Install only production dependencies
RUN npm ci --only=production

# Copy the built JS files from the builder stage
COPY --from=builder /usr/src/app/dist ./dist

# Expose the port the app runs on
EXPOSE 3002

# Command to run the application
CMD ["node", "dist/index.js"]