import { NextRequest, NextResponse } from 'next/server';
import { RecipeModel } from '@/lib/db/models/recipe';
import { RecipeModelAsync } from '@/lib/db/models/recipe-async';
import { UserModel } from '@/lib/db/models/user';
import { authMiddlewareWithRefresh, setTokenCookie } from '@/lib/auth/middleware';
import { UpdateRecipeRequest } from '@/types';
import { VALIDATION, HTTP_STATUS } from '@/lib/constants';
import { withDatabase } from '@/lib/api/withDatabase';
import { validateRecipeMetadataFields } from '@/lib/validation';

type Params = Promise<{ id: string }>;

// GET /api/recipes/[id] - Get recipe detail
async function handleGET(request: NextRequest, props: { params: Params }) {
  try {
    const params = await props.params;
    const recipeId = parseInt(params.id, 10);

    if (!Number.isFinite(recipeId) || recipeId <= 0) {
      return NextResponse.json({ error: 'Invalid recipe ID' }, { status: HTTP_STATUS.BAD_REQUEST });
    }

    // Try to refresh token if authenticated
    const auth = await authMiddlewareWithRefresh(request);

    const recipe = await RecipeModelAsync.findById(recipeId);
    if (!recipe) {
      return NextResponse.json({ error: 'Recipe not found' }, { status: HTTP_STATUS.NOT_FOUND });
    }

    // Get creator info
    const creator = await UserModel.findById(recipe.creator_id);
    const creatorName = creator ? creator.email : 'Unknown';

    // Get ingredients
    const ingredients = await RecipeModelAsync.getIngredients(recipeId);

    // Get nutrients
    const nutrients = await RecipeModelAsync.getNutrients(recipeId);

    // Get tags
    const tags = await RecipeModelAsync.getTags(recipeId);

    // Check permissions
    const canEdit = auth ? parseInt(auth.userId, 10) === recipe.creator_id : false;
    const canDelete = auth ? parseInt(auth.userId, 10) === recipe.creator_id : false;

    let response = NextResponse.json(
      {
        id: recipe.id,
        name: recipe.name,
        description: recipe.description,
        instructions: recipe.instructions,
        servings: recipe.servings,
        imagePath: recipe.image_path,
        creatorId: recipe.creator_id,
        creatorName,
        ingredients,
        nutrients,
        canonicalId: recipe.canonical_id,
        isDuplicate: Boolean(recipe.is_duplicate),
        createdAt: recipe.created_at,
        updatedAt: recipe.updated_at,
        canEdit,
        canDelete,
        difficulty: recipe.difficulty,
        totalTimeMinutes: recipe.total_time_minutes,
        mealType: recipe.meal_type,
        tags,
      },
      { status: HTTP_STATUS.OK }
    );

    // Refresh token if authenticated
    if (auth) {
      response = setTokenCookie(response, auth.newToken);
    }

    return response;
  } catch (error) {
    console.error('Get recipe error:', error);
    return NextResponse.json(
      { error: 'Failed to get recipe' },
      { status: HTTP_STATUS.INTERNAL_SERVER_ERROR }
    );
  }
}

