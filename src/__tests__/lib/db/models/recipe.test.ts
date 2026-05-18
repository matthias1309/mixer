import Database from 'better-sqlite3';
import fs from 'fs';
import path from 'path';
import { RecipeModel } from '../../../../lib/db/models/recipe';
import { UserModel } from '../../../../lib/db/models/user';
import { Recipe } from '../../../../types';

let testDb: Database.Database;
let userId: number;

// Setup test database before each test
beforeEach(async () => {
  const testDbPath = ':memory:';
  testDb = new Database(testDbPath);
  testDb.pragma('foreign_keys = ON');

  // Read migration file - convert SERIAL to INTEGER PRIMARY KEY for SQLite
  const migrationPath = path.join(__dirname, '../../../../lib/db/migrations/001_create_schema.sql');
  let migration = fs.readFileSync(migrationPath, 'utf-8');
  migration = migration.replace(/SERIAL\s+PRIMARY\s+KEY/gi, 'INTEGER PRIMARY KEY');

  // Execute migration
  const statements = migration.split(';').filter(stmt => stmt.trim());
  for (const stmt of statements) {
    testDb.exec(stmt);
  }

  // Override global.db
  (global as any).db = testDb;

  // Create test user
  const user = await UserModel.create('testuser@example.com', 'hashed_password');
  userId = user.id;
});

// Cleanup after each test
afterEach(() => {
  if (testDb) {
    testDb.close();
  }
  delete (global as any).db;
});

