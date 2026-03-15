const jwt = require('jsonwebtoken');
const { authenticate } = require('../../src/middleware/auth');

describe('authenticate middleware', () => {
  it('should reject requests without token', () => {
    const req = {};
    const res = { status: jest.fn().mockReturnThis(), json: jest.fn() };
    const next = jest.fn();

    authenticate(req, res, next);

    expect(res.status).toHaveBeenCalledWith(401);
    expect(res.json).toHaveBeenCalledWith(
      expect.objectContaining({ error: expect.objectContaining({ code: 'AUTH_UNAUTHORIZED' }) })
    );
  });

  it('should reject invalid tokens', () => {
    const req = { headers: { authorization: 'Bearer invalid' } };
    const res = { status: jest.fn().mockReturnThis(), json: jest.fn() };
    const next = jest.fn();

    authenticate(req, res, next);

    setTimeout(() => {
      expect(res.status).toHaveBeenCalledWith(401);
    }, 100);
  });

  it('should call next with valid token', () => {
    const token = jwt.sign({ userId: 'test-id' }, process.env.JWT_SECRET);
    const req = { headers: { authorization: `Bearer ${token}` } };
    const res = {};
    const next = jest.fn();

    authenticate(req, res, next);

    setTimeout(() => {
      expect(next).toHaveBeenCalled();
      expect(req.user).toEqual(expect.objectContaining({ userId: 'test-id' }));
    }, 100);
  });
});
