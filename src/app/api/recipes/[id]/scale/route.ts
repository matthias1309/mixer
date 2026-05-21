import { NextRequest, NextResponse } from 'next/server';
import { RecipeModelAsync } from '@/lib/db/models/recipe-async';
import { authMiddlewareWithRefresh, setTokenCookie } from '@/lib/auth/middleware';
import { RecipeScaler } from '@/lib/units/scaler';
import { HTTP_STATUS } from '@/lib/constants';
import { withDatabase } from '@/lib/api/withDatabase';

type Params = Promise<{ id: string }>;

// POST /api/recipes/[id]/scale - Scale recipe ingredients to a new serving size
async function handlePOST(request: NextRequest, props: { params: Params }) {
  try {
    const params = await props.params;
    const recipeId = parseInt(params.id, 10);

    if (!Number.isFinite(recipeId) || recipeId <= 0) {
      return NextResponse.json({ error: 'Invalid recipe ID' }, { status: HTTP_STATUS.BAD_REQUEST });
    }

    // Validate request body
    let body: { newServings?: unknown };
    try {
      body = await request.json();
    } catch {
      return NextResponse.json(
        { error: 'Invalid request body' },
        { status: HTTP_STATUS.BAD_REQUEST }
      );
    }

    const { newServings } = body;

    if (
      newServings === undefined ||
      newServings === null ||
      !Number.isInteger(newServings) ||
      (newServings as number) <= 0 ||
      (newServings as number) > 100
    ) {
      return NextResponse.json(
        { error: 'newServings must be an integer between 1 and 100' },
        { status: HTTP_STATUS.BAD_REQUEST }
      );
    }

    const targetServings = newServings as number;

    // Try to refresh token if authenticated
    const auth = await authMiddlewareWithRefresh(request);

    // Fetch the recipe
    const recipe = await RecipeModelAsync.findById(recipeId);
    if (!recipe) {
      return NextResponse.json({ error: 'Recipe not found' }, { status: HTTP_STATUS.NOT_FOUND });
    }

    // Guard against invalid servings
    if (!recipe.servings || recipe.servings <= 0) {
      return NextResponse.json(
        { error: 'Recipe servings must be greater than 0' },
        { status: HTTP_STATUS.BAD_REQUEST }
      );
    }

    // Fetch ingredients
    const ingredients = await RecipeModelAsync.getIngredients(recipeId);

    // Calculate scale factor
    const scaleFactor = targetServings / recipe.servings;

    // Initialize RecipeScaler
    const scaler = new RecipeScaler();

    // Scale each ingredient
    const scaledIngredients = ingredients.map((ingredient) =>
      scaler.scaleIngredient(ingredient, scaleFactor)
    );

    const response = NextResponse.json(
      {
        id: recipe.id,
        name: recipe.name,
        description: recipe.description,
        instructions: recipe.instructions,
        servings: targetServings,
        creatorId: recipe.creator_id,
        canonicalId: recipe.canonical_id,
        isDuplicate: Boolean(recipe.is_duplicate),
        createdAt: recipe.created_at,
        updatedAt: recipe.updated_at,
        ingredients: scaledIngredients,
      },
      { status: HTTP_STATUS.OK }
    );

    // Refresh token if authenticated
    if (auth) {
      return setTokenCookie(response, auth.newToken);
    }

    return response;
  } catch (error) {
    console.error('Scale recipe error:', error);
    return NextResponse.json(
      { error: 'Failed to scale recipe' },
      { status: HTTP_STATUS.INTERNAL_SERVER_ERROR }
    );
  }
}

export const POST = withDatabase(handlePOST);
