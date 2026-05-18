/** @jest-environment node */
import { POST as POST_CYCLE, GET as GET_CYCLE } from '@/app/api/users/cycle/route';
import { UserModel } from '@/lib/db/models/user';
import { initializeDatabase } from '@/lib/db/init';
import { generateToken } from '@/lib/auth/tokenRefresh';
import bcryptjs from 'bcryptjs';
import fs from 'fs';
import path from 'path';
import { NextRequest } from 'next/server';

describe('Cycle API Endpoints', () => {
  let testDbPath: string;
  let testCounter = 0;
  let userId: number;
  let userToken: string;

  beforeEach(async () => {
    testCounter++;
    testDbPath = path.join(__dirname, `../../../../../.data/test-cycle-${testCounter}.db`);

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
    await initializeDatabase();

    const passwordHash = await bcryptjs.hash('TestPassword123', 10);
    const user = await await UserModel.create('cycle@example.com', passwordHash);
    userId = user.id;
    userToken = generateToken(String(userId), 'cycle@example.com');
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
  });

  describe('POST /api/users/cycle', () => {
    test('should save cycle data and return 200', async () => {
      const request = new NextRequest('http://localhost:3000/api/users/cycle', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          cookie: `sessionToken=${userToken}`,
        },
        body: JSON.stringify({
          last_menstruation_date: '2026-05-01',
          cycle_length_days: 28,
        }),
      });

      const response = await POST_CYCLE(request);
      const data = await response.json();

      expect(response.status).toBe(200);
      expect(data.success).toBe(true);
      expect(data.data).toBeDefined();
    });

    test('should require authentication', async () => {
      const request = new NextRequest('http://localhost:3000/api/users/cycle', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          last_menstruation_date: '2026-05-01',
          cycle_length_days: 28,
        }),
      });

      const response = await POST_CYCLE(request);
      expect(response.status).toBe(401);
    });

    test('should validate cycle_length_days (21-35)', async () => {
      const request = new NextRequest('http://localhost:3000/api/users/cycle', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          cookie: `sessionToken=${userToken}`,
        },
        body: JSON.stringify({
          last_menstruation_date: '2026-05-01',
          cycle_length_days: 15, // Too short
        }),
      });

      const response = await POST_CYCLE(request);
      expect(response.status).toBe(400);
    });
  });

  describe('GET /api/users/cycle', () => {
    test('should return current phase after saving cycle', async () => {
      // Save cycle data first
      const postRequest = new NextRequest('http://localhost:3000/api/users/cycle', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          cookie: `sessionToken=${userToken}`,
        },
        body: JSON.stringify({
          last_menstruation_date: '2026-05-01',
          cycle_length_days: 28,
        }),
      });

      await POST_CYCLE(postRequest);

      // Get cycle
      const getRequest = new NextRequest('http://localhost:3000/api/users/cycle', {
        method: 'GET',
        headers: {
          cookie: `sessionToken=${userToken}`,
        },
      });

      const response = await GET_CYCLE(getRequest);
      const data = await response.json();

      expect(response.status).toBe(200);
      expect(data.data.current_phase).toBeDefined();
      expect(data.data.current_phase.phase).toBeDefined();
      expect(['Menstruation', 'Follicular', 'Ovulation', 'Luteal']).toContain(data.data.current_phase.phase.name);
    });

    test('should require authentication', async () => {
      const request = new NextRequest('http://localhost:3000/api/users/cycle', {
        method: 'GET',
      });

      const response = await GET_CYCLE(request);
      expect(response.status).toBe(401);
    });

    test('should return success:false if no cycle data', async () => {
      const request = new NextRequest('http://localhost:3000/api/users/cycle', {
        method: 'GET',
        headers: {
          cookie: `sessionToken=${userToken}`,
        },
      });

      const response = await GET_CYCLE(request);
      const data = await response.json();

      expect(response.status).toBe(200);
      expect(data.success).toBe(false);
      expect(data.data).toBeNull();
    });
  });
});
