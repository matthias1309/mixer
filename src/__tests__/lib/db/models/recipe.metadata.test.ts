/** @jest-environment node */
import { initializeDatabase, closeDatabase } from '@/lib/db/init';
import { UserModel } from '@/lib/db/models/user';
import { RecipeModelAsync } from '@/lib/db/models/recipe-async';
import { mkdtempSync, rmSync } from 'fs';
import { tmpdir } from 'os';
import { join } from 'path';

describe('RecipeModelAsync — metadata & tags', () => {
  let dbDir: string;
  let userId: number;

  beforeEach(async () => {
    dbDir = mkdtempSync(join(tmpdir(), 'test-recipe-metadata-'));
    process.env.DATABASE_URL = `file:${join(dbDir, 'test.db')}`;
    await initializeDatabase();

    const user = await UserModel.create('metadata@example.com', 'hashed_password');
    userId = user.id;
  });

  afterEach(() => {
    closeDatabase();
    rmSync(dbDir, { recursive: true, force: true });
    delete process.env.DATABASE_URL;
  });

  // TC-016-07 — AC-016-06
  // Given a recipe created with metadata and tags
  // When it is read back
  // Then difficulty, time, mealType, and tags are returned
  it('stores and returns difficulty, time, mealType, and tags', async () => {
    const recipe = await RecipeModelAsync.create(
      'Vegan Curry',
      userId,
      undefined,
      undefined,
      undefined,
      undefined,
      undefined,
      {
        difficulty: 'easy',
        totalTimeMinutes: 35,
        mealType: 'Hauptspeise',
        tags: ['Vegan', 'Low Carb'],
      }
    );

    expect(recipe.difficulty).toBe('easy');
    expect(recipe.total_time_minutes).toBe(35);
    expect(recipe.meal_type).toBe('Hauptspeise');

    const tags = await RecipeModelAsync.getTags(recipe.id);
    expect(tags.sort()).toEqual(['Low Carb', 'Vegan']);
  });

  // TC-016-07 — AC-016-06
  // Given a recipe with an existing tag set
  // When it is updated with a new tag set
  // Then the old tags are replaced, not merged
  it('replaces the tag set on update', async () => {
    const recipe = await RecipeModelAsync.create(
      'Vegan Curry',
      userId,
      undefined,
      undefined,
      undefined,
      undefined,
      undefined,
      { tags: ['Vegan', 'Low Carb'] }
    );

    await RecipeModelAsync.update(
      recipe.id,
      undefined,
      undefined,
      undefined,
      undefined,
      undefined,
      { tags: ['Vegetarisch'] }
    );

    const tags = await RecipeModelAsync.getTags(recipe.id);
    expect(tags).toEqual(['Vegetarisch']);
  });
});
