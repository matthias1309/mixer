import { Nutrients } from '@/lib/nutrition/types';
import { PhaseNutrientTarget, RecipePhaseScore, NutrientMap } from './types';
import { REASON_TEMPLATES } from './constants';

interface ScoreResult {
  score: number;
  matched_nutrients: string[];
  reason: string;
  contributions: Array<{ nutrient: string; contribution: number }>;
}

export function calculateRecipeScore(
  recipeNutrients: Nutrients,
  phase: string,
  targets: PhaseNutrientTarget[]
): ScoreResult {
  let total_weighted_contribution = 0;
  const contributions: Array<{ nutrient: string; contribution: number }> = [];

  for (const target of targets) {
    const recipe_amount = (recipeNutrients as any)[target.nutrient_name];

    if (typeof recipe_amount !== 'number' || recipe_amount === 0) {
      continue;
    }

    const normalized = recipe_amount / target.daily_value;
    const capped = Math.min(normalized, 1.0);
    const contribution = capped * target.weight;

    total_weighted_contribution += contribution;
    contributions.push({
      nutrient: target.nutrient_name,
      contribution,
    });
  }

  const topNutrients = contributions
    .sort((a, b) => b.contribution - a.contribution)
    .slice(0, 3)
    .map(c => c.nutrient);

  const max_possible = targets.reduce((sum, t) => sum + t.weight, 0);
  const score = (total_weighted_contribution / max_possible) * 100;

  const reason = generateReasonText(topNutrients, phase);

  return {
    score: parseFloat(score.toFixed(1)),
    matched_nutrients: topNutrients,
    reason,
    contributions,
  };
}

function generateReasonText(nutrients: string[], phase: string): string {
  if (nutrients.length === 0) {
    return 'Minimal phase-specific nutrients';
  }

  const templates = REASON_TEMPLATES[phase as keyof typeof REASON_TEMPLATES]?.matched || [];
  if (templates.length === 0) {
    return `Contains ${nutrients.slice(0, 2).join(', ')}`;
  }

  const template = templates[Math.floor(Math.random() * templates.length)];
  return template;
}

export function scoreRecipes(
  recipesWithNutrients: Array<{ id: number; per_portion: Nutrients }>,
  phase: string,
  targets: PhaseNutrientTarget[]
): Array<{ recipe_id: number; score: number }> {
  return recipesWithNutrients.map(recipe => {
    const result = calculateRecipeScore(recipe.per_portion, phase, targets);
    return {
      recipe_id: recipe.id,
      score: result.score,
    };
  });
}
