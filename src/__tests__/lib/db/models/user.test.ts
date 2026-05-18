/** @jest-environment node */
import Database from 'better-sqlite3';
import fs from 'fs';
import path from 'path';
import { UserModel } from '../../../../lib/db/models/user';
import { User } from '../../../../types';

let testDb: Database.Database;

beforeEach(() => {
  testDb = new Database(':memory:');
  testDb.pragma('foreign_keys = ON');

  // Execute migrations - convert SERIAL to INTEGER PRIMARY KEY for SQLite
  const migrationPath = path.join(__dirname, '../../../../lib/db/migrations/001_create_schema.sql');
  let migration = fs.readFileSync(migrationPath, 'utf-8');
  migration = migration.replace(/SERIAL\s+PRIMARY\s+KEY/gi, 'INTEGER PRIMARY KEY');

  const statements = migration.split(';').filter(stmt => stmt.trim());
  for (const stmt of statements) {
    testDb.exec(stmt);
  }

  // Set global.db for UserModel to use
  (global as any).db = testDb;
});

afterEach(() => {
  if (testDb) {
    testDb.close();
  }
  delete (global as any).db;
});

describe('UserModel', () => {
  describe('create', () => {
    it('should create a new user with email and password hash', async () => {
      const email = 'test@example.com';
      const passwordHash = 'hashed_password_123';

      const user = await UserModel.create(email, passwordHash);

      expect(user).toBeDefined();
      expect(user.id).toBeDefined();
      expect(user.email).toBe(email);
      expect(user.password_hash).toBe(passwordHash);
      expect(user.created_at).toBeDefined();
      expect(user.updated_at).toBeDefined();
    });

    it('should auto-increment user IDs', async () => {
      const user1 = await UserModel.create('user1@example.com', 'hash1');
      const user2 = await UserModel.create('user2@example.com', 'hash2');

      expect(user2.id).toBe(user1.id + 1);
    });
  });

  describe('findById', () => {
    it('should find a user by id', async () => {
      const created = await UserModel.create('test@example.com', 'hashed_password');
      const found = await UserModel.findById(created.id);

      expect(found).toBeDefined();
      expect(found?.email).toBe('test@example.com');
      expect(found?.password_hash).toBe('hashed_password');
    });

    it('should return null if user not found', async () => {
      const found = await UserModel.findById(999);
      expect(found).toBeNull();
    });
  });

  describe('findByEmail', () => {
    it('should find a user by email', async () => {
      await UserModel.create('test@example.com', 'hashed_password');
      const found = await UserModel.findByEmail('test@example.com');

      expect(found).toBeDefined();
      expect(found?.email).toBe('test@example.com');
    });

    it('should return null if user not found', async () => {
      const found = await UserModel.findByEmail('nonexistent@example.com');
      expect(found).toBeNull();
    });
  });

  describe('toPublic', () => {
    it('should convert User to UserPublic without sensitive data', () => {
      const user: User = {
        id: 1,
        email: 'test@example.com',
        password_hash: 'secret_hash',
        created_at: '2026-05-14T10:00:00Z',
        updated_at: '2026-05-14T10:00:00Z',
      };

      const publicUser = UserModel.toPublic(user);

      expect(publicUser.id).toBe(1);
      expect(publicUser.email).toBe('test@example.com');
      expect(publicUser.created_at).toBe('2026-05-14T10:00:00Z');
      expect((publicUser as any).password_hash).toBeUndefined();
    });
  });
});
