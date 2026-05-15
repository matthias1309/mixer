import { Ingredient } from '@/lib/nutrition/types';
import { INGREDIENT_SYNONYMS, CONFIDENCE_THRESHOLDS } from './constants';

interface MatchResult {
  ingredient: Ingredient | null;
  confidence: number;
}

/**
 * Calculate Levenshtein distance between two strings
 * Lower distance = better match
 */
function levenshteinDistance(a: string, b: string): number {
  const aLower = a.toLowerCase();
  const bLower = b.toLowerCase();

  const dp: number[][] = Array(aLower.length + 1)
    .fill(null)
    .map(() => Array(bLower.length + 1).fill(0));

  for (let i = 0; i <= aLower.length; i++) dp[i][0] = i;
  for (let j = 0; j <= bLower.length; j++) dp[0][j] = j;

  for (let i = 1; i <= aLower.length; i++) {
    for (let j = 1; j <= bLower.length; j++) {
      if (aLower[i - 1] === bLower[j - 1]) {
        dp[i][j] = dp[i - 1][j - 1];
      } else {
        dp[i][j] = 1 + Math.min(dp[i - 1][j], dp[i][j - 1], dp[i - 1][j - 1]);
      }
    }
  }

  return dp[aLower.length][bLower.length];
}

/**
 * Calculate similarity as percentage (0-1)
 */
function calculateSimilarity(a: string, b: string): number {
  const distance = levenshteinDistance(a, b);
  const maxLength = Math.max(a.length, b.length);
  return 1 - distance / maxLength;
}

/**
 * Find best matching ingredient from database
 */
export function findBestMatch(
  extractedName: string,
  ingredients: Ingredient[]
): MatchResult {
  let bestMatch: Ingredient | null = null;
  let bestConfidence = 0;

  for (const ingredient of ingredients) {
    // Check exact match
    if (ingredient.name.toLowerCase() === extractedName.toLowerCase()) {
      return {
        ingredient,
        confidence: CONFIDENCE_THRESHOLDS.EXACT_MATCH,
      };
    }

    // Check synonyms
    if (INGREDIENT_SYNONYMS[ingredient.name]) {
      if (INGREDIENT_SYNONYMS[ingredient.name].some(
        syn => syn.toLowerCase() === extractedName.toLowerCase()
      )) {
        return {
          ingredient,
          confidence: CONFIDENCE_THRESHOLDS.HIGH,
        };
      }
    }

    // Check fuzzy match
    const similarity = calculateSimilarity(extractedName, ingredient.name);
    if (similarity > bestConfidence && similarity > CONFIDENCE_THRESHOLDS.LOW) {
      bestConfidence = similarity;
      bestMatch = ingredient;
    }
  }

  return {
    ingredient: bestMatch,
    confidence: bestConfidence,
  };
}
