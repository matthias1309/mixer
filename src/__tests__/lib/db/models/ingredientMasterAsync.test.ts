/** @jest-environment node */
import { IngredientMasterModelAsync } from '@/lib/db/models/ingredientMasterAsync';
import { initializeDatabase } from '@/lib/db/init';
import { mkdtempSync, rmSync } from 'fs';
import { tmpdir } from 'os';
import { join } from 'path';

describe('IngredientMasterModelAsync', () => {
  let dbPath: string;

  beforeEach(async () => {
    dbPath = mkdtempSync(join(tmpdir(), 'test-'));
    process.env.DATABASE_URL = `file:${join(dbPath, 'test.db')}`;
    // Clear global db instance
    (global as any).db = undefined;
    await initializeDatabase();
  });

  afterEach(() => {
    const db = (global as any).db;
    if (db) {
      db.close();
    }
    (global as any).db = undefined;
    rmSync(dbPath, { recursive: true, force: true });
    delete process.env.DATABASE_URL;
  });

  test('should create a new ingredient and return it with id and name', async () => {
    const createdIngredient = await IngredientMasterModelAsync.create({
      name: 'Tomato',
    });

    expect(createdIngredient).toBeDefined();
    expect(createdIngredient.id).toBeGreaterThan(0);
    expect(createdIngredient.name).toBe('Tomato');
    expect(createdIngredient.created_at).toBeDefined();
  });

  test('should create ingredient with all nutrient fields', async () => {
    const createdIngredient = await IngredientMasterModelAsync.create({
      name: 'Spinach',
      category: 'Vegetables',
      base_unit: 'g',
      base_size: 100,
      kcal: 23,
      protein: 2.7,
      iron: 2.7,
    });

    expect(createdIngredient.name).toBe('Spinach');
    expect(createdIngredient.category).toBe('Vegetables');
    expect(createdIngredient.kcal).toBe(23);
    expect(createdIngredient.protein).toBe(2.7);
  });

  test('should return null when findById for non-existent ingredient', async () => {
    const found = await IngredientMasterModelAsync.findById(9999);
    expect(found).toBeNull();
  });

  test('should find created ingredient by id', async () => {
    const created = await IngredientMasterModelAsync.create({
      name: 'Carrot',
    });

    const found = await IngredientMasterModelAsync.findById(created.id);

    expect(found).not.toBeNull();
    expect(found!.name).toBe('Carrot');
    expect(found!.id).toBe(created.id);
  });

  test('should reject duplicate ingredient names', async () => {
    await IngredientMasterModelAsync.create({ name: 'Apple' });

    await expect(
      IngredientMasterModelAsync.create({ name: 'Apple' })
    ).rejects.toThrow();
  });

  test('should find all ingredients', async () => {
    await IngredientMasterModelAsync.create({ name: 'Tomato' });
    await IngredientMasterModelAsync.create({ name: 'Lettuce' });

    const result = await IngredientMasterModelAsync.findAll();

    expect(result.total).toBe(2);
    expect(result.ingredients).toHaveLength(2);
  });

  test('should search ingredients by name', async () => {
    await IngredientMasterModelAsync.create({ name: 'Apple' });
    await IngredientMasterModelAsync.create({ name: 'Apricot' });
    await IngredientMasterModelAsync.create({ name: 'Blueberry' });

    const result = await IngredientMasterModelAsync.findAll(1, 20, 'Ap');

    expect(result.total).toBe(2);
    expect(result.ingredients).toHaveLength(2);
  });
});
