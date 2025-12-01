FROM node:20-alpine

WORKDIR /app

# Copy package files
COPY package*.json ./

# Install production dependencies only
RUN npm ci --only=production

# Copy application files
COPY index.js ./
COPY .env.local ./
# Expose API port
EXPOSE 3001

# Start the application
CMD ["node", "index.js"]