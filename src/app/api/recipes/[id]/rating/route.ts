import { NextRequest, NextResponse } from 'next/server';
import { getDb } from '@/lib/db/init';
import { RecipeModelAsync } from '@/lib/db/models/recipe-async';
import { upsertRating, getUserRating } from '@/lib/db/models/rating';
import { authMiddlewareWithRefresh, setTokenCookie } from '@/lib/auth/middleware';
import { HTTP_STATUS } from '@/lib/constants';
import { withDatabase } from '@/lib/api/withDatabase';

type Params = Promise<{ id: string }>;

function parseRecipeId(raw: string): number | null {
  const id = parseInt(raw, 10);
  if (!Number.isFinite(id) || id <= 0) {
    return null;
  }
  return id;
}

// GET /api/recipes/[id]/rating - The caller's current rating (or null)
async function handleGET(request: NextRequest, props: { params: Params }) {
  try {
    const params = await props.params;
    const recipeId = parseRecipeId(params.id);
    if (recipeId === null) {
      return NextResponse.json({ error: 'Invalid recipe ID' }, { status: HTTP_STATUS.BAD_REQUEST });
    }

    const auth = await authMiddlewareWithRefresh(request);
    if (!auth) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: HTTP_STATUS.UNAUTHORIZED });
    }

    const stars = getUserRating(getDb(), parseInt(auth.userId, 10), recipeId);

    let response = NextResponse.json({ stars }, { status: HTTP_STATUS.OK });
    response = setTokenCookie(response, auth.newToken);
    return response;
  } catch (error) {
    console.error('Get rating error:', error);
    return NextResponse.json(
      { error: 'Failed to get rating' },
      { status: HTTP_STATUS.INTERNAL_SERVER_ERROR }
    );
  }
}

// POST/PUT /api/recipes/[id]/rating - Submit or change the caller's rating (upsert)
async function handleUpsert(request: NextRequest, props: { params: Params }) {
  try {
    const params = await props.params;
    const recipeId = parseRecipeId(params.id);
    if (recipeId === null) {
      return NextResponse.json({ error: 'Invalid recipe ID' }, { status: HTTP_STATUS.BAD_REQUEST });
    }

    const auth = await authMiddlewareWithRefresh(request);
    if (!auth) {
      return NextResponse.json(
        { error: 'Must be logged in to rate a recipe' },
        { status: HTTP_STATUS.UNAUTHORIZED }
      );
    }

    const recipe = await RecipeModelAsync.findById(recipeId);
    if (!recipe) {
      return NextResponse.json({ error: 'Recipe not found' }, { status: HTTP_STATUS.NOT_FOUND });
    }

    const body = (await request.json()) as { stars?: unknown };

    if (!Number.isInteger(body.stars) || (body.stars as number) < 1 || (body.stars as number) > 5) {
      return NextResponse.json(
        { error: 'stars must be an integer between 1 and 5' },
        { status: HTTP_STATUS.BAD_REQUEST }
      );
    }

    const stars = body.stars as number;
    upsertRating(getDb(), parseInt(auth.userId, 10), recipeId, stars);

    let response = NextResponse.json({ stars }, { status: HTTP_STATUS.OK });
    response = setTokenCookie(response, auth.newToken);
    return response;
  } catch (error) {
    console.error('Submit rating error:', error);
    return NextResponse.json(
      { error: 'Failed to submit rating' },
      { status: HTTP_STATUS.INTERNAL_SERVER_ERROR }
    );
  }
}

export const GET = withDatabase(handleGET);
export const POST = withDatabase(handleUpsert);
export const PUT = withDatabase(handleUpsert);
