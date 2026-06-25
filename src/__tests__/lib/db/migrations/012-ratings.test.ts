/** @jest-environment node */
import { initializeDatabase, closeDatabase, getDatabase } from '@/lib/db/init';
import Database from 'better-sqlite3';
import { mkdtempSync, rmSync } from 'fs';
import { tmpdir } from 'os';
import { join } from 'path';

describe('Migration 012 — recipe_ratings', () => {
  let db: Database.Database;
  let dbDir: string;

  beforeEach(async () => {
    dbDir = mkdtempSync(join(tmpdir(), 'test-012-'));
    process.env.DATABASE_URL = `file:${join(dbDir, 'test.db')}`;
    await initializeDatabase();
    db = getDatabase() as Database.Database;
  });

  afterEach(() => {
    closeDatabase();
    rmSync(dbDir, { recursive: true, force: true });
    delete process.env.DATABASE_URL;
  });

  // TC-018-01 — AC-018-01
  // Given the migration has run
  // When recipe_ratings is inspected
  // Then it exists with a (user_id, recipe_id) primary key and a 1..5 check
  it('creates recipe_ratings with a unique (user_id, recipe_id) and 1..5 check', () => {
    const tables = db
      .prepare("SELECT name FROM sqlite_master WHERE type='table' AND name = 'recipe_ratings'")
      .all();
    expect(tables).toHaveLength(1);

    const columns = db.prepare('PRAGMA table_info(recipe_ratings)').all() as {
      name: string;
      pk: number;
    }[];
    const columnNames = columns.map((c) => c.name);
    expect(columnNames).toEqual(
      expect.arrayContaining(['user_id', 'recipe_id', 'stars', 'created_at', 'updated_at'])
    );

    const pkColumns = columns.filter((c) => c.pk > 0).map((c) => c.name);
    expect(pkColumns.sort()).toEqual(['recipe_id', 'user_id']);

    db.exec(`
      INSERT INTO users (email, password_hash) VALUES ('rating-migration@example.com', 'hash');
      INSERT INTO recipes (name, creator_id) VALUES ('Rated Recipe', last_insert_rowid());
    `);

    expect(() => {
      db.prepare('INSERT INTO recipe_ratings (user_id, recipe_id, stars) VALUES (1, 1, 6)').run();
    }).toThrow();

    expect(() => {
      db.prepare('INSERT INTO recipe_ratings (user_id, recipe_id, stars) VALUES (1, 1, 0)').run();
    }).toThrow();

    db.prepare('INSERT INTO recipe_ratings (user_id, recipe_id, stars) VALUES (1, 1, 4)').run();

    expect(() => {
      db.prepare('INSERT INTO recipe_ratings (user_id, recipe_id, stars) VALUES (1, 1, 5)').run();
    }).toThrow();
  });
});
