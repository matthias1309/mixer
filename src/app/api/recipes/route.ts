import { NextRequest, NextResponse } from 'next/server';
import { RecipeModel } from '@/lib/db/models/recipe';
import { RecipeModelAsync } from '@/lib/db/models/recipe-async';
import { authMiddlewareWithRefresh, setTokenCookie } from '@/lib/auth/middleware';
import { CreateRecipeRequest } from '@/types';
import {
  VALIDATION,
  HTTP_STATUS,
  RECIPE_SORT_OPTIONS,
  RecipeSortOption,
  DEFAULT_RECIPE_SORT,
  PHASE_OPTIONS,
  DEFAULT_PHASE,
} from '@/lib/constants';
import { withDatabase } from '@/lib/api/withDatabase';
import { validateRecipeMetadataFields } from '@/lib/validation';
import { RecipeQueryFilters } from '@/lib/db/build-recipe-query';

// GET /api/recipes - List recipes with pagination, search, and sorting
async function handleGET(request: NextRequest) {
  try {
    const searchParams = request.nextUrl.searchParams;
    const parsedPage = parseInt(searchParams.get('page') || '1', 10);
    const page = Math.max(1, Number.isNaN(parsedPage) ? 1 : parsedPage);
    const parsedPageSize = parseInt(searchParams.get('pageSize') || '10', 10);
    const pageSize = Math.min(100, Math.max(1, Number.isNaN(parsedPageSize) ? 10 : parsedPageSize));
    const rawSort = searchParams.get('sort') || DEFAULT_RECIPE_SORT;
    const sort = (RECIPE_SORT_OPTIONS as readonly string[]).includes(rawSort)
      ? (rawSort as RecipeSortOption)
      : DEFAULT_RECIPE_SORT;
    const search = searchParams.get('search') || undefined;
    const ingredients = searchParams.get('ingredients');
    const rawPhase = searchParams.get('phase');
    const phase =
      rawPhase && (PHASE_OPTIONS as readonly string[]).includes(rawPhase)
        ? rawPhase
        : DEFAULT_PHASE;

    // REQ-017 — unknown values are dropped by buildRecipeQuery (AC-017-04),
    // so no validation is needed here.
    const rawTags = searchParams.get('tags');
    const rawMaxTime = searchParams.get('maxTime');
    const rawMinRating = searchParams.get('minRating');
    const filters: RecipeQueryFilters = {
      difficulty: searchParams.get('difficulty') || undefined,
      mealType: searchParams.get('mealType') || undefined,
      maxTime: rawMaxTime ? parseInt(rawMaxTime, 10) : undefined,
      tags: rawTags ? rawTags.split(',').map((tag) => tag.trim()) : undefined,
      minRating: rawMinRating ? parseInt(rawMinRating, 10) : undefined,
    };

    // Try to refresh token if authenticated
    const auth = await authMiddlewareWithRefresh(request);

    // Use async listing with scoring and phase support
    let result;
    if (ingredients) {
      // Filter by ingredients if provided
      const ingredientList = ingredients.split(',').map((ing) => ing.trim());
      result = await RecipeModel.filterByIngredientsWithScoreAsync(
        ingredientList,
        page,
        pageSize,
        phase,
        { ...filters, sort }
      );
    } else {
      result = await RecipeModelAsync.listAllWithScoreAsync(
        page,
        pageSize,
        sort,
        search,
        phase,
        filters
      );
    }

    const totalPages = Math.ceil(result.total / pageSize);

    let response = NextResponse.json(
      {
        recipes: result.recipes,
        total: result.total,
        page,
        pageSize,
        totalPages,
      },
      { status: HTTP_STATUS.OK }
    );

    // Refresh token if authenticated
    if (auth) {
      response = setTokenCookie(response, auth.newToken);
    }

    return response;
  } catch (error) {
    console.error('List recipes error:', error);
    return NextResponse.json(
      { error: 'Failed to list recipes' },
      { status: HTTP_STATUS.INTERNAL_SERVER_ERROR }
    );
  }
}

export const GET = withDatabase(handleGET);

