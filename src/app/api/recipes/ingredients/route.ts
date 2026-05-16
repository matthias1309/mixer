import { NextRequest, NextResponse } from 'next/server';
import { RecipeModelAsync } from '@/lib/db/models/recipe-async';
import { authMiddlewareWithRefresh, setTokenCookie } from '@/lib/auth/middleware';
import { withDatabase } from '@/lib/api/withDatabase';

async function handleGET(request: NextRequest) {
  try {
    const auth = await authMiddlewareWithRefresh(request);

    const ingredients = await RecipeModelAsync.getUniqueIngredients();

    let response = NextResponse.json({
      ingredients,
      total: ingredients.length,
    });

    if (auth) {
      response = setTokenCookie(response, auth.newToken);
    }

    return response;
  } catch (error) {
    console.error('Get ingredients error:', error);
    return NextResponse.json(
      { error: 'Failed to get ingredients' },
      { status: 500 }
    );
  }
}

export const GET = withDatabase(handleGET);
