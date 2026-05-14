import { NextRequest, NextResponse } from 'next/server';
import { getDatabase } from '@/lib/db/client';

export async function GET(request: NextRequest) {
  try {
    const db = await getDatabase();

    const ingredients = await db.all(
      'SELECT * FROM ingredients ORDER BY category, name'
    );

    return NextResponse.json({
      status: 200,
      data: ingredients,
      total: ingredients.length,
    });
  } catch (error) {
    console.error('Error fetching ingredients:', error);
    return NextResponse.json(
      { status: 500, error: 'Failed to fetch ingredients' },
      { status: 500 }
    );
  }
}
