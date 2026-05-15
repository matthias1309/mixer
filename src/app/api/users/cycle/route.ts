import { NextRequest, NextResponse } from 'next/server';
import { authMiddlewareWithRefresh, setTokenCookie } from '@/lib/auth/middleware';
import { UserModel } from '@/lib/db/models/user';
import { HTTP_STATUS } from '@/lib/constants';

export async function POST(request: NextRequest) {
  try {
    const auth = await authMiddlewareWithRefresh(request);
    if (!auth) {
      return NextResponse.json(
        { error: 'Must be logged in to save cycle data' },
        { status: HTTP_STATUS.UNAUTHORIZED }
      );
    }

    const body = await request.json();
    const { last_menstruation_date, cycle_length_days } = body;

    if (!last_menstruation_date) {
      return NextResponse.json(
        { error: 'Last menstruation date is required' },
        { status: HTTP_STATUS.BAD_REQUEST }
      );
    }

    if (!cycle_length_days || cycle_length_days < 21 || cycle_length_days > 35) {
      return NextResponse.json(
        { error: 'Cycle length must be between 21 and 35 days' },
        { status: HTTP_STATUS.BAD_REQUEST }
      );
    }

    const userId = parseInt(auth.userId, 10);
    const cycle = UserModel.saveCycle(userId, last_menstruation_date, cycle_length_days);

    let response = NextResponse.json({
      success: true,
      data: cycle,
    }, { status: HTTP_STATUS.OK });

    response = setTokenCookie(response, auth.newToken);
    return response;
  } catch (error) {
    console.error('Save cycle error:', error);
    return NextResponse.json(
      { error: 'Failed to save cycle data' },
      { status: HTTP_STATUS.INTERNAL_SERVER_ERROR }
    );
  }
}

export async function GET(request: NextRequest) {
  try {
    const auth = await authMiddlewareWithRefresh(request);
    if (!auth) {
      return NextResponse.json(
        { error: 'Must be logged in' },
        { status: HTTP_STATUS.UNAUTHORIZED }
      );
    }

    const userId = parseInt(auth.userId, 10);
    const cycle = UserModel.getCycle(userId);

    if (!cycle) {
      return NextResponse.json({
        success: false,
        data: null,
      }, { status: HTTP_STATUS.OK });
    }

    // Calculate current phase
    const lastDate = new Date(cycle.last_menstruation_date);
    const today = new Date();
    const dayOfCycle = Math.floor((today.getTime() - lastDate.getTime()) / (1000 * 60 * 60 * 24)) % cycle.cycle_length_days;
    const cycleProgress = dayOfCycle / cycle.cycle_length_days;

    // Determine phase (menstruation, follicular, ovulation, luteal)
    let phaseName = 'Menstruation';
    if (dayOfCycle > 5 && dayOfCycle < 13) {
      phaseName = 'Follicular';
    } else if (dayOfCycle >= 13 && dayOfCycle < 15) {
      phaseName = 'Ovulation';
    } else if (dayOfCycle >= 15) {
      phaseName = 'Luteal';
    }

    const responseData = {
      last_menstruation_date: cycle.last_menstruation_date,
      cycle_length_days: cycle.cycle_length_days,
      current_phase: {
        phase: {
          name: phaseName,
          day_start: 0,
          day_end: cycle.cycle_length_days,
          description: `${phaseName} phase of menstrual cycle`,
        },
        day_of_cycle: dayOfCycle,
        cycle_progress: cycleProgress,
      },
    };

    let response = NextResponse.json({
      success: true,
      data: responseData,
    }, { status: HTTP_STATUS.OK });

    response = setTokenCookie(response, auth.newToken);
    return response;
  } catch (error) {
    console.error('Get cycle error:', error);
    return NextResponse.json(
      { error: 'Failed to get cycle data' },
      { status: HTTP_STATUS.INTERNAL_SERVER_ERROR }
    );
  }
}
