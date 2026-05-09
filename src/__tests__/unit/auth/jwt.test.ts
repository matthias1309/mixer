/** @jest-environment node */
import { generateToken, verifyToken, decodeToken, verifyTokenDetailed } from '@lib/auth/jwt';
import type { JWTPayload } from '@/types/auth';

describe('JWT utilities', () => {
  beforeAll(() => {
    process.env.JWT_SECRET = 'test-secret-key-must-be-32-chars';
    process.env.JWT_EXPIRATION = '24h';
  });

  describe('generateToken', () => {
    it('should return a string token', () => {
      const token = generateToken('user-123', 'test@example.com');
      expect(typeof token).toBe('string');
      expect(token.length).toBeGreaterThan(0);
    });

    it('should include userId and email in payload', () => {
      const token = generateToken('user-123', 'test@example.com');
      const decoded = decodeToken(token);
      expect(decoded).not.toBeNull();
      expect(decoded?.userId).toBe('user-123');
      expect(decoded?.email).toBe('test@example.com');
    });

    it('should be deterministic (same inputs = same token)', () => {
      const token1 = generateToken('user-123', 'test@example.com');
      const token2 = generateToken('user-123', 'test@example.com');
      expect(token1).toBe(token2);
    });

    it('should include iat and exp claims', () => {
      const token = generateToken('user-123', 'test@example.com');
      const decoded = decodeToken(token);
      expect(decoded?.iat).toBeDefined();
      expect(typeof decoded?.iat).toBe('number');
      expect(decoded?.exp).toBeDefined();
      expect(typeof decoded?.exp).toBe('number');
    });
  });

  describe('verifyToken', () => {
    it('should return payload for valid token', () => {
      const token = generateToken('user-456', 'valid@example.com');
      const payload = verifyToken(token);
      expect(payload).not.toBeNull();
      expect(payload?.userId).toBe('user-456');
      expect(payload?.email).toBe('valid@example.com');
    });

    it('should return null for invalid token', () => {
      const result = verifyToken('invalid.token.here');
      expect(result).toBeNull();
    });

    it('should return null for expired token', async () => {
      // Manually create an expired token by setting exp to past timestamp
      const secret = process.env.JWT_SECRET!;
      const expiredToken = require('jsonwebtoken').sign(
        { userId: 'user-789', email: 'expired@example.com' },
        secret,
        { expiresIn: '-1h' } // Expired 1 hour ago
      );

      const result = verifyToken(expiredToken);
      expect(result).toBeNull();
    });

    it('should return null for malformed token', () => {
      const result = verifyToken('not.even.valid');
      expect(result).toBeNull();
    });
  });

  describe('decodeToken', () => {
    it('should decode token without verification', () => {
      const token = generateToken('user-999', 'decode@example.com');
      const decoded = decodeToken(token);
      expect(decoded).not.toBeNull();
      expect(decoded?.userId).toBe('user-999');
      expect(decoded?.email).toBe('decode@example.com');
    });

    it('should return null for invalid token', () => {
      const result = decodeToken('invalid.token');
      expect(result).toBeNull();
    });
  });

  describe('verifyTokenDetailed', () => {
    it('should return payload with null error for valid token', () => {
      const token = generateToken('user-detail', 'detail@example.com');
      const result = verifyTokenDetailed(token);
      expect(result.error).toBeNull();
      expect(result.payload).not.toBeNull();
      expect(result.payload?.userId).toBe('user-detail');
      expect(result.payload?.email).toBe('detail@example.com');
    });

    it('should return invalid error for malformed token', () => {
      const result = verifyTokenDetailed('not.a.token');
      expect(result.error).toBe('invalid');
      expect(result.payload).toBeNull();
    });

    it('should return expired error for expired token', () => {
      const secret = process.env.JWT_SECRET!;
      const expiredToken = require('jsonwebtoken').sign(
        { userId: 'user-exp', email: 'exp@example.com' },
        secret,
        { expiresIn: '-1h' }
      );

      const result = verifyTokenDetailed(expiredToken);
      expect(result.error).toBe('expired');
      expect(result.payload).toBeNull();
    });

    it('should return invalid error for empty token', () => {
      const result = verifyTokenDetailed('');
      expect(result.error).toBe('invalid');
      expect(result.payload).toBeNull();
    });
  });

  describe('Secret key validation', () => {
    it('should throw error if JWT_SECRET is missing', () => {
      const oldSecret = process.env.JWT_SECRET;
      delete process.env.JWT_SECRET;

      expect(() => {
        generateToken('user', 'test@example.com');
      }).toThrow('JWT_SECRET must be at least 32 characters');

      process.env.JWT_SECRET = oldSecret;
    });

    it('should throw error if JWT_SECRET is too short', () => {
      const oldSecret = process.env.JWT_SECRET;
      process.env.JWT_SECRET = 'tooshort';

      expect(() => {
        generateToken('user', 'test@example.com');
      }).toThrow('JWT_SECRET must be at least 32 characters');

      process.env.JWT_SECRET = oldSecret;
    });
  });
});
