require('dotenv').config();
const express = require('express');
const cors = require('cors');
const http = require('http');
const { errorHandler } = require('./middleware/errorHandler');
const { setupWebSocket } = require('./config/websocket');
const { initDatabase } = require('./config/database');

const app = express();
const server = http.createServer(app);

// Initialize database
initDatabase().then(() => {
  console.log('Database initialized');
}).catch((err) => {
  console.error('Failed to initialize database:', err);
  process.exit(1);
});

// Setup WebSocket
setupWebSocket(server);

// Middleware
app.use(cors({
  origin: process.env.FRONTEND_URL || ['http://localhost:3001', 'http://localhost:5173', 'http://localhost:5174', 'http://localhost:5175'],
  credentials: true
}));
app.use(express.json());

// Routes
app.use('/api/auth', require('./routes/auth'));
app.use('/api/users', require('./routes/users'));
app.use('/api/mbti', require('./routes/mbti'));
app.use('/api/recommendations', require('./routes/recommendations'));
app.use('/api/matches', require('./routes/matches'));
app.use('/api/chat', require('./routes/chat'));

// Health check
app.get('/health', (req, res) => {
  res.json({ status: 'ok', timestamp: new Date().toISOString() });
});

// 404 handler
app.use((req, res) => {
  res.status(404).json({
    error: {
      code: 'NOT_FOUND',
      message: 'Route not found'
    }
  });
});

// Error handler
app.use(errorHandler);

// Start server only in non-test environment
const PORT = process.env.PORT || 3000;
if (process.env.NODE_ENV !== 'test') {
  server.listen(PORT, () => {
    console.log(`Server running on port ${PORT}`);
  });
}

module.exports = { app, server };
