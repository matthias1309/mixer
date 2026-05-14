/** @jest-environment node */
import { POST } from '../../../../app/api/auth/register/route';
import { UserModel } from '../../../../lib/db/models/user';
import { initializeDatabase } from '../../../../lib/db/init';
import fs from 'fs';
import path from 'path';
import { NextRequest } from 'next/server';

describe('POST /api/auth/register', () => {
  let testDbPath: string;
  let testCounter = 0;

  beforeEach(() => {
    testCounter++;
    testDbPath = path.join(
      __dirname,
      `../../../../../.data/test-register-${testCounter}.db`
    );

    // Close existing database instance if any
    const existingDb = (global as any).db;
    if (existingDb) {
      try {
        existingDb.close();
      } catch (e) {
        // ignore if already closed
      }
    }

    process.env.DATABASE_URL = testDbPath;
    process.env.JWT_SECRET = 'test-secret-key-must-be-32-chars-long';
    // Clear global db instance
    (global as any).db = undefined;
    initializeDatabase();
  });

  afterEach(() => {
    // Close database
    try {
      const db = (global as any).db;
      if (db) {
        db.close();
      }
    } catch (e) {
      // ignore
    }
    (global as any).db = undefined;
    if (fs.existsSync(testDbPath)) {
      fs.unlinkSync(testDbPath);
    }
    delete process.env.DATABASE_URL;
  });

  test('should register new user with valid email and password', async () => {
    const request = new NextRequest('http://localhost:3000/api/auth/register', {
      method: 'POST',
      body: JSON.stringify({
        email: 'newuser@example.com',
        password: 'SecurePassword123',
      }),
    });

    const response = await POST(request);
    const data = await response.json();

    expect(response.status).toBe(201);
    expect(data.user.email).toBe('newuser@example.com');
    expect(data.user.id).toBeDefined();

    // Verify user was created
    const user = UserModel.findByEmail('newuser@example.com');
    expect(user).not.toBeNull();
  });

  test('should return error for duplicate email', async () => {
    // First, create a user with this email
    UserModel.create('duplicate@example.com', 'hashed');

    // Then try to register with the same email
    const request = new NextRequest('http://localhost:3000/api/auth/register', {
      method: 'POST',
      body: JSON.stringify({
        email: 'duplicate@example.com',
        password: 'SecurePassword123',
      }),
    });

    const response = await POST(request);
    const data = await response.json();

    expect(response.status).toBe(400);
    expect(data.error).toContain('Email already exists');
  });

  test('should return error for short password', async () => {
    const request = new NextRequest('http://localhost:3000/api/auth/register', {
      method: 'POST',
      body: JSON.stringify({
        email: 'test@example.com',
        password: 'short',
      }),
    });

    const response = await POST(request);
    const data = await response.json();

    expect(response.status).toBe(400);
    expect(data.error).toContain('at least 8 characters');
  });

  test('should return error for invalid email', async () => {
    const request = new NextRequest('http://localhost:3000/api/auth/register', {
      method: 'POST',
      body: JSON.stringify({
        email: 'not-an-email',
        password: 'SecurePassword123',
      }),
    });

    const response = await POST(request);
    const data = await response.json();

    expect(response.status).toBe(400);
    expect(data.error).toContain('Invalid email');
  });

  test('should set secure httpOnly cookie on success', async () => {
    const request = new NextRequest('http://localhost:3000/api/auth/register', {
      method: 'POST',
      body: JSON.stringify({
        email: 'cookie-test@example.com',
        password: 'SecurePassword123',
      }),
    });

    const response = await POST(request);

    const cookieHeader = response.headers.get('set-cookie');
    expect(cookieHeader).toContain('sessionToken');
    expect(cookieHeader).toContain('HttpOnly');
  });

  test('should return error for missing email', async () => {
    const request = new NextRequest('http://localhost:3000/api/auth/register', {
      method: 'POST',
      body: JSON.stringify({
        password: 'SecurePassword123',
      }),
    });

    const response = await POST(request);
    const data = await response.json();

    expect(response.status).toBe(400);
    expect(data.error).toContain('Email and password are required');
  });

  test('should return error for missing password', async () => {
    const request = new NextRequest('http://localhost:3000/api/auth/register', {
      method: 'POST',
      body: JSON.stringify({
        email: 'test@example.com',
      }),
    });

    const response = await POST(request);
    const data = await response.json();

    expect(response.status).toBe(400);
    expect(data.error).toContain('Email and password are required');
  });
});
