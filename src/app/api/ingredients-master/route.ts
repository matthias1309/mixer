import { NextRequest, NextResponse } from 'next/server';
import { IngredientMasterModelAsync, CreateIngredientMasterRequest } from '@/lib/db/models/ingredientMasterAsync';
import { authMiddlewareWithRefresh, setTokenCookie } from '@/lib/auth/middleware';
import { HTTP_STATUS, VALIDATION } from '@/lib/constants';
import { withDatabase } from '@/lib/api/withDatabase';

async function handleGET(request: NextRequest) {
  try {
    const searchParams = request.nextUrl.searchParams;
    const page = Math.max(1, parseInt(searchParams.get('page') || '1', 10));
    const pageSize = Math.min(100, Math.max(1, parseInt(searchParams.get('pageSize') || '20', 10)));
    const search = searchParams.get('search') || undefined;

    const result = await IngredientMasterModelAsync.findAll(page, pageSize, search);

    const totalPages = Math.ceil(result.total / pageSize);

    const response = NextResponse.json(
      {
        ingredients: result.ingredients,
        total: result.total,
        page,
        pageSize,
        totalPages,
      },
      { status: HTTP_STATUS.OK }
    );

    return response;
  } catch (error) {
    console.error('List ingredients error:', error);
    return NextResponse.json(
      { error: 'Failed to list ingredients' },
      { status: HTTP_STATUS.INTERNAL_SERVER_ERROR }
    );
  }
}

async function handlePOST(request: NextRequest) {
  try {
    const auth = await authMiddlewareWithRefresh(request);
    if (!auth) {
      return NextResponse.json(
        { error: 'Must be logged in to create ingredients' },
        { status: HTTP_STATUS.UNAUTHORIZED }
      );
    }

    const body = (await request.json()) as CreateIngredientMasterRequest;

    if (!body.name || body.name.trim() === '') {
      return NextResponse.json(
        { error: 'Ingredient name is required' },
        { status: HTTP_STATUS.BAD_REQUEST }
      );
    }

    if (body.name.length > 255) {
      return NextResponse.json(
        { error: 'Ingredient name must be at most 255 characters' },
        { status: HTTP_STATUS.BAD_REQUEST }
      );
    }

    if (body.kcal !== undefined && (body.kcal < 0 || !Number.isFinite(body.kcal))) {
      return NextResponse.json(
        { error: 'kcal must be a positive number' },
        { status: HTTP_STATUS.BAD_REQUEST }
      );
    }

    // Validate all nutrient values are >= 0
    const nutrientFields = [
      'iron', 'sugar', 'fat', 'protein', 'carbohydrates', 'fiber',
      'salt', 'sodium', 'calcium', 'vitamin_d', 'magnesium', 'vitamin_b6',
      'vitamin_b12', 'vitamin_e', 'zinc'
    ] as const;

    for (const field of nutrientFields) {
      const value = body[field];
      if (value !== undefined && (value < 0 || !Number.isFinite(value))) {
        return NextResponse.json(
          { error: `${field} must be a positive number` },
          { status: HTTP_STATUS.BAD_REQUEST }
        );
      }
    }

    const ingredient = await IngredientMasterModelAsync.create(body);

    let response = NextResponse.json(ingredient, { status: HTTP_STATUS.CREATED });
    response = setTokenCookie(response, auth.newToken);
    return response;
  } catch (error: any) {
    console.error('Create ingredient error:', error);
    if (error.message?.includes('UNIQUE constraint failed')) {
      return NextResponse.json(
        { error: 'Ingredient with this name already exists' },
        { status: HTTP_STATUS.CONFLICT }
      );
    }
    return NextResponse.json(
      { error: 'Failed to create ingredient' },
      { status: HTTP_STATUS.INTERNAL_SERVER_ERROR }
    );
  }
}

export const GET = withDatabase(handleGET);
export const POST = withDatabase(handlePOST);
