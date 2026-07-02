/** @jest-environment node */
import { POST } from '../../../../app/api/auth/login/route';
import { UserModel } from '../../../../lib/db/models/user';
import { initializeDatabase, closeDatabase } from '../../../../lib/db/init';
import { clearRateLimitStore } from '../../../../lib/auth/rateLimiter';
import bcryptjs from 'bcryptjs';
import fs from 'fs';
import path from 'path';
import { NextRequest } from 'next/server';

describe('POST /api/auth/login', () => {
  let testDbPath: string;
  let testCounter = 0;

  beforeEach(async () => {
    testCounter++;
    testDbPath = path.join(__dirname, `../../../../../.data/test-login-${testCounter}.db`);

    process.env.DATABASE_URL = testDbPath;
    process.env.JWT_SECRET = 'test-secret-key-must-be-32-chars-long';
    clearRateLimitStore();
    await initializeDatabase();
  });

  afterEach(() => {
    closeDatabase();
    if (fs.existsSync(testDbPath)) {
      fs.unlinkSync(testDbPath);
    }
    delete process.env.DATABASE_URL;
    delete process.env.JWT_SECRET;
  });

  test('should return 200 with user id and email for valid credentials', async () => {
    // Create a user with hashed password
    const passwordHash = await bcryptjs.hash('SecurePassword123', 10);
    const user = await await UserModel.create('test@example.com', passwordHash);

    // Login with correct credentials
    const request = new NextRequest('http://localhost:3000/api/auth/login', {
      method: 'POST',
      body: JSON.stringify({
        email: 'test@example.com',
        password: 'SecurePassword123',
      }),
    });

    const response = await POST(request);
    const data = await response.json();

    expect(response.status).toBe(200);
    expect(data.user.id).toBe(user.id);
    expect(data.user.email).toBe('test@example.com');
  });

  test('should return 401 for wrong password', async () => {
    // Create a user with hashed password
    const passwordHash = await bcryptjs.hash('SecurePassword123', 10);
    await UserModel.create('test@example.com', passwordHash);

    // Login with wrong password
    const request = new NextRequest('http://localhost:3000/api/auth/login', {
      method: 'POST',
      body: JSON.stringify({
        email: 'test@example.com',
        password: 'WrongPassword123',
      }),
    });

    const response = await POST(request);
    const data = await response.json();

    expect(response.status).toBe(401);
    expect(data.error).toBe('Invalid email or password');
  });

  test('should return 401 for non-existent email', async () => {
    const request = new NextRequest('http://localhost:3000/api/auth/login', {
      method: 'POST',
      body: JSON.stringify({
        email: 'nonexistent@example.com',
        password: 'SecurePassword123',
      }),
    });

    const response = await POST(request);
    const data = await response.json();

    expect(response.status).toBe(401);
    expect(data.error).toBe('Invalid email or password');
  });

  test('should set secure httpOnly cookie with HttpOnly and Strict flags', async () => {
    // Create a user with hashed password
    const passwordHash = await bcryptjs.hash('SecurePassword123', 10);
    await UserModel.create('test@example.com', passwordHash);

    // Login with correct credentials
    const request = new NextRequest('http://localhost:3000/api/auth/login', {
      method: 'POST',
      body: JSON.stringify({
        email: 'test@example.com',
        password: 'SecurePassword123',
      }),
    });

    const response = await POST(request);

    const cookieHeader = response.headers.get('set-cookie');
    expect(cookieHeader).toContain('sessionToken');
    expect(cookieHeader).toContain('HttpOnly');
    expect(cookieHeader).toContain('SameSite=strict');
  });

  test('should return generic error message (no info leakage)', async () => {
    // Test 1: Non-existent user
    const request1 = new NextRequest('http://localhost:3000/api/auth/login', {
      method: 'POST',
      body: JSON.stringify({
        email: 'nonexistent@example.com',
        password: 'SomePassword123',
      }),
    });

    const response1 = await POST(request1);
    const data1 = await response1.json();

    // Should not reveal that user was not found
    expect(data1.error).toBe('Invalid email or password');
    expect(data1.error).not.toContain('user not found');
    expect(data1.error).not.toContain('not found');
    expect(data1.error).not.toContain('User not found');

    // Test 2: Wrong password
    const passwordHash = await bcryptjs.hash('SecurePassword123', 10);
    await UserModel.create('existing@example.com', passwordHash);

    const request2 = new NextRequest('http://localhost:3000/api/auth/login', {
      method: 'POST',
      body: JSON.stringify({
        email: 'existing@example.com',
        password: 'WrongPassword123',
      }),
    });

    const response2 = await POST(request2);
    const data2 = await response2.json();

    // Should not reveal that password was wrong
    expect(data2.error).toBe('Invalid email or password');
    expect(data2.error).not.toContain('wrong password');
    expect(data2.error).not.toContain('Wrong password');
  });

  describe('rate limiting', () => {
    function loginRequest(email: string, xff: string): NextRequest {
      return new NextRequest('http://localhost:3000/api/auth/login', {
        method: 'POST',
        headers: { 'x-forwarded-for': xff },
        body: JSON.stringify({ email, password: 'WrongPassword123' }),
      });
    }

    test('should block after limit even when the spoofable first XFF entry rotates', async () => {
      // Attacker rotates the client-controlled first entry; the trusted last
      // entry (set by our reverse proxy) stays the same real IP.
      for (let i = 0; i < 10; i++) {
        const response = await POST(loginRequest(`victim${i}@example.com`, `6.6.6.${i}, 203.0.113.7`));
        expect(response.status).not.toBe(429);
      }

      const blocked = await POST(loginRequest('victim@example.com', '6.6.6.99, 203.0.113.7'));

      expect(blocked.status).toBe(429);
      expect(blocked.headers.get('Retry-After')).toBeTruthy();
    });

    test('should block the same email across different IPs (per-account limit)', async () => {
      for (let i = 0; i < 10; i++) {
        const response = await POST(loginRequest('victim@example.com', `203.0.113.${i}`));
        expect(response.status).not.toBe(429);
      }

      const blocked = await POST(loginRequest('victim@example.com', '203.0.113.200'));

      expect(blocked.status).toBe(429);
    });

    test('should treat the per-email limit case-insensitively', async () => {
      for (let i = 0; i < 10; i++) {
        await POST(loginRequest(i % 2 === 0 ? 'Victim@Example.com' : 'victim@example.com', `203.0.113.${i}`));
      }

      const blocked = await POST(loginRequest('VICTIM@example.com', '203.0.113.200'));

      expect(blocked.status).toBe(429);
    });

    test('should not block different emails from different IPs', async () => {
      for (let i = 0; i < 10; i++) {
        await POST(loginRequest(`user${i}@example.com`, `203.0.113.${i}`));
      }

      const response = await POST(loginRequest('other@example.com', '203.0.113.201'));

      expect(response.status).not.toBe(429);
    });
  });
});
