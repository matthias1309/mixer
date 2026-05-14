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

export function generateToken(userId: string, email: string): string {
  return jwt.sign(
    {
      sub: userId,
      email,
      type: 'access',
    },
    getSecret(),
    { expiresIn: TOKEN_EXPIRY }
  );
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

export function refreshToken(userId: string, email: string): string {
  // Generate a new token (resets the expiry)
  return generateToken(userId, email);
}
