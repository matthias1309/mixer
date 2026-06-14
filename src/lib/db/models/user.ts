import { getDb, isPostgres } from '../init';
import { User, UserPublic } from '@/types';
import { Pool } from 'pg';
import Database from 'better-sqlite3';

export class UserModel {
  static async create(email: string, passwordHash: string): Promise<User> {
    const db = getDb();

    if (isPostgres()) {
      const pool = db as Pool;
      const result = await pool.query(
        'INSERT INTO users (email, password_hash) VALUES ($1, $2) RETURNING id',
        [email, passwordHash]
      );
      const id = result.rows[0].id;
      return (await this.findById(id))!;
    } else {
      const sqlite = db as Database.Database;
      const stmt = sqlite.prepare(
        'INSERT INTO users (email, password_hash) VALUES (?, ?)'
      );
      const info = stmt.run(email, passwordHash) as { lastInsertRowid: number };
      return (await this.findById(Number(info.lastInsertRowid)))!;
    }
  }

  static async findById(id: number): Promise<User | null> {
    const db = getDb();

    if (isPostgres()) {
      const pool = db as Pool;
      const result = await pool.query('SELECT * FROM users WHERE id = $1', [id]);
      return (result.rows[0] as User) || null;
    } else {
      const sqlite = db as Database.Database;
      const stmt = sqlite.prepare('SELECT * FROM users WHERE id = ?');
      return (stmt.get(id) as User) || null;
    }
  }

  static async findByEmail(email: string): Promise<User | null> {
    const db = getDb();

    if (isPostgres()) {
      const pool = db as Pool;
      const result = await pool.query('SELECT * FROM users WHERE email = $1', [
        email,
      ]);
      return (result.rows[0] as User) || null;
    } else {
      const sqlite = db as Database.Database;
      const stmt = sqlite.prepare('SELECT * FROM users WHERE email = ?');
      return (stmt.get(email) as User) || null;
    }
  }

  static toPublic(user: User): UserPublic {
    return {
      id: user.id,
      email: user.email,
      created_at: user.created_at,
    };
  }

  static async saveCycle(
    userId: number,
    lastMenstruationDate: string,
    cycleLengthDays: number
  ) {
    const db = getDb();

    if (isPostgres()) {
      const pool = db as Pool;
      await pool.query(
        `INSERT INTO user_cycles (user_id, last_menstruation_date, cycle_length_days)
         VALUES ($1, $2, $3)
         ON CONFLICT(user_id) DO UPDATE SET
           last_menstruation_date = excluded.last_menstruation_date,
           cycle_length_days = excluded.cycle_length_days,
           updated_at = CURRENT_TIMESTAMP`,
        [userId, lastMenstruationDate, cycleLengthDays]
      );
    } else {
      const sqlite = db as Database.Database;
      const stmt = sqlite.prepare(`
        INSERT INTO user_cycles (user_id, last_menstruation_date, cycle_length_days)
        VALUES (?, ?, ?)
        ON CONFLICT(user_id) DO UPDATE SET
          last_menstruation_date = excluded.last_menstruation_date,
          cycle_length_days = excluded.cycle_length_days,
          updated_at = CURRENT_TIMESTAMP
      `);
      stmt.run(userId, lastMenstruationDate, cycleLengthDays);
    }

    return this.getCycle(userId);
  }

  static async getCycle(userId: number) {
    const db = getDb();

    if (isPostgres()) {
      const pool = db as Pool;
      const result = await pool.query(
        'SELECT * FROM user_cycles WHERE user_id = $1',
        [userId]
      );
      return result.rows[0] || null;
    } else {
      const sqlite = db as Database.Database;
      const stmt = sqlite.prepare('SELECT * FROM user_cycles WHERE user_id = ?');
      return (stmt.get(userId) as any) || null;
    }
  }
}
