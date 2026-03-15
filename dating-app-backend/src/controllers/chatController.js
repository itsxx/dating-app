const chatService = require('../services/chatService');

async function getConversations(req, res, next) {
  try {
    const conversations = await chatService.getConversations(req.user.userId);
    res.json({ data: conversations });
  } catch (err) {
    next(err);
  }
}

async function getMessages(req, res, next) {
  try {
    const messages = await chatService.getMessages(req.params.matchId, req.user.userId);
    res.json({ data: messages });
  } catch (err) {
    if (err.message === 'Not authorized to view this conversation') {
      return res.status(403).json({
        error: { code: 'CHAT_FORBIDDEN', message: err.message }
      });
    }
    next(err);
  }
}

async function sendMessage(req, res, next) {
  try {
    const { matchId, content } = req.body;

    if (!content || !content.trim()) {
      return res.status(400).json({
        error: { code: 'VALIDATION_ERROR', message: 'Content is required' }
      });
    }

    const message = await chatService.sendMessage(matchId, req.user.userId, content.trim());
    res.status(201).json({ data: message });
  } catch (err) {
    next(err);
  }
}

module.exports = {
  getConversations,
  getMessages,
  sendMessage
};