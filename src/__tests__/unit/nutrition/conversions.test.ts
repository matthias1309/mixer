import { convertToBaseAmount, calculatePerPortion, normalizeNutrientValue } from '@/lib/nutrition/conversions';
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

  describe('convertToBaseAmount', () => {
    it('converts grams directly', () => {
      const result = convertToBaseAmount(200, 'g', mockApple);
      expect(result).toBe(200);
    });

    it('converts pieces to grams (182g per piece)', () => {
      const result = convertToBaseAmount(2, 'Stück', mockApple);
      expect(result).toBe(364);
    });

    it('handles zero amount', () => {
      const result = convertToBaseAmount(0, 'g', mockApple);
      expect(result).toBe(0);
    });

    it('converts fractional amounts', () => {
      const result = convertToBaseAmount(1.5, 'g', mockApple);
      expect(result).toBe(1.5);
    });

    it('throws error for unknown unit', () => {
      expect(() => convertToBaseAmount(1, 'xyz', mockApple)).toThrow();
    });

    it('throws error for unsupported unit of known ingredient', () => {
      const expectedError = () => convertToBaseAmount(1, 'unsupportedUnit', mockApple);
      expect(expectedError).toThrow('Unknown conversion');
    });
  });

  describe('calculatePerPortion', () => {
    it('divides total by portions correctly', () => {
      const result = calculatePerPortion(500, 4);
      expect(result).toBe(125);
    });

    it('handles fractional results', () => {
      const result = calculatePerPortion(100, 3);
      expect(result).toBeCloseTo(33.33, 2);
    });

    it('normalizes to 2 decimal places', () => {
      const result = calculatePerPortion(10, 3);
      expect(result).toBeCloseTo(3.33, 2);
    });

    it('throws error for zero portions', () => {
      expect(() => calculatePerPortion(100, 0)).toThrow();
    });

    it('throws error for negative portions', () => {
      expect(() => calculatePerPortion(100, -1)).toThrow();
    });
  });

  describe('normalizeNutrientValue', () => {
    it('converts number to 2 decimal places', () => {
      const result = normalizeNutrientValue(52.123);
      expect(result).toBe(52.12);
    });

    it('handles null as zero', () => {
      const result = normalizeNutrientValue(null);
      expect(result).toBe(0);
    });

    it('preserves zero values', () => {
      const result = normalizeNutrientValue(0);
      expect(result).toBe(0);
    });

    it('rounds up correctly', () => {
      const result = normalizeNutrientValue(1.999);
      expect(result).toBe(2);
    });

    it('rounds down correctly', () => {
      const result = normalizeNutrientValue(1.111);
      expect(result).toBe(1.11);
    });
  });
});
