# Use the official nodejs 22 debian bookworm slim as the base image
FROM node:22.11-bookworm-slim

# Set the working directory
WORKDIR /home/bots/tvbarrapesada

# Install important deps and clean cache
RUN apt-get update && \
    apt-get clean && \
    rm -rf /var/lib/apt/lists/*

# Install pnpm
RUN npm install pnpm -g

# Copy package.json
COPY package.json ./

# Install dependencies
RUN pnpm install

# Copy the rest of the application code
COPY . .

# Build the application
RUN pnpm run build

# Specify the port number the container should expose
EXPOSE 3000

# Command to run the application
CMD ["pnpm", "run", "start"]