import { Ingredient } from '@/lib/nutrition/types';
import { ParsedIngredient } from './types';
import { AMOUNT_PATTERN, MEASUREMENT_UNITS } from './constants';
import { findBestMatch } from './matcher';

export function parseIngredientsFromText(
  text: string,
  ingredients: Ingredient[]
): ParsedIngredient[] {
  const lines = text.split('\n').filter(line => line.trim().length > 0);
  const results: ParsedIngredient[] = [];

  for (const line of lines) {
    const parsed = parseIngredientLine(line, ingredients);
    if (parsed) {
      results.push(parsed);
    }
  }

  return results;
}

function parseIngredientLine(
  line: string,
  ingredients: Ingredient[]
): ParsedIngredient | null {
  const trimmed = line.trim();

  // Try to extract amount and unit
  const amountMatch = trimmed.match(AMOUNT_PATTERN);
  let amount: number | null = null;
  let unit: string | null = null;
  let remainingText = trimmed;

  if (amountMatch) {
    amount = parseFloat(amountMatch[1].replace(',', '.'));
    if (amountMatch[2]) {
      unit = amountMatch[2];
    }
    remainingText = trimmed.replace(amountMatch[0], '').trim();
  }

  // Extract ingredient name
  const ingredientName = remainingText.trim();

  if (!ingredientName) {
    return null;
  }

  // Find matching ingredient
  const match = findBestMatch(ingredientName, ingredients);

  // Determine unit (default to piece if no unit found)
  if (!unit && amount && match.ingredient) {
    unit = 'Stück';
  }

  return {
    raw_text: trimmed,
    name: match.ingredient?.name || ingredientName,
    amount,
    unit,
    ingredient_id: match.ingredient?.id || null,
    confidence: match.confidence,
    matched: match.ingredient !== null,
  };
}
