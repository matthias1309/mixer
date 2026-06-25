/** @jest-environment node */
import { POST as POST_RATING, GET as GET_RATING } from '@/app/api/recipes/[id]/rating/route';
import { UserModel } from '@/lib/db/models/user';
import { RecipeModel } from '@/lib/db/models/recipe';
import { initializeDatabase, closeDatabase } from '@/lib/db/init';
import { generateToken } from '@/lib/auth/tokenRefresh';
import bcryptjs from 'bcryptjs';
import fs from 'fs';
import path from 'path';
import { NextRequest } from 'next/server';

describe('POST /api/recipes/[id]/rating', () => {
  let testDbPath: string;
  let testCounter = 0;
  let userId: number;
  let userToken: string;
  let recipeId: number;

  beforeEach(async () => {
    testCounter++;
    testDbPath = path.join(__dirname, `../../../../../.data/test-rating-api-${testCounter}.db`);

    process.env.DATABASE_URL = testDbPath;
    process.env.JWT_SECRET = 'test-secret-key-must-be-32-chars-long';
    await initializeDatabase();

    const passwordHash = await bcryptjs.hash('TestPassword123', 10);
    const user = await UserModel.create('rating-api@example.com', passwordHash);
    userId = user.id;
    userToken = generateToken(String(userId), 'rating-api@example.com');

    const recipe = RecipeModel.create('Recipe To Rate', userId);
    recipeId = recipe.id;
  });

  afterEach(() => {
    closeDatabase();
    if (fs.existsSync(testDbPath)) {
      fs.unlinkSync(testDbPath);
    }
    delete process.env.DATABASE_URL;
    delete process.env.JWT_SECRET;
  });

  function postRating(stars: unknown, cookie?: string) {
    return POST_RATING(
      new NextRequest(`http://localhost:3000/api/recipes/${recipeId}/rating`, {
        method: 'POST',
        headers: cookie ? { cookie } : {},
        body: JSON.stringify({ stars }),
      }),
      { params: Promise.resolve({ id: String(recipeId) }) }
    );
  }

  // TC-018-04 — AC-018-02
  it('stores a 1..5 rating for an authed user', async () => {
    const response = await postRating(4, `sessionToken=${userToken}`);
    const data = await response.json();

    expect(response.status).toBe(200);
    expect(data.stars).toBe(4);
  });

  // TC-018-04 — AC-018-03
  it('returns 400 for stars outside 1..5', async () => {
    const response = await postRating(6, `sessionToken=${userToken}`);
    const data = await response.json();

    expect(response.status).toBe(400);
    expect(data.error).toBeDefined();
  });

  // TC-018-04 — AC-018-04
  it('returns 401 for an anonymous request', async () => {
    const response = await postRating(4);

    expect(response.status).toBe(401);
  });

  // TC-018-04 — AC-018-05
  it('updates the rating when the same user rates again', async () => {
    await postRating(2, `sessionToken=${userToken}`);
    const response = await postRating(5, `sessionToken=${userToken}`);
    const data = await response.json();

    expect(response.status).toBe(200);
    expect(data.stars).toBe(5);

    const getResponse = await GET_RATING(
      new NextRequest(`http://localhost:3000/api/recipes/${recipeId}/rating`, {
        headers: { cookie: `sessionToken=${userToken}` },
      }),
      { params: Promise.resolve({ id: String(recipeId) }) }
    );
    const getData = await getResponse.json();
    expect(getData.stars).toBe(5);
  });
});
