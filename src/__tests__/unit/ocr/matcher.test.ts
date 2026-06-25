import { findBestMatch } from '@/lib/ocr/matcher';
import { Ingredient } from '@/lib/nutrition/types';

describe('Ingredient Matcher', () => {
  const mockIngredients: Ingredient[] = [
    {
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
    },
    {
      id: 2,
      name: 'Tomate',
      category: 'Gemüse',
      base_unit: 'g',
      base_size: 100,
      kcal: 18,
      sugar: 2.6,
      fat: 0.2,
      protein: 0.9,
      carbohydrates: 3.9,
      fiber: 1.2,
      sodium: 5,
      calcium: 10,
      vitamin_d: 0,
      magnesium: 11,
      vitamin_b6: 0.08,
      vitamin_b12: 0,
      vitamin_e: 0.54,
      zinc: 0.17,
      created_at: new Date(),
      updated_at: new Date(),
    },
  ];

  // TC-014-03
  it('finds exact match', () => {
    const result = findBestMatch('Apfel', mockIngredients);
    expect(result.ingredient?.id).toBe(1);
    expect(result.confidence).toBe(1.0);
  });

  // TC-014-04
  it('finds fuzzy match', () => {
    const result = findBestMatch('apfel', mockIngredients); // lowercase
    expect(result.ingredient?.id).toBe(1);
    expect(result.confidence).toBeGreaterThan(0.8);
  });

  // TC-014-05
  it('returns null for no match', () => {
    const result = findBestMatch('xyz123', mockIngredients);
    expect(result.ingredient).toBeNull();
    expect(result.confidence).toBe(0);
  });
});
