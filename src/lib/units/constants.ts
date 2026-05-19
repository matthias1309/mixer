export const UNIT_CATEGORIES = {
  VOLUME: 'volume',
  WEIGHT: 'weight',
  COUNT: 'count',
  PINCH: 'pinch',
} as const;

export const BASE_UNITS = {
  VOLUME: 'ml',
  WEIGHT: 'g',
  COUNT: 'count',
  PINCH: 'pinch',
} as const;

export const SUPPORTED_UNITS = {
  TL: { abbreviation: 'TL', category: UNIT_CATEGORIES.VOLUME },
  EL: { abbreviation: 'EL', category: UNIT_CATEGORIES.VOLUME },
  ml: { abbreviation: 'ml', category: UNIT_CATEGORIES.VOLUME },
  l: { abbreviation: 'l', category: UNIT_CATEGORIES.VOLUME },
  g: { abbreviation: 'g', category: UNIT_CATEGORIES.WEIGHT },
  kg: { abbreviation: 'kg', category: UNIT_CATEGORIES.WEIGHT },
  Stück: { abbreviation: 'Stück', category: UNIT_CATEGORIES.COUNT },
  Prise: { abbreviation: 'Prise', category: UNIT_CATEGORIES.PINCH },
} as const;

// Unit promotion thresholds (when to convert to larger unit)
export const UNIT_PROMOTION_RULES = {
  TL: { threshold: 3, promoteToUnit: 'EL' },
  EL: { threshold: 16, promoteToUnit: 'ml' },
  ml: { threshold: 1000, promoteToUnit: 'l' },
} as const;

// Rounding precision rules
export const ROUNDING_RULES = {
  weight_large: { threshold: 50, precision: 5 },    // Round to nearest 5g for >50g
  weight_small: { threshold: 50, precision: 1 },    // Round to nearest 1g for <50g
  volume_large: { threshold: 100, precision: 5 },   // Round to nearest 5ml for >100ml
  volume_small: { threshold: 100, precision: 0.5 }, // Round to nearest 0.5ml for <100ml
} as const;

// Validation bounds
export const VALIDATION_BOUNDS = {
  MIN_QUANTITY: 0.001,
  MAX_QUANTITY: 999999,
  MAX_SERVINGS: 100,
  MIN_SERVINGS: 1,
} as const;
