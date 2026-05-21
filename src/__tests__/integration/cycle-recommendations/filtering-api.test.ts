/** @jest-environment node */
import { GET as GET_RECIPES } from '@/app/api/recipes/route';
import { RecipeModel } from '@/lib/db/models/recipe';
import { IngredientMasterModel } from '@/lib/db/models/ingredientMaster';
import { UserModel } from '@/lib/db/models/user';
import { initializeDatabase, closeDatabase } from '@/lib/db/init';
import { generateToken } from '@/lib/auth/tokenRefresh';
import bcryptjs from 'bcryptjs';
import fs from 'fs';
import path from 'path';
import { NextRequest } from 'next/server';

describe('GET /api/recipes with phase-based filtering', () => {
  let testDbPath: string;
  let testCounter = 0;
  let userId: number;
  let userToken: string;

  beforeEach(async () => {
    testCounter++;
    testDbPath = path.join(__dirname, `../../../../../.data/test-filter-${testCounter}.db`);

    process.env.DATABASE_URL = testDbPath;
    process.env.JWT_SECRET = 'test-secret-key-must-be-32-chars-long';
    await initializeDatabase();

    const passwordHash = await bcryptjs.hash('TestPassword123', 10);
    const user = await UserModel.create('filter@example.com', passwordHash);
    userId = user.id;
    userToken = generateToken(String(userId), 'filter@example.com');

    // Create test ingredients
    IngredientMasterModel.create({
      name: 'Spinach',
      iron: 2.7,
      magnesium: 79,
      protein: 2.7,
    });

    IngredientMasterModel.create({
      name: 'Chicken',
      protein: 31,
      iron: 1.3,
    });

    // Create test recipes
    RecipeModel.create('Iron-Rich Dish', userId, undefined, undefined, 1, [
      { name: 'Spinach', quantity: 200, unit: 'g' },
    ]);

    RecipeModel.create('Protein Dish', userId, undefined, undefined, 1, [
      { name: 'Chicken', quantity: 150, unit: 'g' },
    ]);
  });

  afterEach(() => {
    closeDatabase();

    try {
      if (fs.existsSync(testDbPath)) {
        fs.unlinkSync(testDbPath);
      }
      const walPath = `${testDbPath}-wal`;
      const shmPath = `${testDbPath}-shm`;
      if (fs.existsSync(walPath)) {
        fs.unlinkSync(walPath);
      }
      if (fs.existsSync(shmPath)) {
        fs.unlinkSync(shmPath);
      }
    } catch (e) {
      // ignore
    }

    delete process.env.DATABASE_URL;
    delete process.env.JWT_SECRET;
  });

  test('should return recipes with score field when phase parameter provided', async () => {
    const request = new NextRequest('http://localhost:3000/api/recipes?phase=menstruation');
    const response = await GET_RECIPES(request);
    const data = await response.json();

    expect(response.status).toBe(200);
    expect(data.recipes).toBeDefined();
    expect(data.recipes.length).toBeGreaterThan(0);
    expect(data.recipes[0]).toHaveProperty('score');
  });

  test('should calculate different scores for different phases', async () => {
    const menstruationRequest = new NextRequest(
      'http://localhost:3000/api/recipes?phase=menstruation'
    );
    const menstruationResponse = await GET_RECIPES(menstruationRequest);
    const menstruationData = await menstruationResponse.json();

    const ovulationRequest = new NextRequest('http://localhost:3000/api/recipes?phase=ovulation');
    const ovulationResponse = await GET_RECIPES(ovulationRequest);
    const ovulationData = await ovulationResponse.json();

    // Find the iron-rich spinach dish in both responses
    const spinachMenstruation = menstruationData.recipes.find(
      (r: any) => r.name === 'Iron-Rich Dish'
    );
    const spinachOvulation = ovulationData.recipes.find((r: any) => r.name === 'Iron-Rich Dish');

    // Iron is more important in menstruation, so score should be higher
    expect(spinachMenstruation.score).toBeGreaterThan(spinachOvulation.score);
  });

  test('should work with authenticated user', async () => {
    const request = new NextRequest('http://localhost:3000/api/recipes?phase=menstruation', {
      headers: {
        cookie: `sessionToken=${userToken}`,
      },
    });
    const response = await GET_RECIPES(request);

    expect(response.status).toBe(200);
    const data = await response.json();
    expect(data.recipes).toBeDefined();
  });

  test('should support pagination with phase', async () => {
    const request = new NextRequest(
      'http://localhost:3000/api/recipes?phase=menstruation&page=1&pageSize=10'
    );
    const response = await GET_RECIPES(request);
    const data = await response.json();

    expect(response.status).toBe(200);
    expect(data).toHaveProperty('page');
    expect(data).toHaveProperty('pageSize');
    expect(data).toHaveProperty('totalPages');
  });
});
