/** @jest-environment node */
import { GET } from '../../../../app/api/recipes/ingredients/route';
import { UserModel } from '../../../../lib/db/models/user';
import { RecipeModel } from '../../../../lib/db/models/recipe';
import { initializeDatabase } from '../../../../lib/db/init';
import { generateToken } from '../../../../lib/auth/tokenRefresh';
import bcryptjs from 'bcryptjs';
import fs from 'fs';
import path from 'path';
import { NextRequest } from 'next/server';

describe('GET /api/recipes/ingredients', () => {
  let testDbPath: string;
  let testCounter = 0;
  let userId: number;
  let userToken: string;

  beforeEach(async () => {
    testCounter++;
    testDbPath = path.join(
      __dirname,
      `../../../../../.data/test-ingredients-${testCounter}.db`
    );

    // Close existing database instance if any
    const existingDb = (global as any).db;
    if (existingDb) {
      try {
        existingDb.close();
      } catch (e) {
        // ignore if already closed
      }
    }

    process.env.DATABASE_URL = testDbPath;
    process.env.JWT_SECRET = 'test-secret-key-must-be-32-chars-long';
    // Clear global db instance
    (global as any).db = undefined;
    await initializeDatabase();

    // Create test user
    const passwordHash = await bcryptjs.hash('TestPassword123', 10);
    const user = UserModel.create('test@example.com', passwordHash);
    userId = user.id;
    userToken = generateToken(String(userId), 'test@example.com');
  });

  afterEach(() => {
    // Close database
    try {
      const db = (global as any).db;
      if (db) {
        db.close();
      }
    } catch (e) {
      // ignore
    }
    (global as any).db = undefined;
    if (fs.existsSync(testDbPath)) {
      fs.unlinkSync(testDbPath);
    }
    delete process.env.DATABASE_URL;
  });

  test('should get unique ingredients from all recipes', async () => {
    // Create recipes with various ingredients
    RecipeModel.create(
      'Pasta Carbonara',
      userId,
      'Classic Italian pasta',
      'Cook pasta and mix',
      4,
      [
        { name: 'pasta', quantity: 400, unit: 'g' },
        { name: 'eggs', quantity: 3, unit: '' },
        { name: 'bacon', quantity: 200, unit: 'g' },
      ]
    );

    RecipeModel.create(
      'Tomato Soup',
      userId,
      'Creamy tomato soup',
      'Simmer and blend',
      2,
      [
        { name: 'tomato', quantity: 500, unit: 'g' },
        { name: 'cream', quantity: 200, unit: 'ml' },
        { name: 'onion', quantity: 1, unit: '' },
      ]
    );

    RecipeModel.create(
      'Caesar Salad',
      userId,
      'Fresh salad',
      'Mix and serve',
      1,
      [
        { name: 'lettuce', quantity: 200, unit: 'g' },
        { name: 'eggs', quantity: 2, unit: '' },
        { name: 'parmesan', quantity: 50, unit: 'g' },
      ]
    );

    const request = new NextRequest('http://localhost:3000/api/recipes/ingredients', {
      method: 'GET',
    });

    const response = await GET(request);
    const data = await response.json();

    expect(response.status).toBe(200);
    expect(data.ingredients).toBeDefined();
    expect(Array.isArray(data.ingredients)).toBe(true);
    expect(data.total).toBeDefined();
    expect(data.total).toBe(data.ingredients.length);

    // Check that all expected ingredients are present
    const expectedIngredients = [
      'bacon',
      'cream',
      'eggs',
      'lettuce',
      'onion',
      'parmesan',
      'pasta',
      'tomato',
    ];
    expect(data.ingredients).toEqual(expectedIngredients);
    expect(data.total).toBe(8);
  });

  test('should return normalized (lowercase, trimmed) ingredient names', async () => {
    // Create recipe with various casings and whitespace
    RecipeModel.create(
      'Mixed Case Recipe',
      userId,
      'Test recipe',
      'Instructions',
      1,
      [
        { name: '  TOMATO  ', quantity: 1, unit: 'g' },
        { name: 'Potato', quantity: 1, unit: 'g' },
        { name: '  onion', quantity: 1, unit: 'g' },
        { name: 'GARLIC ', quantity: 1, unit: 'g' },
      ]
    );

    const request = new NextRequest('http://localhost:3000/api/recipes/ingredients', {
      method: 'GET',
    });

    const response = await GET(request);
    const data = await response.json();

    expect(response.status).toBe(200);
    expect(data.ingredients).toEqual(['garlic', 'onion', 'potato', 'tomato']);
    expect(data.total).toBe(4);

    // Verify all are lowercase
    data.ingredients.forEach((ing: string) => {
      expect(ing).toBe(ing.toLowerCase());
      expect(ing).toBe(ing.trim());
    });
  });

  test('should not return duplicate ingredients', async () => {
    // Create multiple recipes with overlapping ingredients
    RecipeModel.create(
      'Recipe 1',
      userId,
      'First recipe',
      'Instructions',
      1,
      [
        { name: 'salt', quantity: 1, unit: 'g' },
        { name: 'pepper', quantity: 1, unit: 'g' },
        { name: 'oil', quantity: 10, unit: 'ml' },
      ]
    );

    RecipeModel.create(
      'Recipe 2',
      userId,
      'Second recipe',
      'Instructions',
      1,
      [
        { name: 'salt', quantity: 2, unit: 'g' },
        { name: 'pepper', quantity: 2, unit: 'g' },
        { name: 'garlic', quantity: 3, unit: 'g' },
      ]
    );

    RecipeModel.create(
      'Recipe 3',
      userId,
      'Third recipe',
      'Instructions',
      1,
      [
        { name: 'salt', quantity: 1, unit: 'g' },
        { name: 'onion', quantity: 1, unit: 'g' },
      ]
    );

    const request = new NextRequest('http://localhost:3000/api/recipes/ingredients', {
      method: 'GET',
    });

    const response = await GET(request);
    const data = await response.json();

    expect(response.status).toBe(200);
    expect(data.ingredients).toEqual(['garlic', 'oil', 'onion', 'pepper', 'salt']);
    expect(data.total).toBe(5);

    // Verify each ingredient appears only once
    const ingredientSet = new Set(data.ingredients);
    expect(ingredientSet.size).toBe(data.ingredients.length);
  });
});
