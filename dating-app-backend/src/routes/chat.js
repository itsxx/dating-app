const express = require('express');
const { authenticate } = require('../middleware/auth');
const { getConversations, getMessages, sendMessage } = require('../controllers/chatController');

const router = express.Router();

router.use(authenticate);
router.get('/conversations', getConversations);
router.get('/conversations/:matchId/messages', getMessages);
router.post('/messages', sendMessage);

module.exports = router;