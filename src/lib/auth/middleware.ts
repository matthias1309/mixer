import { NextRequest, NextResponse } from 'next/server';
import { verifyTokenDetailed } from '@lib/auth/jwt';
import { HTTP_STATUS } from '@lib/constants';

export function authMiddleware(req: NextRequest): NextResponse {
  const tokenCookie = req.cookies.get('token');

  if (!tokenCookie?.value) {
    return NextResponse.json(
      { error: 'Unauthorized' },
      { status: HTTP_STATUS.UNAUTHORIZED }
    );
  }

  const result = verifyTokenDetailed(tokenCookie.value);

  if (result.error === 'expired') {
    return NextResponse.json(
      { error: 'Forbidden' },
      { status: HTTP_STATUS.FORBIDDEN }
    );
  }

  if (result.error === 'invalid') {
    return NextResponse.json(
      { error: 'Unauthorized' },
      { status: HTTP_STATUS.UNAUTHORIZED }
    );
  }

  const requestHeaders = new Headers(req.headers);
  requestHeaders.set('x-user-id', result.payload!.userId);
  requestHeaders.set('x-user-email', result.payload!.email);

  return NextResponse.next({ request: { headers: requestHeaders } });
}
