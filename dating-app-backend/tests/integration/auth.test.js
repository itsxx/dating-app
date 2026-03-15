const request = require('supertest');
const app = require('../../src/index');
const db = require('../../src/config/database');

describe('Auth Integration', () => {
  let testEmail = `test_${Date.now()}@example.com`;

  afterAll(async () => {
    await db.query('DELETE FROM users WHERE email LIKE $1', ['test_%@example.com']);
  });

  describe('POST /api/auth/register', () => {
    it('should register a new user', async () => {
      const res = await request(app)
        .post('/api/auth/register')
        .send({ email: testEmail, password: 'password123' });

      expect(res.status).toBe(201);
      expect(res.body.data).toHaveProperty('token');
      expect(res.body.data.user.email).toBe(testEmail);
    });

    it('should reject duplicate email', async () => {
      const res = await request(app)
        .post('/api/auth/register')
        .send({ email: testEmail, password: 'password123' });

      expect(res.status).toBe(400);
      expect(res.body.error.code).toBe('AUTH_USER_EXISTS');
    });
  });

  describe('POST /api/auth/login', () => {
    it('should login with correct credentials', async () => {
      const res = await request(app)
        .post('/api/auth/login')
        .send({ email: testEmail, password: 'password123' });

      expect(res.status).toBe(200);
      expect(res.body.data).toHaveProperty('token');
    });

    it('should reject wrong password', async () => {
      const res = await request(app)
        .post('/api/auth/login')
        .send({ email: testEmail, password: 'wrongpassword' });

      expect(res.status).toBe(400);
      expect(res.body.error.code).toBe('AUTH_INVALID_CREDENTIALS');
    });
  });
});
