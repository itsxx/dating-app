const db = require('../config/database');

async function getConversations(userId) {
  const result = await db.query(
    `SELECT m.id as match_id,
            CASE WHEN m.user1_id = ? THEN m.user2_id ELSE m.user1_id END as partner_id,
            p.display_name as partner_name,
            p.avatar_url as partner_avatar,
            (SELECT content FROM messages WHERE match_id = m.id ORDER BY created_at DESC LIMIT 1) as last_message_content,
            (SELECT created_at FROM messages WHERE match_id = m.id ORDER BY created_at DESC LIMIT 1) as last_message_at,
            (SELECT COUNT(*) FROM messages WHERE match_id = m.id AND sender_id != ? AND is_read = false) as unread_count
     FROM matches m
     JOIN profiles p ON (CASE WHEN m.user1_id = ? THEN m.user2_id ELSE m.user1_id END) = p.user_id
     WHERE m.user1_id = ? OR m.user2_id = ?
     ORDER BY last_message_at DESC`,
    [userId, userId, userId, userId, userId]
  );

  return result.rows;
}

async function getMessages(matchId, userId) {
  // Verify user is part of the match
  const matchCheck = await db.query(
    'SELECT * FROM matches WHERE id = ? AND (user1_id = ? OR user2_id = ?)',
    [matchId, userId, userId]
  );

  if (matchCheck.rows.length === 0) {
    throw new Error('Not authorized to view this conversation');
  }

  const result = await db.query(
    `SELECT id, sender_id, content, is_read, created_at
     FROM messages
     WHERE match_id = ?
     ORDER BY created_at ASC`,
    [matchId]
  );

  // Mark messages as read
  await db.query(
    `UPDATE messages SET is_read = true
     WHERE match_id = ? AND sender_id != ? AND is_read = false`,
    [matchId, userId]
  );

  return result.rows;
}

async function sendMessage(matchId, senderId, content) {
  const crypto = require('crypto');
  const messageId = crypto.randomUUID();

  const result = await db.query(
    `INSERT INTO messages (id, match_id, sender_id, content)
     VALUES (?, ?, ?, ?)`,
    [messageId, matchId, senderId, content]
  );

  return {
    id: messageId,
    sender_id: senderId,
    content,
    is_read: 0,
    created_at: new Date().toISOString()
  };
}

async function markMessageRead(messageId, userId) {
  await db.query(
    `UPDATE messages SET is_read = 1
     WHERE id = ? AND sender_id != ?`,
    [messageId, userId]
  );
}

module.exports = {
  getConversations,
  getMessages,
  sendMessage,
  markMessageRead
};