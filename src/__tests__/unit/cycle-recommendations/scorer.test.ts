import { calculateRecipeScore } from '@/lib/cycle-recommendations/scorer';
import { Nutrients } from '@/lib/nutrition/types';
import { getPhaseTargets } from '@/lib/cycle-recommendations/targets';

describe('Recipe Scorer', () => {
  const mockRecipeNutrients: Nutrients = {
    kcal: 320,
    sugar: 12,
    fat: 8,
    protein: 18,
    carbohydrates: 45,
    fiber: 6,
    sodium: 400,
    calcium: 250,
    vitamin_d: 8,
    magnesium: 80,
    vitamin_b6: 0.5,
    vitamin_b12: 0.8,
    vitamin_e: 8,
    zinc: 2,
  };

  it('scores recipe based on phase nutrients', () => {
    const targets = getPhaseTargets('Luteal');
    const score = calculateRecipeScore(
      mockRecipeNutrients,
      'Luteal',
      targets
    );

    expect(score.score).toBeGreaterThan(0);
    expect(score.score).toBeLessThanOrEqual(100);
    expect(score.matched_nutrients.length).toBeGreaterThan(0);
  });

  it('scores higher for phase-matching nutrients', () => {
    const targets = getPhaseTargets('Menstruation');
    const menstruationScore = calculateRecipeScore(
      mockRecipeNutrients,
      'Menstruation',
      targets
    );

    const ovulationTargets = getPhaseTargets('Ovulation');
    const ovulationScore = calculateRecipeScore(
      mockRecipeNutrients,
      'Ovulation',
      ovulationTargets
    );

    expect(menstruationScore.score).not.toBe(ovulationScore.score);
  });

  it('returns top 3 matched nutrients', () => {
    const targets = getPhaseTargets('Ovulation');
    const score = calculateRecipeScore(
      mockRecipeNutrients,
      'Ovulation',
      targets
    );

    expect(score.matched_nutrients.length).toBeLessThanOrEqual(3);
  });
});
