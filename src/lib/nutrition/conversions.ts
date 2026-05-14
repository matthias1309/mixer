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

export function calculatePerPortion(
  totalValue: number,
  portions: number
): number {
  if (portions <= 0) throw new Error('Portions must be > 0');
  return parseFloat((totalValue / portions).toFixed(2));
}

export function normalizeNutrientValue(value: number | null): number {
  return value === null ? 0 : parseFloat(value.toFixed(2));
}
