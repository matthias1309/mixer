/** @jest-environment node */
import fs from 'fs';
import path from 'path';

import { NextRequest } from 'next/server';

import { POST } from '../../../../app/api/recipes/ocr/route';
import { UserModel } from '../../../../lib/db/models/user';
import { initializeDatabase, closeDatabase } from '../../../../lib/db/init';
import { generateToken } from '../../../../lib/auth/tokenRefresh';
import { clearRateLimitStore } from '../../../../lib/auth/rateLimiter';

// TEST-021 (REQ-021 / ARCH-021) — OCR runs Tesseract (CPU-heavy) per upload;
// without a rate limit a single authenticated user can exhaust the server
// (security review finding 4). Tesseract is mocked; only the route's limiting
// behaviour is under test.
jest.mock('../../../../lib/ocr/tesseract', () => ({
  extractTextFromImage: jest.fn().mockResolvedValue(''),
}));

describe('POST /api/recipes/ocr - rate limiting', () => {
  let testDbPath: string;
  let testCounter = 0;

  beforeEach(async () => {
    testCounter++;
    testDbPath = path.join(__dirname, `../../../../../.data/test-ocr-rl-${testCounter}.db`);

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

  async function createUserToken(email: string): Promise<string> {
    const user = await UserModel.create(email, 'irrelevant-hash');
    return generateToken(String(user.id), email);
  }

  function ocrRequest(token: string): NextRequest {
    const formData = new FormData();
    const file = new File([Buffer.from('fake-image-bytes')], 'photo.jpg', {
      type: 'image/jpeg',
    });
    formData.append('file', file);

    return new NextRequest('http://localhost:3000/api/recipes/ocr', {
      method: 'POST',
      headers: { cookie: `sessionToken=${token}` },
      body: formData,
    });
  }

  // TC-021-01
  test('should return 429 with Retry-After once the per-user limit is reached', async () => {
    const token = await createUserToken('uploader@example.com');

    for (let i = 0; i < 10; i++) {
      const response = await POST(ocrRequest(token));
      expect(response.status).toBe(200);
    }

    const blocked = await POST(ocrRequest(token));

    expect(blocked.status).toBe(429);
    expect(blocked.headers.get('Retry-After')).toBeTruthy();
  });

  // TC-021-02
  test('should limit users independently', async () => {
    const token1 = await createUserToken('heavy@example.com');
    const token2 = await createUserToken('normal@example.com');

    for (let i = 0; i < 10; i++) {
      await POST(ocrRequest(token1));
    }
    expect((await POST(ocrRequest(token1))).status).toBe(429);

    const response = await POST(ocrRequest(token2));

    expect(response.status).toBe(200);
  });
});
