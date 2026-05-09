/** @jest-environment node */
import { hashPassword, verifyPassword } from '@lib/auth/password';

describe('Password utilities', () => {
  describe('hashPassword', () => {
    it('should return a bcrypt hash', async () => {
      const password = 'testPassword123';
      const hash = await hashPassword(password);
      expect(typeof hash).toBe('string');
      expect(hash.length).toBeGreaterThan(0);
    });

    it('should produce different hashes for the same password', async () => {
      const password = 'testPassword123';
      const hash1 = await hashPassword(password);
      const hash2 = await hashPassword(password);
      expect(hash1).not.toBe(hash2);
    });

    it('should not return the original password', async () => {
      const password = 'testPassword123';
      const hash = await hashPassword(password);
      expect(hash).not.toBe(password);
    });
  });

  describe('verifyPassword', () => {
    it('should return true for correct password', async () => {
      const password = 'testPassword123';
      const hash = await hashPassword(password);
      const result = await verifyPassword(password, hash);
      expect(result).toBe(true);
    });

    it('should return false for wrong password', async () => {
      const password = 'testPassword123';
      const wrongPassword = 'wrongPassword456';
      const hash = await hashPassword(password);
      const result = await verifyPassword(wrongPassword, hash);
      expect(result).toBe(false);
    });

    it('should return false for empty password against non-empty hash', async () => {
      const password = 'testPassword123';
      const hash = await hashPassword(password);
      const result = await verifyPassword('', hash);
      expect(result).toBe(false);
    });
  });
});
