/** @jest-environment node */
import { initializeDatabase, closeDatabase, getDatabase } from '@/lib/db/init';
import { UserModel } from '@/lib/db/models/user';
import { RecipeModel } from '@/lib/db/models/recipe';
import Database from 'better-sqlite3';
import { mkdtempSync, rmSync } from 'fs';
import { tmpdir } from 'os';
import { join } from 'path';

describe('Migration 011 — recipe metadata & recipe_tags', () => {
  let db: Database.Database;
  let dbDir: string;

  beforeEach(async () => {
    dbDir = mkdtempSync(join(tmpdir(), 'test-011-'));
    process.env.DATABASE_URL = `file:${join(dbDir, 'test.db')}`;
    await initializeDatabase();
    db = getDatabase() as Database.Database;
  });

  afterEach(() => {
    closeDatabase();
    rmSync(dbDir, { recursive: true, force: true });
    delete process.env.DATABASE_URL;
  });

  // TC-016-05 — AC-016-03, AC-016-05
  // Given the migration has run
  // When a recipe is inserted without metadata
  // Then the new columns are nullable and the recipe stays valid, with no tags
  it('adds nullable columns and leaves existing recipes valid', async () => {
    const columns = db.prepare('PRAGMA table_info(recipes)').all() as { name: string }[];
    const columnNames = columns.map((c) => c.name);

    expect(columnNames).toContain('difficulty');
    expect(columnNames).toContain('total_time_minutes');
    expect(columnNames).toContain('meal_type');

    const tables = db
      .prepare("SELECT name FROM sqlite_master WHERE type='table' AND name = 'recipe_tags'")
      .all();
    expect(tables).toHaveLength(1);

    const user = await UserModel.create('migration011@example.com', 'hashed_password');
    const recipe = RecipeModel.create('Plain Recipe', user.id);

    expect(recipe.difficulty).toBeNull();
    expect(recipe.total_time_minutes).toBeNull();
    expect(recipe.meal_type).toBeNull();

    const tagRows = db.prepare('SELECT * FROM recipe_tags WHERE recipe_id = ?').all(recipe.id);
    expect(tagRows).toHaveLength(0);
  });
});
