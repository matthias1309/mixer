import { NextRequest, NextResponse } from 'next/server';
import bcryptjs from 'bcryptjs';
import { UserModel } from '../../../../lib/db/models/user';
import { generateToken } from '../../../../lib/auth/tokenRefresh';
import { setTokenCookie } from '../../../../lib/auth/middleware';
import { RegisterRequest } from '../../../../types';
import { withDatabase } from '../../../../lib/api/withDatabase';

// Input validation
function validateEmail(email: string): boolean {
  const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
  return emailRegex.test(email) && email.length <= 255;
}

function validatePassword(password: string): boolean {
  return password.length >= 8;
}

// POST /api/auth/register
async function handler(request: NextRequest) {
  try {
    const body = (await request.json()) as RegisterRequest;

    // Validate input
    if (!body.email || !body.password) {
      return NextResponse.json(
        { error: 'Email and password are required' },
        { status: 400 }
      );
    }

    if (!validateEmail(body.email)) {
      return NextResponse.json(
        { error: 'Invalid email format' },
        { status: 400 }
      );
    }

    if (!validatePassword(body.password)) {
      return NextResponse.json(
        { error: 'Password must be at least 8 characters' },
        { status: 400 }
      );
    }

    // Check if user already exists
    const existing = await UserModel.findByEmail(body.email);
    if (existing) {
      return NextResponse.json(
        { error: 'Email already exists' },
        { status: 400 }
      );
    }

    // Hash password and create user
    const passwordHash = await bcryptjs.hash(body.password, 10);
    const user = await UserModel.create(body.email, passwordHash);

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
      { status: 201 }
    );

    // Set token cookie
    return setTokenCookie(response, token);
  } catch (error) {
    console.error('Registration error:', error);
    return NextResponse.json(
      { error: 'Registration failed' },
      { status: 500 }
    );
  }
}

export const POST = withDatabase(handler);
