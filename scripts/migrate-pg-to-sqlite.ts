/**
 * One-off data migration: copy all rows from the production PostgreSQL
 * database (Raspberry Pi) into a fresh SQLite database file.
 *
 * Usage:
 *   1. Open an SSH tunnel to the Pi's PostgreSQL port, e.g.:
 *        ssh -L 5433:localhost:5432 pi
 *   2. Run the migration:
 *        SOURCE_DATABASE_URL="postgresql://recipe_user:<password>@localhost:5433/recipe_manager" \
 *        TARGET_DB_PATH="./mixer.db" \
 *        npm run db:migrate-pg-to-sqlite
 *   3. Check the printed row-count report — every table must show
 *      "source === target". The script exits with a non-zero code if any
 *      table is out of sync.
 *   4. Manually verify the result by pointing the app at the new file
 *      (DATABASE_URL=file:./mixer.db) and logging in with an existing user.
 *   5. Copy the resulting file to Uberspace (operational step, see
 *      MAINT-003 Phase 3).
 *
 * The target file must not exist yet — this script creates it from scratch
 * by applying the existing SQL migrations (schema only, no seed data), then
 * copies every row from PostgreSQL, preserving primary keys so foreign-key
 * relationships stay intact.
 */

import { Pool } from 'pg';
import Database from 'better-sqlite3';
import fs from 'fs';
import path from 'path';

// Tables in foreign-key dependency order: a table only appears after every
// table it references via FOREIGN KEY.
const TABLES_IN_FK_ORDER = [
  'users',
  'units',
  'ingredients_master',
  'nutrition_ingredients',
  'recipes',
  'ingredients',
  'recipe_nutrients',
  'ingredient_conversions',
  'unit_conversions',
  'ingredient_densities',
  'user_cycles',
] as const;

interface TableReport {
  table: string;
  sourceCount: number;
  targetCount: number;
}

function applyMigrations(sqliteDb: Database.Database): void {
  const migrationsDir = path.join(__dirname, '..', 'src', 'lib', 'db', 'migrations');
  const migrationFiles = fs
    .readdirSync(migrationsDir)
    .filter((file) => file.endsWith('.sql'))
    .sort();

  for (const file of migrationFiles) {
    let sql = fs.readFileSync(path.join(migrationsDir, file), 'utf-8');
    sql = sql.replace(/\bSERIAL\s+PRIMARY\s+KEY\b/gi, 'INTEGER PRIMARY KEY AUTOINCREMENT');
    sqliteDb.exec(sql);
    console.log(`Applied migration: ${file}`);
  }
}

// Convert a PostgreSQL value to something better-sqlite3 can bind.
function toSqliteValue(value: unknown): string | number | bigint | Buffer | null {
  if (value === null || value === undefined) {
    return null;
  }
  if (typeof value === 'boolean') {
    return value ? 1 : 0;
  }
  if (value instanceof Date) {
    return value.toISOString();
  }
  return value as string | number | bigint | Buffer;
}

async function copyTable(
  pgPool: Pool,
  sqliteDb: Database.Database,
  table: string
): Promise<TableReport> {
  const result = await pgPool.query(`SELECT * FROM ${table} ORDER BY id`);
  const columns = result.fields.map((field) => field.name);

  const insert = sqliteDb.prepare(
    `INSERT INTO ${table} (${columns.join(', ')}) VALUES (${columns.map(() => '?').join(', ')})`
  );

  const insertAll = sqliteDb.transaction((rows: Record<string, unknown>[]) => {
    for (const row of rows) {
      insert.run(...columns.map((column) => toSqliteValue(row[column])));
    }
  });
  insertAll(result.rows);

  const targetCount = (
    sqliteDb.prepare(`SELECT COUNT(*) as count FROM ${table}`).get() as { count: number }
  ).count;

  return { table, sourceCount: result.rowCount ?? 0, targetCount };
}

function printReport(report: TableReport[]): boolean {
  console.log('\nRow-count parity report:');
  console.log('table'.padEnd(24), 'source'.padStart(8), 'target'.padStart(8), 'status');

  let allMatch = true;
  for (const { table, sourceCount, targetCount } of report) {
    const matches = sourceCount === targetCount;
    allMatch = allMatch && matches;
    console.log(
      table.padEnd(24),
      String(sourceCount).padStart(8),
      String(targetCount).padStart(8),
      matches ? 'OK' : 'MISMATCH'
    );
  }

  return allMatch;
}

async function main(): Promise<void> {
  const sourceUrl = process.env.SOURCE_DATABASE_URL;
  const targetPath = process.env.TARGET_DB_PATH;

  if (!sourceUrl) {
    throw new Error('SOURCE_DATABASE_URL is required (PostgreSQL connection string).');
  }
  if (!targetPath) {
    throw new Error('TARGET_DB_PATH is required (path for the new SQLite file).');
  }
  if (fs.existsSync(targetPath)) {
    throw new Error(`Target file already exists: ${targetPath}. Remove it before re-running.`);
  }

  const pgPool = new Pool({ connectionString: sourceUrl });
  const sqliteDb = new Database(targetPath);

  try {
    console.log('Applying schema migrations to fresh SQLite database...');
    applyMigrations(sqliteDb);

    const report: TableReport[] = [];
    for (const table of TABLES_IN_FK_ORDER) {
      console.log(`Copying table: ${table}...`);
      report.push(await copyTable(pgPool, sqliteDb, table));
    }

    const allMatch = printReport(report);
    if (!allMatch) {
      throw new Error('Row-count mismatch detected — see report above.');
    }

    console.log('\nMigration complete. Row counts match for all tables.');
  } finally {
    sqliteDb.close();
    await pgPool.end();
  }
}

main().catch((error) => {
  console.error('Migration failed:', error);
  process.exitCode = 1;
});
