/** @jest-environment node */
import { initializeDatabase, closeDatabase, getDatabase } from '@/lib/db/init';
import { UserModel } from '@/lib/db/models/user';
import { RecipeModel } from '@/lib/db/models/recipe';
import Database from 'better-sqlite3';
import { mkdtempSync, rmSync } from 'fs';
import { tmpdir } from 'os';
import { join } from 'path';

describe('recipe_tags table constraints', () => {
  let db: Database.Database;
  let dbDir: string;
  let userId: number;

  beforeEach(async () => {
    dbDir = mkdtempSync(join(tmpdir(), 'test-recipe-tags-'));
    process.env.DATABASE_URL = `file:${join(dbDir, 'test.db')}`;
    await initializeDatabase();
    db = getDatabase() as Database.Database;

    const user = await UserModel.create('tags@example.com', 'hashed_password');
    userId = user.id;
  });

  afterEach(() => {
    closeDatabase();
    rmSync(dbDir, { recursive: true, force: true });
    delete process.env.DATABASE_URL;
  });

  // TC-016-06 — AC-016-04
  // Given a recipe with a tag already attached
  // When the same (recipe_id, tag) pair is inserted again
  // Then the insert is rejected by the unique constraint
  it('enforces unique (recipe_id, tag)', () => {
    const recipe = RecipeModel.create('Tagged Recipe', userId);
    db.prepare('INSERT INTO recipe_tags (recipe_id, tag) VALUES (?, ?)').run(recipe.id, 'Vegan');

    expect(() => {
      db.prepare('INSERT INTO recipe_tags (recipe_id, tag) VALUES (?, ?)').run(recipe.id, 'Vegan');
    }).toThrow();
  });

  // TC-016-06 — AC-016-04
  // Given a recipe with tags
  // When the recipe is deleted
  // Then its tag rows are cascade-deleted
  it('cascades delete with the recipe', () => {
    const recipe = RecipeModel.create('Recipe To Delete', userId);
    db.prepare('INSERT INTO recipe_tags (recipe_id, tag) VALUES (?, ?)').run(recipe.id, 'Vegan');

    RecipeModel.delete(recipe.id);

    const remaining = db.prepare('SELECT * FROM recipe_tags WHERE recipe_id = ?').all(recipe.id);
    expect(remaining).toHaveLength(0);
  });
});
