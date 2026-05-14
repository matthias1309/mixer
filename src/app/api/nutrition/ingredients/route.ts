import { NextRequest, NextResponse } from 'next/server';
import { getDatabase } from '@/lib/db/init';

export async function GET(request: NextRequest) {
  try {
    const db = getDatabase();

    const ingredients = db.prepare(
      'SELECT * FROM ingredients ORDER BY category, name'
    ).all();

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
