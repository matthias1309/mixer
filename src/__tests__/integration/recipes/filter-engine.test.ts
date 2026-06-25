/** @jest-environment node */
import { GET as GET_RECIPES } from '@/app/api/recipes/route';
import { RecipeModel } from '@/lib/db/models/recipe';
import { UserModel } from '@/lib/db/models/user';
import { initializeDatabase, closeDatabase } from '@/lib/db/init';
import { generateToken } from '@/lib/auth/tokenRefresh';
import bcryptjs from 'bcryptjs';
import fs from 'fs';
import path from 'path';
import { NextRequest } from 'next/server';

describe('GET /api/recipes — REWE-style filter & sort engine', () => {
  let testDbPath: string;
  let testCounter = 0;
  let userId: number;
  let userToken: string;

  beforeEach(async () => {
    testCounter++;
    testDbPath = path.join(__dirname, `../../../../../.data/test-filter-engine-${testCounter}.db`);

    process.env.DATABASE_URL = testDbPath;
    process.env.JWT_SECRET = 'test-secret-key-must-be-32-chars-long';
    await initializeDatabase();

    const passwordHash = await bcryptjs.hash('TestPassword123', 10);
    const user = await UserModel.create('filter-engine@example.com', passwordHash);
    userId = user.id;
    userToken = generateToken(String(userId), 'filter-engine@example.com');

    RecipeModel.create(
      'Schnelle Vegane Pasta',
      userId,
      undefined,
      undefined,
      1,
      [{ name: 'Nudeln', quantity: 200, unit: 'g' }],
      null,
      {
        difficulty: 'easy',
        totalTimeMinutes: 15,
        mealType: 'Hauptspeise',
        tags: ['Vegan', 'Nudeln/Pasta'],
      }
    );

    RecipeModel.create(
      'Aufwendiger Festtagsbraten',
      userId,
      undefined,
      undefined,
      1,
      [{ name: 'Rinderbraten', quantity: 1000, unit: 'g' }],
      null,
      {
        difficulty: 'hard',
        totalTimeMinutes: 180,
        mealType: 'Hauptspeise',
        tags: ['Fleisch', 'Geburtstag'],
      }
    );

    RecipeModel.create(
      'Veganer Kuchen',
      userId,
      undefined,
      undefined,
      1,
      [{ name: 'Mehl', quantity: 300, unit: 'g' }],
      null,
      {
        difficulty: 'medium',
        totalTimeMinutes: 60,
        mealType: 'Dessert',
        tags: ['Vegan', 'Kuchen'],
      }
    );
  });

  afterEach(() => {
    closeDatabase();
    try {
      if (fs.existsSync(testDbPath)) fs.unlinkSync(testDbPath);
      const walPath = `${testDbPath}-wal`;
      const shmPath = `${testDbPath}-shm`;
      if (fs.existsSync(walPath)) fs.unlinkSync(walPath);
      if (fs.existsSync(shmPath)) fs.unlinkSync(shmPath);
    } catch {
      // ignore
    }
    delete process.env.DATABASE_URL;
    delete process.env.JWT_SECRET;
  });

  function get(query: string) {
    return GET_RECIPES(
      new NextRequest(`http://localhost:3000/api/recipes?${query}`, {
        headers: { cookie: `sessionToken=${userToken}` },
      })
    );
  }

  // TC-017-01 — AC-017-01
  it('filters by difficulty', async () => {
    const response = await get('difficulty=hard');
    const data = await response.json();

    expect(data.recipes.map((r: any) => r.name)).toEqual(['Aufwendiger Festtagsbraten']);
  });

  // TC-017-01 — AC-017-01
  it('filters by maxTime', async () => {
    const response = await get('maxTime=20');
    const data = await response.json();

    expect(data.recipes.map((r: any) => r.name)).toEqual(['Schnelle Vegane Pasta']);
  });

  // TC-017-01 — AC-017-01
  it('filters by mealType', async () => {
    const response = await get('mealType=Dessert');
    const data = await response.json();

    expect(data.recipes.map((r: any) => r.name)).toEqual(['Veganer Kuchen']);
  });

  // TC-017-01 — AC-017-01
  it('filters by a single tag', async () => {
    const response = await get('tags=Fleisch');
    const data = await response.json();

    expect(data.recipes.map((r: any) => r.name)).toEqual(['Aufwendiger Festtagsbraten']);
  });

  // TC-017-02 — AC-017-02
  it('returns only recipes carrying every requested tag', async () => {
    const response = await get('tags=Vegan,Kuchen');
    const data = await response.json();

    expect(data.recipes.map((r: any) => r.name)).toEqual(['Veganer Kuchen']);
  });

  // TC-017-03 — AC-017-03
  it('applies phase, ingredients, and metadata filters together', async () => {
    const response = await get('phase=menstruation&ingredients=nudeln&difficulty=easy');
    const data = await response.json();

    expect(data.recipes.map((r: any) => r.name)).toEqual(['Schnelle Vegane Pasta']);
  });

  // TC-017-04 — AC-017-04
  it('ignores an unknown difficulty and returns 200', async () => {
    const response = await get('difficulty=unmoeglich');
    const data = await response.json();

    expect(response.status).toBe(200);
    expect(data.recipes).toHaveLength(3);
  });
});
