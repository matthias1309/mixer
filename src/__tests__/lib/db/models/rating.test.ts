/** @jest-environment node */
import { initializeDatabase, closeDatabase, getDatabase } from '@/lib/db/init';
import { UserModel } from '@/lib/db/models/user';
import { RecipeModel } from '@/lib/db/models/recipe';
import { upsertRating, getUserRating, getRatingAggregate } from '@/lib/db/models/rating';
import Database from 'better-sqlite3';
import { mkdtempSync, rmSync } from 'fs';
import { tmpdir } from 'os';
import { join } from 'path';

describe('rating model — upsert & aggregate', () => {
  let db: Database.Database;
  let dbDir: string;
  let userId: number;
  let otherUserId: number;
  let recipeId: number;

  beforeEach(async () => {
    dbDir = mkdtempSync(join(tmpdir(), 'test-rating-'));
    process.env.DATABASE_URL = `file:${join(dbDir, 'test.db')}`;
    await initializeDatabase();
    db = getDatabase() as Database.Database;

    const user = await UserModel.create('rating-model@example.com', 'hashed_password');
    userId = user.id;
    const otherUser = await UserModel.create('rating-model-2@example.com', 'hashed_password');
    otherUserId = otherUser.id;

    const recipe = RecipeModel.create('Rated Recipe', userId);
    recipeId = recipe.id;
  });

  afterEach(() => {
    closeDatabase();
    rmSync(dbDir, { recursive: true, force: true });
    delete process.env.DATABASE_URL;
  });

  // TC-018-02 — AC-018-02
  // Given no prior rating
  // When a user rates a recipe
  // Then the rating is stored
  it('inserts a new rating', () => {
    upsertRating(db, userId, recipeId, 4);

    expect(getUserRating(db, userId, recipeId)).toBe(4);
  });

  // TC-018-02 — AC-018-05
  // Given a user already rated a recipe
  // When the same user rates it again
  // Then the existing row is updated, not duplicated
  it('updates the existing row on re-rating', () => {
    upsertRating(db, userId, recipeId, 2);
    upsertRating(db, userId, recipeId, 5);

    expect(getUserRating(db, userId, recipeId)).toBe(5);

    const rows = db
      .prepare('SELECT * FROM recipe_ratings WHERE user_id = ? AND recipe_id = ?')
      .all(userId, recipeId);
    expect(rows).toHaveLength(1);
  });

  // TC-018-03 — AC-018-06
  // Given several users rated a recipe
  // When the aggregate is read
  // Then it returns the rounded average and count
  it('returns rounded average and count', () => {
    upsertRating(db, userId, recipeId, 4);
    upsertRating(db, otherUserId, recipeId, 5);

    const aggregate = getRatingAggregate(db, recipeId);

    expect(aggregate.ratingAverage).toBe(4.5);
    expect(aggregate.ratingCount).toBe(2);
  });

  // TC-018-03 — AC-018-06
  // Given a recipe with no ratings
  // When the aggregate is read
  // Then average is null and count is 0
  it('returns null/0 for an unrated recipe', () => {
    const aggregate = getRatingAggregate(db, recipeId);

    expect(aggregate.ratingAverage).toBeNull();
    expect(aggregate.ratingCount).toBe(0);
  });
});
