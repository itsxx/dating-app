const WebSocket = require('ws');
const jwt = require('jsonwebtoken');
const chatService = require('../services/chatService');

let wss = null;

function setupWebSocket(server) {
  wss = new WebSocket.Server({ server, path: '/ws' });

  wss.on('connection', (ws, req) => {
    const token = req.url.split('token=')[1];

    if (!token) {
      ws.close(4001, 'Authentication required');
      return;
    }

    let decoded;
    try {
      decoded = jwt.verify(token, process.env.JWT_SECRET);
    } catch (err) {
      ws.close(4002, 'Invalid token');
      return;
    }

    ws.userId = decoded.userId;
    console.log(`User ${ws.userId} connected`);

    ws.on('message', async (message) => {
      try {
        const data = JSON.parse(message);
        await handleWebSocketMessage(ws, data);
      } catch (err) {
        console.error('WebSocket error:', err);
        ws.send(JSON.stringify({ type: 'error', message: 'Internal error' }));
      }
    });

    ws.on('close', () => {
      console.log(`User ${ws.userId} disconnected`);
    });
  });

  return wss;
}

async function handleWebSocketMessage(ws, data) {
  const { type, matchId, content, messageId } = data;

  if (type === 'send_message') {
    const message = await chatService.sendMessage(matchId, ws.userId, content);

    // Broadcast to match partner
    broadcastToMatch(matchId, ws.userId, {
      type: 'new_message',
      messageId: message.id,
      matchId,
      senderId: ws.userId,
      content: message.content,
      createdAt: message.created_at
    });

    ws.send(JSON.stringify({
      type: 'message_sent',
      messageId: message.id,
      status: 'sent'
    }));
  }

  if (type === 'mark_read') {
    await chatService.markMessageRead(messageId, ws.userId);

    broadcastToMatch(matchId, ws.userId, {
      type: 'message_read',
      messageId,
      matchId
    });
  }
}

function broadcastToMatch(matchId, senderId, message) {
  if (!wss) return;

  wss.clients.forEach((client) => {
    if (client.readyState === WebSocket.OPEN) {
      client.send(JSON.stringify(message));
    }
  });
}

function broadcastToUser(userId, message) {
  if (!wss) return;

  wss.clients.forEach((client) => {
    if (client.readyState === WebSocket.OPEN && client.userId === userId) {
      client.send(JSON.stringify(message));
    }
  });
}

module.exports = {
  setupWebSocket,
  broadcastToMatch,
  broadcastToUser
};