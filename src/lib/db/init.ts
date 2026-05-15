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

    CREATE TABLE IF NOT EXISTS ingredients_master (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      name VARCHAR(255) NOT NULL UNIQUE,
      category VARCHAR(100),
      base_unit VARCHAR(50) NOT NULL DEFAULT 'g',
      base_size INTEGER NOT NULL DEFAULT 100,
      kcal DECIMAL(8,2),
      sugar DECIMAL(8,2),
      fat DECIMAL(8,2),
      protein DECIMAL(8,2),
      carbohydrates DECIMAL(8,2),
      fiber DECIMAL(8,2),
      sodium DECIMAL(8,2),
      calcium DECIMAL(8,2),
      vitamin_d DECIMAL(8,2),
      magnesium DECIMAL(8,2),
      vitamin_b6 DECIMAL(8,2),
      vitamin_b12 DECIMAL(8,2),
      vitamin_e DECIMAL(8,2),
      iron DECIMAL(8,2),
      zinc DECIMAL(8,2),
      created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
      updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
    );

    CREATE INDEX IF NOT EXISTS idx_ingredients_master_name ON ingredients_master(name);
    CREATE INDEX IF NOT EXISTS idx_ingredients_master_category ON ingredients_master(category);

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

    CREATE TABLE IF NOT EXISTS user_cycles (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      user_id INTEGER NOT NULL REFERENCES users(id) ON DELETE CASCADE UNIQUE,
      last_menstruation_date DATE NOT NULL,
      cycle_length_days INTEGER NOT NULL DEFAULT 28,
      created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
      updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
    );

    CREATE INDEX IF NOT EXISTS idx_user_cycles_user ON user_cycles(user_id);

    CREATE TABLE IF NOT EXISTS cycle_phases (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      name VARCHAR(50) NOT NULL UNIQUE,
      day_start INTEGER NOT NULL,
      day_end INTEGER NOT NULL,
      description TEXT,
      created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
    );

    CREATE TABLE IF NOT EXISTS cycle_logs (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      user_id INTEGER NOT NULL REFERENCES users(id) ON DELETE CASCADE,
      log_date DATE NOT NULL,
      phase VARCHAR(50),
      notes TEXT,
      created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
      updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
      UNIQUE(user_id, log_date)
    );

    CREATE INDEX IF NOT EXISTS idx_cycle_logs_user ON cycle_logs(user_id);
    CREATE INDEX IF NOT EXISTS idx_cycle_logs_date ON cycle_logs(log_date);

    CREATE TABLE IF NOT EXISTS phase_targets (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      phase_id INTEGER NOT NULL REFERENCES cycle_phases(id) ON DELETE CASCADE,
      nutrient_id INTEGER,
      target_value REAL,
      unit VARCHAR(20),
      created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
    );

    CREATE INDEX IF NOT EXISTS idx_phase_targets_phase ON phase_targets(phase_id);
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
