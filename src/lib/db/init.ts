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

  // Read and execute migration
  const migrationPath = path.join(__dirname, 'migrations', '001_create_schema.sql');
  const migration = fs.readFileSync(migrationPath, 'utf-8');

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
  var db: Database.Database | undefined;
}