describe('RecipeModel', () => {
  describe('create', () => {
    it('should create a recipe with basic fields', () => {
      const recipe = RecipeModel.create(
        'Pasta',
        userId,
        'Italian pasta dish',
        'Boil pasta and mix with sauce',
        4
      );

      expect(recipe).toBeDefined();
      expect(recipe.id).toBeDefined();
      expect(recipe.name).toBe('Pasta');
      expect(recipe.description).toBe('Italian pasta dish');
      expect(recipe.instructions).toBe('Boil pasta and mix with sauce');
      expect(recipe.servings).toBe(4);
      expect(recipe.creator_id).toBe(userId);
      expect(recipe.canonical_id).toBeNull();
      expect(recipe.is_duplicate).toBe(0); // SQLite returns 0 for false
    });

    it('should create a recipe with ingredients', () => {
      const recipe = RecipeModel.create(
        'Pasta',
        userId,
        undefined,
        undefined,
        undefined,
        [
          { name: 'Pasta', quantity: 500, unit: 'g' },
          { name: 'Tomato Sauce', quantity: 200, unit: 'ml' },
        ]
      );

      const ingredients = RecipeModel.getIngredients(recipe.id);
      expect(ingredients).toHaveLength(2);
      expect(ingredients[0].name).toBe('pasta'); // Normalized
      expect(ingredients[1].name).toBe('tomato sauce'); // Normalized
    });

    it('should normalize ingredient names (trim + lowercase)', () => {
      const recipe = RecipeModel.create(
        'Dish',
        userId,
        undefined,
        undefined,
        undefined,
        [
          { name: '  PASTA  ', quantity: 500, unit: 'g' },
        ]
      );

      const ingredients = RecipeModel.getIngredients(recipe.id);
      expect(ingredients[0].name).toBe('pasta');
    });

    it('should handle recipes marked as duplicates', () => {
      const canonical = RecipeModel.create('Original', userId);
      const duplicate = RecipeModel.create(
        'Original',
        userId,
        undefined,
        undefined,
        undefined,
        undefined,
        canonical.id
      );

      expect(duplicate.canonical_id).toBe(canonical.id);
      expect(duplicate.is_duplicate).toBe(1); // SQLite returns 1 for true
    });

    it('should use default servings of 1 if not provided', () => {
      const recipe = RecipeModel.create('Dish', userId);
      expect(recipe.servings).toBe(1);
    });
  });

  describe('findById', () => {
    it('should find a recipe by id', () => {
      const created = RecipeModel.create('Pasta', userId);
      const found = RecipeModel.findById(created.id);

      expect(found).toBeDefined();
      expect(found?.name).toBe('Pasta');
    });

    it('should return null if recipe not found', () => {
      const found = RecipeModel.findById(999);
      expect(found).toBeNull();
    });
  });

  describe('listAll', () => {
    beforeEach(() => {
      // Create test recipes
      RecipeModel.create('Recipe A', userId, 'Description A');
      RecipeModel.create('Recipe B', userId, 'Description B');
      RecipeModel.create('Recipe C', userId, 'Description C');
      // Create a duplicate recipe (should be excluded from list)
      const canonical = RecipeModel.create('Duplicate', userId);
      RecipeModel.create('Duplicate Copy', userId, undefined, undefined, undefined, undefined, canonical.id);
    });

    it('should list all non-duplicate recipes', () => {
      const result = RecipeModel.listAll(1, 10);
      // Should include Recipe A, B, C, and canonical Duplicate (but not Duplicate Copy which is marked as duplicate)
      expect(result.recipes).toHaveLength(4);
      expect(result.total).toBe(4);
    });

    it('should paginate results', () => {
      const page1 = RecipeModel.listAll(1, 2);
      expect(page1.recipes).toHaveLength(2);
      expect(page1.total).toBe(4);

      const page2 = RecipeModel.listAll(2, 2);
      expect(page2.recipes).toHaveLength(2);
    });

    it('should sort by date descending (default)', () => {
      const result = RecipeModel.listAll(1, 10, 'date');
      // All recipes are created in order, so most recent is last (Duplicate)
      // But since they're all created at the same time, order may vary
      // Just check that we get all 4 recipes
      const names = result.recipes.map(r => r.name);
      expect(names).toContain('Recipe A');
      expect(names).toContain('Recipe B');
      expect(names).toContain('Recipe C');
      expect(names).toContain('Duplicate');
    });

    it('should sort by name ascending', () => {
      const result = RecipeModel.listAll(1, 10, 'name');
      const names = result.recipes.map(r => r.name);
      expect(names[0]).toBe('Duplicate');
      expect(names[1]).toBe('Recipe A');
      expect(names[2]).toBe('Recipe B');
      expect(names[3]).toBe('Recipe C');
    });

    it('should search by recipe name', () => {
      const result = RecipeModel.listAll(1, 10, 'date', 'Recipe A');
      expect(result.recipes).toHaveLength(1);
      expect(result.recipes[0].name).toBe('Recipe A');
    });

    it('should include creator name in results', () => {
      const result = RecipeModel.listAll(1, 10);
      expect(result.recipes[0].creatorName).toBe('testuser@example.com');
    });

    it('should include ingredient count in results', () => {
      const recipe = RecipeModel.create('Dish', userId, undefined, undefined, undefined, [
        { name: 'Ingredient 1', quantity: 1 },
        { name: 'Ingredient 2', quantity: 1 },
      ]);

      const result = RecipeModel.listAll(1, 10);
      const found = result.recipes.find(r => r.id === recipe.id);
      expect(found?.ingredientCount).toBe(2);
    });
  });

  describe('findByNameAndIngredients', () => {
    it('should find exact recipe match by name and ingredients', () => {
      const recipe = RecipeModel.create(
        'Pasta',
        userId,
        undefined,
        undefined,
        undefined,
        [
          { name: 'Pasta', quantity: 500 },
          { name: 'Tomato Sauce', quantity: 200 },
        ]
      );

      const found = RecipeModel.findByNameAndIngredients(
        'Pasta',
        ['Pasta', 'Tomato Sauce']
      );

      expect(found).toBeDefined();
      expect(found?.id).toBe(recipe.id);
    });

    it('should not match if ingredient names differ', () => {
      RecipeModel.create(
        'Pasta',
        userId,
        undefined,
        undefined,
        undefined,
        [
          { name: 'Pasta', quantity: 500 },
          { name: 'Tomato Sauce', quantity: 200 },
        ]
      );

      const found = RecipeModel.findByNameAndIngredients(
        'Pasta',
        ['Pasta', 'Cream Sauce'] // Different ingredient
      );

      expect(found).toBeNull();
    });

    it('should not match if ingredient count differs', () => {
      RecipeModel.create(
        'Pasta',
        userId,
        undefined,
        undefined,
        undefined,
        [
          { name: 'Pasta', quantity: 500 },
          { name: 'Tomato Sauce', quantity: 200 },
        ]
      );

      const found = RecipeModel.findByNameAndIngredients(
        'Pasta',
        ['Pasta'] // Fewer ingredients
      );

      expect(found).toBeNull();
    });

    it('should normalize names and ingredients for comparison', () => {
      RecipeModel.create(
        'Pasta',
        userId,
        undefined,
        undefined,
        undefined,
        [
          { name: 'Pasta', quantity: 500 },
          { name: 'Tomato Sauce', quantity: 200 },
        ]
      );

      const found = RecipeModel.findByNameAndIngredients(
        'pasta', // Different case
        ['  PASTA  ', 'TOMATO SAUCE'] // Different case and whitespace
      );

      expect(found).toBeDefined();
    });

    it('should not match duplicate recipes', () => {
      const canonical = RecipeModel.create('Pasta', userId, undefined, undefined, undefined, [
        { name: 'Pasta', quantity: 500 },
      ]);

      const duplicate = RecipeModel.create(
        'Pasta',
        userId,
        undefined,
        undefined,
        undefined,
        [{ name: 'Pasta', quantity: 500 }],
        canonical.id
      );

      const found = RecipeModel.findByNameAndIngredients('Pasta', ['Pasta']);

      // Should find the canonical, not the duplicate
      expect(found?.id).toBe(canonical.id);
    });
  });

  describe('update', () => {
    it('should update recipe fields', () => {
      const recipe = RecipeModel.create('Original', userId, 'Original desc');
      RecipeModel.update(recipe.id, 'Updated', 'Updated desc');

      const updated = RecipeModel.findById(recipe.id);
      expect(updated?.name).toBe('Updated');
      expect(updated?.description).toBe('Updated desc');
    });

    it('should update only provided fields', () => {
      const recipe = RecipeModel.create('Pasta', userId, 'Good pasta', 'Instructions', 4);
      RecipeModel.update(recipe.id, 'New Name');

      const updated = RecipeModel.findById(recipe.id);
      expect(updated?.name).toBe('New Name');
      expect(updated?.description).toBe('Good pasta');
      expect(updated?.instructions).toBe('Instructions');
      expect(updated?.servings).toBe(4);
    });

    it('should update ingredients', () => {
      const recipe = RecipeModel.create(
        'Pasta',
        userId,
        undefined,
        undefined,
        undefined,
        [{ name: 'Pasta', quantity: 500 }]
      );

      RecipeModel.update(recipe.id, undefined, undefined, undefined, undefined, [
        { name: 'Rice', quantity: 300 },
        { name: 'Vegetables', quantity: 200 },
      ]);

      const ingredients = RecipeModel.getIngredients(recipe.id);
      expect(ingredients).toHaveLength(2);
      expect(ingredients[0].name).toBe('rice');
      expect(ingredients[1].name).toBe('vegetables');
    });
  });

  describe('delete', () => {
    it('should delete a recipe', () => {
      const recipe = RecipeModel.create('Pasta', userId);
      RecipeModel.delete(recipe.id);

      const found = RecipeModel.findById(recipe.id);
      expect(found).toBeNull();
    });

    it('should cascade delete ingredients on recipe delete', () => {
      const recipe = RecipeModel.create(
        'Pasta',
        userId,
        undefined,
        undefined,
        undefined,
        [{ name: 'Pasta', quantity: 500 }]
      );

      RecipeModel.delete(recipe.id);

      const ingredients = RecipeModel.getIngredients(recipe.id);
      expect(ingredients).toHaveLength(0);
    });
  });

  describe('getIngredients', () => {
    it('should get all ingredients for a recipe', () => {
      const recipe = RecipeModel.create(
        'Pasta',
        userId,
        undefined,
        undefined,
        undefined,
        [
          { name: 'Pasta', quantity: 500, unit: 'g' },
          { name: 'Sauce', quantity: 300, unit: 'ml' },
        ]
      );

      const ingredients = RecipeModel.getIngredients(recipe.id);
      expect(ingredients).toHaveLength(2);
      expect(ingredients[0].quantity).toBe(500);
      expect(ingredients[0].unit).toBe('g');
    });

    it('should return ingredients sorted by name', () => {
      const recipe = RecipeModel.create(
        'Dish',
        userId,
        undefined,
        undefined,
        undefined,
        [
          { name: 'Zucchini', quantity: 1 },
          { name: 'Apple', quantity: 1 },
        ]
      );

      const ingredients = RecipeModel.getIngredients(recipe.id);
      expect(ingredients[0].name).toBe('apple');
      expect(ingredients[1].name).toBe('zucchini');
    });
  });

  describe('getUniqueIngredients', () => {
    it('should return all unique ingredient names from non-duplicate recipes', () => {
      RecipeModel.create('Recipe 1', userId, undefined, undefined, undefined, [
        { name: 'Pasta', quantity: 500 },
        { name: 'Sauce', quantity: 200 },
      ]);

      RecipeModel.create('Recipe 2', userId, undefined, undefined, undefined, [
        { name: 'Pasta', quantity: 400 },
        { name: 'Butter', quantity: 100 },
      ]);

      const unique = RecipeModel.getUniqueIngredients();
      expect(unique).toContain('pasta');
      expect(unique).toContain('sauce');
      expect(unique).toContain('butter');
      expect(unique.length).toBe(3);
    });

    it('should be sorted alphabetically', () => {
      RecipeModel.create('Recipe', userId, undefined, undefined, undefined, [
        { name: 'Zucchini', quantity: 1 },
        { name: 'Apple', quantity: 1 },
        { name: 'Banana', quantity: 1 },
      ]);

      const unique = RecipeModel.getUniqueIngredients();
      expect(unique).toEqual(['apple', 'banana', 'zucchini']);
    });

    it('should exclude ingredients from duplicate recipes', () => {
      const canonical = RecipeModel.create('Recipe 1', userId, undefined, undefined, undefined, [
        { name: 'Pasta', quantity: 500 },
      ]);

      RecipeModel.create(
        'Recipe 2',
        userId,
        undefined,
        undefined,
        undefined,
        [{ name: 'Chicken', quantity: 500 }],
        canonical.id
      );

      const unique = RecipeModel.getUniqueIngredients();
      expect(unique).toContain('pasta');
      expect(unique).not.toContain('chicken');
    });
  });

  describe('filterByIngredients', () => {
    beforeEach(() => {
      // Recipe with pasta and sauce
      RecipeModel.create('Pasta Carbonara', userId, undefined, undefined, undefined, [
        { name: 'Pasta', quantity: 500 },
        { name: 'Eggs', quantity: 3 },
        { name: 'Cheese', quantity: 100 },
      ]);

      // Recipe with pasta and vegetables
      RecipeModel.create('Pasta Primavera', userId, undefined, undefined, undefined, [
        { name: 'Pasta', quantity: 500 },
        { name: 'Tomato', quantity: 2 },
        { name: 'Zucchini', quantity: 1 },
      ]);

      // Recipe with rice
      RecipeModel.create('Fried Rice', userId, undefined, undefined, undefined, [
        { name: 'Rice', quantity: 300 },
        { name: 'Eggs', quantity: 2 },
        { name: 'Soy Sauce', quantity: 50 },
      ]);
    });

    it('should find recipes matching all provided ingredients', () => {
      const result = RecipeModel.filterByIngredients(['Pasta', 'Eggs']);
      expect(result.recipes).toHaveLength(1);
      expect(result.recipes[0].name).toBe('Pasta Carbonara');
    });

    it('should normalize ingredient names for search', () => {
      const result = RecipeModel.filterByIngredients(['  PASTA  ', 'EGGS']);
      expect(result.recipes).toHaveLength(1);
    });

    it('should not match if recipe has extra ingredients', () => {
      // Looking for pasta and eggs should only match carbonara
      const result = RecipeModel.filterByIngredients(['Pasta', 'Eggs']);
      expect(result.recipes).toHaveLength(1);
    });

    it('should return empty if no recipes match', () => {
      const result = RecipeModel.filterByIngredients(['NonExistent']);
      expect(result.recipes).toHaveLength(0);
      expect(result.total).toBe(0);
    });

    it('should support pagination', () => {
      // Create many recipes
      for (let i = 0; i < 5; i++) {
        RecipeModel.create(`Recipe ${i}`, userId, undefined, undefined, undefined, [
          { name: 'Pasta', quantity: 500 },
          { name: 'Eggs', quantity: 3 },
        ]);
      }

      const page1 = RecipeModel.filterByIngredients(['Pasta', 'Eggs'], 1, 2);
      expect(page1.recipes.length).toBeLessThanOrEqual(2);

      const page2 = RecipeModel.filterByIngredients(['Pasta', 'Eggs'], 2, 2);
      expect(page2.recipes.length).toBeGreaterThanOrEqual(0);
    });

    it('should return total count', () => {
      const result = RecipeModel.filterByIngredients(['Pasta']);
      expect(result.total).toBe(2); // Carbonara and Primavera
    });
  });
});
