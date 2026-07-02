import jwt from 'jsonwebtoken';
import type { JWTPayload } from '@/types/auth';

function getSecret(): string {
  const secret = process.env.JWT_SECRET;
  if (!secret || secret.length < 32) {
    throw new Error('JWT_SECRET must be at least 32 characters');
  }
  return secret;
}

const TOKEN_EXPIRY = '1h';

// Hard cap on the total session age (REQ-020): the sliding window may renew
// a token many times, but never past this many seconds after the login.
export const ABSOLUTE_SESSION_LIFETIME_SECONDS = 24 * 60 * 60;

function signToken(userId: string, email: string, authTime: number): string {
  return jwt.sign(
    {
      sub: userId,
      email,
      type: 'access',
      authTime,
    },
    getSecret(),
    { expiresIn: TOKEN_EXPIRY }
  );
}

export function generateToken(userId: string, email: string): string {
  return signToken(userId, email, Math.floor(Date.now() / 1000));
}

export function verifyToken(token: string): JWTPayload | null {
  try {
    const decoded = jwt.verify(token, getSecret()) as JWTPayload;
    return decoded;
  } catch (error) {
    return null;
  }
}

export function shouldRefreshToken(token: string): boolean {
  const decoded = verifyToken(token);
  if (!decoded) return false;

  // Refresh if token exists (sliding window means we always refresh on use)
  return true;
}

export function refreshToken(userId: string, email: string, authTime: number): string {
  // New token with a fresh sliding-window expiry, but the original login
  // time is preserved so the absolute lifetime is never extended (AC-020-03)
  return signToken(userId, email, authTime);
}
