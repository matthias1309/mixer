import { parseIngredientsFromText } from '@/lib/ocr/parser';
import { Ingredient } from '@/lib/nutrition/types';

describe('Ingredient Parser', () => {
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

  const mockMilk: Ingredient = {
    id: 2,
    name: 'Milch',
    category: 'Milchprodukte',
    base_unit: 'ml',
    base_size: 100,
    kcal: 61,
    sugar: 4.8,
    fat: 3.3,
    protein: 3.2,
    carbohydrates: 4.8,
    fiber: 0,
    sodium: 49,
    calcium: 113,
    vitamin_d: 0.05,
    magnesium: 10,
    vitamin_b6: 0.06,
    vitamin_b12: 0.5,
    vitamin_e: 0.07,
    zinc: 0.4,
    created_at: new Date(),
    updated_at: new Date(),
  };

  const mockIngredients = [mockApple, mockMilk];

  // TC-014-01
  it('parses simple ingredient line', () => {
    const text = '2 Äpfel';
    const results = parseIngredientsFromText(text, mockIngredients);

    expect(results.length).toBe(1);
    expect(results[0].amount).toBe(2);
    expect(results[0].unit).toBe('Stück');
    expect(results[0].name).toBe('Apfel');
  });

  // TC-014-01
  it('parses ingredient with unit', () => {
    const text = '200 ml Milch';
    const results = parseIngredientsFromText(text, mockIngredients);

    expect(results.length).toBeGreaterThan(0);
    expect(results[0].amount).toBe(200);
    expect(results[0].unit).toBe('ml');
  });

  // TC-014-02
  it('handles multiple lines', () => {
    const text = '2 Äpfel\n200 ml Milch\nSalz';
    const results = parseIngredientsFromText(text, mockIngredients);

    expect(results.length).toBeGreaterThanOrEqual(1);
  });
});
