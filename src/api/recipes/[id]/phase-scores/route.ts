import { NextRequest, NextResponse } from 'next/server';
import { verifyAuth } from '@/lib/auth/middleware';
import { getDatabase } from '@/lib/db/init';
import { calculateRecipeScore } from '@/lib/cycle-recommendations/scorer';
import { getAllPhaseTargets } from '@/lib/cycle-recommendations/targets';
import { Nutrients } from '@/lib/nutrition/types';

export async function GET(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const user = await verifyAuth(request);
    if (!user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const recipeId = parseInt(params.id);
    const db = await getDatabase();

    // Verify ownership
    const recipe = await db.get(
      'SELECT * FROM recipes WHERE id = ? AND user_id = ?',
      [recipeId, user.userId]
    );

    if (!recipe) {
      return NextResponse.json({ error: 'Recipe not found' }, { status: 404 });
    }

    // Get recipe nutrients
    const nutrients = await db.get(
      'SELECT * FROM recipe_nutrients WHERE recipe_id = ?',
      [recipeId]
    );

    if (!nutrients) {
      return NextResponse.json(
        { error: 'Recipe nutrients not calculated' },
        { status: 404 }
      );
    }

    const recipeNutrients: Nutrients = {
      kcal: nutrients.per_portion_kcal || 0,
      sugar: nutrients.per_portion_sugar || 0,
      fat: nutrients.per_portion_fat || 0,
      protein: nutrients.per_portion_protein || 0,
      carbohydrates: nutrients.per_portion_carbohydrates || 0,
      fiber: nutrients.per_portion_fiber || 0,
      sodium: nutrients.per_portion_sodium || 0,
      calcium: nutrients.per_portion_calcium || 0,
      vitamin_d: nutrients.per_portion_vitamin_d || 0,
      magnesium: nutrients.per_portion_magnesium || 0,
      vitamin_b6: nutrients.per_portion_vitamin_b6 || 0,
      vitamin_b12: nutrients.per_portion_vitamin_b12 || 0,
      vitamin_e: nutrients.per_portion_vitamin_e || 0,
      zinc: nutrients.per_portion_zinc || 0,
    };

    // Score for all phases
    const allTargets = getAllPhaseTargets();
    const scores = Object.entries(allTargets).map(([phase, targets]) => {
      const result = calculateRecipeScore(recipeNutrients, phase, targets);
      return {
        phase,
        score: result.score,
        matched_nutrients: result.matched_nutrients,
        reason: result.reason,
      };
    });

    return NextResponse.json({
      status: 200,
      data: {
        recipe_id: recipeId,
        scores,
      },
    });
  } catch (error) {
    console.error('Phase scores error:', error);
    return NextResponse.json(
      { error: 'Failed to calculate phase scores' },
      { status: 500 }
    );
  }
}
