/** @jest-environment node */
import Database from 'better-sqlite3';
import fs from 'fs';
import path from 'path';

describe('Database Initialization', () => {
  let testDb: Database.Database;
  let testDbPath: string;

  beforeEach(() => {
    testDbPath = path.join(__dirname, '../../../../.data/test-init.db');
    if (fs.existsSync(testDbPath)) {
      fs.unlinkSync(testDbPath);
    }

    testDb = new Database(testDbPath);
    testDb.pragma('foreign_keys = ON');
  });

  afterEach(() => {
    if (testDb) {
      testDb.close();
    }
    if (fs.existsSync(testDbPath)) {
      fs.unlinkSync(testDbPath);
    }
  });

  test('should create database with all required tables', () => {
    // Read and execute migration
    const migrationPath = path.join(__dirname, '../../../lib/db/migrations/001_create_schema.sql');
    const migration = fs.readFileSync(migrationPath, 'utf-8');
    const statements = migration.split(';').filter(stmt => stmt.trim());
    for (const stmt of statements) {
      testDb.exec(stmt);
    }

    // Check tables exist
    const tables = testDb
      .prepare(
        "SELECT name FROM sqlite_master WHERE type='table' AND name NOT LIKE 'sqlite_%'"
      )
      .all() as { name: string }[];

    const tableNames = tables.map((t: { name: string }) => t.name);
    expect(tableNames).toContain('users');
    expect(tableNames).toContain('recipes');
    expect(tableNames).toContain('ingredients');
  });

  test('should create indexes for performance', () => {
    // Read and execute migration
    const migrationPath = path.join(__dirname, '../../../lib/db/migrations/001_create_schema.sql');
    const migration = fs.readFileSync(migrationPath, 'utf-8');
    const statements = migration.split(';').filter(stmt => stmt.trim());
    for (const stmt of statements) {
      testDb.exec(stmt);
    }

    const indexes = testDb
      .prepare(
        "SELECT name FROM sqlite_master WHERE type='index' AND name LIKE 'idx_%'"
      )
      .all() as { name: string }[];

    const indexNames = indexes.map((i: { name: string }) => i.name);
    expect(indexNames).toContain('idx_recipes_creator');
    expect(indexNames).toContain('idx_recipes_canonical');
    expect(indexNames).toContain('idx_ingredients_recipe');
  });

  test('should enforce foreign keys', () => {
    const fkEnabled = testDb.prepare('PRAGMA foreign_keys').get() as { foreign_keys: number };
    expect(fkEnabled.foreign_keys).toBe(1);
  });
});
