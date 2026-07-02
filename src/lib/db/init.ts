import Database from 'better-sqlite3';
import path from 'path';
import fs from 'fs';
import { seedDatabase } from '@/db/seeds';

let db: Database.Database | undefined;
// Absolute path of the database file the current `db` connection is bound to.
// Used to detect a DATABASE_URL switch (tests reopen a fresh DB per case) and
// reconcile against the *actually open* connection instead of a cached promise.
let openDbPath: string | undefined;

export type DbClient = Database.Database;

export function getDb(): DbClient {
  if (db) {
    return db;
  }
  throw new Error('Database not initialized. Call initializeDatabase() first.');
}

// Alias for backwards compatibility
export function getDatabase(): DbClient {
  return getDb();
}

// Explicit SQLite accessor (kept for call sites that document the engine).
export function getSqliteDb(): Database.Database {
  return getDb();
}

// Resolve the target SQLite file from DATABASE_URL (`file:` URL or direct
// path), falling back to the default location when unset.
function resolveDbPath(): string {
  const databaseUrl = process.env.DATABASE_URL;
  if (!databaseUrl) {
    return path.join(process.cwd(), '.data', 'app.db');
  }
  return databaseUrl.startsWith('file:') ? databaseUrl.slice('file:'.length) : databaseUrl;
}

// Jest always sets JEST_WORKER_ID; rely on it (plus NODE_ENV) rather than
// NODE_ENV alone, which is 'development' locally but 'test' in CI — that
// asymmetry left tests running in WAL mode locally and DELETE mode in CI.
function isTestEnvironment(): boolean {
  return process.env.JEST_WORKER_ID !== undefined || process.env.NODE_ENV === 'test';
}

export async function initializeDatabase(): Promise<void> {
  const targetPath = path.resolve(resolveDbPath());

  // Already initialized against exactly this database — nothing to do. This is
  // the hot path for repeated per-request init via withDatabase().
  if (db && openDbPath === targetPath) {
    return;
  }

  // DATABASE_URL switched (tests reopen a fresh DB per case) or a stale
  // connection lingered — close it before opening the new one so callers never
  // see a connection bound to a previous test's database.
  if (db) {
    closeDatabase();
  }

  _initializeDatabaseInternal(targetPath);
}

function _initializeDatabaseInternal(dbPath: string): void {
  const dbDir = path.dirname(dbPath);

  if (!fs.existsSync(dbDir)) {
    fs.mkdirSync(dbDir, { recursive: true });
  }

  db = new Database(dbPath);
  openDbPath = dbPath;

  // DELETE journal mode in tests for strict isolation (no WAL sidecar files
  // that outlive teardown); WAL for real deployments for better concurrency.
  if (isTestEnvironment()) {
    db.pragma('journal_mode = DELETE');
  } else {
    db.pragma('journal_mode = WAL');
    db.pragma('synchronous = NORMAL');  // Balanced between safety and performance
  }

  console.log('Connected to SQLite');

  // Run migrations
  runMigrationsSync(db);

  // Seed database with default data
  seedDatabase(db);
}

function runMigrationsSync(database: Database.Database): void {
  const migrationsDir = path.join(process.cwd(), 'src', 'lib', 'db', 'migrations');

  if (!fs.existsSync(migrationsDir)) {
    console.log('No migrations directory found');
    return;
  }

  const migrationFiles = fs
    .readdirSync(migrationsDir)
    .filter((f) => f.endsWith('.sql'))
    .sort();

  for (const file of migrationFiles) {
    const filePath = path.join(migrationsDir, file);
    let sql = fs.readFileSync(filePath, 'utf-8');

    // Convert PostgreSQL SERIAL to SQLite INTEGER PRIMARY KEY AUTOINCREMENT
    sql = sql.replace(/\bSERIAL\s+PRIMARY\s+KEY\b/gi, 'INTEGER PRIMARY KEY AUTOINCREMENT');

    // Execute each statement individually so a "duplicate column" from a
    // repeated ALTER TABLE ADD COLUMN can be skipped without aborting the run.
    const statements = sql
      .split(';')
      .map((s) => s.trim())
      // Keep statements that contain at least one non-comment, non-empty line
      .filter((s) => s.split('\n').some((line) => line.trim().length > 0 && !line.trim().startsWith('--')));

    for (const stmt of statements) {
      try {
        database.exec(stmt);
      } catch (error: unknown) {
        const isAlterAddColumn = /ALTER\s+TABLE\s+\S+\s+ADD\s+COLUMN/i.test(stmt);
        const isDuplicateColumn =
          error instanceof Error && error.message.includes('duplicate column name');
        if (isAlterAddColumn && isDuplicateColumn) {
          // Column already exists — migration is idempotent, skip silently.
          continue;
        }
        console.error(`Migration failed: ${file}`, error);
        throw error;
      }
    }
    console.log(`Migration executed: ${file}`);
  }
}

export function closeDatabase(): void {
  if (db) {
    db.close();
    db = undefined;
  }
  openDbPath = undefined;
}
