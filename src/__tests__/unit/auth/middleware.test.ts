/** @jest-environment node */
import { authMiddleware } from '@lib/auth/middleware';
import { NextRequest, NextResponse } from 'next/server';
import jwt from 'jsonwebtoken';

describe('Auth Middleware', () => {
  beforeAll(() => {
    process.env.JWT_SECRET = 'test-secret-key-must-be-32-chars';
  });

  describe('authMiddleware', () => {
    it('should return 401 when token cookie is missing', () => {
      const req = new NextRequest(new URL('http://localhost:3000/api/recipes'));
      const res = authMiddleware(req);

      expect(res.status).toBe(401);
    });

    it('should return 401 when token cookie is empty', () => {
      const url = new URL('http://localhost:3000/api/recipes');
      const req = new NextRequest(url, {
        headers: { cookie: 'sessionToken=' },
      });
      const res = authMiddleware(req);

      expect(res.status).toBe(401);
    });

    it('should return 401 for malformed token', () => {
      const url = new URL('http://localhost:3000/api/recipes');
      const req = new NextRequest(url, {
        headers: { cookie: 'sessionToken=not.a.valid.token' },
      });
      const res = authMiddleware(req);

      expect(res.status).toBe(401);
    });

    it('should return 403 for expired token', () => {
      const secret = process.env.JWT_SECRET!;
      const expiredToken = jwt.sign(
        { sub: 'user-123', email: 'test@example.com', type: 'access' },
        secret,
        { expiresIn: '-1h' }
      );

      const url = new URL('http://localhost:3000/api/recipes');
      const req = new NextRequest(url, {
        headers: { cookie: `sessionToken=${expiredToken}` },
      });
      const res = authMiddleware(req);

      expect(res.status).toBe(403);
    });

    it('should return NextResponse.next() for valid token', () => {
      const secret = process.env.JWT_SECRET!;
      const token = jwt.sign(
        { sub: 'user-456', email: 'valid@example.com', type: 'access' },
        secret,
        { expiresIn: '1h' }
      );

      const url = new URL('http://localhost:3000/api/recipes');
      const req = new NextRequest(url, {
        headers: { cookie: `sessionToken=${token}` },
      });
      const res = authMiddleware(req);

      // NextResponse.next() returns status 200 and continues to next handler
      // Headers are attached to the request forwarded to the handler, not directly testable in unit test
      // The middleware function properly sets headers via Headers API which are forwarded by NextResponse.next()
      expect(res.status).toBe(200);
      expect(res instanceof NextResponse).toBe(true);
    });

    it('should return 401 for invalid token signature', () => {
      const wrongSecret = 'wrong-secret-key-must-be-32-chars';
      const token = jwt.sign(
        { sub: 'user-789', email: 'wrong@example.com', type: 'access' },
        wrongSecret,
        { expiresIn: '1h' }
      );

      const url = new URL('http://localhost:3000/api/recipes');
      const req = new NextRequest(url, {
        headers: { cookie: `sessionToken=${token}` },
      });
      const res = authMiddleware(req);

      expect(res.status).toBe(401);
    });
  });
});
