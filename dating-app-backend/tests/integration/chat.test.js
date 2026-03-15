const request = require('supertest');
const app = require('../../src/index');
const db = require('../../src/config/database');

describe('Chat Integration', () => {
  let token1, token2;
  let userId1, userId2;
  let matchId;

  beforeAll(async () => {
    // Create user 1
    const res1 = await request(app)
      .post('/api/auth/register')
      .send({ email: `test_chat1_${Date.now()}@example.com`, password: 'password123' });

    token1 = res1.body.data.token;
    userId1 = res1.body.data.user.id;

    // Create user 2
    const res2 = await request(app)
      .post('/api/auth/register')
      .send({ email: `test_chat2_${Date.now()}@example.com`, password: 'password123' });

    token2 = res2.body.data.token;
    userId2 = res2.body.data.user.id;

    // Create profiles
    await request(app)
      .post('/api/users/me')
      .set('Authorization', `Bearer ${token1}`)
      .send({ displayName: 'User 1', birthday: '1990-01-01' });

    await request(app)
      .post('/api/users/me')
      .set('Authorization', `Bearer ${token2}`)
      .send({ displayName: 'User 2', birthday: '1990-01-02' });

    // Create a match manually for testing
    const matchRes = await db.query(
      'INSERT INTO matches (user1_id, user2_id) VALUES ($1, $2) RETURNING *',
      [userId1, userId2]
    );
    matchId = matchRes.rows[0].id;
  });

  describe('GET /api/chat/conversations', () => {
    it('should get conversation list', async () => {
      const res = await request(app)
        .get('/api/chat/conversations')
        .set('Authorization', `Bearer ${token1}`);

      expect(res.status).toBe(200);
      expect(res.body.data).toBeInstanceOf(Array);
    });
  });

  describe('POST /api/chat/messages', () => {
    it('should send a message', async () => {
      const res = await request(app)
        .post('/api/chat/messages')
        .set('Authorization', `Bearer ${token1}`)
        .send({ matchId, content: 'Hello!' });

      expect(res.status).toBe(201);
      expect(res.body.data).toHaveProperty('content', 'Hello!');
    });
  });
});
