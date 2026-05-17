import { calculateRecipeNutrients } from '@/lib/nutrition/calculator';
import { Ingredient, RecipeIngredient, Nutrients } from '@/lib/nutrition/types';

describe('Nutrient Calculator', () => {
  const mockApple: Ingredient = {
    id: 1,
    name: 'Apfel',
    category: 'Obst',
    base_unit: 'g',
    base_size: 100,
    kcal: 52,
    sugar: 10.4,
    fat: 0.3,
    protein: 0.3,
    carbohydrates: 13.8,
    fiber: 2.4,
    salt: null,
    sodium: 2,
    calcium: 5,
    vitamin_d: 0,
    magnesium: 5,
    vitamin_b6: 0.04,
    vitamin_b12: 0,
    vitamin_e: 0.18,
    zinc: 0.04,
    created_at: new Date(),
    updated_at: new Date(),
  };

  const mockRecipeIngredient: RecipeIngredient = {
    id: 1,
    recipe_id: 1,
    ingredient_id: 1,
    amount: 2,
    unit: 'Stück',
    calculated_base_amount: 364, // 2 pieces * 182g
  };

  it('calculates total nutrients for single ingredient', () => {
    const result = calculateRecipeNutrients(
      [{ ...mockRecipeIngredient, calculated_base_amount: 200 }],
      { 1: mockApple },
      2
    );

    // Apple 200g: kcal = (200/100) * 52 = 104
    expect(result.total.kcal).toBe(104);
    expect(result.per_portion.kcal).toBe(52);
    expect(result.portions).toBe(2);
  });

  it('calculates per-portion nutrients correctly', () => {
    const result = calculateRecipeNutrients(
      [mockRecipeIngredient],
      { 1: mockApple },
      4
    );

    // 364g apple / 4 portions
    const expectedKcal = (364 / 100) * 52; // 189.28
    expect(result.total.kcal).toBeCloseTo(189.28, 1);
    expect(result.per_portion.kcal).toBeCloseTo(47.32, 1);
  });

  it('includes salt in calculated totals', () => {
    const ingredientWithSalt = {
      ...mockApple,
      salt: 1.5,
    };
    const result = calculateRecipeNutrients(
      [{ ...mockRecipeIngredient, calculated_base_amount: 200 }],
      { 1: ingredientWithSalt },
      1
    );
    // 200g * (1.5mg salt / 100g base) = 3mg
    expect(result.total.salt).toBe(3);
    expect(result.per_portion.salt).toBe(3);
  });

  it('handles multiple ingredients', () => {
    const mockYogurt: Ingredient = {
      ...mockApple,
      id: 2,
      name: 'Joghurt',
      kcal: 61,
    };

    const ingredients: RecipeIngredient[] = [
      mockRecipeIngredient,
      {
        id: 2,
        recipe_id: 1,
        ingredient_id: 2,
        amount: 200,
        unit: 'ml',
        calculated_base_amount: 200,
      },
    ];

    const ingredientMap = { 1: mockApple, 2: mockYogurt };

    const result = calculateRecipeNutrients(ingredients, ingredientMap, 1);

    // Apple 364g: (364/100)*52 = 189.28
    // Yogurt 200g: (200/100)*61 = 122
    // Total: 311.28
    expect(result.total.kcal).toBeCloseTo(311.28, 1);
  });
});
