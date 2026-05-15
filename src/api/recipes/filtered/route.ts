import { NextRequest, NextResponse } from 'next/server';
import { authMiddlewareWithRefresh, setTokenCookie } from '@/lib/auth/middleware';
import { getDatabase } from '@/lib/db/init';
import { calculateRecipeScore } from '@/lib/cycle-recommendations/scorer';
import { getPhaseTargets } from '@/lib/cycle-recommendations/targets';
import { SCORE_THRESHOLDS } from '@/lib/cycle-recommendations/constants';
import { Nutrients } from '@/lib/nutrition/types';

export async function GET(request: NextRequest) {
  try {
    const auth = await authMiddlewareWithRefresh(request);
    if (!auth) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }
    const user = { userId: auth.userId };

    const searchParams = request.nextUrl.searchParams;
    const phase = searchParams.get('phase') || 'menstruation';
    const min_score = parseInt(searchParams.get('min_score') || '50');
    const sort_by = searchParams.get('sort_by') || 'score';
    const limit = parseInt(searchParams.get('limit') || '20');

    const db = await getDatabase();

    // Fetch recipes with nutrients
    const recipes = await db.all(
      `SELECT r.id, r.name, rn.per_portion_kcal as kcal
       FROM recipes r
       LEFT JOIN recipe_nutrients rn ON r.id = rn.recipe_id
       WHERE r.user_id = ?
       LIMIT ?`,
      [user.userId, limit * 2]
    );

    // Get phase targets
    const targets = getPhaseTargets(phase);

    // Score each recipe
    const scored = recipes
      .map((recipe: any) => {
        const nutrientsRow = db.prepare(
          `SELECT * FROM recipe_nutrients WHERE recipe_id = ?`
        ).get(recipe.id);

        if (!nutrientsRow) {
          return null;
        }

        const recipeNutrients: Nutrients = {
          kcal: nutrientsRow.per_portion_kcal || 0,
          sugar: nutrientsRow.per_portion_sugar || 0,
          fat: nutrientsRow.per_portion_fat || 0,
          protein: nutrientsRow.per_portion_protein || 0,
          carbohydrates: nutrientsRow.per_portion_carbohydrates || 0,
          fiber: nutrientsRow.per_portion_fiber || 0,
          sodium: nutrientsRow.per_portion_sodium || 0,
          calcium: nutrientsRow.per_portion_calcium || 0,
          vitamin_d: nutrientsRow.per_portion_vitamin_d || 0,
          magnesium: nutrientsRow.per_portion_magnesium || 0,
          vitamin_b6: nutrientsRow.per_portion_vitamin_b6 || 0,
          vitamin_b12: nutrientsRow.per_portion_vitamin_b12 || 0,
          vitamin_e: nutrientsRow.per_portion_vitamin_e || 0,
          zinc: nutrientsRow.per_portion_zinc || 0,
        };

        const scoreResult = calculateRecipeScore(
          recipeNutrients,
          phase,
          targets
        );

        return {
          recipe_id: recipe.id,
          name: recipe.name,
          score: scoreResult.score,
          matched_nutrients: scoreResult.matched_nutrients,
          reason: scoreResult.reason,
          phase,
        };
      })
      .filter((r: any) => r !== null && r.score >= min_score)
      .sort((a: any, b: any) => {
        if (sort_by === 'score') return b.score - a.score;
        if (sort_by === 'name') return a.name.localeCompare(b.name);
        return 0;
      })
      .slice(0, limit);

    return NextResponse.json({
      status: 200,
      data: scored,
      total_count: scored.length,
      average_score: scored.length > 0
        ? parseFloat((scored.reduce((s: any, r: any) => s + r.score, 0) / scored.length).toFixed(1))
        : 0,
    });
  } catch (error) {
    console.error('Filter error:', error);
    return NextResponse.json(
      { error: 'Filtering failed' },
      { status: 500 }
    );
  }
}
