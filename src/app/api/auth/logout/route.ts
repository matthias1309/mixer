import { NextRequest, NextResponse } from 'next/server';
import { clearTokenCookie } from '../../../../lib/auth/middleware';

// POST /api/auth/logout
export async function POST(request: NextRequest) {
  try {
    const response = NextResponse.json(
      { message: 'Logged out successfully' },
      { status: 200 }
    );

    clearTokenCookie(response);

    return response;
  } catch (error: unknown) {
    console.error('Logout error:', error);
    return NextResponse.json(
      { error: 'Logout failed' },
      { status: 500 }
    );
  }
}
