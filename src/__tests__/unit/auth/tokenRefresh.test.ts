/** @jest-environment node */
import { generateToken, verifyToken, refreshToken, shouldRefreshToken } from '@lib/auth/tokenRefresh';
import jwt from 'jsonwebtoken';

describe('Token Refresh', () => {
  const userId = '1';
  const email = 'test@example.com';

  beforeAll(() => {
    process.env.JWT_SECRET = 'test-secret-key-must-be-32-chars';
    process.env.JWT_EXPIRATION = '1h';
  });

  test('should generate valid JWT token', () => {
    const token = generateToken(userId, email);

    expect(token).toBeDefined();
    const decoded = jwt.decode(token) as any;
    expect(decoded.sub).toBe(userId);
    expect(decoded.email).toBe(email);
  });

  test('should verify valid token', () => {
    const token = generateToken(userId, email);
    const payload = verifyToken(token);

    expect(payload).not.toBeNull();
    expect(payload!.sub).toBe(userId);
    expect(payload!.email).toBe(email);
  });

  test('should reject invalid token', () => {
    const payload = verifyToken('invalid.token.here');

    expect(payload).toBeNull();
  });

  test('should refresh token with new expiry', (done) => {
    const token1 = generateToken(userId, email);
    const payload1 = jwt.decode(token1) as any;

    // Wait 1.1 seconds to ensure different issuance times (JWT uses second precision)
    setTimeout(() => {
      const token2 = refreshToken(userId, email);
      const payload2 = jwt.decode(token2) as any;

      expect(payload1.iat).toBeLessThan(payload2.iat);
      expect(payload2.exp).toBeGreaterThan(payload1.exp);
      done();
    }, 1100);
  }, 10000);

  test('should return true for shouldRefreshToken if token valid', () => {
    const token = generateToken(userId, email);
    const shouldRefresh = shouldRefreshToken(token);

    expect(shouldRefresh).toBe(true);
  });

  test('should return false for shouldRefreshToken if token invalid', () => {
    const shouldRefresh = shouldRefreshToken('invalid');

    expect(shouldRefresh).toBe(false);
  });
});
