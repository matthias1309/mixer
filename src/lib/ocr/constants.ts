// Regex patterns for parsing
export const AMOUNT_PATTERN = /(\d+(?:[.,]\d+)?)\s*(g|ml|kg|l|mg|EL|TL|Stück|Tasse)?/i;

// Common measurement units (German + English)
export const MEASUREMENT_UNITS = [
  'g',     // grams
  'ml',    // milliliters
  'kg',    // kilograms
  'l',     // liters
  'mg',    // milligrams
  'EL',    // Esslöffel (tablespoon)
  'TL',    // Teelöffel (teaspoon)
  'Stück', // piece
  'Tasse', // cup
] as const;

// Ingredient synonyms mapping
export const INGREDIENT_SYNONYMS: Record<string, string[]> = {
  'Hähnchen': ['chicken', 'huhn', 'poulet'],
  'Tomate': ['tomato', 'tomates'],
  'Zwiebel': ['onion', 'zwiebeln'],
  'Knoblauch': ['garlic', 'knoblauch'],
  'Salz': ['salt', 'sea salt'],
  // Add more as needed
};

// Confidence thresholds
export const CONFIDENCE_THRESHOLDS = {
  EXACT_MATCH: 1.0,
  HIGH: 0.85,
  MEDIUM: 0.7,
  LOW: 0.5,
  UNKNOWN: 0.0,
} as const;

// Tesseract configuration
export const TESSERACT_CONFIG = {
  LANGUAGES: 'deu+eng', // German + English
  TIMEOUT: 10000, // 10 seconds
} as const;
