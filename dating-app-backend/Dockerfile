FROM node:20-alpine

WORKDIR /app

# Install dependencies
COPY package*.json ./
RUN npm install --production

# Copy source code
COPY . .

# Set environment variables
ENV NODE_ENV=production
ENV PORT=8080
ENV SQLITE_DB_PATH=/app/dating_app.db

EXPOSE 8080

CMD ["node", "src/index.js"]
