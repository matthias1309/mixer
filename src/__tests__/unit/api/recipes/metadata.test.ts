/** @jest-environment node */
import { POST as POST_CREATE } from '../../../../app/api/recipes/route';
import { PUT as PUT_UPDATE } from '../../../../app/api/recipes/[id]/route';
import { UserModel } from '../../../../lib/db/models/user';
import { RecipeModel } from '../../../../lib/db/models/recipe';
import { initializeDatabase, closeDatabase } from '../../../../lib/db/init';
import { generateToken } from '../../../../lib/auth/tokenRefresh';
import bcryptjs from 'bcryptjs';
import fs from 'fs';
import path from 'path';
import { NextRequest } from 'next/server';

describe('Recipe metadata API validation', () => {
  let testDbPath: string;
  let testCounter = 0;
  let userId: number;
  let userToken: string;

  beforeEach(async () => {
    testCounter++;
    testDbPath = path.join(
      __dirname,
      `../../../../../.data/test-recipe-metadata-${testCounter}.db`
    );

    process.env.DATABASE_URL = testDbPath;
    process.env.JWT_SECRET = 'test-secret-key-must-be-32-chars-long';
    await initializeDatabase();

    const passwordHash = await bcryptjs.hash('TestPassword123', 10);
    const user = await UserModel.create('metadata-api@example.com', passwordHash);
    userId = user.id;
    userToken = generateToken(String(userId), 'metadata-api@example.com');
  });

  afterEach(() => {
    closeDatabase();
    if (fs.existsSync(testDbPath)) {
      fs.unlinkSync(testDbPath);
    }
    delete process.env.DATABASE_URL;
    delete process.env.JWT_SECRET;
  });

  // TC-016-08 — AC-016-07
  // Given a create request with an out-of-vocabulary tag
  // When it is submitted
  // Then the API returns 400
  it('returns 400 for an out-of-vocabulary tag', async () => {
    const request = new NextRequest('http://localhost:3000/api/recipes', {
      method: 'POST',
      headers: { cookie: `sessionToken=${userToken}` },
      body: JSON.stringify({
        name: 'Recipe With Bad Tag',
        tags: ['Glutenhaltig'],
      }),
    });

    const response = await POST_CREATE(request);
    const data = await response.json();

    expect(response.status).toBe(400);
    expect(data.error).toBeDefined();
  });

  // TC-016-08 — AC-016-08
  // Given a create request with a non-positive totalTimeMinutes
  // When it is submitted
  // Then the API returns 400
  it('returns 400 for non-positive time', async () => {
    const request = new NextRequest('http://localhost:3000/api/recipes', {
      method: 'POST',
      headers: { cookie: `sessionToken=${userToken}` },
      body: JSON.stringify({
        name: 'Recipe With Bad Time',
        totalTimeMinutes: 0,
      }),
    });

    const response = await POST_CREATE(request);
    const data = await response.json();

    expect(response.status).toBe(400);
    expect(data.error).toBeDefined();
  });

  // TC-016-08 — AC-016-07
  // Given an update request with an out-of-vocabulary mealType
  // When it is submitted
  // Then the API returns 400
  it('returns 400 for an out-of-vocabulary mealType on update', async () => {
    const recipe = RecipeModel.create('Existing Recipe', userId);

    const request = new NextRequest(`http://localhost:3000/api/recipes/${recipe.id}`, {
      method: 'PUT',
      headers: { cookie: `sessionToken=${userToken}` },
      body: JSON.stringify({
        mealType: 'Mitternachtssnack',
      }),
    });

    const response = await PUT_UPDATE(request, {
      params: Promise.resolve({ id: String(recipe.id) }),
    });
    const data = await response.json();

    expect(response.status).toBe(400);
    expect(data.error).toBeDefined();
  });

  // TC-016-08 — accepted path: valid metadata round-trips through create
  it('accepts valid metadata and persists it', async () => {
    const request = new NextRequest('http://localhost:3000/api/recipes', {
      method: 'POST',
      headers: { cookie: `sessionToken=${userToken}` },
      body: JSON.stringify({
        name: 'Valid Metadata Recipe',
        difficulty: 'easy',
        totalTimeMinutes: 20,
        mealType: 'Hauptspeise',
        tags: ['Vegan'],
      }),
    });

    const response = await POST_CREATE(request);
    const data = await response.json();

    expect(response.status).toBe(201);

    const persisted = RecipeModel.findById(data.id);
    expect(persisted?.difficulty).toBe('easy');
    expect(persisted?.total_time_minutes).toBe(20);
    expect(persisted?.meal_type).toBe('Hauptspeise');
  });

  // Regression (code review finding): the form's "–" option must be able to
  // clear a previously-set field, not just be unable to set it in the first
  // place. Before the fix, sending null was rejected as an invalid value.
  it('allows clearing difficulty, totalTimeMinutes, and mealType back to null', async () => {
    const recipe = RecipeModel.create(
      'Recipe With Metadata',
      userId,
      undefined,
      undefined,
      undefined,
      undefined,
      undefined,
      { difficulty: 'hard', totalTimeMinutes: 45, mealType: 'Hauptspeise' }
    );

    const request = new NextRequest(`http://localhost:3000/api/recipes/${recipe.id}`, {
      method: 'PUT',
      headers: { cookie: `sessionToken=${userToken}` },
      body: JSON.stringify({
        difficulty: null,
        totalTimeMinutes: null,
        mealType: null,
      }),
    });

    const response = await PUT_UPDATE(request, {
      params: Promise.resolve({ id: String(recipe.id) }),
    });
    const data = await response.json();

    expect(response.status).toBe(200);
    expect(data.difficulty).toBeNull();
    expect(data.totalTimeMinutes).toBeNull();
    expect(data.mealType).toBeNull();

    const persisted = RecipeModel.findById(recipe.id);
    expect(persisted?.difficulty).toBeNull();
    expect(persisted?.total_time_minutes).toBeNull();
    expect(persisted?.meal_type).toBeNull();
  });
});
