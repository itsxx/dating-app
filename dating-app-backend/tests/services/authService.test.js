const { register, login, hashPassword, verifyPassword, validateEmail, validatePassword } = require('../../src/services/authService');

describe('authService', () => {
  describe('hashPassword and verifyPassword', () => {
    it('should hash and verify password correctly', async () => {
      const password = 'testPassword123';
      const hash = await hashPassword(password);

      const isValid = await verifyPassword(password, hash);
      expect(isValid).toBe(true);
    });

    it('should reject wrong password', async () => {
      const password = 'testPassword123';
      const hash = await hashPassword(password);

      const isValid = await verifyPassword('wrongPassword', hash);
      expect(isValid).toBe(false);
    });
  });

  describe('validateEmail', () => {
    it('should validate correct email', () => {
      expect(validateEmail('test@example.com')).toBe(true);
    });

    it('should reject invalid email', () => {
      expect(validateEmail('invalid-email')).toBe(false);
    });
  });

  describe('validatePassword', () => {
    it('should accept strong password', () => {
      expect(validatePassword('password123')).toBe(true);
    });

    it('should reject weak password', () => {
      expect(validatePassword('123')).toBe(false);
    });
  });
});
