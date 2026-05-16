import { NextRequest, NextResponse } from 'next/server';
import { initializeDatabase } from './lib/db/init';

export async function middleware(request: NextRequest) {
  try {
    await initializeDatabase();
  } catch (error) {
    console.error('Database initialization failed in middleware:', error);
  }

  return NextResponse.next();
}

export const config = {
  matcher: ['/api/:path*'],
};
