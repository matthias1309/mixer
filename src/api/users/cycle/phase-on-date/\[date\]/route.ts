import { NextRequest, NextResponse } from 'next/server';
import { verifyAuth } from '@/lib/auth/middleware';
import { getDatabase } from '@/lib/db/init';
import { calculatePhaseOnDate } from '@/lib/cycle/calculator';

export async function GET(
  request: NextRequest,
  { params }: { params: { date: string } }
) {
  try {
    const user = await verifyAuth(request);
    if (!user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

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

    const queryDate = new Date(params.date);
    if (isNaN(queryDate.getTime())) {
      return NextResponse.json(
        { error: 'Invalid date format' },
        { status: 400 }
      );
    }

    const result = calculatePhaseOnDate(
      {
        last_menstruation_date: new Date(cycle.last_menstruation_date),
        cycle_length_days: cycle.cycle_length_days,
      },
      queryDate
    );

    return NextResponse.json({
      status: 200,
      data: {
        date: params.date,
        day_of_cycle: result.day_of_cycle,
        phase: result.phase.name,
      },
    });
  } catch (error) {
    console.error('Phase on date error:', error);
    return NextResponse.json(
      { error: 'Failed to calculate phase' },
      { status: 500 }
    );
  }
}
