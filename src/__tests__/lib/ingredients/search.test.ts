import { searchIngredients } from '@/lib/ingredients/search';

describe('searchIngredients', () => {
  describe('case-insensitive substring matching', () => {
    test('should match ingredient by exact name', () => {
      const ingredients = [
        { id: 1, name: 'Tomato' },
        { id: 2, name: 'Potato' },
      ];
      const results = searchIngredients(ingredients, 'tomato', []);
      expect(results).toHaveLength(1);
      expect(results[0].name).toBe('Tomato');
    });

    test('should match by substring', () => {
      const ingredients = [
        { id: 1, name: 'Tomato' },
        { id: 2, name: 'Potato' },
      ];
      const results = searchIngredients(ingredients, 'tom', []);
      expect(results).toHaveLength(1);
      expect(results[0].name).toBe('Tomato');
    });

    test('should be case-insensitive', () => {
      const ingredients = [{ id: 1, name: 'Tomato' }];
      const results = searchIngredients(ingredients, 'TOMATO', []);
      expect(results).toHaveLength(1);
    });
  });

  describe('exact match priority', () => {
    test('should sort exact matches first', () => {
      const ingredients = [
        { id: 1, name: 'Tomato' },
        { id: 2, name: 'Tomate' },
        { id: 3, name: 'Tomatoe' },
      ];
      const results = searchIngredients(ingredients, 'tomato', []);
      expect(results[0].name).toBe('Tomato');
    });
  });

  describe('exclude already-added', () => {
    test('should exclude ingredients already in recipe', () => {
      const ingredients = [
        { id: 1, name: 'Tomato' },
        { id: 2, name: 'Potato' },
      ];
      const addedIds = [1];
      const results = searchIngredients(ingredients, 'to', addedIds);
      expect(results).toHaveLength(1);
      expect(results[0].id).toBe(2);
    });
  });

  describe('max results', () => {
    test('should limit results to 10 by default', () => {
      const ingredients = Array.from({ length: 20 }, (_, i) => ({
        id: i,
        name: `Ingredient ${i}`,
      }));
      const results = searchIngredients(ingredients, 'ingredient', []);
      expect(results).toHaveLength(10);
    });

    test('should return all if less than max', () => {
      const ingredients = [
        { id: 1, name: 'Apple' },
        { id: 2, name: 'Apricot' },
      ];
      const results = searchIngredients(ingredients, 'ap', []);
      expect(results).toHaveLength(2);
    });
  });

  describe('requires 2+ characters', () => {
    test('should return empty array for single character', () => {
      const ingredients = [{ id: 1, name: 'Apple' }];
      const results = searchIngredients(ingredients, 'a', []);
      expect(results).toHaveLength(0);
    });

    test('should search with 2+ characters', () => {
      const ingredients = [{ id: 1, name: 'Apple' }];
      const results = searchIngredients(ingredients, 'ap', []);
      expect(results).toHaveLength(1);
    });
  });
});
