/** @jest-environment node */
import jwt from 'jsonwebtoken';
import { NextRequest } from 'next/server';

import { generateToken, refreshToken } from '@/lib/auth/tokenRefresh';
import { authMiddlewareWithRefresh } from '@/lib/auth/middleware';
import type { JWTPayload } from '@/types/auth';

// TEST-020 — Absolute Session Lifetime (REQ-020 / ARCH-020)
// The sliding-window JWT must expire at the latest 24h after the original
// login, no matter how often it was refreshed in between.

const SECRET = 'test-secret-key-must-be-32-chars-long';
const LOGIN_TIME = new Date('2026-07-02T08:00:00Z');
const HOUR_MS = 60 * 60 * 1000;

function requestWithToken(token: string): NextRequest {
  return new NextRequest('http://localhost:3000/api/recipes', {
    headers: { cookie: `sessionToken=${token}` },
  });
}

function decode(token: string): JWTPayload {
  return jwt.decode(token) as JWTPayload;
}

describe('absolute session lifetime', () => {
  beforeEach(() => {
    process.env.JWT_SECRET = SECRET;
    jest.useFakeTimers();
    jest.setSystemTime(LOGIN_TIME);
  });

  afterEach(() => {
    jest.useRealTimers();
    delete process.env.JWT_SECRET;
  });

  // TC-020-01
  // Given a user who logged in less than 24 hours ago
  // When they make an authenticated API request
  // Then the request succeeds
  // And a refreshed session token is issued (sliding window unchanged)
  it('should authenticate and refresh when the login is less than 24 hours old', async () => {
    // Arrange: login now, then stay active via refreshes for 23 hours
    const loginAuthTime = decode(generateToken('1', 'user@example.com')).authTime;
    jest.setSystemTime(new Date(LOGIN_TIME.getTime() + 23 * HOUR_MS));
    const currentToken = refreshToken('1', 'user@example.com', loginAuthTime);

    // Act
    const result = await authMiddlewareWithRefresh(requestWithToken(currentToken));

    // Assert
    expect(result).not.toBeNull();
    expect(result!.userId).toBe('1');
    expect(result!.newToken).toBeTruthy();
  });

  // TC-020-02
  // Given a user who logged in more than 24 hours ago
  // And whose token has been refreshed continuously since then
  // When they make an authenticated API request
  // Then the request is treated as unauthenticated
  // And no refreshed session token is issued
  it('should reject a continuously refreshed session once the login is older than 24 hours', async () => {
    // Arrange: fresh (non-expired) token whose original login is 24.5h ago —
    // exactly what a continuously refreshed session looks like
    const loginAuthTime = decode(generateToken('1', 'user@example.com')).authTime;
    jest.setSystemTime(new Date(LOGIN_TIME.getTime() + 24.5 * HOUR_MS));
    const currentToken = refreshToken('1', 'user@example.com', loginAuthTime);

    // Act
    const result = await authMiddlewareWithRefresh(requestWithToken(currentToken));

    // Assert
    expect(result).toBeNull();
  });

  // TC-020-03
  // Given a session token issued at login
  // When the token is refreshed during an authenticated request
  // Then the new token carries the original login timestamp
  // And the new token's remaining absolute lifetime is not extended
  it('should preserve the original login time in refreshed tokens', async () => {
    // Arrange
    const loginToken = generateToken('1', 'user@example.com');
    const loginAuthTime = decode(loginToken).authTime;
    jest.setSystemTime(new Date(LOGIN_TIME.getTime() + 0.5 * HOUR_MS));

    // Act
    const result = await authMiddlewareWithRefresh(requestWithToken(loginToken));

    // Assert
    expect(result).not.toBeNull();
    expect(decode(result!.newToken).authTime).toBe(loginAuthTime);
    expect(loginAuthTime).toBe(Math.floor(LOGIN_TIME.getTime() / 1000));
  });

  // TC-020-04
  // Given a user whose previous session reached its absolute lifetime
  // When they log in again with valid credentials
  // Then a new session is created
  // And its absolute lifetime starts from the new login time
  it('should restart the absolute lifetime on a fresh login', async () => {
    // Arrange: first session is long past its absolute lifetime
    const secondLoginTime = new Date(LOGIN_TIME.getTime() + 30 * HOUR_MS);
    jest.setSystemTime(secondLoginTime);

    // Act: login/register mint tokens via generateToken
    const newLoginToken = generateToken('1', 'user@example.com');
    const result = await authMiddlewareWithRefresh(requestWithToken(newLoginToken));

    // Assert
    expect(decode(newLoginToken).authTime).toBe(Math.floor(secondLoginTime.getTime() / 1000));
    expect(result).not.toBeNull();
  });

  // TC-020-05
  // Given a session token minted before the authTime claim existed
  // When it is used within its sliding-window validity
  // Then the request succeeds
  // And the refreshed token carries the legacy token's iat as authTime
  it('should fall back to iat for legacy tokens without authTime', async () => {
    // Arrange: pre-deploy token — signed without an authTime claim
    const legacyToken = jwt.sign({ sub: '1', email: 'user@example.com', type: 'access' }, SECRET, {
      expiresIn: '1h',
    });
    const legacyIat = decode(legacyToken).iat;
    jest.setSystemTime(new Date(LOGIN_TIME.getTime() + 0.5 * HOUR_MS));

    // Act
    const result = await authMiddlewareWithRefresh(requestWithToken(legacyToken));

    // Assert
    expect(result).not.toBeNull();
    expect(decode(result!.newToken).authTime).toBe(legacyIat);
  });
});
