import { RecipeIngredient, Ingredient, Nutrients, RecipeNutrients, NUTRIENT_KEYS } from './types';
import { normalizeNutrientValue } from './conversions';

export function calculateRecipeNutrients(
  recipeIngredients: RecipeIngredient[],
  ingredientMap: Record<number, Ingredient>,
  portions: number
): RecipeNutrients {
  if (portions <= 0) {
    throw new Error('Portions must be greater than 0');
  }

  // Initialize total nutrients
  const total: Nutrients = {
    kcal: 0,
    sugar: 0,
    fat: 0,
    protein: 0,
    carbohydrates: 0,
    fiber: 0,
    sodium: 0,
    calcium: 0,
    vitamin_d: 0,
    magnesium: 0,
    vitamin_b6: 0,
    vitamin_b12: 0,
    vitamin_e: 0,
    zinc: 0,
  };

  // Calculate total for each nutrient
  for (const recipeIng of recipeIngredients) {
    const ingredient = ingredientMap[recipeIng.ingredient_id];
    if (!ingredient) continue;

    const baseAmount = recipeIng.calculated_base_amount;

    // For each nutrient
    for (const nutrientKey of NUTRIENT_KEYS) {
      const ingredientValue = ingredient[nutrientKey as keyof Ingredient];
      if (typeof ingredientValue === 'number' && ingredientValue > 0) {
        // Calculate contribution: (amount / base_size) * nutrient_value
        const contribution = (baseAmount / ingredient.base_size) * ingredientValue;
        total[nutrientKey as keyof Nutrients] += contribution;
      }
    }
  }

  // Normalize all values to 2 decimal places
  const normalizedTotal: Nutrients = {
    kcal: normalizeNutrientValue(total.kcal),
    sugar: normalizeNutrientValue(total.sugar),
    fat: normalizeNutrientValue(total.fat),
    protein: normalizeNutrientValue(total.protein),
    carbohydrates: normalizeNutrientValue(total.carbohydrates),
    fiber: normalizeNutrientValue(total.fiber),
    sodium: normalizeNutrientValue(total.sodium),
    calcium: normalizeNutrientValue(total.calcium),
    vitamin_d: normalizeNutrientValue(total.vitamin_d),
    magnesium: normalizeNutrientValue(total.magnesium),
    vitamin_b6: normalizeNutrientValue(total.vitamin_b6),
    vitamin_b12: normalizeNutrientValue(total.vitamin_b12),
    vitamin_e: normalizeNutrientValue(total.vitamin_e),
    zinc: normalizeNutrientValue(total.zinc),
  };

  // Calculate per-portion
  const per_portion: Nutrients = {} as Nutrients;
  for (const key of NUTRIENT_KEYS) {
    per_portion[key as keyof Nutrients] = normalizeNutrientValue(
      normalizedTotal[key as keyof Nutrients] / portions
    );
  }

  return {
    id: 0,
    recipe_id: 0,
    portions,
    total: normalizedTotal,
    per_portion,
    last_calculated: new Date(),
    created_at: new Date(),
    updated_at: new Date(),
  };
}
