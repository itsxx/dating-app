const db = require('../config/database');

async function getConversations(userId) {
  const result = await db.query(
    `SELECT m.id as match_id,
            CASE WHEN m.user1_id = $1 THEN m.user2_id ELSE m.user1_id END as partner_id,
            p.display_name as partner_name,
            p.avatar_url as partner_avatar,
            (SELECT content FROM messages WHERE match_id = m.id ORDER BY created_at DESC LIMIT 1) as last_message_content,
            (SELECT created_at FROM messages WHERE match_id = m.id ORDER BY created_at DESC LIMIT 1) as last_message_at,
            (SELECT COUNT(*) FROM messages WHERE match_id = m.id AND sender_id != $1 AND is_read = false) as unread_count
     FROM matches m
     JOIN profiles p ON (CASE WHEN m.user1_id = $1 THEN m.user2_id ELSE m.user1_id END) = p.user_id
     WHERE m.user1_id = $1 OR m.user2_id = $1
     ORDER BY last_message_at DESC NULLS LAST`,
    [userId]
  );

  return result.rows;
}

async function getMessages(matchId, userId) {
  // Verify user is part of the match
  const matchCheck = await db.query(
    'SELECT * FROM matches WHERE id = $1 AND (user1_id = $2 OR user2_id = $2)',
    [matchId, userId]
  );

  if (matchCheck.rows.length === 0) {
    throw new Error('Not authorized to view this conversation');
  }

  const result = await db.query(
    `SELECT id, sender_id, content, is_read, created_at
     FROM messages
     WHERE match_id = $1
     ORDER BY created_at ASC`,
    [matchId]
  );

  // Mark messages as read
  await db.query(
    `UPDATE messages SET is_read = true
     WHERE match_id = $1 AND sender_id != $2 AND is_read = false`,
    [matchId, userId]
  );

  return result.rows;
}

async function sendMessage(matchId, senderId, content) {
  const result = await db.query(
    `INSERT INTO messages (match_id, sender_id, content)
     VALUES ($1, $2, $3)
     RETURNING id, sender_id, content, is_read, created_at`,
    [matchId, senderId, content]
  );

  return result.rows[0];
}

async function markMessageRead(messageId, userId) {
  await db.query(
    `UPDATE messages SET is_read = true
     WHERE id = $1 AND sender_id != $2`,
    [messageId, userId]
  );
}

module.exports = {
  getConversations,
  getMessages,
  sendMessage,
  markMessageRead
};