import { Ingredient } from './types';

// Predefined unit conversions (amount in grams/ml)
const DEFAULT_CONVERSIONS: Record<string, Record<string, number>> = {
  'Apfel': { 'g': 1, 'Stück': 1.82 },
  'Banane': { 'g': 1, 'Stück': 1.2 },
  'Orange': { 'g': 1, 'Stück': 1.5 },
  'Brokkoli': { 'g': 1, 'Röschen': 0.55 },
  'Karotte': { 'g': 1, 'Stück': 0.61 },
  'Spinat': { 'g': 1 },
  'Hähnchen (Brust)': { 'g': 1 },
  'Rindfleisch (mager)': { 'g': 1 },
  'Joghurt (natur)': { 'ml': 1 },
  'Milch (Vollmilch)': { 'ml': 1 },
};

/**
 * Convert amount from any unit to base amount (in grams/ml)
 * @param amount - Quantity of the ingredient
 * @param unit - Unit of measurement
 * @param ingredient - Ingredient data with base unit and size
 * @returns Amount in base unit (grams or ml)
 * @throws Error if unit is unknown
 */
export function convertToBaseAmount(
  amount: number,
  unit: string,
  ingredient: Ingredient
): number {
  // If already in base unit, return amount as is
  if (unit === ingredient.base_unit) {
    return amount;
  }

  // Check default conversions (multipliers to convert to base unit)
  const multiplier = DEFAULT_CONVERSIONS[ingredient.name]?.[unit];
  if (multiplier !== undefined) {
    return amount * multiplier * ingredient.base_size;
  }

  throw new Error(
    `Unknown conversion: ${amount} ${unit} of ${ingredient.name}`
  );
}

/**
 * Calculate per-portion value from total
 * @param totalValue - Total nutrient value
 * @param portions - Number of portions
 * @returns Per-portion value rounded to 2 decimals
 * @throws Error if portions <= 0
 */
export function calculatePerPortion(
  totalValue: number,
  portions: number
): number {
  if (portions <= 0) throw new Error('Portions must be > 0');
  return parseFloat((totalValue / portions).toFixed(2));
}

/**
 * Normalize nutrient value to 2 decimal places, treating null as 0
 * @param value - Nutrient value or null
 * @returns Normalized numeric value with 2 decimals
 */
export function normalizeNutrientValue(value: number | null): number {
  return value === null ? 0 : parseFloat(value.toFixed(2));
}
