import { RecipeScaler } from '@/lib/units/scaler';

describe('RecipeScaler', () => {
  let scaler: RecipeScaler;

  beforeEach(() => {
    scaler = new RecipeScaler();
  });

  describe('scaleIngredient', () => {
    // TC-013-05
    it('scales ingredient quantity by factor', () => {
      const ingredient = {
        id: 1, recipe_id: 1, name: 'Mehl', quantity: 500, unit: 'g',
      };
      const scaled = scaler.scaleIngredient(ingredient, 2);
      expect(scaled.quantity).toBe(1000);
      expect(scaled.unit).toBe('g');
    });

    // TC-013-06
    it('promotes TL to EL when scaled quantity reaches threshold', () => {
      const ingredient = {
        id: 1, recipe_id: 1, name: 'Wasser', quantity: 3, unit: 'TL',
      };
      // 3 TL * 2 = 6 TL → should promote to EL
      const scaled = scaler.scaleIngredient(ingredient, 2);
      expect(scaled.unit).toBe('EL');
      expect(scaled.quantity).toBeCloseTo(2, 0);
    });

    // TC-013-07
    it('preserves Stück unit and rounds to integer', () => {
      const ingredient = {
        id: 1, recipe_id: 1, name: 'Eier', quantity: 2, unit: 'Stück',
      };
      const scaled = scaler.scaleIngredient(ingredient, 3);
      expect(scaled.quantity).toBe(6);
      expect(scaled.unit).toBe('Stück');
    });

    // TC-013-07
    it('preserves Prise unit', () => {
      const ingredient = {
        id: 1, recipe_id: 1, name: 'Salz', quantity: 1, unit: 'Prise',
      };
      const scaled = scaler.scaleIngredient(ingredient, 2);
      expect(scaled.quantity).toBe(2);
      expect(scaled.unit).toBe('Prise');
    });

    // TC-013-07
    it('rounds large weight quantities to nearest 5g', () => {
      const ingredient = {
        id: 1, recipe_id: 1, name: 'Butter', quantity: 25, unit: 'g',
      };
      // 25g * 3 = 75g → round to nearest 5 = 75
      const scaled = scaler.scaleIngredient(ingredient, 3);
      expect(scaled.quantity).toBe(75);
    });

    it('rounds small weight quantities to nearest 1g', () => {
      const ingredient = {
        id: 1, recipe_id: 1, name: 'Mehl', quantity: 10, unit: 'g',
      };
      // 10g * 1.5 = 15g (small, round to 1)
      const scaled = scaler.scaleIngredient(ingredient, 1.5);
      expect(scaled.quantity).toBe(15);
    });

    it('handles null unit gracefully', () => {
      const ingredient = {
        id: 1, recipe_id: 1, name: 'Salz', quantity: 2, unit: null,
      };
      const scaled = scaler.scaleIngredient(ingredient, 2);
      expect(scaled.quantity).toBe(4);
      expect(scaled.unit).toBeNull();
    });

    it('throws for non-positive scale factor', () => {
      const ingredient = {
        id: 1, recipe_id: 1, name: 'Mehl', quantity: 100, unit: 'g',
      };
      expect(() => scaler.scaleIngredient(ingredient, 0)).toThrow();
      expect(() => scaler.scaleIngredient(ingredient, -1)).toThrow();
    });
  });

  // TC-013-06
  describe('promoteUnit', () => {
    it('promotes TL to EL when quantity >= 3', () => {
      const result = scaler.promoteUnit(3, 'TL');
      expect(result.unit).toBe('EL');
      expect(result.quantity).toBeCloseTo(1, 1);
    });

    it('keeps TL when quantity < 3', () => {
      const result = scaler.promoteUnit(2, 'TL');
      expect(result.unit).toBe('TL');
      expect(result.quantity).toBe(2);
    });

    it('promotes ml to l when quantity >= 1000', () => {
      const result = scaler.promoteUnit(1500, 'ml');
      expect(result.unit).toBe('l');
      expect(result.quantity).toBeCloseTo(1.5, 1);
    });

    it('does not promote Stück', () => {
      const result = scaler.promoteUnit(100, 'Stück');
      expect(result.unit).toBe('Stück');
      expect(result.quantity).toBe(100);
    });

    it('does not promote Prise', () => {
      const result = scaler.promoteUnit(5, 'Prise');
      expect(result.unit).toBe('Prise');
      expect(result.quantity).toBe(5);
    });

    it('promotes EL to ml when quantity >= 16', () => {
      const result = scaler.promoteUnit(16, 'EL');
      expect(result.unit).toBe('ml');
      expect(result.quantity).toBeCloseTo(240, 0); // 16 EL × 15 = 240 ml
    });
  });
});
