import { initializeDatabase } from '../../../lib/db/init';
import fs from 'fs';
import path from 'path';

describe('Database Initialization', () => {
  let testDbPath: string;

  beforeEach(() => {
    testDbPath = path.join(__dirname, '../../../../.data/test.db');
    const dir = path.dirname(testDbPath);
    if (!fs.existsSync(dir)) {
      fs.mkdirSync(dir, { recursive: true });
    }
    if (fs.existsSync(testDbPath)) {
      fs.unlinkSync(testDbPath);
    }
    process.env.DATABASE_URL = testDbPath;
    // Reset global db
    (global as any).db = undefined;
  });

  afterEach(() => {
    (global as any).db = undefined;
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

  test('should have correct schema for users table', () => {
    const db = initializeDatabase();

    const columns = db
      .prepare("PRAGMA table_info(users)")
      .all() as { name: string; type: string; notnull: number }[];

    const columnNames = columns.map(c => c.name);
    expect(columnNames).toContain('id');
    expect(columnNames).toContain('email');
    expect(columnNames).toContain('password_hash');
    expect(columnNames).toContain('created_at');
    expect(columnNames).toContain('updated_at');

    db.close();
  });

  test('should have correct schema for recipes table', () => {
    const db = initializeDatabase();

    const columns = db
      .prepare("PRAGMA table_info(recipes)")
      .all() as { name: string; type: string; notnull: number }[];

    const columnNames = columns.map(c => c.name);
    expect(columnNames).toContain('id');
    expect(columnNames).toContain('name');
    expect(columnNames).toContain('description');
    expect(columnNames).toContain('instructions');
    expect(columnNames).toContain('servings');
    expect(columnNames).toContain('creator_id');
    expect(columnNames).toContain('canonical_id');
    expect(columnNames).toContain('is_duplicate');
    expect(columnNames).toContain('created_at');
    expect(columnNames).toContain('updated_at');

    db.close();
  });

  test('should have correct schema for ingredients table', () => {
    const db = initializeDatabase();

    const columns = db
      .prepare("PRAGMA table_info(ingredients)")
      .all() as { name: string; type: string; notnull: number }[];

    const columnNames = columns.map(c => c.name);
    expect(columnNames).toContain('id');
    expect(columnNames).toContain('recipe_id');
    expect(columnNames).toContain('name');
    expect(columnNames).toContain('quantity');
    expect(columnNames).toContain('unit');

    db.close();
  });
});
