/** @jest-environment node */
import { POST } from '@/app/api/ingredients-master/route';
import { UserModel } from '@/lib/db/models/user';
import { initializeDatabase } from '@/lib/db/init';
import { generateToken } from '@/lib/auth/tokenRefresh';
import bcryptjs from 'bcryptjs';
import { NextRequest } from 'next/server';
import fs from 'fs';
import path from 'path';

describe('POST /api/ingredients-master - Create Ingredient', () => {
  let testDbPath: string;
  let userId: number;
  let userToken: string;

  beforeEach(async () => {
    testDbPath = path.join(__dirname, '../../../../../.data/test-create-ingredient.db');

    // Close existing database instance if any
    const existingDb = (global as any).db;
    if (existingDb) {
      try {
        existingDb.close();
      } catch (e) {
        // ignore if already closed
      }
    }

    // Clean up old test database if it exists
    if (fs.existsSync(testDbPath)) {
      fs.unlinkSync(testDbPath);
    }

    process.env.DATABASE_URL = testDbPath;
    process.env.JWT_SECRET = 'test-secret-key-must-be-32-chars-long';
    // Clear global db instance
    (global as any).db = undefined;
    await initializeDatabase();

    // Create test user
    const passwordHash = await bcryptjs.hash('TestPassword123', 10);
    const user = await UserModel.create(`test-${Date.now()}@example.com`, passwordHash);
    userId = user.id;
    userToken = generateToken(String(userId), `test-${Date.now()}@example.com`);
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

  test('should create ingredient and return with id and name fields', async () => {
    const request = new NextRequest('http://localhost:3000/api/ingredients-master', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Cookie': `sessionToken=${userToken}`,
      },
      body: JSON.stringify({ name: 'Tomato' }),
    });

    const response = await POST(request);
    expect(response.status).toBe(201);

    const data = await response.json();
    console.log('Response data:', data);

    expect(data).toBeDefined();
    expect(data.id).toBeDefined();
    expect(typeof data.id).toBe('number');
    expect(data.id).toBeGreaterThan(0);
    expect(data.name).toBe('Tomato');
    expect(data.created_at).toBeDefined();
  });

  test('should create ingredient with all nutrient fields', async () => {
    const request = new NextRequest('http://localhost:3000/api/ingredients-master', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Cookie': `sessionToken=${userToken}`,
      },
      body: JSON.stringify({
        name: 'Spinach',
        category: 'Vegetables',
        kcal: 23,
        protein: 2.7,
      }),
    });

    const response = await POST(request);
    const data = await response.json();

    expect(response.status).toBe(201);
    expect(data.id).toBeGreaterThan(0);
    expect(data.name).toBe('Spinach');
    expect(data.category).toBe('Vegetables');
    expect(data.kcal).toBe(23);
    expect(data.protein).toBe(2.7);
  });

  test('should reject duplicate ingredient names', async () => {
    const ingredientName = 'Apple';

    // Create first ingredient
    const request1 = new NextRequest('http://localhost:3000/api/ingredients-master', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Cookie': `sessionToken=${userToken}`,
      },
      body: JSON.stringify({ name: ingredientName }),
    });

    const response1 = await POST(request1);
    expect(response1.status).toBe(201);

    // Try to create duplicate
    const request2 = new NextRequest('http://localhost:3000/api/ingredients-master', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Cookie': `sessionToken=${userToken}`,
      },
      body: JSON.stringify({ name: ingredientName }),
    });

    const response2 = await POST(request2);
    expect(response2.status).toBe(409);
    const data = await response2.json();
    expect(data.error).toContain('already exists');
  });
});
