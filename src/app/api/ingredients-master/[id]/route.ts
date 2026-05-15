import { NextRequest, NextResponse } from 'next/server';
import { IngredientMasterModel, CreateIngredientMasterRequest } from '@/lib/db/models/ingredientMaster';
import { authMiddlewareWithRefresh, setTokenCookie } from '@/lib/auth/middleware';
import { HTTP_STATUS } from '@/lib/constants';

type Params = Promise<{ id: string }>;

export async function GET(request: NextRequest, props: { params: Params }) {
  try {
    const params = await props.params;
    const ingredientId = parseInt(params.id, 10);

    if (!Number.isFinite(ingredientId) || ingredientId <= 0) {
      return NextResponse.json(
        { error: 'Invalid ingredient ID' },
        { status: HTTP_STATUS.BAD_REQUEST }
      );
    }

    const ingredient = IngredientMasterModel.findById(ingredientId);
    if (!ingredient) {
      return NextResponse.json(
        { error: 'Ingredient not found' },
        { status: HTTP_STATUS.NOT_FOUND }
      );
    }

    return NextResponse.json(ingredient, { status: HTTP_STATUS.OK });
  } catch (error) {
    console.error('Get ingredient error:', error);
    return NextResponse.json(
      { error: 'Failed to get ingredient' },
      { status: HTTP_STATUS.INTERNAL_SERVER_ERROR }
    );
  }
}

export async function PUT(request: NextRequest, props: { params: Params }) {
  try {
    const params = await props.params;
    const ingredientId = parseInt(params.id, 10);

    if (!Number.isFinite(ingredientId) || ingredientId <= 0) {
      return NextResponse.json(
        { error: 'Invalid ingredient ID' },
        { status: HTTP_STATUS.BAD_REQUEST }
      );
    }

    const auth = await authMiddlewareWithRefresh(request);
    if (!auth) {
      return NextResponse.json(
        { error: 'Must be logged in to update ingredients' },
        { status: HTTP_STATUS.UNAUTHORIZED }
      );
    }

    const ingredient = IngredientMasterModel.findById(ingredientId);
    if (!ingredient) {
      return NextResponse.json(
        { error: 'Ingredient not found' },
        { status: HTTP_STATUS.NOT_FOUND }
      );
    }

    const body = (await request.json()) as Partial<CreateIngredientMasterRequest>;

    if (body.name !== undefined && body.name.trim() === '') {
      return NextResponse.json(
        { error: 'Ingredient name cannot be empty' },
        { status: HTTP_STATUS.BAD_REQUEST }
      );
    }

    if (body.name && body.name.length > 255) {
      return NextResponse.json(
        { error: 'Ingredient name must be at most 255 characters' },
        { status: HTTP_STATUS.BAD_REQUEST }
      );
    }

    // Validate nutrient values
    if (body.kcal !== undefined && (body.kcal < 0 || !Number.isFinite(body.kcal))) {
      return NextResponse.json(
        { error: 'kcal must be a positive number' },
        { status: HTTP_STATUS.BAD_REQUEST }
      );
    }

    const nutrientFields = [
      'sugar', 'fat', 'protein', 'carbohydrates', 'fiber',
      'sodium', 'calcium', 'vitamin_d', 'magnesium', 'vitamin_b6',
      'vitamin_b12', 'vitamin_e', 'iron', 'zinc'
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

    const updated = IngredientMasterModel.update(ingredientId, body);

    let response = NextResponse.json(updated, { status: HTTP_STATUS.OK });
    response = setTokenCookie(response, auth.newToken);
    return response;
  } catch (error: any) {
    console.error('Update ingredient error:', error);
    if (error.message?.includes('UNIQUE constraint failed')) {
      return NextResponse.json(
        { error: 'Ingredient with this name already exists' },
        { status: HTTP_STATUS.CONFLICT }
      );
    }
    return NextResponse.json(
      { error: 'Failed to update ingredient' },
      { status: HTTP_STATUS.INTERNAL_SERVER_ERROR }
    );
  }
}

export async function DELETE(request: NextRequest, props: { params: Params }) {
  try {
    const params = await props.params;
    const ingredientId = parseInt(params.id, 10);

    if (!Number.isFinite(ingredientId) || ingredientId <= 0) {
      return NextResponse.json(
        { error: 'Invalid ingredient ID' },
        { status: HTTP_STATUS.BAD_REQUEST }
      );
    }

    const auth = await authMiddlewareWithRefresh(request);
    if (!auth) {
      return NextResponse.json(
        { error: 'Must be logged in to delete ingredients' },
        { status: HTTP_STATUS.UNAUTHORIZED }
      );
    }

    const ingredient = IngredientMasterModel.findById(ingredientId);
    if (!ingredient) {
      return NextResponse.json(
        { error: 'Ingredient not found' },
        { status: HTTP_STATUS.NOT_FOUND }
      );
    }

    IngredientMasterModel.delete(ingredientId);

    let response = new NextResponse(null, { status: HTTP_STATUS.NO_CONTENT });
    response = setTokenCookie(response, auth.newToken);
    return response;
  } catch (error) {
    console.error('Delete ingredient error:', error);
    return NextResponse.json(
      { error: 'Failed to delete ingredient' },
      { status: HTTP_STATUS.INTERNAL_SERVER_ERROR }
    );
  }
}
