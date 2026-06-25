/** @jest-environment node */
import { GET } from '../../../app/api/nutrition/ingredients/route';
import { initializeDatabase, closeDatabase, getSqliteDb } from '../../../lib/db/init';
import { NextRequest } from 'next/server';
import fs from 'fs';
import path from 'path';

describe('GET /api/nutrition/ingredients', () => {
  let testDbPath: string;
  let testCounter = 0;

  beforeEach(async () => {
    testCounter++;
    testDbPath = path.join(__dirname, `../../../../.data/test-nutrition-ingredients-${testCounter}.db`);

    process.env.DATABASE_URL = testDbPath;
    process.env.JWT_SECRET = 'test-secret-key-must-be-32-chars-long';
    await initializeDatabase();
  });

  afterEach(() => {
    closeDatabase();

    try {
      if (fs.existsSync(testDbPath)) {
        fs.unlinkSync(testDbPath);
      }
      const walPath = `${testDbPath}-wal`;
      const shmPath = `${testDbPath}-shm`;
      if (fs.existsSync(walPath)) fs.unlinkSync(walPath);
      if (fs.existsSync(shmPath)) fs.unlinkSync(shmPath);
    } catch (e) {
      // Ignore cleanup errors
    }

    delete process.env.DATABASE_URL;
  });

  // TC-008-01, TC-012-03
  it('returns 200 with ingredients ordered by category, then name', async () => {
    const db = getSqliteDb();
    const insert = db.prepare(
      'INSERT INTO ingredients_master (name, category) VALUES (?, ?)'
    );
    insert.run('Banane', 'Obst');
    insert.run('Apfel', 'Obst');
    insert.run('Reis', 'Getreide');

    const request = new NextRequest('http://localhost:3000/api/nutrition/ingredients');
    const response = await GET(request);
    const body = await response.json();

    expect(response.status).toBe(200);
    expect(body.total).toBe(3);
    expect(body.data.map((i: { name: string }) => i.name)).toEqual(['Reis', 'Apfel', 'Banane']);
  });

  // TC-008-02, TC-012-04
  it('returns 200 with an empty list when no ingredients exist', async () => {
    const request = new NextRequest('http://localhost:3000/api/nutrition/ingredients');
    const response = await GET(request);
    const body = await response.json();

    expect(response.status).toBe(200);
    expect(body.total).toBe(0);
    expect(body.data).toEqual([]);
  });
});
