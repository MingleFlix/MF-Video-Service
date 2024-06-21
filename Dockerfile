# Use the official Node.js image.
FROM node:21

# Create and change to the app directory.
WORKDIR /usr/src/app


# Install dependencies.
COPY package*.json ./
RUN npm install

# Copy the source code.
COPY . .

# Set NODE_ENV to production by default
ENV NODE_ENV=production
# Build the TypeScript code.
RUN npm run build

# Set the command to run the application.
CMD ["node", "dist/index.js"]

# Expose the port.
EXPOSE 3002