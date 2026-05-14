/** @jest-environment node */
import { POST } from '../../../../app/api/auth/logout/route';
import { NextRequest } from 'next/server';

describe('POST /api/auth/logout', () => {
  test('should return 200 with success message and clear sessionToken cookie', async () => {
    const request = new NextRequest('http://localhost:3000/api/auth/logout', {
      method: 'POST',
    });

    const response = await POST(request);
    const data = await response.json();

    expect(response.status).toBe(200);
    expect(data.message).toContain('Logged out');

    const cookieHeader = response.headers.get('set-cookie');
    expect(cookieHeader).toContain('sessionToken=');
    expect(cookieHeader).toContain('Max-Age=0');
  });

  test('should include logged out message in response body', async () => {
    const request = new NextRequest('http://localhost:3000/api/auth/logout', {
      method: 'POST',
    });

    const response = await POST(request);
    const data = await response.json();

    expect(data.message).toBe('Logged out successfully');
    expect(data).toHaveProperty('message');
    expect(data.error).toBeUndefined();
  });

  test('should set secure httpOnly cookie with HttpOnly and Strict flags', async () => {
    const request = new NextRequest('http://localhost:3000/api/auth/logout', {
      method: 'POST',
    });

    const response = await POST(request);

    const cookieHeader = response.headers.get('set-cookie');
    expect(cookieHeader).toContain('sessionToken');
    expect(cookieHeader).toContain('HttpOnly');
    expect(cookieHeader).toContain('SameSite=strict');
  });
});
