import { getDatabase } from '../init';
import { User, UserPublic } from '@/types';

export class UserModel {
  static create(email: string, passwordHash: string): User {
    const db = getDatabase();
    const stmt = db.prepare(
      'INSERT INTO users (email, password_hash) VALUES (?, ?)'
    );

    const info = stmt.run(email, passwordHash) as { lastInsertRowid: number };

    return this.findById(Number(info.lastInsertRowid))!;
  }

  static findById(id: number): User | null {
    const db = getDatabase();
    const stmt = db.prepare('SELECT * FROM users WHERE id = ?');
    return (stmt.get(id) as User) || null;
  }

  static findByEmail(email: string): User | null {
    const db = getDatabase();
    const stmt = db.prepare('SELECT * FROM users WHERE email = ?');
    return (stmt.get(email) as User) || null;
  }

  static toPublic(user: User): UserPublic {
    return {
      id: user.id,
      email: user.email,
      created_at: user.created_at,
    };
  }

  static saveCycle(userId: number, lastMenstruationDate: string, cycleLengthDays: number) {
    const db = getDatabase();
    const stmt = db.prepare(`
      INSERT INTO user_cycles (user_id, last_menstruation_date, cycle_length_days)
      VALUES (?, ?, ?)
      ON CONFLICT(user_id) DO UPDATE SET
        last_menstruation_date = excluded.last_menstruation_date,
        cycle_length_days = excluded.cycle_length_days,
        updated_at = CURRENT_TIMESTAMP
    `);

    stmt.run(userId, lastMenstruationDate, cycleLengthDays);
    return this.getCycle(userId);
  }

  static getCycle(userId: number) {
    const db = getDatabase();
    const stmt = db.prepare('SELECT * FROM user_cycles WHERE user_id = ?');
    return (stmt.get(userId) as any) || null;
  }
}
