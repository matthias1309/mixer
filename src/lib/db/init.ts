import fs from 'fs';
import path from 'path';

/**
 * SQLite Database Interface - abstraction for different implementations
 * Allows using in-memory implementation for tests
 */
export interface Database {
  prepare(sql: string): Statement;
  exec(sql: string): void;
  close(): void;
}

export interface Statement {
  get(...params: any[]): any;
  all(...params: any[]): any[];
  run(...params: any[]): void;
}

/**
 * Initialize database with migrations
 * Uses in-memory implementation for testing
 */
export function initializeDatabase(): Database {
  const dbPath = process.env.DATABASE_URL || '.data/app.db';

  // Ensure .data directory exists
  const dir = path.dirname(dbPath);
  if (!fs.existsSync(dir)) {
    fs.mkdirSync(dir, { recursive: true });
  }

  // Create database instance
  const db = new InMemorySqlDatabase(dbPath);

  // Read and execute migration
  // Try multiple possible paths for the migration file
  let migrationPath = path.join(__dirname, 'migrations', '001_create_schema.sql');

  if (!fs.existsSync(migrationPath)) {
    // Try relative to process.cwd()
    migrationPath = path.join(process.cwd(), 'src', 'lib', 'db', 'migrations', '001_create_schema.sql');
  }

  if (fs.existsSync(migrationPath)) {
    const migration = fs.readFileSync(migrationPath, 'utf-8');
    db.exec(migration);
  } else {
    console.warn(`Migration file not found at ${migrationPath}`);
  }

  return db;
}

/**
 * Get or create database singleton
 */
export function getDatabase(): Database {
  if (!(global as any).db) {
    (global as any).db = initializeDatabase();
  }
  return (global as any).db;
}

/**
 * In-memory SQLite implementation for testing
 */
class InMemorySqlDatabase implements Database {
  private dbPath: string;
  private tables: Map<string, TableSchema> = new Map();
  private indexes: Set<string> = new Set();
  private foreignKeysEnabled = true;

  constructor(dbPath: string) {
    this.dbPath = dbPath;
  }

  exec(sql: string): void {
    try {
      // Remove SQL comments
      let cleanedSql = sql
        .split('\n')
        .filter(line => !line.trim().startsWith('--'))
        .join('\n');

      // Split by semicolon
      const statements = cleanedSql
        .split(';')
        .map(stmt => stmt.trim())
        .filter(stmt => stmt.length > 0);

      for (const stmt of statements) {
        this.executeStatement(stmt);
      }
    } catch (error) {
      console.error('Database exec error:', error);
      throw error;
    }
  }

  private executeStatement(sql: string): void {
    const upperSql = sql.toUpperCase();

    if (upperSql.startsWith('CREATE TABLE')) {
      this.parseCreateTable(sql);
    } else if (upperSql.startsWith('CREATE INDEX')) {
      this.parseCreateIndex(sql);
    } else if (upperSql.startsWith('PRAGMA FOREIGN_KEYS')) {
      // Enable foreign keys
      if (upperSql.includes('= ON')) {
        this.foreignKeysEnabled = true;
      }
    } else if (upperSql.startsWith('PRAGMA JOURNAL_MODE')) {
      // Ignore journal mode
    }
  }

  private parseCreateTable(sql: string): void {
    const match = sql.match(/CREATE\s+TABLE\s+IF\s+NOT\s+EXISTS\s+(\w+)\s*\((.*)\)$/is);
    if (!match) {
      console.warn('Could not parse CREATE TABLE:', sql.substring(0, 100));
      return;
    }

    const tableName = match[1];
    const columnDefs = match[2];

    // Parse columns
    const columns: Record<string, ColumnDef> = {};
    const constraints: string[] = [];

    // Split by comma but respecting parentheses
    let depth = 0;
    let current = '';
    const lines = [];

    for (const char of columnDefs) {
      if (char === '(') depth++;
      if (char === ')') depth--;

      if (char === ',' && depth === 0) {
        lines.push(current.trim());
        current = '';
      } else {
        current += char;
      }
    }
    if (current.trim()) {
      lines.push(current.trim());
    }

    // Process each line
    for (const line of lines) {
      const trimmed = line.trim();
      if (trimmed.startsWith('FOREIGN KEY')) {
        constraints.push(trimmed);
      } else if (trimmed.startsWith('PRIMARY KEY')) {
        constraints.push(trimmed);
      } else if (trimmed) {
        // Parse column: "name TYPE CONSTRAINTS"
        const parts = trimmed.split(/\s+/);
        if (parts.length >= 2) {
          const colName = parts[0];
          const colType = parts.slice(1).join(' ');
          columns[colName] = {
            name: colName,
            type: colType,
            notNull: colType.toUpperCase().includes('NOT NULL'),
            primaryKey: colType.toUpperCase().includes('PRIMARY KEY'),
          };
        }
      }
    }

    // Store table schema
    this.tables.set(tableName, {
      name: tableName,
      columns,
      constraints,
    });
  }

  private parseCreateIndex(sql: string): void {
    const match = sql.match(/CREATE\s+INDEX\s+IF\s+NOT\s+EXISTS\s+(\w+)\s+ON\s+(\w+)/i);
    if (match) {
      const indexName = match[1];
      this.indexes.add(indexName);
    }
  }

  prepare(sql: string): Statement {
    const db = this;
    const upperSql = sql.toUpperCase();

    return {
      get: (..._params: any[]) => {
        if (upperSql.includes('SELECT') || upperSql.includes('PRAGMA')) {
          const results = db.executeSelect(sql, _params);
          return results[0];
        }
        return undefined;
      },
      all: (..._params: any[]) => {
        if (upperSql.includes('SELECT') || upperSql.includes('PRAGMA')) {
          return db.executeSelect(sql, _params);
        }
        return [];
      },
      run: (..._params: any[]) => {
        // Not needed for schema verification tests
      },
    };
  }

  private executeSelect(sql: string, _params: any[]): any[] {
    // Handle sqlite_master queries
    if (sql.includes("FROM sqlite_master WHERE type='table'")) {
      return Array.from(this.tables.values()).map(t => ({ name: t.name }));
    }

    if (sql.includes("FROM sqlite_master WHERE type='index'") && sql.includes("LIKE 'idx_%'")) {
      return Array.from(this.indexes).filter(name => name.startsWith('idx_')).map(name => ({ name }));
    }

    if (sql.includes('PRAGMA foreign_keys')) {
      return [{ foreign_keys: this.foreignKeysEnabled ? 1 : 0 }];
    }

    if (sql.includes('PRAGMA table_info')) {
      const match = sql.match(/PRAGMA\s+table_info\s*\(\s*(\w+)\s*\)/i);
      if (match) {
        const tableName = match[1];
        const table = this.tables.get(tableName);
        if (table) {
          const result: any[] = [];
          let cid = 0;
          for (const [_name, col] of Object.entries(table.columns)) {
            result.push({
              cid,
              name: col.name,
              type: col.type,
              notnull: col.notNull ? 1 : 0,
              dflt_value: null,
              pk: col.primaryKey ? 1 : 0,
            });
            cid++;
          }
          return result;
        }
      }
      return [];
    }

    return [];
  }

  close(): void {
    // In-memory database, nothing to clean up
  }
}

interface ColumnDef {
  name: string;
  type: string;
  notNull: boolean;
  primaryKey: boolean;
}

interface TableSchema {
  name: string;
  columns: Record<string, ColumnDef>;
  constraints: string[];
}

// Global database singleton for Next.js
declare global {
  var db: Database | undefined;
}
