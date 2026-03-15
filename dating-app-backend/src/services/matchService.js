const db = require('../config/database');
const { NotFoundError } = require('../middleware/errorHandler');

async function sendLike(senderId, receiverId) {
  if (senderId === receiverId) {
    throw new Error('Cannot like yourself');
  }

  try {
    await db.query(
      'INSERT INTO likes (sender_id, receiver_id) VALUES ($1, $2)',
      [senderId, receiverId]
    );

    // Check if it's a mutual match
    const matchCheck = await db.query(
      'SELECT * FROM likes WHERE sender_id = $1 AND receiver_id = $2',
      [receiverId, senderId]
    );

    let isMatch = false;
    if (matchCheck.rows.length > 0) {
      // Create match
      const matchResult = await db.query(
        'INSERT INTO matches (user1_id, user2_id) VALUES ($1, $2) RETURNING *',
        [senderId, receiverId]
      );
      isMatch = true;
    }

    return { isMatch };
  } catch (err) {
    if (err.code === '23505') { // Unique constraint violation
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
     WHERE l.receiver_id = $1`,
    [userId]
  );

  return result.rows;
}

async function getMatches(userId) {
  const result = await db.query(
    `SELECT m.*,
            CASE WHEN m.user1_id = $1 THEN m.user2_id ELSE m.user1_id END as partner_id,
            p.display_name as partner_name,
            p.avatar_url as partner_avatar
     FROM matches m
     JOIN profiles p ON (CASE WHEN m.user1_id = $1 THEN m.user2_id ELSE m.user1_id END) = p.user_id
     WHERE m.user1_id = $1 OR m.user2_id = $1
     ORDER BY m.created_at DESC`,
    [userId]
  );

  return result.rows;
}

async function deleteMatch(matchId, userId) {
  const result = await db.query(
    'DELETE FROM matches WHERE id = $1 AND (user1_id = $2 OR user2_id = $2) RETURNING *',
    [matchId, userId]
  );

  if (result.rows.length === 0) {
    throw new NotFoundError('Match not found');
  }

  return result.rows[0];
}

module.exports = {
  sendLike,
  getLikes,
  getMatches,
  deleteMatch
};
