/** @jest-environment node */
import { IngredientMasterModel, CreateIngredientMasterRequest } from '@/lib/db/models/ingredientMaster';
import { initializeDatabase, closeDatabase } from '@/lib/db/init';
import Database from 'better-sqlite3';
import { mkdtempSync, rmSync } from 'fs';
import { tmpdir } from 'os';
import { join } from 'path';

describe('IngredientMasterModel', () => {
  let db: Database.Database;
  let dbPath: string;

  beforeEach(async () => {
    dbPath = mkdtempSync(join(tmpdir(), 'test-'));
    process.env.DATABASE_URL = `file:${join(dbPath, 'test.db')}`;
    await initializeDatabase();
    db = require('@/lib/db/init').getDatabase();
  });

  afterEach(() => {
    closeDatabase();
    rmSync(dbPath, { recursive: true, force: true });
    delete process.env.DATABASE_URL;
  });

  describe('create', () => {
    test('should create a new ingredient with all fields', () => {
      const data: CreateIngredientMasterRequest = {
        name: 'Spinach',
        category: 'Vegetables',
        base_unit: 'g',
        base_size: 100,
        kcal: 23,
        protein: 2.7,
        iron: 2.7,
        magnesium: 79,
        calcium: 99,
        vitamin_d: 0,
        vitamin_b6: 0.2,
        vitamin_b12: 0,
      };

      const ingredient = IngredientMasterModel.create(data);

      expect(ingredient.id).toBeGreaterThan(0);
      expect(ingredient.name).toBe('Spinach');
      expect(ingredient.category).toBe('Vegetables');
      expect(ingredient.base_unit).toBe('g');
      expect(ingredient.base_size).toBe(100);
      expect(ingredient.kcal).toBe(23);
      expect(ingredient.protein).toBe(2.7);
      expect(ingredient.iron).toBe(2.7);
      expect(ingredient.created_at).toBeDefined();
    });

    test('should trim name and category', () => {
      const data: CreateIngredientMasterRequest = {
        name: '  Apple  ',
        category: '  Fruits  ',
      };

      const ingredient = IngredientMasterModel.create(data);

      expect(ingredient.name).toBe('Apple');
      expect(ingredient.category).toBe('Fruits');
    });

    test('should use default values for optional fields', () => {
      const data: CreateIngredientMasterRequest = {
        name: 'Rice',
      };

      const ingredient = IngredientMasterModel.create(data);

      expect(ingredient.base_unit).toBe('g');
      expect(ingredient.base_size).toBe(100);
      expect(ingredient.kcal).toBeNull();
      expect(ingredient.protein).toBeNull();
    });

    test('should reject duplicate ingredient names', () => {
      const data: CreateIngredientMasterRequest = {
        name: 'Broccoli',
      };

      IngredientMasterModel.create(data);

      expect(() => {
        IngredientMasterModel.create(data);
      }).toThrow();
    });

    test('should allow null category', () => {
      const data: CreateIngredientMasterRequest = {
        name: 'Mystery Ingredient',
        category: undefined,
      };

      const ingredient = IngredientMasterModel.create(data);

      expect(ingredient.category).toBeNull();
    });
  });

  describe('findById', () => {
    test('should find ingredient by id', () => {
      const created = IngredientMasterModel.create({ name: 'Carrot' });
      const found = IngredientMasterModel.findById(created.id);

      expect(found).not.toBeNull();
      expect(found!.name).toBe('Carrot');
      expect(found!.id).toBe(created.id);
    });

    test('should return null for non-existent id', () => {
      const found = IngredientMasterModel.findById(9999);

      expect(found).toBeNull();
    });
  });

  describe('findAll', () => {
    test('should return all ingredients', () => {
      IngredientMasterModel.create({ name: 'Tomato' });
      IngredientMasterModel.create({ name: 'Lettuce' });
      IngredientMasterModel.create({ name: 'Cucumber' });

      const { ingredients, total } = IngredientMasterModel.findAll();

      expect(total).toBe(3);
      expect(ingredients).toHaveLength(3);
    });

    test('should support pagination', () => {
      for (let i = 0; i < 25; i++) {
        IngredientMasterModel.create({ name: `Ingredient${i}` });
      }

      const page1 = IngredientMasterModel.findAll(1, 10);
      const page2 = IngredientMasterModel.findAll(2, 10);
      const page3 = IngredientMasterModel.findAll(3, 10);

      expect(page1.total).toBe(25);
      expect(page1.ingredients).toHaveLength(10);
      expect(page2.ingredients).toHaveLength(10);
      expect(page3.ingredients).toHaveLength(5);
      expect(page1.ingredients[0].name).not.toBe(page2.ingredients[0].name);
    });

    test('should support search by name', () => {
      IngredientMasterModel.create({ name: 'Apple' });
      IngredientMasterModel.create({ name: 'Apricot' });
      IngredientMasterModel.create({ name: 'Blueberry' });

      const results = IngredientMasterModel.findAll(1, 20, 'Ap');

      expect(results.total).toBe(2);
      expect(results.ingredients).toHaveLength(2);
      expect(results.ingredients.map(i => i.name)).toContain('Apple');
      expect(results.ingredients.map(i => i.name)).toContain('Apricot');
    });

    test('should be case-insensitive in search', () => {
      IngredientMasterModel.create({ name: 'Orange' });

      const results1 = IngredientMasterModel.findAll(1, 20, 'oran');
      const results2 = IngredientMasterModel.findAll(1, 20, 'ORAN');

      expect(results1.total).toBe(1);
      expect(results2.total).toBe(1);
    });

    test('should sort alphabetically', () => {
      IngredientMasterModel.create({ name: 'Zebra' });
      IngredientMasterModel.create({ name: 'Apple' });
      IngredientMasterModel.create({ name: 'Mango' });

      const { ingredients } = IngredientMasterModel.findAll();

      expect(ingredients[0].name).toBe('Apple');
      expect(ingredients[1].name).toBe('Mango');
      expect(ingredients[2].name).toBe('Zebra');
    });

    test('should return empty result when no matches', () => {
      IngredientMasterModel.create({ name: 'Pineapple' });

      const results = IngredientMasterModel.findAll(1, 20, 'Watermelon');

      expect(results.total).toBe(0);
      expect(results.ingredients).toHaveLength(0);
    });
  });

  describe('update', () => {
    test('should update ingredient fields', () => {
      const created = IngredientMasterModel.create({
        name: 'Chicken',
        protein: 26,
        iron: 1.3,
      });

      const updated = IngredientMasterModel.update(created.id, {
        protein: 31,
        iron: 1.8,
      });

      expect(updated.id).toBe(created.id);
      expect(updated.name).toBe('Chicken');
      expect(updated.protein).toBe(31);
      expect(updated.iron).toBe(1.8);
    });

    test('should support partial updates', () => {
      const created = IngredientMasterModel.create({
        name: 'Beef',
        protein: 26,
        iron: 2.6,
        kcal: 250,
      });

      const updated = IngredientMasterModel.update(created.id, {
        protein: 27,
      });

      expect(updated.name).toBe('Beef');
      expect(updated.protein).toBe(27);
      expect(updated.iron).toBe(2.6);
      expect(updated.kcal).toBe(250);
    });

    test('should update name with trimming', () => {
      const created = IngredientMasterModel.create({ name: 'Fish' });

      const updated = IngredientMasterModel.update(created.id, {
        name: '  Salmon  ',
      });

      expect(updated.name).toBe('Salmon');
    });

    test('should update category', () => {
      const created = IngredientMasterModel.create({
        name: 'Milk',
        category: 'Dairy',
      });

      const updated = IngredientMasterModel.update(created.id, {
        category: 'Beverages',
      });

      expect(updated.category).toBe('Beverages');
    });

    test('should throw error when ingredient not found', () => {
      expect(() => {
        IngredientMasterModel.update(9999, { name: 'New Name' });
      }).toThrow('Ingredient not found');
    });

    test('should update updated_at timestamp', () => {
      const created = IngredientMasterModel.create({ name: 'Egg' });
      const originalUpdatedAt = created.updated_at;

      // Small delay to ensure timestamp difference
      const updated = IngredientMasterModel.update(created.id, {
        protein: 6,
      });

      // Updated_at should be more recent
      expect(new Date(updated.updated_at).getTime()).toBeGreaterThanOrEqual(
        new Date(originalUpdatedAt).getTime()
      );
    });
  });

  describe('delete', () => {
    test('should delete ingredient', () => {
      const created = IngredientMasterModel.create({ name: 'Cheese' });

      IngredientMasterModel.delete(created.id);
      const found = IngredientMasterModel.findById(created.id);

      expect(found).toBeNull();
    });

    test('should not throw error when deleting non-existent id', () => {
      expect(() => {
        IngredientMasterModel.delete(9999);
      }).not.toThrow();
    });

    test('should remove from findAll results', () => {
      const created = IngredientMasterModel.create({ name: 'Butter' });
      const { total: beforeDelete } = IngredientMasterModel.findAll();

      IngredientMasterModel.delete(created.id);
      const { total: afterDelete } = IngredientMasterModel.findAll();

      expect(beforeDelete).toBe(1);
      expect(afterDelete).toBe(0);
    });
  });
});
