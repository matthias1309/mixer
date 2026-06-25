import {
  DIFFICULTY_LEVELS,
  MEAL_TYPES,
  isValidDifficulty,
  isValidMealType,
  isValidTag,
} from './constants';

export function validateEmail(email: string): boolean {
  const regex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
  return regex.test(email) && email.length <= 255;
}

export function validatePassword(password: string): string | null {
  if (password.length < 8) {
    return 'Password must be at least 8 characters';
  }
  return null;
}

export function validateRecipeName(name: string): string | null {
  if (!name || name.trim().length === 0 || name.length > 100) {
    return 'Recipe name must be 1-100 characters';
  }
  return null;
}

// null means "explicitly cleared" (e.g. the recipe form's "–" option) and is
// always valid; only a non-null, out-of-vocabulary value is rejected.
export function validateDifficulty(difficulty: string | null): string | null {
  if (difficulty !== null && !isValidDifficulty(difficulty)) {
    return `Difficulty must be one of: ${DIFFICULTY_LEVELS.join(', ')}`;
  }
  return null;
}

export function validateMealType(mealType: string | null): string | null {
  if (mealType !== null && !isValidMealType(mealType)) {
    return `Meal type must be one of: ${MEAL_TYPES.join(', ')}`;
  }
  return null;
}

export function validateTags(tags: string[]): string | null {
  for (const tag of tags) {
    if (!isValidTag(tag)) {
      return `Unknown tag: ${tag}`;
    }
  }
  return null;
}

export function validateTotalTimeMinutes(totalTimeMinutes: number | null): string | null {
  if (totalTimeMinutes !== null && (!Number.isInteger(totalTimeMinutes) || totalTimeMinutes <= 0)) {
    return 'Total time must be a positive integer';
  }
  return null;
}

// Shared by POST /api/recipes and PUT /api/recipes/[id] (code review finding:
// these were 4 duplicated validate-then-400 blocks in each route).
export interface RecipeMetadataFields {
  difficulty?: string | null;
  mealType?: string | null;
  totalTimeMinutes?: number | null;
  tags?: string[];
}

export function validateRecipeMetadataFields(fields: RecipeMetadataFields): string | null {
  if (fields.difficulty !== undefined) {
    const error = validateDifficulty(fields.difficulty);
    if (error) return error;
  }

  if (fields.mealType !== undefined) {
    const error = validateMealType(fields.mealType);
    if (error) return error;
  }

  if (fields.totalTimeMinutes !== undefined) {
    const error = validateTotalTimeMinutes(fields.totalTimeMinutes);
    if (error) return error;
  }

  if (fields.tags !== undefined) {
    const error = validateTags(fields.tags);
    if (error) return error;
  }

  return null;
}
