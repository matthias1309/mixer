import { initializeDatabase } from '../../../lib/db/init';
import fs from 'fs';
import path from 'path';

describe('Database Initialization', () => {
  let testDbPath: string;

  beforeEach(() => {
    testDbPath = path.join(__dirname, '../../../../.data/test.db');
    if (fs.existsSync(testDbPath)) {
      fs.unlinkSync(testDbPath);
    }
    process.env.DATABASE_URL = testDbPath;
  });

  afterEach(() => {
    if (fs.existsSync(testDbPath)) {
      fs.unlinkSync(testDbPath);
    }
    delete process.env.DATABASE_URL;
  });

  test('should create database with all required tables', () => {
    const db = initializeDatabase();

    // Check tables exist
    const tables = db
      .prepare(
        "SELECT name FROM sqlite_master WHERE type='table' AND name NOT LIKE 'sqlite_%'"
      )
      .all() as { name: string }[];

    const tableNames = tables.map(t => t.name);
    expect(tableNames).toContain('users');
    expect(tableNames).toContain('recipes');
    expect(tableNames).toContain('ingredients');

    db.close();
  });

  test('should create indexes for performance', () => {
    const db = initializeDatabase();

    const indexes = db
      .prepare(
        "SELECT name FROM sqlite_master WHERE type='index' AND name LIKE 'idx_%'"
      )
      .all() as { name: string }[];

    const indexNames = indexes.map(i => i.name);
    expect(indexNames).toContain('idx_users_email');
    expect(indexNames).toContain('idx_recipes_canonical');
    expect(indexNames).toContain('idx_ingredients_recipe');

    db.close();
  });

  test('should enforce foreign keys', () => {
    const db = initializeDatabase();

    const fkEnabled = db.prepare('PRAGMA foreign_keys').get() as { foreign_keys: number };
    expect(fkEnabled.foreign_keys).toBe(1);

    db.close();
  });
});
