import { NextRequest, NextResponse } from 'next/server';
import { verifyAuth } from '@/lib/auth/middleware';
import { getDatabase } from '@/lib/db/client';
import { calculateRecipeNutrients } from '@/lib/nutrition/calculator';
import { NUTRIENT_KEYS } from '@/lib/nutrition/types';

export async function POST(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const user = await verifyAuth(request);
    if (!user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const recipeId = parseInt(params.id);
    const body = await request.json();
    const { portions } = body;

    if (!portions || portions <= 0) {
      return NextResponse.json(
        { error: 'Portions must be > 0' },
        { status: 400 }
      );
    }

    const db = await getDatabase();

    // Fetch recipe and verify ownership
    const recipe = await db.get(
      'SELECT * FROM recipes WHERE id = ? AND creator_id = ?',
      [recipeId, user.id]
    );

    if (!recipe) {
      return NextResponse.json({ error: 'Recipe not found' }, { status: 404 });
    }

    // Fetch recipe ingredients
    const recipeIngredients = await db.all(
      `SELECT id, recipe_id, ingredient_id, amount, unit, calculated_base_amount
       FROM recipe_ingredients
       WHERE recipe_id = ?`,
      [recipeId]
    );

    if (recipeIngredients.length === 0) {
      return NextResponse.json(
        { error: 'Recipe has no ingredients' },
        { status: 400 }
      );
    }

    // Fetch ingredient details
    const ingredientMap: Record<number, any> = {};
    for (const ing of recipeIngredients) {
      if (!ingredientMap[ing.ingredient_id]) {
        const ingredient = await db.get(
          'SELECT * FROM ingredients WHERE id = ?',
          [ing.ingredient_id]
        );
        ingredientMap[ing.ingredient_id] = ingredient;
      }
    }

    // Calculate nutrients
    const nutrients = calculateRecipeNutrients(
      recipeIngredients,
      ingredientMap,
      portions
    );

    // Prepare update/insert values for all 14 nutrients
    const nutrientColumns = NUTRIENT_KEYS.map(key => `total_${key}, per_portion_${key}`).join(', ');
    const nutrientValues = NUTRIENT_KEYS.flatMap(key => [
      nutrients.total[key as keyof typeof nutrients.total],
      nutrients.per_portion[key as keyof typeof nutrients.per_portion],
    ]);

    // Store/update in database
    const existing = await db.get(
      'SELECT id FROM recipe_nutrients WHERE recipe_id = ?',
      [recipeId]
    );

    if (existing) {
      const updateSet = NUTRIENT_KEYS.flatMap(key => 
        [`total_${key} = ?`, `per_portion_${key} = ?`]
      ).join(', ');

      await db.run(
        `UPDATE recipe_nutrients SET
          portions = ?, ${updateSet}, last_calculated = CURRENT_TIMESTAMP, updated_at = CURRENT_TIMESTAMP
         WHERE recipe_id = ?`,
        [...[portions], ...nutrientValues, recipeId]
      );
    } else {
      const columns = ['recipe_id', 'portions', ...NUTRIENT_KEYS.flatMap(key => [`total_${key}`, `per_portion_${key}`]), 'last_calculated'];
      const placeholders = Array(columns.length).fill('?').join(', ');

      await db.run(
        `INSERT INTO recipe_nutrients (${columns.join(', ')})
         VALUES (${placeholders})`,
        [recipeId, portions, ...nutrientValues, new Date().toISOString()]
      );
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
