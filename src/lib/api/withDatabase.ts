import { NextRequest, NextResponse } from 'next/server';
import { initializeDatabase } from '../db/init';

export function withDatabase(
  handler: (request: NextRequest, props?: any) => Promise<NextResponse>
) {
  return async (request: NextRequest, props?: any) => {
    try {
      await initializeDatabase();
    } catch (error) {
      console.error('Database initialization failed:', error);
      return NextResponse.json(
        { error: 'Database initialization failed' },
        { status: 500 }
      );
    }

    return handler(request, props);
  };
}
