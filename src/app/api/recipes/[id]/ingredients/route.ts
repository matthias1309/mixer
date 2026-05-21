import { NextRequest, NextResponse } from 'next/server';
import { RecipeModelAsync } from '@/lib/db/models/recipe-async';
import { authMiddlewareWithRefresh, setTokenCookie } from '@/lib/auth/middleware';
import { UnitConverter } from '@/lib/units/converter';
import { UnknownUnitError } from '@/lib/units/types';
import { withDatabase } from '@/lib/api/withDatabase';
import { HTTP_STATUS, VALIDATION } from '@/lib/constants';
import { getDb, isPostgres } from '@/lib/db/init';
import Database from 'better-sqlite3';
import { Pool } from 'pg';

type Params = Promise<{ id: string }>;

// POST /api/recipes/[id]/ingredients - Add an ingredient to a recipe
async function handlePOST(request: NextRequest, props: { params: Params }) {
  try {
    const params = await props.params;
    const recipeId = parseInt(params.id, 10);

    if (!Number.isFinite(recipeId) || recipeId <= 0) {
      return NextResponse.json(
        { error: 'Invalid recipe ID' },
        { status: HTTP_STATUS.BAD_REQUEST }
      );
    }

    // Require authentication
    const auth = await authMiddlewareWithRefresh(request);
    if (!auth) {
      return NextResponse.json(
        { error: 'Must be logged in to add ingredients' },
        { status: HTTP_STATUS.UNAUTHORIZED }
      );
    }

    // Verify recipe exists
    const recipe = await RecipeModelAsync.findById(recipeId);
    if (!recipe) {
      return NextResponse.json(
        { error: 'Recipe not found' },
        { status: HTTP_STATUS.NOT_FOUND }
      );
    }

    // Check ownership
    if (recipe.creator_id !== parseInt(auth.userId, 10)) {
      return NextResponse.json(
        { error: 'You can only add ingredients to recipes you created' },
        { status: HTTP_STATUS.FORBIDDEN }
      );
    }

    const body = await request.json();
    const { name, quantity, unit } = body as { name?: unknown; quantity?: unknown; unit?: unknown };

    // Validate name
    if (!name || typeof name !== 'string' || name.trim() === '') {
      return NextResponse.json(
        { error: 'Ingredient name is required' },
        { status: HTTP_STATUS.BAD_REQUEST }
      );
    }

    if (name.length > VALIDATION.INGREDIENT_NAME_MAX_LENGTH) {
      return NextResponse.json(
        { error: `Ingredient name must be at most ${VALIDATION.INGREDIENT_NAME_MAX_LENGTH} characters` },
        { status: HTTP_STATUS.BAD_REQUEST }
      );
    }

    // Validate quantity
    if (quantity === undefined || quantity === null || !Number.isInteger(quantity) || (quantity as number) <= 0) {
      return NextResponse.json(
        { error: 'Ingredient quantity must be a positive integer' },
        { status: HTTP_STATUS.BAD_REQUEST }
      );
    }

    const ingredientName = name.trim().toLowerCase();
    const ingredientQuantity = quantity as number;
    const ingredientUnit = (unit && typeof unit === 'string' && unit.trim()) ? unit.trim() : null;

    // Normalize unit if provided
    let normalizedQuantity: number | null = null;
    let normalizedUnit: string | null = null;

    if (ingredientUnit) {
      const converter = new UnitConverter();
      await converter.initialize();

      try {
        const result = await converter.normalizeToBaseUnit(ingredientQuantity, ingredientUnit, ingredientName);
        normalizedQuantity = result.quantity;
        normalizedUnit = result.unit;
      } catch (err) {
        if (err instanceof UnknownUnitError && err.unit === ingredientUnit) {
          // The input unit itself is unknown
          return NextResponse.json(
            { error: `Unknown unit: ${ingredientUnit}` },
            { status: HTTP_STATUS.BAD_REQUEST }
          );
        }
        // Non-normalizable unit (e.g. Stück base_unit='count' not in units table)
        // Allow with null normalized values
        normalizedQuantity = null;
        normalizedUnit = null;
      }
    }

    // Insert ingredient into DB
    const db = getDb();
    let ingredientId: number;

    if (isPostgres()) {
      const pool = db as Pool;
      const result = await pool.query(
        `INSERT INTO ingredients (recipe_id, name, quantity, unit, normalized_quantity, normalized_unit)
         VALUES ($1, $2, $3, $4, $5, $6) RETURNING id`,
        [recipeId, ingredientName, ingredientQuantity, ingredientUnit, normalizedQuantity, normalizedUnit]
      );
      ingredientId = result.rows[0].id;
    } else {
      const sqlite = db as Database.Database;
      const info = sqlite.prepare(
        `INSERT INTO ingredients (recipe_id, name, quantity, unit, normalized_quantity, normalized_unit)
         VALUES (?, ?, ?, ?, ?, ?)`
      ).run(recipeId, ingredientName, ingredientQuantity, ingredientUnit, normalizedQuantity, normalizedUnit) as { lastInsertRowid: number };
      ingredientId = Number(info.lastInsertRowid);
    }

    const ingredient = {
      id: ingredientId,
      recipe_id: recipeId,
      name: ingredientName,
      quantity: ingredientQuantity,
      unit: ingredientUnit,
      normalized_quantity: normalizedQuantity,
      normalized_unit: normalizedUnit,
    };

    let response = NextResponse.json(ingredient, { status: HTTP_STATUS.CREATED });
    response = setTokenCookie(response, auth.newToken);

    return response;
  } catch (error) {
    console.error('Add ingredient error:', error);
    return NextResponse.json(
      { error: 'Failed to add ingredient' },
      { status: HTTP_STATUS.INTERNAL_SERVER_ERROR }
    );
  }
}

export const POST = withDatabase(handlePOST);
