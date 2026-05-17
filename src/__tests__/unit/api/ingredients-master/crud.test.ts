/** @jest-environment node */
import { GET as GET_LIST, POST as POST_CREATE } from '../../../../app/api/ingredients-master/route';
import { GET as GET_DETAIL, PUT as PUT_UPDATE, DELETE as DELETE_INGREDIENT } from '../../../../app/api/ingredients-master/[id]/route';
import { UserModel } from '../../../../lib/db/models/user';
import { initializeDatabase } from '../../../../lib/db/init';
import { generateToken } from '../../../../lib/auth/tokenRefresh';
import bcryptjs from 'bcryptjs';
import fs from 'fs';
import path from 'path';
import { NextRequest } from 'next/server';

describe('Ingredients Master API', () => {
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

    const existingDb = (global as any).db;
    if (existingDb) {
      try {
        existingDb.close();
      } catch (e) {
        // ignore
      }
    }

    process.env.DATABASE_URL = testDbPath;
    process.env.JWT_SECRET = 'test-secret-key-must-be-32-chars-long';
    (global as any).db = undefined;
    initializeDatabase();

    const passwordHash = await bcryptjs.hash('TestPassword123', 10);
    const user = UserModel.create('user@example.com', passwordHash);
    userId = user.id;
    userToken = generateToken(String(userId), 'user@example.com');
  });

  afterEach(() => {
    try {
      const db = (global as any).db;
      if (db && db.open) {
        db.close();
      }
    } catch (e) {
      // ignore
    }
    (global as any).db = undefined;

    // Clean up database file
    try {
      if (fs.existsSync(testDbPath)) {
        fs.unlinkSync(testDbPath);
      }
      // Also try to clean up WAL files
      const walPath = `${testDbPath}-wal`;
      const shmPath = `${testDbPath}-shm`;
      if (fs.existsSync(walPath)) {
        fs.unlinkSync(walPath);
      }
      if (fs.existsSync(shmPath)) {
        fs.unlinkSync(shmPath);
      }
    } catch (e) {
      // Ignore cleanup errors
    }

    delete process.env.DATABASE_URL;
  });

  describe('POST /api/ingredients-master - Create ingredient', () => {
    test('should create ingredient with valid data and return 201', async () => {
      const request = new NextRequest('http://localhost:3000/api/ingredients-master', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          cookie: `sessionToken=${userToken}`,
        },
        body: JSON.stringify({
          name: 'Spinach',
          category: 'Vegetables',
          kcal: 23,
          protein: 2.7,
          iron: 2.7,
          magnesium: 79,
        }),
      });

      const response = await POST_CREATE(request);
      const data = await response.json();

      expect(response.status).toBe(201);
      expect(data.id).toBeDefined();
      expect(data.name).toBe('Spinach');
      expect(data.category).toBe('Vegetables');
      expect(data.kcal).toBe(23);
      expect(data.protein).toBe(2.7);
      expect(data.iron).toBe(2.7);
    });

    test('should reject duplicate ingredient names with 409', async () => {
      // Create first ingredient
      const request1 = new NextRequest('http://localhost:3000/api/ingredients-master', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          cookie: `sessionToken=${userToken}`,
        },
        body: JSON.stringify({ name: 'Carrot' }),
      });

      await POST_CREATE(request1);

      // Try to create duplicate
      const request2 = new NextRequest('http://localhost:3000/api/ingredients-master', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          cookie: `sessionToken=${userToken}`,
        },
        body: JSON.stringify({ name: 'Carrot' }),
      });

      const response = await POST_CREATE(request2);
      expect(response.status).toBe(409);
    });

    test('should return 401 when not authenticated', async () => {
      const request = new NextRequest('http://localhost:3000/api/ingredients-master', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ name: 'Test' }),
      });

      const response = await POST_CREATE(request);
      expect(response.status).toBe(401);
    });

    test('should accept and return salt field when provided', async () => {
      const request = new NextRequest('http://localhost:3000/api/ingredients-master', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Cookie: `auth_token=${userToken}`,
        },
        body: JSON.stringify({
          name: 'Meersalz',
          salt: 390.0,
          sodium: 153.0,
        }),
      });

      const response = await POST_CREATE(request);
      const data = await response.json();

      expect(response.status).toBe(201);
      expect(data.salt).toBe(390);
    });

    test('should reject negative salt value', async () => {
      const request = new NextRequest('http://localhost:3000/api/ingredients-master', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Cookie: `auth_token=${userToken}`,
        },
        body: JSON.stringify({
          name: 'Bad Salt',
          salt: -5,
        }),
      });

      const response = await POST_CREATE(request);
      expect(response.status).toBe(400);
    });

    test('should use default values for optional fields', async () => {
      const request = new NextRequest('http://localhost:3000/api/ingredients-master', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          cookie: `sessionToken=${userToken}`,
        },
        body: JSON.stringify({ name: 'Rice' }),
      });

      const response = await POST_CREATE(request);
      const data = await response.json();

      expect(response.status).toBe(201);
      expect(data.base_unit).toBe('g');
      expect(data.base_size).toBe(100);
    });
  });

  describe('GET /api/ingredients-master - List ingredients', () => {
    test('should return list of ingredients with 200', async () => {
      // Create test ingredients
      for (const name of ['Apple', 'Banana', 'Cherry']) {
        const request = new NextRequest('http://localhost:3000/api/ingredients-master', {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
            cookie: `sessionToken=${userToken}`,
          },
          body: JSON.stringify({ name }),
        });
        await POST_CREATE(request);
      }

      const request = new NextRequest('http://localhost:3000/api/ingredients-master', {
        method: 'GET',
      });

      const response = await GET_LIST(request);
      const data = await response.json();

      expect(response.status).toBe(200);
      expect(data.ingredients).toHaveLength(3);
      expect(data.total).toBe(3);
      expect(data.ingredients[0].name).toMatch(/^(Apple|Banana|Cherry)$/);
    });

    test('should support pagination', async () => {
      for (let i = 0; i < 25; i++) {
        const request = new NextRequest('http://localhost:3000/api/ingredients-master', {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
            cookie: `sessionToken=${userToken}`,
          },
          body: JSON.stringify({ name: `Ingredient${String(i).padStart(2, '0')}` }),
        });
        await POST_CREATE(request);
      }

      const request = new NextRequest('http://localhost:3000/api/ingredients-master?page=2&pageSize=10');
      const response = await GET_LIST(request);
      const data = await response.json();

      expect(response.status).toBe(200);
      expect(data.total).toBe(25);
      expect(data.ingredients).toHaveLength(10);
      expect(data.page).toBe(2);
      expect(data.pageSize).toBe(10);
    });

    test('should support search parameter', async () => {
      const ingredients = ['Apple', 'Apricot', 'Blueberry'];
      for (const name of ingredients) {
        const request = new NextRequest('http://localhost:3000/api/ingredients-master', {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
            cookie: `sessionToken=${userToken}`,
          },
          body: JSON.stringify({ name }),
        });
        await POST_CREATE(request);
      }

      const request = new NextRequest('http://localhost:3000/api/ingredients-master?search=Ap');
      const response = await GET_LIST(request);
      const data = await response.json();

      expect(response.status).toBe(200);
      expect(data.total).toBe(2);
      expect(data.ingredients).toHaveLength(2);
    });
  });

  describe('GET /api/ingredients-master/:id - Get ingredient detail', () => {
    test('should return ingredient detail with 200', async () => {
      // Create ingredient
      const createRequest = new NextRequest('http://localhost:3000/api/ingredients-master', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          cookie: `sessionToken=${userToken}`,
        },
        body: JSON.stringify({ name: 'Broccoli', protein: 3.7, calcium: 89 }),
      });

      const createResponse = await POST_CREATE(createRequest);
      const created = await createResponse.json();

      // Get detail
      const request = new NextRequest(
        `http://localhost:3000/api/ingredients-master/${created.id}`
      );
      const response = await GET_DETAIL(request, { params: { id: created.id } });
      const data = await response.json();

      expect(response.status).toBe(200);
      expect(data.id).toBe(created.id);
      expect(data.name).toBe('Broccoli');
      expect(data.protein).toBe(3.7);
      expect(data.calcium).toBe(89);
    });

    test('should return 404 for non-existent ingredient', async () => {
      const request = new NextRequest('http://localhost:3000/api/ingredients-master/9999');
      const response = await GET_DETAIL(request, { params: { id: 9999 } });

      expect(response.status).toBe(404);
    });
  });

  describe('PUT /api/ingredients-master/:id - Update ingredient', () => {
    test('should update ingredient with valid data and return 200', async () => {
      // Create ingredient
      const createRequest = new NextRequest('http://localhost:3000/api/ingredients-master', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          cookie: `sessionToken=${userToken}`,
        },
        body: JSON.stringify({ name: 'Chicken', protein: 26, iron: 1.3 }),
      });

      const createResponse = await POST_CREATE(createRequest);
      const created = await createResponse.json();

      // Update ingredient
      const updateRequest = new NextRequest(
        `http://localhost:3000/api/ingredients-master/${created.id}`,
        {
          method: 'PUT',
          headers: {
            'Content-Type': 'application/json',
            cookie: `sessionToken=${userToken}`,
          },
          body: JSON.stringify({ protein: 31, iron: 1.8 }),
        }
      );

      const response = await PUT_UPDATE(updateRequest, { params: { id: created.id } });
      const data = await response.json();

      expect(response.status).toBe(200);
      expect(data.id).toBe(created.id);
      expect(data.name).toBe('Chicken');
      expect(data.protein).toBe(31);
      expect(data.iron).toBe(1.8);
    });

    test('should require authentication', async () => {
      const request = new NextRequest('http://localhost:3000/api/ingredients-master/1', {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ protein: 30 }),
      });

      const response = await PUT_UPDATE(request, { params: { id: 1 } });
      expect(response.status).toBe(401);
    });

    test('should return 404 for non-existent ingredient', async () => {
      const request = new NextRequest('http://localhost:3000/api/ingredients-master/9999', {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
          cookie: `sessionToken=${userToken}`,
        },
        body: JSON.stringify({ protein: 30 }),
      });

      const response = await PUT_UPDATE(request, { params: { id: 9999 } });
      expect(response.status).toBe(404);
    });
  });

  describe('DELETE /api/ingredients-master/:id - Delete ingredient', () => {
    test('should delete ingredient and return 204', async () => {
      // Create ingredient
      const createRequest = new NextRequest('http://localhost:3000/api/ingredients-master', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          cookie: `sessionToken=${userToken}`,
        },
        body: JSON.stringify({ name: 'Garlic' }),
      });

      const createResponse = await POST_CREATE(createRequest);
      const created = await createResponse.json();

      // Delete ingredient
      const deleteRequest = new NextRequest(
        `http://localhost:3000/api/ingredients-master/${created.id}`,
        {
          method: 'DELETE',
          headers: {
            cookie: `sessionToken=${userToken}`,
          },
        }
      );

      const response = await DELETE_INGREDIENT(deleteRequest, { params: { id: created.id } });
      expect(response.status).toBe(204);

      // Verify deleted by trying to get it
      const getRequest = new NextRequest(
        `http://localhost:3000/api/ingredients-master/${created.id}`
      );
      const getResponse = await GET_DETAIL(getRequest, { params: { id: created.id } });
      expect(getResponse.status).toBe(404);
    });

    test('should require authentication', async () => {
      const request = new NextRequest('http://localhost:3000/api/ingredients-master/1', {
        method: 'DELETE',
      });

      const response = await DELETE_INGREDIENT(request, { params: { id: 1 } });
      expect(response.status).toBe(401);
    });

    test('should return 404 for non-existent ingredient', async () => {
      const request = new NextRequest('http://localhost:3000/api/ingredients-master/9999', {
        method: 'DELETE',
        headers: {
          cookie: `sessionToken=${userToken}`,
        },
      });

      const response = await DELETE_INGREDIENT(request, { params: { id: 9999 } });
      expect(response.status).toBe(404);
    });
  });
});
