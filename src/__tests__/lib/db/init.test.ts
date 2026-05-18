/** @jest-environment node */
import { initializeDatabase, getDatabase } from '../../../lib/db/init';
import { closeDatabase } from '../../../lib/db/init';
import Database from 'better-sqlite3';
import fs from 'fs';
import path from 'path';

describe('Database Initialization', () => {
  let testDbPath: string;

  beforeEach(async () => {
    testDbPath = path.join(__dirname, '../../../../.data/test-init.db');
    if (fs.existsSync(testDbPath)) {
      fs.unlinkSync(testDbPath);
    }
    process.env.DATABASE_URL = testDbPath;
    delete (global as any).db;
    await initializeDatabase();
  });

  afterEach(() => {
    closeDatabase();
    if (fs.existsSync(testDbPath)) {
      fs.unlinkSync(testDbPath);
    }
    delete process.env.DATABASE_URL;
    delete (global as any).db;
  });

  test('should create database with all required tables', () => {
    // Database already initialized in beforeEach, no need to call again
    const db = getDatabase() as Database.Database;

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
    expect(tableNames).toContain('ingredients_master');
  });

  test('should create indexes for performance', () => {
    // Database already initialized in beforeEach
    const db = getDatabase() as Database.Database;

    const indexes = db
      .prepare(
        "SELECT name FROM sqlite_master WHERE type='index' AND name LIKE 'idx_%'"
      )
      .all() as { name: string }[];

    const indexNames = indexes.map(i => i.name);
    expect(indexNames).toContain('idx_recipes_creator');
    expect(indexNames).toContain('idx_recipes_canonical');
    expect(indexNames).toContain('idx_ingredients_recipe');
    expect(indexNames.some(name => name.includes('cycle') && name.includes('user'))).toBe(true);
  });

  test('should enforce foreign keys', () => {
    // Database already initialized in beforeEach
    const db = getDatabase() as Database.Database;

    const fkEnabled = db.prepare('PRAGMA foreign_keys').get() as { foreign_keys: number };
    expect(fkEnabled.foreign_keys).toBe(1);
  });
});
