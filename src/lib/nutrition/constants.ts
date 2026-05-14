export const NUTRIENT_NAMES = {
  kcal: 'kcal',
  sugar: 'Sugar',
  fat: 'Fat',
  protein: 'Protein',
  carbohydrates: 'Carbohydrates',
  fiber: 'Fiber',
  sodium: 'Sodium',
  calcium: 'Calcium',
  vitamin_d: 'Vitamin D',
  magnesium: 'Magnesium',
  vitamin_b6: 'Vitamin B6',
  vitamin_b12: 'Vitamin B12',
  vitamin_e: 'Vitamin E',
  zinc: 'Zinc',
} as const;

export const NUTRIENT_UNITS = {
  kcal: 'kcal',
  sugar: 'g',
  fat: 'g',
  protein: 'g',
  carbohydrates: 'g',
  fiber: 'g',
  sodium: 'mg',
  calcium: 'mg',
  vitamin_d: 'mcg',
  magnesium: 'mg',
  vitamin_b6: 'mg',
  vitamin_b12: 'mcg',
  vitamin_e: 'mg',
  zinc: 'mg',
} as const;

export const COMMON_UNITS = [
  'g',      // grams
  'ml',     // milliliters
  'kg',     // kilograms
  'l',      // liters
  'mg',     // milligrams
  'mcg',    // micrograms
  'Stück',  // piece
  'EL',     // tablespoon (Esslöffel)
  'TL',     // teaspoon (Teelöffel)
  'Tasse',  // cup
] as const;

export const CYCLE_LENGTH_MIN = 21;
export const CYCLE_LENGTH_MAX = 35;
export const DEFAULT_CYCLE_LENGTH = 28;
