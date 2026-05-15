export const PHASE_NUTRIENT_TARGETS = {
  Menstruation: {
    Iron: { daily_value: 18, unit: 'mg', priority: 'CRITICAL' },
    vitamin_b12: { daily_value: 2.4, unit: 'mcg', priority: 'HIGH' },
    zinc: { daily_value: 8, unit: 'mg', priority: 'HIGH' },
    vitamin_c: { daily_value: 75, unit: 'mg', priority: 'MEDIUM' },
    protein: { daily_value: 46, unit: 'g', priority: 'MEDIUM' },
  },
  Follicular: {
    vitamin_d: { daily_value: 15, unit: 'mcg', priority: 'CRITICAL' },
    vitamin_b6: { daily_value: 1.3, unit: 'mg', priority: 'HIGH' },
    magnesium: { daily_value: 310, unit: 'mg', priority: 'HIGH' },
    folate: { daily_value: 400, unit: 'mcg', priority: 'MEDIUM' },
    protein: { daily_value: 46, unit: 'g', priority: 'MEDIUM' },
  },
  Ovulation: {
    vitamin_e: { daily_value: 15, unit: 'mg', priority: 'CRITICAL' },
    zinc: { daily_value: 8, unit: 'mg', priority: 'CRITICAL' },
    selenium: { daily_value: 55, unit: 'mcg', priority: 'HIGH' },
    vitamin_c: { daily_value: 75, unit: 'mg', priority: 'HIGH' },
    protein: { daily_value: 46, unit: 'g', priority: 'MEDIUM' },
  },
  Luteal: {
    magnesium: { daily_value: 310, unit: 'mg', priority: 'CRITICAL' },
    calcium: { daily_value: 1000, unit: 'mg', priority: 'CRITICAL' },
    vitamin_b6: { daily_value: 1.3, unit: 'mg', priority: 'HIGH' },
    iron: { daily_value: 18, unit: 'mg', priority: 'MEDIUM' },
  },
} as const;

export const SCORE_THRESHOLDS = {
  EXCELLENT: 80,
  VERY_GOOD: 60,
  GOOD: 50,
  DECENT: 40,
  DEFAULT_MIN: 50,
} as const;

export const REASON_TEMPLATES = {
  Menstruation: {
    matched: [
      `Excellent source of iron and B12`,
      `Good source of iron for blood replenishment`,
      `Supports energy recovery with protein`,
    ],
  },
  Follicular: {
    matched: [
      `Good source of vitamin D and B vitamins`,
      `Supports energy with B6 and magnesium`,
      `Aids nutrient absorption`,
    ],
  },
  Ovulation: {
    matched: [
      `Perfect for peak fertility with antioxidants`,
      `High in antioxidants (Vitamin E, Zinc)`,
      `Excellent source of selenium and zinc`,
    ],
  },
  Luteal: {
    matched: [
      `Perfect for luteal phase - high in magnesium and calcium`,
      `Supports mood regulation with magnesium`,
      `Helps with PMS prevention (Mg + Ca)`,
    ],
  },
} as const;