// PUT /api/recipes/[id] - Update recipe (owner only)
export async function PUT(request: NextRequest, props: { params: Params }) {
  try {
    const params = await props.params;
    const recipeId = parseInt(params.id, 10);

    if (!Number.isFinite(recipeId) || recipeId <= 0) {
      return NextResponse.json({ error: 'Invalid recipe ID' }, { status: HTTP_STATUS.BAD_REQUEST });
    }

    // Require authentication
    const auth = await authMiddlewareWithRefresh(request);
    if (!auth) {
      return NextResponse.json(
        { error: 'Must be logged in to update recipes' },
        { status: HTTP_STATUS.UNAUTHORIZED }
      );
    }

    const recipe = await RecipeModelAsync.findById(recipeId);
    if (!recipe) {
      return NextResponse.json({ error: 'Recipe not found' }, { status: HTTP_STATUS.NOT_FOUND });
    }

    // Check ownership
    if (recipe.creator_id !== parseInt(auth.userId, 10)) {
      return NextResponse.json(
        { error: 'You can only update recipes you created' },
        { status: HTTP_STATUS.FORBIDDEN }
      );
    }

    const body = (await request.json()) as UpdateRecipeRequest;

    // Validate name if provided
    if (body.name !== undefined) {
      if (body.name.trim() === '') {
        return NextResponse.json(
          { error: 'Recipe name cannot be empty' },
          { status: HTTP_STATUS.BAD_REQUEST }
        );
      }

      if (body.name.length > VALIDATION.RECIPE_NAME_MAX_LENGTH) {
        return NextResponse.json(
          { error: `Recipe name must be at most ${VALIDATION.RECIPE_NAME_MAX_LENGTH} characters` },
          { status: HTTP_STATUS.BAD_REQUEST }
        );
      }
    }

    // Validate description if provided
    if (
      body.description !== undefined &&
      body.description !== null &&
      body.description.length > VALIDATION.RECIPE_DESCRIPTION_MAX_LENGTH
    ) {
      return NextResponse.json(
        {
          error: `Description must be at most ${VALIDATION.RECIPE_DESCRIPTION_MAX_LENGTH} characters`,
        },
        { status: HTTP_STATUS.BAD_REQUEST }
      );
    }

    // Validate instructions if provided
    if (
      body.instructions !== undefined &&
      body.instructions !== null &&
      body.instructions.length > VALIDATION.RECIPE_INSTRUCTIONS_MAX_LENGTH
    ) {
      return NextResponse.json(
        {
          error: `Instructions must be at most ${VALIDATION.RECIPE_INSTRUCTIONS_MAX_LENGTH} characters`,
        },
        { status: HTTP_STATUS.BAD_REQUEST }
      );
    }

    // Validate servings if provided
    if (body.servings !== undefined) {
      if (!Number.isInteger(body.servings) || body.servings <= 0) {
        return NextResponse.json(
          { error: 'Servings must be a positive integer' },
          { status: HTTP_STATUS.BAD_REQUEST }
        );
      }
    }

    // Validate ingredients if provided
    if (body.ingredients !== undefined && body.ingredients.length > 0) {
      if (body.ingredients.length > VALIDATION.MAX_INGREDIENTS) {
        return NextResponse.json(
          { error: `Recipe cannot have more than ${VALIDATION.MAX_INGREDIENTS} ingredients` },
          { status: HTTP_STATUS.BAD_REQUEST }
        );
      }

      for (const ing of body.ingredients) {
        if (!ing.name || ing.name.trim() === '') {
          return NextResponse.json(
            { error: 'Ingredient name is required' },
            { status: HTTP_STATUS.BAD_REQUEST }
          );
        }

        if (ing.name.length > VALIDATION.INGREDIENT_NAME_MAX_LENGTH) {
          return NextResponse.json(
            {
              error: `Ingredient name must be at most ${VALIDATION.INGREDIENT_NAME_MAX_LENGTH} characters`,
            },
            { status: HTTP_STATUS.BAD_REQUEST }
          );
        }

        if (!Number.isInteger(ing.quantity) || ing.quantity <= 0) {
          return NextResponse.json(
            { error: 'Ingredient quantity must be a positive integer' },
            { status: HTTP_STATUS.BAD_REQUEST }
          );
        }
      }
    }

    // Validate metadata if provided (REQ-016)
    const metadataError = validateRecipeMetadataFields(body);
    if (metadataError) {
      return NextResponse.json({ error: metadataError }, { status: HTTP_STATUS.BAD_REQUEST });
    }

    // Update recipe
    const updated = await RecipeModelAsync.update(
      recipeId,
      body.name?.trim(),
      body.description?.trim(),
      body.instructions?.trim(),
      body.servings,
      body.ingredients,
      {
        difficulty: body.difficulty,
        totalTimeMinutes: body.totalTimeMinutes,
        mealType: body.mealType,
        tags: body.tags,
      }
    );

    const ingredients = await RecipeModelAsync.getIngredients(recipeId);
    const creator = await UserModel.findById(updated.creator_id);
    const creatorName = creator ? creator.email : 'Unknown';

    let response = NextResponse.json(
      {
        id: updated.id,
        name: updated.name,
        description: updated.description,
        instructions: updated.instructions,
        servings: updated.servings,
        creatorId: updated.creator_id,
        creatorName,
        ingredients,
        canonicalId: updated.canonical_id,
        isDuplicate: Boolean(updated.is_duplicate),
        createdAt: updated.created_at,
        updatedAt: updated.updated_at,
        difficulty: updated.difficulty,
        totalTimeMinutes: updated.total_time_minutes,
        mealType: updated.meal_type,
        tags: await RecipeModelAsync.getTags(recipeId),
      },
      { status: HTTP_STATUS.OK }
    );

    // Refresh token
    response = setTokenCookie(response, auth.newToken);

    return response;
  } catch (error) {
    console.error('Update recipe error:', error);
    return NextResponse.json(
      { error: 'Failed to update recipe' },
      { status: HTTP_STATUS.INTERNAL_SERVER_ERROR }
    );
  }
}

// DELETE /api/recipes/[id] - Delete recipe (owner only)
export async function DELETE(request: NextRequest, props: { params: Params }) {
  try {
    const params = await props.params;
    const recipeId = parseInt(params.id, 10);

    if (!Number.isFinite(recipeId) || recipeId <= 0) {
      return NextResponse.json({ error: 'Invalid recipe ID' }, { status: HTTP_STATUS.BAD_REQUEST });
    }

    // Require authentication
    const auth = await authMiddlewareWithRefresh(request);
    if (!auth) {
      return NextResponse.json(
        { error: 'Must be logged in to delete recipes' },
        { status: HTTP_STATUS.UNAUTHORIZED }
      );
    }

    const recipe = await RecipeModelAsync.findById(recipeId);
    if (!recipe) {
      return NextResponse.json({ error: 'Recipe not found' }, { status: HTTP_STATUS.NOT_FOUND });
    }

    // Check ownership
    if (recipe.creator_id !== parseInt(auth.userId, 10)) {
      return NextResponse.json(
        { error: 'You can only delete recipes you created' },
        { status: HTTP_STATUS.FORBIDDEN }
      );
    }

    // Delete recipe
    await RecipeModelAsync.delete(recipeId);

    let response = new NextResponse(null, { status: HTTP_STATUS.NO_CONTENT });

    // Refresh token
    response = setTokenCookie(response, auth.newToken);

    return response;
  } catch (error) {
    console.error('Delete recipe error:', error);
    return NextResponse.json(
      { error: 'Failed to delete recipe' },
      { status: HTTP_STATUS.INTERNAL_SERVER_ERROR }
    );
  }
}

export const GET = withDatabase(handleGET);
