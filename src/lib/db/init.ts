import Database from 'better-sqlite3';
import { Pool } from 'pg';
import path from 'path';
import fs from 'fs';

let db: Database.Database;
let pgPool: Pool | null = null;

export type DbClient = Database.Database | Pool;

export function getDb(): DbClient {
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

export async function initializeDatabase(): Promise<void> {
  const databaseUrl = process.env.DATABASE_URL;

  if (databaseUrl) {
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
    // Initialize SQLite (development)
    const dbPath = path.join(process.cwd(), '.data', 'app.db');
    const dbDir = path.dirname(dbPath);

    if (!fs.existsSync(dbDir)) {
      fs.mkdirSync(dbDir, { recursive: true });
    }

    db = new Database(dbPath);
    db.pragma('journal_mode = WAL');

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
    const sql = fs.readFileSync(filePath, 'utf-8');

    try {
      database.exec(sql);
      console.log(`Migration executed: ${file}`);
    } catch (error) {
      console.error(`Migration failed: ${file}`, error);
      throw error;
    }
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

    try {
      await pool.query(sql);
      console.log(`Migration executed: ${file}`);
    } catch (error) {
      console.error(`Migration failed: ${file}`, error);
      throw error;
    }
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
