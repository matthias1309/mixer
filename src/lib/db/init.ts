import Database from 'better-sqlite3';
import { Pool } from 'pg';
import path from 'path';
import fs from 'fs';

let db: Database.Database;
let pgPool: Pool | null = null;
let initPromise: Promise<void> | null = null;

export type DbClient = Database.Database | Pool;

export function getDb(): DbClient {
  // Check for global.db (used by tests)
  if ((global as any).db) {
    return (global as any).db;
  }
  if (pgPool) {
    return pgPool;
  }
  if (db) {
    return db;
  }
  throw new Error('Database not initialized');
}

// Alias for backwards compatibility
export function getDatabase(): DbClient {
  return getDb();
}

export function isPostgres(): boolean {
  return !!pgPool;
}

export function closeDatabase(): void {
  try {
    if (db) {
      db.close();
    }
  } catch (e) {
    // ignore if already closed
  }
  try {
    if (pgPool) {
      pgPool.end();
    }
  } catch (e) {
    // ignore if already closed
  }
  db = undefined as any;
  pgPool = null;
  initPromise = null;
}

export async function initializeDatabase(): Promise<void> {
  if (initPromise) {
    return initPromise;
  }

  initPromise = _initializeDatabaseInternal();
  return initPromise;
}

async function _initializeDatabaseInternal(): Promise<void> {
  const databaseUrl = process.env.DATABASE_URL;

  if (databaseUrl && databaseUrl.startsWith('postgres://')) {
    // Initialize PostgreSQL
    pgPool = new Pool({
      connectionString: databaseUrl,
    });

    // Test connection
    try {
      const client = await pgPool.connect();
      console.log('Connected to PostgreSQL');
      client.release();
    } catch (error) {
      console.error('Failed to connect to PostgreSQL:', error);
      if (process.env.NODE_ENV === 'production') {
        throw error;
      }
      console.log('Continuing despite connection error (likely during build)');
      pgPool = null;
      return;
    }

    // Run migrations
    await runMigrations(pgPool);
  } else {
    // Initialize SQLite (development or test)
    const dbPath = databaseUrl || path.join(process.cwd(), '.data', 'app.db');
    const dbDir = path.dirname(dbPath);

    if (!fs.existsSync(dbDir)) {
      fs.mkdirSync(dbDir, { recursive: true });
    }

    db = new Database(dbPath);
    const isTest = process.env.NODE_ENV === 'test' || process.env.DATABASE_URL?.includes('test');
    const journalMode = isTest ? 'DELETE' : 'WAL';
    db.pragma(`journal_mode = ${journalMode}`);

    console.log('Connected to SQLite');

    // Run migrations
    runMigrationsSync(db);
  }
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

    // Convert PostgreSQL SERIAL PRIMARY KEY to SQLite INTEGER PRIMARY KEY
    sql = sql.replace(/SERIAL\s+PRIMARY\s+KEY/gi, 'INTEGER PRIMARY KEY');

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

async function runMigrations(pool: Pool): Promise<void> {
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
    const sql = fs.readFileSync(filePath, 'utf-8');

    const statements = sql
      .split(';')
      .map((s) => s.trim())
      .filter((s) => s.split('\n').some((line) => line.trim().length > 0 && !line.trim().startsWith('--')));

    for (const statement of statements) {
      try {
        await pool.query(statement);
      } catch (error: unknown) {
        const isAlterAddColumn = /ALTER\s+TABLE\s+\S+\s+ADD\s+COLUMN/i.test(statement);
        const isDuplicateColumn = error instanceof Error && (error as any).code === '42701';
        if (isAlterAddColumn && isDuplicateColumn) {
          // Column already exists — safe to skip
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
  }
  if (pgPool) {
    pgPool.end();
  }
}
