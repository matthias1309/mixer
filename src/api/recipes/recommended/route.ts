import { NextRequest, NextResponse } from 'next/server';
import { verifyAuth } from '@/lib/auth/middleware';
import { getDatabase } from '@/lib/db/client';
import { calculateCurrentPhase } from '@/lib/cycle/calculator';

export async function GET(request: NextRequest) {
  try {
    const user = await verifyAuth(request);
    if (!user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const db = await getDatabase();

    // Get user's current cycle
    const cycle = await db.get(
      'SELECT * FROM user_cycles WHERE user_id = ?',
      [user.userId]
    );

    if (!cycle) {
      return NextResponse.json(
        { error: 'Cycle not initialized' },
        { status: 404 }
      );
    }

    // Calculate current phase
    const currentPhase = calculateCurrentPhase({
      last_menstruation_date: new Date(cycle.last_menstruation_date),
      cycle_length_days: cycle.cycle_length_days,
    });

    // Redirect to filtered endpoint with current phase
    const url = new URL(request.url);
    url.pathname = '/api/recipes/filtered';
    url.searchParams.set('phase', currentPhase.phase.name.toLowerCase());

    const filteredRequest = new Request(url, request);
    const response = await fetch(filteredRequest);

    return response;
  } catch (error) {
    console.error('Recommended recipes error:', error);
    return NextResponse.json(
      { error: 'Failed to get recommendations' },
      { status: 500 }
    );
  }
}
