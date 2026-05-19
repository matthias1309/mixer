/** @jest-environment node */
import { POST } from '../../../../../app/api/recipes/[id]/ingredients/route';
import { UserModel } from '../../../../../lib/db/models/user';
import { RecipeModel } from '../../../../../lib/db/models/recipe';
import { initializeDatabase, getDb } from '../../../../../lib/db/init';
import { generateToken } from '../../../../../lib/auth/tokenRefresh';
import { UNIT_SEEDS, CONVERSION_SEEDS, DENSITY_SEEDS } from '../../../../../db/seeds/units';
import bcryptjs from 'bcryptjs';
import Database from 'better-sqlite3';
import { mkdtempSync, rmSync, existsSync } from 'fs';
import { tmpdir } from 'os';
import { join } from 'path';
import { NextRequest } from 'next/server';

describe('POST /api/recipes/[id]/ingredients - Unit Normalization', () => {
  let tempDir: string;
  let testDbPath: string;
  let userId: number;
  let userToken: string;
  let recipeId: number;

  beforeEach(async () => {
    tempDir = mkdtempSync(join(tmpdir(), 'test-ingredient-norm-'));
    testDbPath = join(tempDir, 'test.db');

    const existingDb = (global as any).db;
    if (existingDb) {
      try {
        existingDb.close();
      } catch (e) {
        // ignore
      }
    }

    process.env.DATABASE_URL = `file:${testDbPath}`;
    process.env.JWT_SECRET = 'test-secret-key-must-be-32-chars-long';
    (global as any).db = undefined;
    await initializeDatabase();

    // Database is already seeded with units, conversions, and densities
    // during initializeDatabase() call above, so we can skip manual seeding
    const db = getDb() as Database.Database;

    // Create test user
    const passwordHash = await bcryptjs.hash('TestPassword123', 10);
    const user = await UserModel.create('test@example.com', passwordHash);
    userId = user.id;
    userToken = generateToken(String(userId), 'test@example.com');

    // Create test recipe
    const recipe = RecipeModel.create('Test Recipe', userId, 'A test recipe');
    recipeId = recipe.id;
  });

  afterEach(() => {
    try {
      const db = (global as any).db;
      if (db) {
        db.close();
      }
    } catch (e) {
      // ignore
    }
    (global as any).db = undefined;
    if (existsSync(tempDir)) {
      rmSync(tempDir, { recursive: true, force: true });
    }
    delete process.env.DATABASE_URL;
  });

  function makeRequest(recipeId: number, body: object, token?: string): NextRequest {
    return new NextRequest(`http://localhost:3000/api/recipes/${recipeId}/ingredients`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        ...(token ? { cookie: `sessionToken=${token}` } : {}),
      },
      body: JSON.stringify(body),
    });
  }

  describe('Volume unit normalization', () => {
    it('creates ingredient with ml unit - normalized_unit is ml, normalized_quantity equals quantity', async () => {
      const request = makeRequest(recipeId, { name: 'water', quantity: 250, unit: 'ml' }, userToken);
      const response = await POST(request, { params: Promise.resolve({ id: String(recipeId) }) });
      const data = await response.json();

      expect(response.status).toBe(201);
      expect(data.normalized_unit).toBe('ml');
      expect(data.normalized_quantity).toBe(250);
    });

    it('creates ingredient with l unit - normalized to ml', async () => {
      const request = makeRequest(recipeId, { name: 'water', quantity: 1, unit: 'l' }, userToken);
      const response = await POST(request, { params: Promise.resolve({ id: String(recipeId) }) });
      const data = await response.json();

      expect(response.status).toBe(201);
      expect(data.normalized_unit).toBe('ml');
      expect(data.normalized_quantity).toBeCloseTo(1000, 0);
    });

    it('creates ingredient with TL unit - normalized to ml (5ml per TL)', async () => {
      const request = makeRequest(recipeId, { name: 'oil', quantity: 2, unit: 'TL' }, userToken);
      const response = await POST(request, { params: Promise.resolve({ id: String(recipeId) }) });
      const data = await response.json();

      expect(response.status).toBe(201);
      expect(data.normalized_unit).toBe('ml');
      expect(data.normalized_quantity).toBeCloseTo(10, 0);
    });
  });

  describe('Weight unit normalization', () => {
    it('creates ingredient with g unit - normalized_unit is g (already base)', async () => {
      const request = makeRequest(recipeId, { name: 'flour', quantity: 500, unit: 'g' }, userToken);
      const response = await POST(request, { params: Promise.resolve({ id: String(recipeId) }) });
      const data = await response.json();

      expect(response.status).toBe(201);
      expect(data.normalized_unit).toBe('g');
      expect(data.normalized_quantity).toBe(500);
    });

    it('creates ingredient with kg unit - normalized to g', async () => {
      const request = makeRequest(recipeId, { name: 'potatoes', quantity: 2, unit: 'kg' }, userToken);
      const response = await POST(request, { params: Promise.resolve({ id: String(recipeId) }) });
      const data = await response.json();

      expect(response.status).toBe(201);
      expect(data.normalized_unit).toBe('g');
      expect(data.normalized_quantity).toBeCloseTo(2000, 0);
    });
  });

  describe('Unknown unit rejection', () => {
    it('returns 400 for unknown unit', async () => {
      const request = makeRequest(recipeId, { name: 'flour', quantity: 100, unit: 'cups' }, userToken);
      const response = await POST(request, { params: Promise.resolve({ id: String(recipeId) }) });
      const data = await response.json();

      expect(response.status).toBe(400);
      expect(data.error).toBe('Unknown unit: cups');
    });

    it('returns 400 for completely invalid unit string', async () => {
      const request = makeRequest(recipeId, { name: 'sugar', quantity: 1, unit: 'xyz' }, userToken);
      const response = await POST(request, { params: Promise.resolve({ id: String(recipeId) }) });
      const data = await response.json();

      expect(response.status).toBe(400);
      expect(data.error).toBe('Unknown unit: xyz');
    });
  });

  describe('Non-normalizable units (Stück, Prise)', () => {
    it('creates ingredient with Stück unit - succeeds with null normalized values', async () => {
      const request = makeRequest(recipeId, { name: 'tomato', quantity: 3, unit: 'Stück' }, userToken);
      const response = await POST(request, { params: Promise.resolve({ id: String(recipeId) }) });
      const data = await response.json();

      expect(response.status).toBe(201);
      expect(data.name).toBe('tomato');
      expect(data.quantity).toBe(3);
      expect(data.unit).toBe('Stück');
      expect(data.normalized_quantity).toBeNull();
      expect(data.normalized_unit).toBeNull();
    });

    it('creates ingredient with Prise unit - succeeds with null normalized values', async () => {
      const request = makeRequest(recipeId, { name: 'salt', quantity: 1, unit: 'Prise' }, userToken);
      const response = await POST(request, { params: Promise.resolve({ id: String(recipeId) }) });
      const data = await response.json();

      expect(response.status).toBe(201);
      expect(data.unit).toBe('Prise');
      expect(data.normalized_quantity).toBeNull();
      expect(data.normalized_unit).toBeNull();
    });
  });

  describe('Backward compatibility', () => {
    it('creates ingredient without unit - succeeds with null normalized values', async () => {
      const request = makeRequest(recipeId, { name: 'eggs', quantity: 3 }, userToken);
      const response = await POST(request, { params: Promise.resolve({ id: String(recipeId) }) });
      const data = await response.json();

      expect(response.status).toBe(201);
      expect(data.name).toBe('eggs');
      expect(data.quantity).toBe(3);
      expect(data.unit).toBeNull();
      expect(data.normalized_quantity).toBeNull();
      expect(data.normalized_unit).toBeNull();
    });

    it('creates ingredient with empty string unit - treated as no unit', async () => {
      const request = makeRequest(recipeId, { name: 'eggs', quantity: 2, unit: '' }, userToken);
      const response = await POST(request, { params: Promise.resolve({ id: String(recipeId) }) });
      const data = await response.json();

      expect(response.status).toBe(201);
      expect(data.unit).toBeNull();
      expect(data.normalized_quantity).toBeNull();
      expect(data.normalized_unit).toBeNull();
    });

    it('creates ingredient with g unit - stores both original and normalized values', async () => {
      const request = makeRequest(recipeId, { name: 'butter', quantity: 100, unit: 'g' }, userToken);
      const response = await POST(request, { params: Promise.resolve({ id: String(recipeId) }) });
      const data = await response.json();

      expect(response.status).toBe(201);
      expect(data.id).toBeDefined();
      expect(data.recipe_id).toBe(recipeId);
      expect(data.name).toBe('butter');
      expect(data.quantity).toBe(100);
      expect(data.unit).toBe('g');
      expect(data.normalized_quantity).toBe(100);
      expect(data.normalized_unit).toBe('g');
    });
  });

  describe('Authentication and authorization', () => {
    it('returns 401 if not authenticated', async () => {
      const request = makeRequest(recipeId, { name: 'flour', quantity: 100, unit: 'g' });
      const response = await POST(request, { params: Promise.resolve({ id: String(recipeId) }) });
      const data = await response.json();

      expect(response.status).toBe(401);
      expect(data.error).toContain('logged in');
    });

    it('returns 404 for non-existent recipe', async () => {
      const request = makeRequest(99999, { name: 'flour', quantity: 100, unit: 'g' }, userToken);
      const response = await POST(request, { params: Promise.resolve({ id: '99999' }) });
      const data = await response.json();

      expect(response.status).toBe(404);
    });

    it('returns 400 for missing ingredient name', async () => {
      const request = makeRequest(recipeId, { quantity: 100, unit: 'g' }, userToken);
      const response = await POST(request, { params: Promise.resolve({ id: String(recipeId) }) });
      const data = await response.json();

      expect(response.status).toBe(400);
      expect(data.error).toContain('name');
    });

    it('returns 400 for missing quantity', async () => {
      const request = makeRequest(recipeId, { name: 'flour', unit: 'g' }, userToken);
      const response = await POST(request, { params: Promise.resolve({ id: String(recipeId) }) });
      const data = await response.json();

      expect(response.status).toBe(400);
      expect(data.error).toContain('quantity');
    });
  });
});
