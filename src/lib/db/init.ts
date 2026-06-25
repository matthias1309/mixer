import Database from 'better-sqlite3';
import path from 'path';
import fs from 'fs';
import { seedDatabase } from '@/db/seeds';

let db: Database.Database;
let initPromise: Promise<void> | null = null;
let lastDatabaseUrl: string | undefined;

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

export async function initializeDatabase(): Promise<void> {
  const currentDatabaseUrl = process.env.DATABASE_URL;

  // Allow re-initialization if DATABASE_URL has changed (for tests)
  if (lastDatabaseUrl === currentDatabaseUrl && initPromise) {
    return initPromise;
  }

  // If DATABASE_URL changed, wait for old init to complete, then close
  if (lastDatabaseUrl !== currentDatabaseUrl && initPromise) {
    await initPromise;
    closeDatabase();
    initPromise = null;
  }

  lastDatabaseUrl = currentDatabaseUrl;
  initPromise = _initializeDatabaseInternal();
  return initPromise;
}

async function _initializeDatabaseInternal(): Promise<void> {
  const databaseUrl = process.env.DATABASE_URL;

  // SQLite path: a `file:` URL, a direct file path, or the default location.
  let dbPath: string;

  if (databaseUrl) {
    if (databaseUrl.startsWith('file:')) {
      // Extract path from file: URL
      dbPath = databaseUrl.replace(/^file:/, '');
    } else {
      // Assume it's a direct file path
      dbPath = databaseUrl;
    }
  } else {
    // Default path
    dbPath = path.join(process.cwd(), '.data', 'app.db');
  }

  const dbDir = path.dirname(dbPath);

  if (!fs.existsSync(dbDir)) {
    fs.mkdirSync(dbDir, { recursive: true });
  }

  db = new Database(dbPath);

  // WAL mode for better concurrency, except in test environments
  if (process.env.NODE_ENV !== 'test') {
    db.pragma('journal_mode = WAL');
    db.pragma('synchronous = NORMAL');  // Balanced between safety and performance
  } else {
    // Use DELETE journal mode for tests for better isolation
    db.pragma('journal_mode = DELETE');
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
    db = undefined as any;
  }
  // Reset initialization promise so next init is allowed
  initPromise = null;
  lastDatabaseUrl = undefined;
}
