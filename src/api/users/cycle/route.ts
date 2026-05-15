import { NextRequest, NextResponse } from 'next/server';
import { authMiddlewareWithRefresh, setTokenCookie } from '@/lib/auth/middleware';
import { getDatabase } from '@/lib/db/init';
import { calculateCurrentPhase } from '@/lib/cycle/calculator';

export async function GET(request: NextRequest) {
  try {
    const auth = await authMiddlewareWithRefresh(request);
    if (!auth) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }
    const user = { userId: auth.userId };

    const db = await getDatabase();
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

    const currentPhase = calculateCurrentPhase({
      last_menstruation_date: new Date(cycle.last_menstruation_date),
      cycle_length_days: cycle.cycle_length_days,
    });

    return NextResponse.json({
      status: 200,
      data: {
        last_menstruation_date: cycle.last_menstruation_date,
        cycle_length_days: cycle.cycle_length_days,
        current_phase: currentPhase,
      },
    });
  } catch (error) {
    console.error('Cycle fetch error:', error);
    return NextResponse.json(
      { error: 'Failed to fetch cycle' },
      { status: 500 }
    );
  }
}

export async function POST(request: NextRequest) {
  try {
    const auth = await authMiddlewareWithRefresh(request);
    if (!auth) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }
    const user = { userId: auth.userId };

    const body = await request.json();
    const { last_menstruation_date, cycle_length_days } = body;

    // Validate input
    if (!last_menstruation_date) {
      return NextResponse.json(
        { error: 'Last menstruation date required' },
        { status: 400 }
      );
    }

    if (!cycle_length_days || cycle_length_days < 21 || cycle_length_days > 35) {
      return NextResponse.json(
        { error: 'Cycle length must be 21-35 days' },
        { status: 400 }
      );
    }

    const db = await getDatabase();

    // Check if exists
    const existing = await db.get(
      'SELECT id FROM user_cycles WHERE user_id = ?',
      [user.userId]
    );

    const cycleDate = new Date(last_menstruation_date);

    if (existing) {
      // Update
      await db.run(
        `UPDATE user_cycles SET
          last_menstruation_date = ?, cycle_length_days = ?, updated_at = NOW()
         WHERE user_id = ?`,
        [cycleDate, cycle_length_days, user.userId]
      );
    } else {
      // Create
      await db.run(
        `INSERT INTO user_cycles (user_id, last_menstruation_date, cycle_length_days)
         VALUES (?, ?, ?)`,
        [user.userId, cycleDate, cycle_length_days]
      );
    }

    const currentPhase = calculateCurrentPhase({
      last_menstruation_date: cycleDate,
      cycle_length_days,
    });

    return NextResponse.json({
      status: 200,
      data: {
        last_menstruation_date,
        cycle_length_days,
        current_phase: currentPhase,
      },
    });
  } catch (error) {
    console.error('Cycle create error:', error);
    return NextResponse.json(
      { error: 'Failed to create/update cycle' },
      { status: 500 }
    );
  }
}

export async function PUT(request: NextRequest) {
  // PUT is same as POST for updates
  return POST(request);
}
