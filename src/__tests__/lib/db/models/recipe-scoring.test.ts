/** @jest-environment node */
import { RecipeModel } from '@/lib/db/models/recipe';
import { IngredientMasterModel } from '@/lib/db/models/ingredientMaster';
import { UserModel } from '@/lib/db/models/user';
import { initializeDatabase, closeDatabase } from '@/lib/db/init';
import Database from 'better-sqlite3';
import { mkdtempSync, rmSync } from 'fs';
import { tmpdir } from 'os';
import { join } from 'path';

describe('RecipeModel - Scoring Methods', () => {
  let db: Database.Database;
  let dbPath: string;
  let userId: number;

  beforeEach(async () => {
    dbPath = mkdtempSync(join(tmpdir(), 'test-'));
    process.env.DATABASE_URL = `file:${join(dbPath, 'test.db')}`;
    process.env.JWT_SECRET = 'test-secret-minimum-32-characters!!';
    await initializeDatabase();
    db = require('@/lib/db/init').getDatabase();

    // Create a test user
    const user = await UserModel.create('testuser@test.com', 'hashedpassword');
    userId = user.id;

    // Create test ingredients in ingredients_master
    IngredientMasterModel.create({
      name: 'Spinach',
      category: 'Vegetables',
      protein: 2.7,
      iron: 2.7,
      magnesium: 79,
      calcium: 99,
      kcal: 23,
    });

    IngredientMasterModel.create({
      name: 'Chicken',
      category: 'Meat',
      protein: 31,
      iron: 1.3,
      kcal: 165,
    });

    IngredientMasterModel.create({
      name: 'Rice',
      category: 'Grains',
      protein: 7,
      carbohydrates: 78,
      kcal: 365,
    });

    IngredientMasterModel.create({
      name: 'Broccoli',
      category: 'Vegetables',
      protein: 3.7,
      vitamin_d: 0.1,
      calcium: 89,
      kcal: 34,
    });
  });

  afterEach(() => {
    closeDatabase();
    rmSync(dbPath, { recursive: true, force: true });
    delete process.env.DATABASE_URL;
    delete process.env.JWT_SECRET;
  });

  describe('getNutrients', () => {
    test('should return aggregated nutrients for recipe with matched ingredients', () => {
      const recipe = RecipeModel.create('Spinach Salad', userId, 'A healthy salad', undefined, 1, [
        { name: 'Spinach', quantity: 100, unit: 'g' },
      ]);

      const nutrients = RecipeModel.getNutrients(recipe.id);

      expect(nutrients.iron).toBeCloseTo(2.7, 1);
      expect(nutrients.protein).toBeCloseTo(2.7, 1);
      expect(nutrients.magnesium).toBeCloseTo(79, 0);
      expect(nutrients.kcal).toBeCloseTo(23, 0);
    });

    test('should scale nutrients by quantity and base_size', () => {
      const recipe = RecipeModel.create('Rice Bowl', userId, 'Cooked rice', undefined, 1, [
        { name: 'Rice', quantity: 200, unit: 'g' }, // 200g of rice with base_size 100
      ]);

      const nutrients = RecipeModel.getNutrients(recipe.id);

      // Rice protein is 7 per 100g, so 200g = 7 * 2 = 14
      expect(nutrients.protein).toBeCloseTo(14, 0);
      // Rice kcal is 365 per 100g, so 200g = 365 * 2 = 730
      expect(nutrients.kcal).toBeCloseTo(730, 0);
    });

    test('should sum nutrients from multiple ingredients', () => {
      const recipe = RecipeModel.create('Chicken & Rice', userId, 'Chicken with rice', undefined, 1, [
        { name: 'Chicken', quantity: 100, unit: 'g' },
        { name: 'Rice', quantity: 100, unit: 'g' },
      ]);

      const nutrients = RecipeModel.getNutrients(recipe.id);

      // Chicken: 31 protein, Rice: 7 protein
      expect(nutrients.protein).toBeCloseTo(38, 0);
      // Chicken: 165 kcal, Rice: 365 kcal
      expect(nutrients.kcal).toBeCloseTo(530, 0);
    });

    test('should return 0 for nutrients when no ingredients matched in ingredients_master', () => {
      const recipe = RecipeModel.create('Mystery Dish', userId, 'Unknown ingredients', undefined, 1, [
        { name: 'Unknown Ingredient', quantity: 100, unit: 'g' },
      ]);

      const nutrients = RecipeModel.getNutrients(recipe.id);

      // No matched ingredients should give 0 nutrition
      expect(nutrients.iron).toBe(0);
      expect(nutrients.protein).toBe(0);
      expect(nutrients.kcal).toBe(0);
    });

    test('should return 0 for recipe with no ingredients', () => {
      const recipe = RecipeModel.create('Empty Recipe', userId);

      const nutrients = RecipeModel.getNutrients(recipe.id);

      expect(nutrients.protein).toBe(0);
      expect(nutrients.iron).toBe(0);
      expect(nutrients.kcal).toBe(0);
    });

    test('should be case-insensitive when matching ingredient names', () => {
      const recipe = RecipeModel.create('Tasty Dish', userId, undefined, undefined, 1, [
        { name: 'SPINACH', quantity: 100, unit: 'g' }, // Different case
      ]);

      const nutrients = RecipeModel.getNutrients(recipe.id);

      // Should still match 'Spinach' from ingredients_master
      expect(nutrients.iron).toBeCloseTo(2.7, 1);
    });

    test('should handle whitespace in ingredient names', () => {
      const recipe = RecipeModel.create('Trimmed Dish', userId, undefined, undefined, 1, [
        { name: '  Broccoli  ', quantity: 100, unit: 'g' }, // Extra whitespace
      ]);

      const nutrients = RecipeModel.getNutrients(recipe.id);

      // Should still match 'Broccoli' from ingredients_master
      expect(nutrients.protein).toBeCloseTo(3.7, 1);
    });
  });

  describe('listAllWithScore', () => {
    test('should return recipes with score field', () => {
      RecipeModel.create('Spinach Dish', userId, undefined, undefined, 1, [
        { name: 'Spinach', quantity: 100, unit: 'g' },
      ]);

      const { recipes, total } = RecipeModel.listAllWithScore(1, 10, 'date', undefined, 'menstruation');

      expect(total).toBe(1);
      expect(recipes).toHaveLength(1);
      expect(recipes[0]).toHaveProperty('score');
      expect(recipes[0].score).toBeGreaterThan(0);
    });

    test('should calculate different scores for different phases', () => {
      RecipeModel.create('Mixed Nutrition', userId, undefined, undefined, 1, [
        { name: 'Spinach', quantity: 100, unit: 'g' },
        { name: 'Chicken', quantity: 100, unit: 'g' },
      ]);

      const { recipes: menstruation } = RecipeModel.listAllWithScore(1, 10, 'date', undefined, 'menstruation');
      const { recipes: ovulation } = RecipeModel.listAllWithScore(1, 10, 'date', undefined, 'ovulation');

      // Scores should be different for different phases
      expect(menstruation[0].score).not.toEqual(ovulation[0].score);
    });

    test('should return null score for recipe with no matched ingredients', () => {
      RecipeModel.create('Unknown Dish', userId, undefined, undefined, 1, [
        { name: 'Unmatchable Ingredient', quantity: 100, unit: 'g' },
      ]);

      const { recipes } = RecipeModel.listAllWithScore(1, 10, 'date', undefined, 'menstruation');

      expect(recipes[0].score).toBeNull();
    });

    test('should support pagination', () => {
      for (let i = 0; i < 25; i++) {
        RecipeModel.create(`Recipe ${i}`, userId, undefined, undefined, 1, [
          { name: 'Spinach', quantity: 50, unit: 'g' },
        ]);
      }

      const page1 = RecipeModel.listAllWithScore(1, 10, 'date', undefined, 'menstruation');
      const page2 = RecipeModel.listAllWithScore(2, 10, 'date', undefined, 'menstruation');
      const page3 = RecipeModel.listAllWithScore(3, 10, 'date', undefined, 'menstruation');

      expect(page1.total).toBe(25);
      expect(page1.recipes).toHaveLength(10);
      expect(page2.recipes).toHaveLength(10);
      expect(page3.recipes).toHaveLength(5);
    });

    test('should support search parameter', () => {
      RecipeModel.create('Healthy Salad', userId, undefined, undefined, 1, [
        { name: 'Spinach', quantity: 100, unit: 'g' },
      ]);
      RecipeModel.create('Chicken Stir Fry', userId, undefined, undefined, 1, [
        { name: 'Chicken', quantity: 100, unit: 'g' },
      ]);

      const results = RecipeModel.listAllWithScore(1, 10, 'date', 'Salad', 'menstruation');

      expect(results.total).toBe(1);
      expect(results.recipes[0].name).toContain('Salad');
    });

    test('should include recipe info in results', () => {
      const recipe = RecipeModel.create('Test Recipe', userId, 'A test recipe', undefined, 2, [
        { name: 'Spinach', quantity: 100, unit: 'g' },
      ]);

      const { recipes } = RecipeModel.listAllWithScore(1, 10, 'date', undefined, 'menstruation');

      expect(recipes[0].id).toBe(recipe.id);
      expect(recipes[0].name).toBe('Test Recipe');
      expect(recipes[0].description).toBe('A test recipe');
      expect(recipes[0]).toHaveProperty('creatorName');
      expect(recipes[0]).toHaveProperty('ingredientCount');
      expect(recipes[0]).toHaveProperty('createdAt');
    });
  });

  describe('filterByIngredientsWithScore', () => {
    test('should filter recipes containing all specified ingredients', () => {
      RecipeModel.create('Spinach & Chicken', userId, undefined, undefined, 1, [
        { name: 'Spinach', quantity: 100, unit: 'g' },
        { name: 'Chicken', quantity: 100, unit: 'g' },
      ]);
      RecipeModel.create('Rice Only', userId, undefined, undefined, 1, [
        { name: 'Rice', quantity: 200, unit: 'g' },
      ]);

      const results = RecipeModel.filterByIngredientsWithScore(
        ['Spinach', 'Chicken'],
        1,
        10,
        'menstruation'
      );

      expect(results.total).toBe(1);
      expect(results.recipes[0].name).toBe('Spinach & Chicken');
    });

    test('should apply AND logic for ingredients', () => {
      RecipeModel.create('Chicken & Rice', userId, undefined, undefined, 1, [
        { name: 'Chicken', quantity: 100, unit: 'g' },
        { name: 'Rice', quantity: 100, unit: 'g' },
      ]);
      RecipeModel.create('Spinach & Chicken', userId, undefined, undefined, 1, [
        { name: 'Spinach', quantity: 100, unit: 'g' },
        { name: 'Chicken', quantity: 100, unit: 'g' },
      ]);
      RecipeModel.create('Broccoli Only', userId, undefined, undefined, 1, [
        { name: 'Broccoli', quantity: 100, unit: 'g' },
      ]);

      const results = RecipeModel.filterByIngredientsWithScore(
        ['Spinach', 'Chicken'],
        1,
        10,
        'menstruation'
      );

      // Only the recipe with both Spinach AND Chicken should match
      expect(results.total).toBe(1);
      expect(results.recipes[0].name).toBe('Spinach & Chicken');
    });

    test('should include score in filtered results', () => {
      RecipeModel.create('Test Recipe', userId, undefined, undefined, 1, [
        { name: 'Spinach', quantity: 100, unit: 'g' },
      ]);

      const results = RecipeModel.filterByIngredientsWithScore(
        ['Spinach'],
        1,
        10,
        'menstruation'
      );

      expect(results.recipes[0]).toHaveProperty('score');
      expect(results.recipes[0].score).toBeGreaterThan(0);
    });

    test('should be case-insensitive in filter', () => {
      RecipeModel.create('Mixed Greens', userId, undefined, undefined, 1, [
        { name: 'Spinach', quantity: 100, unit: 'g' },
      ]);

      const results = RecipeModel.filterByIngredientsWithScore(
        ['SPINACH'], // uppercase
        1,
        10,
        'menstruation'
      );

      expect(results.total).toBe(1);
    });

    test('should support pagination', () => {
      for (let i = 0; i < 15; i++) {
        RecipeModel.create(`Recipe ${i}`, userId, undefined, undefined, 1, [
          { name: 'Spinach', quantity: 100, unit: 'g' },
        ]);
      }

      const page1 = RecipeModel.filterByIngredientsWithScore(['Spinach'], 1, 5, 'menstruation');
      const page2 = RecipeModel.filterByIngredientsWithScore(['Spinach'], 2, 5, 'menstruation');
      const page3 = RecipeModel.filterByIngredientsWithScore(['Spinach'], 3, 5, 'menstruation');

      expect(page1.total).toBe(15);
      expect(page1.recipes).toHaveLength(5);
      expect(page2.recipes).toHaveLength(5);
      expect(page3.recipes).toHaveLength(5);
    });

    test('should score differently across phases', () => {
      RecipeModel.create('Iron-Rich Dish', userId, undefined, undefined, 1, [
        { name: 'Spinach', quantity: 200, unit: 'g' }, // High iron
      ]);

      const menstruation = RecipeModel.filterByIngredientsWithScore(
        ['Spinach'],
        1,
        10,
        'menstruation'
      );
      const ovulation = RecipeModel.filterByIngredientsWithScore(
        ['Spinach'],
        1,
        10,
        'ovulation'
      );

      // Iron is more important in menstruation, so score should be higher
      expect(menstruation.recipes[0].score).toBeGreaterThan(ovulation.recipes[0].score!);
    });

    test('should return empty results when no recipes match', () => {
      RecipeModel.create('Just Rice', userId, undefined, undefined, 1, [
        { name: 'Rice', quantity: 100, unit: 'g' },
      ]);

      const results = RecipeModel.filterByIngredientsWithScore(
        ['Spinach'],
        1,
        10,
        'menstruation'
      );

      expect(results.total).toBe(0);
      expect(results.recipes).toHaveLength(0);
    });
  });
});