// POST /api/recipes - Create a new recipe
async function handlePOST(request: NextRequest) {
  try {
    // Require authentication
    const auth = await authMiddlewareWithRefresh(request);
    if (!auth) {
      return NextResponse.json(
        { error: 'Must be logged in to create recipes' },
        { status: HTTP_STATUS.UNAUTHORIZED }
      );
    }

    const body = (await request.json()) as CreateRecipeRequest;

    // Validate name
    if (!body.name || body.name.trim() === '') {
      return NextResponse.json(
        { error: 'Recipe name is required' },
        { status: HTTP_STATUS.BAD_REQUEST }
      );
    }

    if (body.name.length > VALIDATION.RECIPE_NAME_MAX_LENGTH) {
      return NextResponse.json(
        { error: `Recipe name must be at most ${VALIDATION.RECIPE_NAME_MAX_LENGTH} characters` },
        { status: HTTP_STATUS.BAD_REQUEST }
      );
    }

    // Validate description
    if (body.description && body.description.length > VALIDATION.RECIPE_DESCRIPTION_MAX_LENGTH) {
      return NextResponse.json(
        {
          error: `Description must be at most ${VALIDATION.RECIPE_DESCRIPTION_MAX_LENGTH} characters`,
        },
        { status: HTTP_STATUS.BAD_REQUEST }
      );
    }

    // Validate instructions
    if (body.instructions && body.instructions.length > VALIDATION.RECIPE_INSTRUCTIONS_MAX_LENGTH) {
      return NextResponse.json(
        {
          error: `Instructions must be at most ${VALIDATION.RECIPE_INSTRUCTIONS_MAX_LENGTH} characters`,
        },
        { status: HTTP_STATUS.BAD_REQUEST }
      );
    }

    // Validate servings
    if (body.servings !== undefined) {
      if (!Number.isInteger(body.servings) || body.servings <= 0) {
        return NextResponse.json(
          { error: 'Servings must be a positive integer' },
          { status: HTTP_STATUS.BAD_REQUEST }
        );
      }
    }

    // Validate ingredients
    if (body.ingredients && body.ingredients.length > 0) {
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

    // Validate metadata (REQ-016)
    const metadataError = validateRecipeMetadataFields(body);
    if (metadataError) {
      return NextResponse.json({ error: metadataError }, { status: HTTP_STATUS.BAD_REQUEST });
    }

    // Check for duplicates
    const normalizedIngredients = body.ingredients
      ? body.ingredients.map((i) => i.name.trim().toLowerCase()).sort()
      : [];

    const duplicate = await RecipeModelAsync.findByNameAndIngredients(
      body.name,
      normalizedIngredients
    );

    let canonicalId: number | null = null;
    let isDuplicate = false;

    if (duplicate) {
      // This is a duplicate, mark it and link to original
      canonicalId = duplicate.id;
      isDuplicate = true;
    }

    // Create recipe
    const recipe = await RecipeModelAsync.create(
      body.name.trim(),
      parseInt(auth.userId, 10),
      body.description?.trim(),
      body.instructions?.trim(),
      body.servings,
      body.ingredients,
      canonicalId,
      {
        difficulty: body.difficulty,
        totalTimeMinutes: body.totalTimeMinutes,
        mealType: body.mealType,
        tags: body.tags,
      }
    );

    let response = NextResponse.json(
      {
        id: recipe.id,
        name: recipe.name,
        creatorId: recipe.creator_id,
        canonicalId: recipe.canonical_id,
        isDuplicate: Boolean(recipe.is_duplicate),
        difficulty: recipe.difficulty,
        totalTimeMinutes: recipe.total_time_minutes,
        mealType: recipe.meal_type,
        tags: await RecipeModelAsync.getTags(recipe.id),
      },
      { status: HTTP_STATUS.CREATED }
    );

    // Refresh token
    response = setTokenCookie(response, auth.newToken);

    return response;
  } catch (error) {
    console.error('Create recipe error:', error);
    return NextResponse.json(
      { error: 'Failed to create recipe' },
      { status: HTTP_STATUS.INTERNAL_SERVER_ERROR }
    );
  }
}

export const POST = withDatabase(handlePOST);
