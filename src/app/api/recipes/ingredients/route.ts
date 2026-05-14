import { NextRequest, NextResponse } from 'next/server';
import { RecipeModel } from '../../../../lib/db/models/recipe';
import { authMiddlewareWithRefresh, setTokenCookie } from '../../../../lib/auth/middleware';

export async function GET(request: NextRequest) {
  try {
    const auth = await authMiddlewareWithRefresh(request);

    const ingredients = RecipeModel.getUniqueIngredients();

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
