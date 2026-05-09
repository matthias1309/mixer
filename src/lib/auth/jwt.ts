import jwt from 'jsonwebtoken';
import { JWT } from '@lib/constants';
import type { JWTPayload } from '@/types/auth';

function getSecret(): string {
  const secret = process.env.JWT_SECRET;
  if (!secret || secret.length < 32) {
    throw new Error('JWT_SECRET must be at least 32 characters');
  }
  return secret;
}

export function generateToken(userId: string, email: string): string {
  return jwt.sign({ userId, email }, getSecret(), { expiresIn: JWT.EXPIRATION } as any);
}

export function verifyToken(token: string): JWTPayload | null {
  try {
    return jwt.verify(token, getSecret()) as JWTPayload;
  } catch {
    return null;
  }
}

export function decodeToken(token: string): JWTPayload | null {
  try {
    return jwt.decode(token) as JWTPayload | null;
  } catch {
    return null;
  }
}
