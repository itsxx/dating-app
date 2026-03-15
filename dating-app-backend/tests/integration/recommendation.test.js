const request = require('supertest');
const { app } = require('../../src/index');
const db = require('../../src/config/database');

describe('Recommendation Integration', () => {
  let token;
  let userId;

  beforeAll(async () => {
    // Create a test user
    const res = await request(app)
      .post('/api/auth/register')
      .send({ email: `test_rec_${Date.now()}@example.com`, password: 'password123' });

    token = res.body.data.token;
    userId = res.body.data.user.id;

    // Create profile
    await request(app)
      .post('/api/users/me')
      .set('Authorization', `Bearer ${token}`)
      .send({
        displayName: 'Test User',
        birthday: '1990-01-01',
        mbtiType: 'INFJ'
      });
  });

  describe('GET /api/recommendations', () => {
    it('should return recommendations', async () => {
      const res = await request(app)
        .get('/api/recommendations')
        .set('Authorization', `Bearer ${token}`);

      expect(res.status).toBe(200);
      expect(res.body.data).toBeInstanceOf(Array);
    });
  });

  describe('GET /api/recommendations/settings', () => {
    it('should get default settings', async () => {
      const res = await request(app)
        .get('/api/recommendations/settings')
        .set('Authorization', `Bearer ${token}`);

      expect(res.status).toBe(200);
      expect(res.body.data).toHaveProperty('zodiac_filter');
    });
  });
});
