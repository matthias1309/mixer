import { convertToBaseAmount } from '@/lib/nutrition/conversions';
import { Ingredient } from '@/lib/nutrition/types';

describe('Nutrition Conversions', () => {
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

  it('converts grams directly', () => {
    const result = convertToBaseAmount(200, 'g', mockApple);
    expect(result).toBe(200);
  });

  it('converts pieces to grams (182g per piece)', () => {
    const result = convertToBaseAmount(2, 'Stück', mockApple);
    expect(result).toBe(364);
  });

  it('throws error for unknown unit', () => {
    expect(() => convertToBaseAmount(1, 'xyz', mockApple)).toThrow();
  });
});
