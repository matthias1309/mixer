import jwt from 'jsonwebtoken';
import type { JWTPayload } from '@/types/auth';

export type TokenVerificationResult =
  | { payload: JWTPayload; error: null }
  | { payload: null; error: 'expired' | 'invalid' };

function getSecret(): string {
  const secret = process.env.JWT_SECRET;
  if (!secret || secret.length < 32) {
    throw new Error('JWT_SECRET must be at least 32 characters');
  }
  return secret;
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

export function verifyTokenDetailed(token: string): TokenVerificationResult {
  try {
    const payload = jwt.verify(token, getSecret()) as JWTPayload;
    return { payload, error: null };
  } catch (err) {
    if (err instanceof jwt.TokenExpiredError) {
      return { payload: null, error: 'expired' };
    }
    return { payload: null, error: 'invalid' };
  }
}
