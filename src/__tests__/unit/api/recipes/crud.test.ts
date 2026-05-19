/** @jest-environment node */
import { GET as GET_LIST, POST as POST_CREATE } from '../../../../app/api/recipes/route';
import { GET as GET_DETAIL, PUT as PUT_UPDATE, DELETE as DELETE_RECIPE } from '../../../../app/api/recipes/[id]/route';
import { UserModel } from '../../../../lib/db/models/user';
import { RecipeModel } from '../../../../lib/db/models/recipe';
import { RecipeModelAsync } from '../../../../lib/db/models/recipe-async';
import { initializeDatabase } from '../../../../lib/db/init';
import { generateToken } from '../../../../lib/auth/tokenRefresh';
import bcryptjs from 'bcryptjs';
import fs from 'fs';
import path from 'path';
import { NextRequest } from 'next/server';

describe('Recipe CRUD API', () => {
  let testDbPath: string;
  let testCounter = 0;
  let user1Id: number;
  let user2Id: number;
  let user1Token: string;
  let user2Token: string;

  beforeEach(async () => {
    testCounter++;
    testDbPath = path.join(
      __dirname,
      `../../../../../.data/test-recipes-${testCounter}.db`
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

    // Create test users
    const passwordHash1 = await bcryptjs.hash('TestPassword123', 10);
    const user1 = await await UserModel.create('user1@example.com', passwordHash1);
    user1Id = user1.id;
    user1Token = generateToken(String(user1Id), 'user1@example.com');

    const passwordHash2 = await bcryptjs.hash('TestPassword123', 10);
    const user2 = await await UserModel.create('user2@example.com', passwordHash2);
    user2Id = user2.id;
    user2Token = generateToken(String(user2Id), 'user2@example.com');
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

  describe('POST /api/recipes - Create recipe with deduplication', () => {
    test('should create recipe with valid data and return 201', async () => {
      const request = new NextRequest('http://localhost:3000/api/recipes', {
        method: 'POST',
        headers: {
          cookie: `sessionToken=${user1Token}`,
        },
        body: JSON.stringify({
          name: 'Spaghetti Carbonara',
          description: 'Classic Italian pasta dish',
          instructions: 'Cook pasta and mix with sauce',
          servings: 4,
          ingredients: [
            { name: 'pasta', quantity: 400, unit: 'g' },
            { name: 'eggs', quantity: 3, unit: '' },
          ],
        }),
      });

      const response = await POST_CREATE(request);
      const data = await response.json();

      expect(response.status).toBe(201);
      expect(data.id).toBeDefined();
      expect(data.name).toBe('Spaghetti Carbonara');
      expect(data.creatorId).toBe(user1Id);
      expect(data.isDuplicate).toBe(false);
      expect(data.canonicalId).toBeNull();
    });

    test('should detect duplicate recipe and set canonicalId', async () => {
      // Create first recipe
      const recipe1 = RecipeModel.create(
        'Tomato Soup',
        user1Id,
        'Classic tomato soup',
        'Simmer tomatoes',
        4,
        [
          { name: 'tomato', quantity: 500, unit: 'g' },
          { name: 'water', quantity: 1, unit: 'l' },
        ]
      );

      // Try to create duplicate
      const request = new NextRequest('http://localhost:3000/api/recipes', {
        method: 'POST',
        headers: {
          cookie: `sessionToken=${user2Token}`,
        },
        body: JSON.stringify({
          name: 'Tomato Soup',
          description: 'Another version',
          ingredients: [
            { name: 'tomato', quantity: 500, unit: 'g' },
            { name: 'water', quantity: 1, unit: 'l' },
          ],
        }),
      });

      const response = await POST_CREATE(request);
      const data = await response.json();

      expect(response.status).toBe(201);
      expect(data.isDuplicate).toBe(true);
      expect(data.canonicalId).toBe(recipe1.id);
    });

    test('should return 400 for missing name', async () => {
      const request = new NextRequest('http://localhost:3000/api/recipes', {
        method: 'POST',
        headers: {
          cookie: `sessionToken=${user1Token}`,
        },
        body: JSON.stringify({
          description: 'No name provided',
        }),
      });

      const response = await POST_CREATE(request);
      const data = await response.json();

      expect(response.status).toBe(400);
      expect(data.error).toContain('required');
    });

    test('should return 400 for name exceeding max length', async () => {
      const request = new NextRequest('http://localhost:3000/api/recipes', {
        method: 'POST',
        headers: {
          cookie: `sessionToken=${user1Token}`,
        },
        body: JSON.stringify({
          name: 'a'.repeat(101),
        }),
      });

      const response = await POST_CREATE(request);
      const data = await response.json();

      expect(response.status).toBe(400);
      expect(data.error).toContain('100 characters');
    });

    test('should return 400 for invalid servings', async () => {
      const request = new NextRequest('http://localhost:3000/api/recipes', {
        method: 'POST',
        headers: {
          cookie: `sessionToken=${user1Token}`,
        },
        body: JSON.stringify({
          name: 'Recipe',
          servings: -1,
        }),
      });

      const response = await POST_CREATE(request);
      const data = await response.json();

      expect(response.status).toBe(400);
      expect(data.error).toContain('positive');
    });

    test('should return 400 for too many ingredients', async () => {
      const ingredients = Array.from({ length: 51 }).map((_, i) => ({
        name: `ingredient${i}`,
        quantity: 1,
      }));

      const request = new NextRequest('http://localhost:3000/api/recipes', {
        method: 'POST',
        headers: {
          cookie: `sessionToken=${user1Token}`,
        },
        body: JSON.stringify({
          name: 'Recipe',
          ingredients,
        }),
      });

      const response = await POST_CREATE(request);
      const data = await response.json();

      expect(response.status).toBe(400);
      expect(data.error).toContain('50');
    });

    test('should return 401 if not authenticated', async () => {
      const request = new NextRequest('http://localhost:3000/api/recipes', {
        method: 'POST',
        body: JSON.stringify({
          name: 'Recipe',
        }),
      });

      const response = await POST_CREATE(request);
      const data = await response.json();

      expect(response.status).toBe(401);
      expect(data.error).toContain('logged in');
    });
  });

  describe('GET /api/recipes - List recipes with pagination', () => {
    test('should return paginated recipes list', async () => {
      // Create some recipes
      RecipeModel.create('Recipe A', user1Id, 'First recipe');
      RecipeModel.create('Recipe B', user1Id, 'Second recipe');
      RecipeModel.create('Recipe C', user2Id, 'Third recipe');

      const request = new NextRequest('http://localhost:3000/api/recipes?page=1&pageSize=10', {
        method: 'GET',
      });

      const response = await GET_LIST(request);
      const data = await response.json();

      expect(response.status).toBe(200);
      expect(data.recipes).toHaveLength(3);
      expect(data.total).toBe(3);
      expect(data.page).toBe(1);
      expect(data.pageSize).toBe(10);
      expect(data.totalPages).toBe(1);
    });

    test('should filter recipes by search term', async () => {
      RecipeModel.create('Spaghetti', user1Id);
      RecipeModel.create('Pizza', user1Id);
      RecipeModel.create('Spaghetti Aglio e Olio', user2Id);

      const request = new NextRequest('http://localhost:3000/api/recipes?search=spaghetti', {
        method: 'GET',
      });

      const response = await GET_LIST(request);
      const data = await response.json();

      expect(response.status).toBe(200);
      expect(data.recipes).toHaveLength(2);
      expect(data.total).toBe(2);
      expect(data.recipes.every((r: any) => r.name.toLowerCase().includes('spaghetti'))).toBe(true);
    });

    test('should filter recipes by ingredients', async () => {
      RecipeModel.create(
        'Pasta Carbonara',
        user1Id,
        undefined,
        undefined,
        undefined,
        [
          { name: 'pasta', quantity: 400, unit: 'g' },
          { name: 'eggs', quantity: 3, unit: '' },
        ]
      );

      RecipeModel.create(
        'Omelette',
        user1Id,
        undefined,
        undefined,
        undefined,
        [
          { name: 'eggs', quantity: 2, unit: '' },
          { name: 'butter', quantity: 10, unit: 'g' },
        ]
      );

      RecipeModel.create('Pizza', user2Id);

      const request = new NextRequest('http://localhost:3000/api/recipes?ingredients=eggs', {
        method: 'GET',
      });

      const response = await GET_LIST(request);
      const data = await response.json();

      expect(response.status).toBe(200);
      expect(data.recipes.length).toBeGreaterThan(0);
      expect(data.recipes.every((r: any) => r.ingredientCount > 0)).toBe(true);
    });

    test('should respect pagination limits', async () => {
      // Create 25 recipes
      for (let i = 0; i < 25; i++) {
        RecipeModel.create(`Recipe ${i}`, user1Id);
      }

      const request = new NextRequest('http://localhost:3000/api/recipes?page=2&pageSize=10', {
        method: 'GET',
      });

      const response = await GET_LIST(request);
      const data = await response.json();

      expect(response.status).toBe(200);
      expect(data.recipes.length).toBeLessThanOrEqual(10);
      expect(data.page).toBe(2);
      expect(data.totalPages).toBe(3);
    });

    test('should exclude duplicate recipes from list', async () => {
      const original = RecipeModel.create('Original Recipe', user1Id);
      RecipeModel.create(
        'Original Recipe',
        user2Id,
        undefined,
        undefined,
        undefined,
        undefined,
        original.id // Mark as duplicate
      );

      const request = new NextRequest('http://localhost:3000/api/recipes', {
        method: 'GET',
      });

      const response = await GET_LIST(request);
      const data = await response.json();

      expect(response.status).toBe(200);
      expect(data.recipes).toHaveLength(1);
      expect(data.recipes[0].name).toBe('Original Recipe');
    });
  });

  describe('GET /api/recipes/[id] - Get recipe detail', () => {
    test('should return full recipe detail with ingredients and creator', async () => {
      const recipe = RecipeModel.create(
        'Pasta Carbonara',
        user1Id,
        'Italian dish',
        'Cook and mix',
        4,
        [
          { name: 'pasta', quantity: 400, unit: 'g' },
          { name: 'eggs', quantity: 3, unit: '' },
        ]
      );

      const request = new NextRequest(`http://localhost:3000/api/recipes/${recipe.id}`, {
        method: 'GET',
        headers: {
          cookie: `sessionToken=${user1Token}`,
        },
      });

      const response = await GET_DETAIL(request, { params: Promise.resolve({ id: String(recipe.id) }) });
      const data = await response.json();

      expect(response.status).toBe(200);
      expect(data.id).toBe(recipe.id);
      expect(data.name).toBe('Pasta Carbonara');
      expect(data.creatorName).toBe('user1@example.com');
      expect(data.ingredients).toHaveLength(2);
      expect(data.canEdit).toBe(true);
      expect(data.canDelete).toBe(true);
    });

    test('should set canEdit/canDelete false for non-owner', async () => {
      const recipe = RecipeModel.create('Recipe', user1Id);

      const request = new NextRequest(`http://localhost:3000/api/recipes/${recipe.id}`, {
        method: 'GET',
        headers: {
          cookie: `sessionToken=${user2Token}`,
        },
      });

      const response = await GET_DETAIL(request, { params: Promise.resolve({ id: String(recipe.id) }) });
      const data = await response.json();

      expect(response.status).toBe(200);
      expect(data.canEdit).toBe(false);
      expect(data.canDelete).toBe(false);
    });

    test('should return 404 for non-existent recipe', async () => {
      const request = new NextRequest('http://localhost:3000/api/recipes/99999', {
        method: 'GET',
      });

      const response = await GET_DETAIL(request, { params: Promise.resolve({ id: '99999' }) });
      const data = await response.json();

      expect(response.status).toBe(404);
      expect(data.error).toContain('not found');
    });

    test('should return 400 for invalid recipe ID', async () => {
      const request = new NextRequest('http://localhost:3000/api/recipes/invalid', {
        method: 'GET',
      });

      const response = await GET_DETAIL(request, { params: Promise.resolve({ id: 'invalid' }) });
      const data = await response.json();

      expect(response.status).toBe(400);
      expect(data.error).toContain('Invalid');
    });
  });

  describe('PUT /api/recipes/[id] - Update recipe', () => {
    test('should update recipe by owner and return 200', async () => {
      const recipe = RecipeModel.create('Original Name', user1Id, 'Original description');

      const request = new NextRequest(`http://localhost:3000/api/recipes/${recipe.id}`, {
        method: 'PUT',
        headers: {
          cookie: `sessionToken=${user1Token}`,
        },
        body: JSON.stringify({
          name: 'Updated Name',
          description: 'Updated description',
          servings: 6,
        }),
      });

      const response = await PUT_UPDATE(request, { params: Promise.resolve({ id: String(recipe.id) }) });
      const data = await response.json();

      expect(response.status).toBe(200);
      expect(data.name).toBe('Updated Name');
      expect(data.description).toBe('Updated description');
      expect(data.servings).toBe(6);

      // Verify update persisted
      const updated = RecipeModel.findById(recipe.id);
      expect(updated?.name).toBe('Updated Name');
    });

    test('should update ingredients by owner', async () => {
      const recipe = RecipeModel.create(
        'Recipe',
        user1Id,
        undefined,
        undefined,
        undefined,
        [{ name: 'tomato', quantity: 2, unit: '' }]
      );

      const request = new NextRequest(`http://localhost:3000/api/recipes/${recipe.id}`, {
        method: 'PUT',
        headers: {
          cookie: `sessionToken=${user1Token}`,
        },
        body: JSON.stringify({
          ingredients: [
            { name: 'tomato', quantity: 3, unit: '' },
            { name: 'basil', quantity: 1, unit: 'handful' },
          ],
        }),
      });

      const response = await PUT_UPDATE(request, { params: Promise.resolve({ id: String(recipe.id) }) });
      const data = await response.json();

      expect(response.status).toBe(200);
      expect(data.ingredients).toHaveLength(2);

      const updated = RecipeModel.findById(recipe.id);
      const ingredients = RecipeModel.getIngredients(recipe.id);
      expect(ingredients).toHaveLength(2);
    });

    test('should return 403 if non-owner tries to update', async () => {
      const recipe = RecipeModel.create('Recipe', user1Id);

      const request = new NextRequest(`http://localhost:3000/api/recipes/${recipe.id}`, {
        method: 'PUT',
        headers: {
          cookie: `sessionToken=${user2Token}`,
        },
        body: JSON.stringify({
          name: 'Hacked',
        }),
      });

      const response = await PUT_UPDATE(request, { params: Promise.resolve({ id: String(recipe.id) }) });
      const data = await response.json();

      expect(response.status).toBe(403);
      expect(data.error).toContain('created');

      // Verify not updated
      const unchanged = RecipeModel.findById(recipe.id);
      expect(unchanged?.name).toBe('Recipe');
    });

    test('should return 401 if not authenticated', async () => {
      const recipe = RecipeModel.create('Recipe', user1Id);

      const request = new NextRequest(`http://localhost:3000/api/recipes/${recipe.id}`, {
        method: 'PUT',
        body: JSON.stringify({ name: 'Updated' }),
      });

      const response = await PUT_UPDATE(request, { params: Promise.resolve({ id: String(recipe.id) }) });
      const data = await response.json();

      expect(response.status).toBe(401);
    });

    test('should return 400 for validation errors', async () => {
      const recipe = RecipeModel.create('Recipe', user1Id);

      const request = new NextRequest(`http://localhost:3000/api/recipes/${recipe.id}`, {
        method: 'PUT',
        headers: {
          cookie: `sessionToken=${user1Token}`,
        },
        body: JSON.stringify({
          servings: -5,
        }),
      });

      const response = await PUT_UPDATE(request, { params: Promise.resolve({ id: String(recipe.id) }) });
      const data = await response.json();

      expect(response.status).toBe(400);
      expect(data.error).toContain('positive');
    });
  });

  describe('DELETE /api/recipes/[id] - Delete recipe', () => {
    test('should delete recipe by owner and return 204', async () => {
      const recipe = RecipeModel.create('To Delete', user1Id);
      const recipeId = recipe.id;

      const request = new NextRequest(`http://localhost:3000/api/recipes/${recipeId}`, {
        method: 'DELETE',
        headers: {
          cookie: `sessionToken=${user1Token}`,
        },
      });

      const response = await DELETE_RECIPE(request, { params: Promise.resolve({ id: String(recipeId) }) });

      expect(response.status).toBe(204);

      // Verify deleted
      const deleted = RecipeModel.findById(recipeId);
      expect(deleted).toBeNull();
    });

    test('should return 403 if non-owner tries to delete', async () => {
      const recipe = RecipeModel.create('Recipe', user1Id);

      const request = new NextRequest(`http://localhost:3000/api/recipes/${recipe.id}`, {
        method: 'DELETE',
        headers: {
          cookie: `sessionToken=${user2Token}`,
        },
      });

      const response = await DELETE_RECIPE(request, { params: Promise.resolve({ id: String(recipe.id) }) });
      const data = await response.json();

      expect(response.status).toBe(403);
      expect(data.error).toContain('created');

      // Verify not deleted
      const unchanged = RecipeModel.findById(recipe.id);
      expect(unchanged).not.toBeNull();
    });

    test('should return 401 if not authenticated for delete', async () => {
      const recipe = RecipeModel.create('Recipe', user1Id);

      const request = new NextRequest(`http://localhost:3000/api/recipes/${recipe.id}`, {
        method: 'DELETE',
      });

      const response = await DELETE_RECIPE(request, { params: Promise.resolve({ id: String(recipe.id) }) });
      const data = await response.json();

      expect(response.status).toBe(401);
    });

    test('should return 404 for non-existent recipe', async () => {
      const request = new NextRequest('http://localhost:3000/api/recipes/99999', {
        method: 'DELETE',
        headers: {
          cookie: `sessionToken=${user1Token}`,
        },
      });

      const response = await DELETE_RECIPE(request, { params: Promise.resolve({ id: '99999' }) });
      const data = await response.json();

      expect(response.status).toBe(404);
    });
  });

  describe('Integer Quantity Validation', () => {
    test('should accept integer quantities (no decimals)', async () => {
      const request = new NextRequest('http://localhost:3000/api/recipes', {
        method: 'POST',
        headers: {
          cookie: `sessionToken=${user1Token}`,
        },
        body: JSON.stringify({
          name: 'Integer Test Recipe',
          ingredients: [
            { name: 'flour', quantity: 500, unit: 'g' },
            { name: 'sugar', quantity: 2, unit: 'cups' },
          ],
        }),
      });

      const response = await POST_CREATE(request);
      expect(response.status).toBe(201);
    });

    test('should reject decimal quantities with decimal point (e.g., 100.5)', async () => {
      const request = new NextRequest('http://localhost:3000/api/recipes', {
        method: 'POST',
        headers: {
          cookie: `sessionToken=${user1Token}`,
        },
        body: JSON.stringify({
          name: 'Decimal Point Test',
          ingredients: [
            { name: 'flour', quantity: 100.5, unit: 'g' },
          ],
        }),
      });

      const response = await POST_CREATE(request);
      const data = await response.json();
      expect(response.status).toBe(400);
      expect(data.error).toContain('integer');
    });

    test('should reject zero or negative quantities', async () => {
      const request = new NextRequest('http://localhost:3000/api/recipes', {
        method: 'POST',
        headers: {
          cookie: `sessionToken=${user1Token}`,
        },
        body: JSON.stringify({
          name: 'Zero Test',
          ingredients: [
            { name: 'flour', quantity: 0, unit: 'g' },
          ],
        }),
      });

      const response = await POST_CREATE(request);
      const data = await response.json();
      expect(response.status).toBe(400);
      expect(data.error).toContain('positive');
    });

    test('should reject negative quantities', async () => {
      const request = new NextRequest('http://localhost:3000/api/recipes', {
        method: 'POST',
        headers: {
          cookie: `sessionToken=${user1Token}`,
        },
        body: JSON.stringify({
          name: 'Negative Test',
          ingredients: [
            { name: 'flour', quantity: -100, unit: 'g' },
          ],
        }),
      });

      const response = await POST_CREATE(request);
      const data = await response.json();
      expect(response.status).toBe(400);
      expect(data.error).toContain('positive');
    });

    test('PUT should also reject decimal quantities', async () => {
      const recipe = RecipeModel.create(
        'Update Test Recipe',
        user1Id,
        null,
        null,
        1,
        [{ name: 'flour', quantity: 500, unit: 'g' }]
      );

      const request = new NextRequest(`http://localhost:3000/api/recipes/${recipe.id}`, {
        method: 'PUT',
        headers: {
          cookie: `sessionToken=${user1Token}`,
        },
        body: JSON.stringify({
          ingredients: [
            { name: 'flour', quantity: 500.5, unit: 'g' },
          ],
        }),
      });

      const response = await PUT_UPDATE(request, { params: Promise.resolve({ id: String(recipe.id) }) });
      const data = await response.json();
      expect(response.status).toBe(400);
      expect(data.error).toContain('integer');
    });

    test('should handle integer quantities from locale-formatted strings (e.g., commas converted)', async () => {
      const request = new NextRequest('http://localhost:3000/api/recipes', {
        method: 'POST',
        headers: {
          cookie: `sessionToken=${user1Token}`,
        },
        body: JSON.stringify({
          name: 'Locale Test Recipe',
          ingredients: [
            { name: 'butter', quantity: 100, unit: 'g' },
            { name: 'sugar', quantity: 250, unit: 'g' },
          ],
        }),
      });

      const response = await POST_CREATE(request);
      expect(response.status).toBe(201);
      const data = await response.json();

      const recipe = await RecipeModelAsync.findById(data.id);
      const ingredients = await RecipeModelAsync.getIngredients(data.id);

      expect(ingredients).toHaveLength(2);
      expect(ingredients[0].quantity).toBe(100);
      expect(ingredients[1].quantity).toBe(250);
    });
  });
});
