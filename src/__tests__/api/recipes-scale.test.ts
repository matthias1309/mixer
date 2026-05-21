/** @jest-environment node */
import { POST as POST_SCALE } from '../../app/api/recipes/[id]/scale/route';
import { RecipeModel } from '../../lib/db/models/recipe';
import { UserModel } from '../../lib/db/models/user';
import { initializeDatabase } from '../../lib/db/init';
import { generateToken } from '../../lib/auth/tokenRefresh';
import bcryptjs from 'bcryptjs';
import fs from 'fs';
import path from 'path';
import { NextRequest } from 'next/server';

describe('POST /api/recipes/[id]/scale', () => {
  let testDbPath: string;
  let testCounter = 0;
  let userId: number;
  let userToken: string;

  beforeEach(async () => {
    testCounter++;
    testDbPath = path.join(
      __dirname,
      `../../../.data/test-scale-${testCounter}.db`
    );

    const existingDb = (global as any).db;
    if (existingDb) {
      try {
        existingDb.close();
      } catch {
        // ignore if already closed
      }
    }

    process.env.DATABASE_URL = testDbPath;
    process.env.JWT_SECRET = 'test-secret-key-must-be-32-chars-long';
    (global as any).db = undefined;
    await initializeDatabase();

    const passwordHash = await bcryptjs.hash('TestPassword123', 10);
    const user = await UserModel.create('user@example.com', passwordHash);
    userId = user.id;
    userToken = generateToken(String(userId), 'user@example.com');
  });

  afterEach(() => {
    try {
      const db = (global as any).db;
      if (db) {
        db.close();
      }
    } catch {
      // ignore
    }
    (global as any).db = undefined;
    if (fs.existsSync(testDbPath)) {
      fs.unlinkSync(testDbPath);
    }
    delete process.env.DATABASE_URL;
  });

  function makeRequest(recipeId: string | number, body: unknown, token?: string) {
    return new NextRequest(
      `http://localhost:3000/api/recipes/${recipeId}/scale`,
      {
        method: 'POST',
        headers: token ? { cookie: `sessionToken=${token}` } : {},
        body: JSON.stringify(body),
      }
    );
  }

  describe('happy path', () => {
    it('returns scaled ingredients for a valid request (unauthenticated)', async () => {
      const recipe = RecipeModel.create(
        'Pasta',
        userId,
        null,
        null,
        4,
        [
          { name: 'pasta', quantity: 400, unit: 'g' },
          { name: 'eggs', quantity: 4, unit: 'Stück' },
        ]
      );

      const request = makeRequest(recipe.id, { newServings: 8 });
      const response = await POST_SCALE(request, {
        params: Promise.resolve({ id: String(recipe.id) }),
      });
      const data = await response.json();

      expect(response.status).toBe(200);
      expect(data.servings).toBe(8);
      expect(data.id).toBe(recipe.id);
      expect(data.name).toBe('Pasta');
      expect(data.ingredients).toHaveLength(2);

      const pastaIng = data.ingredients.find((i: any) => i.name === 'pasta');
      const eggsIng = data.ingredients.find((i: any) => i.name === 'eggs');

      // 400g * (8/4) = 800g
      expect(pastaIng.quantity).toBe(800);
      expect(pastaIng.unit).toBe('g');

      // 4 Stück * (8/4) = 8 Stück
      expect(eggsIng.quantity).toBe(8);
      expect(eggsIng.unit).toBe('Stück');
    });

    it('scales down correctly (e.g., 4 servings → 2)', async () => {
      const recipe = RecipeModel.create(
        'Soup',
        userId,
        null,
        null,
        4,
        [{ name: 'water', quantity: 1000, unit: 'ml' }]
      );

      const request = makeRequest(recipe.id, { newServings: 2 });
      const response = await POST_SCALE(request, {
        params: Promise.resolve({ id: String(recipe.id) }),
      });
      const data = await response.json();

      expect(response.status).toBe(200);
      expect(data.servings).toBe(2);

      const waterIng = data.ingredients.find((i: any) => i.name === 'water');
      // 1000ml * (2/4) = 500ml
      expect(waterIng.quantity).toBe(500);
      expect(waterIng.unit).toBe('ml');
    });

    it('promotes units when threshold is exceeded (ml → l)', async () => {
      const recipe = RecipeModel.create(
        'Tea',
        userId,
        null,
        null,
        1,
        [{ name: 'water', quantity: 500, unit: 'ml' }]
      );

      // 500ml * (4/1) = 2000ml → should promote to 2l
      const request = makeRequest(recipe.id, { newServings: 4 });
      const response = await POST_SCALE(request, {
        params: Promise.resolve({ id: String(recipe.id) }),
      });
      const data = await response.json();

      expect(response.status).toBe(200);
      const waterIng = data.ingredients.find((i: any) => i.name === 'water');
      expect(waterIng.unit).toBe('l');
      expect(waterIng.quantity).toBeCloseTo(2, 1);
    });

    it('handles ingredient with null unit', async () => {
      const recipe = RecipeModel.create(
        'Recipe',
        userId,
        null,
        null,
        2,
        [{ name: 'cloves', quantity: 2, unit: '' }]
      );

      const request = makeRequest(recipe.id, { newServings: 4 });
      const response = await POST_SCALE(request, {
        params: Promise.resolve({ id: String(recipe.id) }),
      });
      const data = await response.json();

      expect(response.status).toBe(200);
      const cloveIng = data.ingredients.find((i: any) => i.name === 'cloves');
      expect(cloveIng.quantity).toBe(4);
    });

    it('works with authentication and refreshes token', async () => {
      const recipe = RecipeModel.create(
        'My Recipe',
        userId,
        null,
        null,
        2,
        [{ name: 'flour', quantity: 200, unit: 'g' }]
      );

      const request = makeRequest(recipe.id, { newServings: 4 }, userToken);
      const response = await POST_SCALE(request, {
        params: Promise.resolve({ id: String(recipe.id) }),
      });
      const data = await response.json();

      expect(response.status).toBe(200);
      expect(data.servings).toBe(4);
    });

    it('scales to same number of servings (factor = 1, no change)', async () => {
      const recipe = RecipeModel.create(
        'Cake',
        userId,
        null,
        null,
        4,
        [{ name: 'sugar', quantity: 200, unit: 'g' }]
      );

      const request = makeRequest(recipe.id, { newServings: 4 });
      const response = await POST_SCALE(request, {
        params: Promise.resolve({ id: String(recipe.id) }),
      });
      const data = await response.json();

      expect(response.status).toBe(200);
      const sugarIng = data.ingredients.find((i: any) => i.name === 'sugar');
      expect(sugarIng.quantity).toBe(200);
    });
  });

  describe('validation errors', () => {
    it('returns 404 for non-existent recipe', async () => {
      const request = makeRequest(99999, { newServings: 4 });
      const response = await POST_SCALE(request, {
        params: Promise.resolve({ id: '99999' }),
      });
      const data = await response.json();

      expect(response.status).toBe(404);
      expect(data.error).toContain('not found');
    });

    it('returns 400 for invalid recipe ID', async () => {
      const request = makeRequest('invalid', { newServings: 4 });
      const response = await POST_SCALE(request, {
        params: Promise.resolve({ id: 'invalid' }),
      });
      const data = await response.json();

      expect(response.status).toBe(400);
      expect(data.error).toContain('Invalid recipe ID');
    });

    it('returns 400 when newServings is missing', async () => {
      const recipe = RecipeModel.create('Recipe', userId, null, null, 4);

      const request = makeRequest(recipe.id, {});
      const response = await POST_SCALE(request, {
        params: Promise.resolve({ id: String(recipe.id) }),
      });
      const data = await response.json();

      expect(response.status).toBe(400);
      expect(data.error).toContain('newServings');
    });

    it('returns 400 when newServings is zero', async () => {
      const recipe = RecipeModel.create('Recipe', userId, null, null, 4);

      const request = makeRequest(recipe.id, { newServings: 0 });
      const response = await POST_SCALE(request, {
        params: Promise.resolve({ id: String(recipe.id) }),
      });
      const data = await response.json();

      expect(response.status).toBe(400);
      expect(data.error).toContain('newServings');
    });

    it('returns 400 when newServings is negative', async () => {
      const recipe = RecipeModel.create('Recipe', userId, null, null, 4);

      const request = makeRequest(recipe.id, { newServings: -3 });
      const response = await POST_SCALE(request, {
        params: Promise.resolve({ id: String(recipe.id) }),
      });
      const data = await response.json();

      expect(response.status).toBe(400);
      expect(data.error).toContain('newServings');
    });

    it('returns 400 when newServings exceeds 100', async () => {
      const recipe = RecipeModel.create('Recipe', userId, null, null, 4);

      const request = makeRequest(recipe.id, { newServings: 101 });
      const response = await POST_SCALE(request, {
        params: Promise.resolve({ id: String(recipe.id) }),
      });
      const data = await response.json();

      expect(response.status).toBe(400);
      expect(data.error).toContain('newServings');
    });

    it('returns 400 when newServings is a decimal', async () => {
      const recipe = RecipeModel.create('Recipe', userId, null, null, 4);

      const request = makeRequest(recipe.id, { newServings: 2.5 });
      const response = await POST_SCALE(request, {
        params: Promise.resolve({ id: String(recipe.id) }),
      });
      const data = await response.json();

      expect(response.status).toBe(400);
      expect(data.error).toContain('newServings');
    });

    it('returns 400 when newServings is a string', async () => {
      const recipe = RecipeModel.create('Recipe', userId, null, null, 4);

      const request = makeRequest(recipe.id, { newServings: 'four' });
      const response = await POST_SCALE(request, {
        params: Promise.resolve({ id: String(recipe.id) }),
      });
      const data = await response.json();

      expect(response.status).toBe(400);
      expect(data.error).toContain('newServings');
    });

    it('accepts newServings = 100 (boundary)', async () => {
      const recipe = RecipeModel.create(
        'Big Batch',
        userId,
        null,
        null,
        4,
        [{ name: 'flour', quantity: 100, unit: 'g' }]
      );

      const request = makeRequest(recipe.id, { newServings: 100 });
      const response = await POST_SCALE(request, {
        params: Promise.resolve({ id: String(recipe.id) }),
      });

      expect(response.status).toBe(200);
    });

    it('accepts newServings = 1 (boundary)', async () => {
      const recipe = RecipeModel.create(
        'Single',
        userId,
        null,
        null,
        4,
        [{ name: 'flour', quantity: 400, unit: 'g' }]
      );

      const request = makeRequest(recipe.id, { newServings: 1 });
      const response = await POST_SCALE(request, {
        params: Promise.resolve({ id: String(recipe.id) }),
      });
      const data = await response.json();

      expect(response.status).toBe(200);
      expect(data.servings).toBe(1);
    });
  });

  describe('response shape', () => {
    it('returns the full recipe shape with scaled ingredients', async () => {
      const recipe = RecipeModel.create(
        'Full Shape Test',
        userId,
        'Some description',
        'Some instructions',
        2,
        [{ name: 'butter', quantity: 50, unit: 'g' }]
      );

      const request = makeRequest(recipe.id, { newServings: 4 });
      const response = await POST_SCALE(request, {
        params: Promise.resolve({ id: String(recipe.id) }),
      });
      const data = await response.json();

      expect(response.status).toBe(200);
      expect(data.id).toBe(recipe.id);
      expect(data.name).toBe('Full Shape Test');
      expect(data.description).toBe('Some description');
      expect(data.instructions).toBe('Some instructions');
      expect(data.servings).toBe(4);
      expect(data.creatorId).toBe(userId);
      expect(Array.isArray(data.ingredients)).toBe(true);
      expect(data.createdAt).toBeDefined();
      expect(data.updatedAt).toBeDefined();
    });

    it('does not modify the recipe in the database', async () => {
      const recipe = RecipeModel.create(
        'Unchanged',
        userId,
        null,
        null,
        4,
        [{ name: 'pasta', quantity: 400, unit: 'g' }]
      );

      const request = makeRequest(recipe.id, { newServings: 8 });
      await POST_SCALE(request, {
        params: Promise.resolve({ id: String(recipe.id) }),
      });

      // Verify recipe in DB is unchanged
      const unchanged = RecipeModel.findById(recipe.id);
      expect(unchanged?.servings).toBe(4);

      const ingredients = RecipeModel.getIngredients(recipe.id);
      expect(ingredients[0].quantity).toBe(400);
    });
  });
});
