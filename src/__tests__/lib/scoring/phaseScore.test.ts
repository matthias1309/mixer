import { calculateScore, AggregatedNutrients } from '@/lib/scoring/phaseScore';

describe('Phase Score Calculation', () => {
  test('should return a score between 0 and 100', () => {
    const nutrients: AggregatedNutrients = {
      iron: 5,
      magnesium: 75,
      protein: 20,
      calcium: 150,
    };
    const score = calculateScore(nutrients, 'menstruation');
    expect(score).toBeGreaterThanOrEqual(0);
    expect(score).toBeLessThanOrEqual(100);
  });

  test('should return 0 for unknown phase', () => {
    const nutrients: AggregatedNutrients = {
      iron: 5,
      protein: 20,
    };
    const score = calculateScore(nutrients, 'unknown');
    expect(score).toBe(0);
  });

  test('should return 0 for empty nutrients', () => {
    const score = calculateScore({}, 'menstruation');
    expect(score).toBe(0);
  });

  describe('Phase-specific weighting', () => {
    test('menstruation phase should prioritize iron', () => {
      const highIron: AggregatedNutrients = {
        iron: 8,
        magnesium: 1,
        protein: 1,
        calcium: 1,
        vitamin_b6: 0.1,
        vitamin_b12: 0.1,
        vitamin_e: 0.1,
        zinc: 0.1,
        fiber: 0.1,
        vitamin_d: 0.1,
      };
      const lowIron: AggregatedNutrients = {
        iron: 0.5,
        magnesium: 1,
        protein: 1,
        calcium: 1,
        vitamin_b6: 0.1,
        vitamin_b12: 0.1,
        vitamin_e: 0.1,
        zinc: 0.1,
        fiber: 0.1,
        vitamin_d: 0.1,
      };

      const scoreHighIron = calculateScore(highIron, 'menstruation');
      const scoreLowIron = calculateScore(lowIron, 'menstruation');
      expect(scoreHighIron).toBeGreaterThan(scoreLowIron);
    });

    test('ovulation phase should not prioritize iron as much', () => {
      const highIron: AggregatedNutrients = {
        iron: 8,
      };
      const highProtein: AggregatedNutrients = {
        protein: 30,
      };

      const scoreIron = calculateScore(highIron, 'ovulation');
      const scoreProtein = calculateScore(highProtein, 'ovulation');
      // Protein is more important in ovulation (weight 2 vs iron weight 1)
      expect(scoreProtein).toBeGreaterThan(scoreIron);
    });

    test('luteal phase should prioritize magnesium', () => {
      const highMagnesium: AggregatedNutrients = {
        magnesium: 150,
        calcium: 10,
        vitamin_b6: 10,
        fiber: 10,
      };
      const lowMagnesium: AggregatedNutrients = {
        magnesium: 10,
        calcium: 300,
        vitamin_b6: 2,
        fiber: 20,
      };

      const scoreHigh = calculateScore(highMagnesium, 'luteal');
      const scoreLow = calculateScore(lowMagnesium, 'luteal');
      expect(scoreHigh).toBeGreaterThan(scoreLow);
    });

    test('follicular phase should prioritize B vitamins', () => {
      const highB: AggregatedNutrients = {
        vitamin_b6: 2,
        vitamin_b12: 3,
        protein: 5,
        iron: 5,
      };
      const lowB: AggregatedNutrients = {
        vitamin_b6: 0.1,
        vitamin_b12: 0.1,
        protein: 50,
        iron: 50,
      };

      const scoreHigh = calculateScore(highB, 'follicular');
      const scoreLow = calculateScore(lowB, 'follicular');
      expect(scoreHigh).toBeGreaterThan(scoreLow);
    });
  });

  describe('Score variation across phases', () => {
    test('iron-heavy nutrients should score differently for menstruation vs ovulation', () => {
      const ironHeavy: AggregatedNutrients = {
        iron: 10,
        magnesium: 1,
        protein: 1,
      };

      const menstruationScore = calculateScore(ironHeavy, 'menstruation');
      const ovulationScore = calculateScore(ironHeavy, 'ovulation');

      // Iron is weight 3 in menstruation but only 1 in ovulation
      // So menstruation should score higher for iron-heavy nutrients
      expect(menstruationScore).toBeGreaterThan(ovulationScore);
    });

    test('protein-heavy nutrients should score similarly for follicular and ovulation', () => {
      const proteinHeavy: AggregatedNutrients = {
        protein: 30,
        iron: 0.1,
        magnesium: 0.1,
      };

      const follicularScore = calculateScore(proteinHeavy, 'follicular');
      const ovulationScore = calculateScore(proteinHeavy, 'ovulation');

      // Protein is weight 2 in both phases, so they should be similar
      expect(Math.abs(follicularScore - ovulationScore)).toBeLessThan(20);
    });
  });

  describe('Reference value normalization', () => {
    test('should cap normalized nutrients at 1.0', () => {
      const veryHighNutrients: AggregatedNutrients = {
        iron: 100, // Far exceeds reference value of 3
        protein: 500, // Far exceeds reference value of 15
      };
      const highNutrients: AggregatedNutrients = {
        iron: 3, // At reference value
        protein: 15, // At reference value
      };

      const scoreVeryHigh = calculateScore(veryHighNutrients, 'menstruation');
      const scoreHigh = calculateScore(highNutrients, 'menstruation');

      // Very high nutrients shouldn't score significantly higher than at-reference nutrients
      // because they're capped at 1.0 normalization
      expect(scoreVeryHigh).toBeLessThanOrEqual(scoreHigh + 5);
    });
  });

  describe('Weighted blend of phase-specific and general nutrition', () => {
    test('high phase-specific nutrients should dominate score', () => {
      const phaseOptimized: AggregatedNutrients = {
        iron: 8, // High for menstruation
        magnesium: 100, // High general
        protein: 5, // Low general
      };
      const generalHighOnly: AggregatedNutrients = {
        iron: 0.5, // Low for menstruation
        magnesium: 100, // High general
        protein: 100, // High general
      };

      const scorePhaseOpt = calculateScore(phaseOptimized, 'menstruation');
      const scoreGeneral = calculateScore(generalHighOnly, 'menstruation');

      // Phase-optimized should score higher
      expect(scorePhaseOpt).toBeGreaterThan(scoreGeneral);
    });
  });
});
