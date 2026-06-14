import { NextRequest, NextResponse } from 'next/server';
import { verifyTokenDetailed } from '@lib/auth/jwt';
import { verifyToken, refreshToken } from '@lib/auth/tokenRefresh';
import { HTTP_STATUS } from '@lib/constants';

// Scope the auth cookie to the app's base path so it is not shared with other
// apps hosted on the same domain (e.g. matt-maxx.de/rezepte). Falls back to "/".
const COOKIE_PATH = process.env.BASE_PATH || '/';

export function authMiddleware(req: NextRequest): NextResponse {
  const tokenCookie = req.cookies.get('sessionToken');

  if (!tokenCookie?.value) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: HTTP_STATUS.UNAUTHORIZED });
  }

  const result = verifyTokenDetailed(tokenCookie.value);

  if (result.error === 'expired') {
    return NextResponse.json({ error: 'Forbidden' }, { status: HTTP_STATUS.FORBIDDEN });
  }

  if (result.error === 'invalid') {
    return NextResponse.json({ error: 'Unauthorized' }, { status: HTTP_STATUS.UNAUTHORIZED });
  }

  const requestHeaders = new Headers(req.headers);
  requestHeaders.set('x-user-id', result.payload!.sub);
  requestHeaders.set('x-user-email', result.payload!.email);

  return NextResponse.next({ request: { headers: requestHeaders } });
}

export async function authMiddlewareWithRefresh(request: NextRequest) {
  const token = request.cookies.get('sessionToken')?.value;

  if (!token) {
    return null;
  }

  const payload = verifyToken(token);
  if (!payload) {
    return null;
  }

  // Token is valid, refresh it (sliding window)
  const newToken = refreshToken(payload.sub, payload.email);

  return {
    userId: payload.sub,
    email: payload.email,
    newToken,
  };
}

export function setTokenCookie<T>(response: NextResponse<T>, token: string): NextResponse<T> {
  response.cookies.set('sessionToken', token, {
    httpOnly: true,
    secure: process.env.NODE_ENV === 'production',
    sameSite: 'strict',
    maxAge: 60 * 60, // 1 hour
    path: COOKIE_PATH,
  });

  return response;
}

export function clearTokenCookie<T>(response: NextResponse<T>): NextResponse<T> {
  response.cookies.set('sessionToken', '', {
    httpOnly: true,
    secure: process.env.NODE_ENV === 'production',
    sameSite: 'strict',
    maxAge: 0,
    path: COOKIE_PATH,
  });

  return response;
}
