import { NextRequest, NextResponse } from 'next/server';
import bcryptjs from 'bcryptjs';
import { UserModel } from '../../../../lib/db/models/user';
import { generateToken } from '../../../../lib/auth/tokenRefresh';
import { setTokenCookie } from '../../../../lib/auth/middleware';
import { checkRateLimit } from '../../../../lib/auth/rateLimiter';
import { LoginRequest } from '../../../../types';
import { withDatabase } from '../../../../lib/api/withDatabase';

// POST /api/auth/login
async function handler(request: NextRequest) {
  try {
    const ip = request.headers.get('x-forwarded-for')?.split(',')[0].trim() ?? 'unknown';
    const { allowed, retryAfterMs } = checkRateLimit(`login:${ip}`, 10, 15 * 60 * 1000);
    if (!allowed) {
      return NextResponse.json(
        { error: 'Too many login attempts. Please try again later.' },
        {
          status: 429,
          headers: { 'Retry-After': String(Math.ceil(retryAfterMs / 1000)) },
        }
      );
    }

    const body = (await request.json()) as LoginRequest;

    // Validate input
    if (!body.email || !body.password) {
      return NextResponse.json({ error: 'Email and password are required' }, { status: 400 });
    }

    // Find user by email
    const user = await UserModel.findByEmail(body.email);
    if (!user) {
      return NextResponse.json({ error: 'Invalid email or password' }, { status: 401 });
    }

    // Verify password
    const passwordValid = await bcryptjs.compare(body.password, user.password_hash);
    if (!passwordValid) {
      return NextResponse.json({ error: 'Invalid email or password' }, { status: 401 });
    }

    // Generate token
    const token = generateToken(String(user.id), user.email);

    // Create response
    const response = NextResponse.json(
      {
        user: {
          id: user.id,
          email: user.email,
        },
      },
      { status: 200 }
    );

    // Set token cookie
    return setTokenCookie(response, token);
  } catch (error) {
    console.error('Login error:', error);
    return NextResponse.json({ error: 'Login failed' }, { status: 500 });
  }
}

export const POST = withDatabase(handler);
