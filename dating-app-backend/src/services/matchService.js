const db = require('../config/database');
const { NotFoundError } = require('../middleware/errorHandler');

async function sendLike(senderId, receiverId) {
  if (senderId === receiverId) {
    throw new Error('Cannot like yourself');
  }

  const crypto = require('crypto');

  try {
    await db.query(
      'INSERT INTO likes (sender_id, receiver_id) VALUES (?, ?)',
      [senderId, receiverId]
    );

    // Check if it's a mutual match
    const matchCheck = await db.query(
      'SELECT * FROM likes WHERE sender_id = ? AND receiver_id = ?',
      [receiverId, senderId]
    );

    let isMatch = false;
    if (matchCheck.rows.length > 0) {
      // Create match with UUID
      const matchId = crypto.randomUUID();
      await db.query(
        'INSERT INTO matches (id, user1_id, user2_id) VALUES (?, ?, ?)',
        [matchId, senderId, receiverId]
      );
      isMatch = true;
    }

    return { isMatch };
  } catch (err) {
    // SQLite error code for UNIQUE constraint violation
    if (err.message && err.message.includes('UNIQUE constraint failed')) {
      throw new Error('Already liked this user');
    }
    throw err;
  }
}

async function getLikes(userId) {
  const result = await db.query(
    `SELECT l.*, p.display_name, p.avatar_url
     FROM likes l
     JOIN profiles p ON l.sender_id = p.user_id
     WHERE l.receiver_id = ?`,
    [userId]
  );

  return result.rows;
}

async function getMatches(userId) {
  const result = await db.query(
    `SELECT m.*,
            CASE WHEN m.user1_id = ? THEN m.user2_id ELSE m.user1_id END as partner_id,
            p.display_name as partner_name,
            p.avatar_url as partner_avatar
     FROM matches m
     JOIN profiles p ON (CASE WHEN m.user1_id = ? THEN m.user2_id ELSE m.user1_id END) = p.user_id
     WHERE m.user1_id = ? OR m.user2_id = ?
     ORDER BY m.created_at DESC`,
    [userId, userId, userId, userId]
  );

  return result.rows;
}

async function deleteMatch(matchId, userId) {
  const result = await db.query(
    'DELETE FROM matches WHERE id = ? AND (user1_id = ? OR user2_id = ?)',
    [matchId, userId, userId]
  );

  // SQLite doesn't support RETURNING, so fetch the match before deleting
  const matchCheck = await db.query(
    'SELECT * FROM matches WHERE id = ? AND (user1_id = ? OR user2_id = ?)',
    [matchId, userId, userId]
  );

  if (matchCheck.rows.length === 0) {
    throw new NotFoundError('Match not found');
  }

  return matchCheck.rows[0];
}

module.exports = {
  sendLike,
  getLikes,
  getMatches,
  deleteMatch
};
