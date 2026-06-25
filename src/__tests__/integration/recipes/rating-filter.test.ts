/** @jest-environment node */
import { GET as GET_RECIPES } from '@/app/api/recipes/route';
import { RecipeModel } from '@/lib/db/models/recipe';
import { UserModel } from '@/lib/db/models/user';
import { upsertRating } from '@/lib/db/models/rating';
import { initializeDatabase, closeDatabase, getDatabase } from '@/lib/db/init';
import { generateToken } from '@/lib/auth/tokenRefresh';
import bcryptjs from 'bcryptjs';
import fs from 'fs';
import path from 'path';
import { NextRequest } from 'next/server';

describe('GET /api/recipes — minRating & sort=rating', () => {
  let testDbPath: string;
  let testCounter = 0;
  let userId: number;
  let userToken: string;
  let lowRatedId: number;
  let highRatedId: number;
  let unratedId: number;

  beforeEach(async () => {
    testCounter++;
    testDbPath = path.join(__dirname, `../../../../../.data/test-rating-filter-${testCounter}.db`);

    process.env.DATABASE_URL = testDbPath;
    process.env.JWT_SECRET = 'test-secret-key-must-be-32-chars-long';
    await initializeDatabase();

    const passwordHash = await bcryptjs.hash('TestPassword123', 10);
    const user = await UserModel.create('rating-filter@example.com', passwordHash);
    userId = user.id;
    userToken = generateToken(String(userId), 'rating-filter@example.com');

    const lowRated = RecipeModel.create('Low Rated Recipe', userId);
    const highRated = RecipeModel.create('High Rated Recipe', userId);
    const unrated = RecipeModel.create('Unrated Recipe', userId);
    lowRatedId = lowRated.id;
    highRatedId = highRated.id;
    unratedId = unrated.id;

    const db = getDatabase();
    upsertRating(db, userId, lowRatedId, 2);
    upsertRating(db, userId, highRatedId, 5);
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

  // TC-018-07 — AC-018-09
  it('returns only recipes with average >= minRating', async () => {
    const response = await get('minRating=4');
    const data = await response.json();

    expect(data.recipes.map((r: any) => r.id)).toEqual([highRatedId]);
  });

  // TC-018-07 — AC-018-09
  it('excludes unrated recipes when minRating > 0', async () => {
    const response = await get('minRating=1');
    const data = await response.json();

    const ids = data.recipes.map((r: any) => r.id);
    expect(ids).not.toContain(unratedId);
    expect(ids.sort()).toEqual([lowRatedId, highRatedId].sort());
  });

  // TC-018-08 — AC-018-10
  it('orders recipes by average rating descending', async () => {
    const response = await get('sort=rating');
    const data = await response.json();

    expect(data.recipes.map((r: any) => r.id)).toEqual([highRatedId, lowRatedId, unratedId]);
  });
});
