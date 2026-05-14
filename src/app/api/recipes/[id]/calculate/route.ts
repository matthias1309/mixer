import { NextRequest, NextResponse } from 'next/server';
import { authMiddlewareWithRefresh } from '@/lib/auth/middleware';
import { getDatabase } from '@/lib/db/init';
import { calculateRecipeNutrients } from '@/lib/nutrition/calculator';
import { NUTRIENT_KEYS } from '@/lib/nutrition/types';
import { HTTP_STATUS } from '@/lib/constants';

type Params = Promise<{ id: string }>;

export async function POST(request: NextRequest, props: { params: Params }) {
  try {
    const params = await props.params;
    const recipeId = parseInt(params.id, 10);

    if (!Number.isFinite(recipeId) || recipeId <= 0) {
      return NextResponse.json(
        { error: 'Invalid recipe ID' },
        { status: HTTP_STATUS.BAD_REQUEST }
      );
    }

    const auth = await authMiddlewareWithRefresh(request);
    if (!auth) {
      return NextResponse.json(
        { error: 'Unauthorized' },
        { status: HTTP_STATUS.UNAUTHORIZED }
      );
    }

    const body = await request.json();
    const { portions } = body;

    if (!portions || portions <= 0) {
      return NextResponse.json(
        { error: 'Portions must be > 0' },
        { status: HTTP_STATUS.BAD_REQUEST }
      );
    }

    const db = getDatabase();

    // Fetch recipe and verify ownership
    const recipe = db.prepare(
      'SELECT * FROM recipes WHERE id = ? AND creator_id = ?'
    ).get(recipeId, auth.userId) as any;

    if (!recipe) {
      return NextResponse.json(
        { error: 'Recipe not found' },
        { status: HTTP_STATUS.NOT_FOUND }
      );
    }

    // Fetch recipe ingredients
    const recipeIngredients = db.prepare(
      `SELECT id, recipe_id, ingredient_id, amount, unit, calculated_base_amount
       FROM recipe_ingredients
       WHERE recipe_id = ?`
    ).all(recipeId) as any[];

    if (recipeIngredients.length === 0) {
      return NextResponse.json(
        { error: 'Recipe has no ingredients' },
        { status: HTTP_STATUS.BAD_REQUEST }
      );
    }

    // Fetch ingredient details
    const ingredientMap: Record<number, any> = {};
    const ingredientStmt = db.prepare('SELECT * FROM ingredients WHERE id = ?');

    for (const ing of recipeIngredients) {
      if (!ingredientMap[ing.ingredient_id]) {
        const ingredient = ingredientStmt.get(ing.ingredient_id) as any;
        ingredientMap[ing.ingredient_id] = ingredient;
      }
    }

    // Calculate nutrients
    const nutrients = calculateRecipeNutrients(
      recipeIngredients,
      ingredientMap,
      portions
    );

    // Store/update in database
    const existing = db.prepare(
      'SELECT id FROM recipe_nutrients WHERE recipe_id = ?'
    ).get(recipeId) as any;

    if (existing) {
      const updateClauses = NUTRIENT_KEYS.flatMap(key =>
        [`total_${key} = ?`, `per_portion_${key} = ?`]
      ).join(', ');

      const values = NUTRIENT_KEYS.flatMap(key => [
        nutrients.total[key as keyof typeof nutrients.total],
        nutrients.per_portion[key as keyof typeof nutrients.per_portion],
      ]);

      db.prepare(
        `UPDATE recipe_nutrients SET
          portions = ?, ${updateClauses}, last_calculated = CURRENT_TIMESTAMP, updated_at = CURRENT_TIMESTAMP
         WHERE recipe_id = ?`
      ).run(portions, ...values, recipeId);
    } else {
      const columns = [
        'recipe_id',
        'portions',
        ...NUTRIENT_KEYS.flatMap(key => [`total_${key}`, `per_portion_${key}`]),
        'last_calculated',
      ];
      const placeholders = Array(columns.length).fill('?').join(', ');

      const values = [
        recipeId,
        portions,
        ...NUTRIENT_KEYS.flatMap(key => [
          nutrients.total[key as keyof typeof nutrients.total],
          nutrients.per_portion[key as keyof typeof nutrients.per_portion],
        ]),
        new Date().toISOString(),
      ];

      db.prepare(
        `INSERT INTO recipe_nutrients (${columns.join(', ')})
         VALUES (${placeholders})`
      ).run(...values);
    }

    return NextResponse.json({ status: 200, data: nutrients });
  } catch (error) {
    console.error('Calculation error:', error);
    return NextResponse.json(
      { status: 500, error: 'Calculation failed' },
      { status: 500 }
    );
  }
}
