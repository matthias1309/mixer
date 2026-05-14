import fs from 'fs';
import path from 'path';
import Database from 'better-sqlite3';

function getDbPath(): string {
  return process.env.DATABASE_URL || '.data/app.db';
}

export function initializeDatabase() {
  // Read dbPath at runtime, not at module load time
  const dbPath = getDbPath();

  // Ensure .data directory exists
  const dir = path.dirname(dbPath);
  if (!fs.existsSync(dir)) {
    fs.mkdirSync(dir, { recursive: true });
  }

  const db = new Database(dbPath);
  db.pragma('journal_mode = WAL'); // Better concurrency
  db.pragma('foreign_keys = ON');  // Enforce foreign keys

  // Execute migration inline to avoid __dirname issues in Next.js
  const migration = `
    CREATE TABLE IF NOT EXISTS users (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      email TEXT UNIQUE NOT NULL,
      password_hash TEXT NOT NULL,
      created_at DATETIME DEFAULT CURRENT_TIMESTAMP
    );

    CREATE TABLE IF NOT EXISTS recipes (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      name TEXT NOT NULL,
      description TEXT,
      instructions TEXT,
      servings INTEGER DEFAULT 1,
      creator_id INTEGER NOT NULL,
      canonical_id INTEGER,
      is_duplicate INTEGER DEFAULT 0,
      created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
      updated_at DATETIME DEFAULT CURRENT_TIMESTAMP,
      FOREIGN KEY (creator_id) REFERENCES users(id),
      FOREIGN KEY (canonical_id) REFERENCES recipes(id)
    );

    CREATE TABLE IF NOT EXISTS ingredients (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      recipe_id INTEGER NOT NULL,
      name TEXT NOT NULL,
      quantity REAL NOT NULL,
      unit TEXT,
      FOREIGN KEY (recipe_id) REFERENCES recipes(id) ON DELETE CASCADE
    );

    CREATE INDEX IF NOT EXISTS idx_recipes_creator_id ON recipes(creator_id);
    CREATE INDEX IF NOT EXISTS idx_recipes_canonical_id ON recipes(canonical_id);
    CREATE INDEX IF NOT EXISTS idx_recipes_is_duplicate ON recipes(is_duplicate);
    CREATE INDEX IF NOT EXISTS idx_ingredients_recipe_id ON ingredients(recipe_id);
  `;

  const statements = migration.split(';').filter(stmt => stmt.trim());
  for (const stmt of statements) {
    db.exec(stmt);
  }

  return db;
}

export function getDatabase(): Database.Database {
  if (!global.db) {
    global.db = initializeDatabase();
  }
  return global.db;
}

declare global {
  // eslint-disable-next-line no-var
  var db: Database.Database | undefined;
}
