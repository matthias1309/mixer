// Phase-specific nutrient weights (importance for each phase)
const PHASE_WEIGHTS: Record<string, Record<string, number>> = {
  menstruation: { iron: 3, magnesium: 2, protein: 2, calcium: 1 },
  follicular: { protein: 2, vitamin_b6: 2, vitamin_b12: 2, iron: 1 },
  ovulation: { protein: 2, vitamin_e: 2, zinc: 2, vitamin_d: 1 },
  luteal: { magnesium: 3, vitamin_b6: 2, calcium: 2, fiber: 1 },
};

// Reference values for normalization (typical good source per 100g)
const REFERENCE_VALUES: Record<string, number> = {
  iron: 3,
  magnesium: 50,
  protein: 15,
  calcium: 120,
  vitamin_b6: 0.5,
  vitamin_b12: 1,
  vitamin_e: 3,
  zinc: 2,
  fiber: 5,
  vitamin_d: 5,
};

export interface AggregatedNutrients {
  iron?: number;
  magnesium?: number;
  protein?: number;
  calcium?: number;
  vitamin_b6?: number;
  vitamin_b12?: number;
  vitamin_e?: number;
  zinc?: number;
  fiber?: number;
  vitamin_d?: number;
}

export function calculateScore(nutrients: AggregatedNutrients, phase: string): number {
  const weights = PHASE_WEIGHTS[phase];
  if (!weights) {
    return 0;
  }

  // Calculate phase-specific nutrients score (weighted by importance for this phase)
  let phaseScore = 0;
  let phaseWeight = 0;

  for (const [nutrient, weight] of Object.entries(weights)) {
    const value = nutrients[nutrient as keyof AggregatedNutrients] || 0;
    const reference = REFERENCE_VALUES[nutrient] || 1;
    const normalized = Math.min(1, value / reference);
    phaseScore += normalized * weight;
    phaseWeight += weight;
  }

  const phaseAverage = phaseWeight > 0 ? phaseScore / phaseWeight : 0; // 0-1

  // Calculate other nutrients score (nutrients not weighted for this phase)
  let otherScore = 0;
  let otherCount = 0;
  const allNutrients = Object.keys(REFERENCE_VALUES);

  for (const nutrient of allNutrients) {
    if (nutrient in weights) continue; // Skip phase-important nutrients

    const value = nutrients[nutrient as keyof AggregatedNutrients] || 0;
    const reference = REFERENCE_VALUES[nutrient] || 1;
    const normalized = Math.min(1, value / reference);
    otherScore += normalized;
    otherCount++;
  }

  const otherAverage = otherCount > 0 ? otherScore / otherCount : 0.5; // 0-1, default 0.5

  // Final score: 70% phase-specific, 30% general nutrition
  const finalScore = (phaseAverage * 0.7 + otherAverage * 0.3) * 100;
  return Math.round(finalScore);
}
