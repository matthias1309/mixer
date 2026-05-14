import { getDatabase } from '../init';
import { User, UserPublic } from '../../types';

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
}
