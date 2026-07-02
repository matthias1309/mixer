import { NextRequest, NextResponse } from 'next/server';
import { authMiddlewareWithRefresh, setTokenCookie } from '@/lib/auth/middleware';
import { randomUUID } from 'crypto';
import { getValidationError } from '@/config/upload';
import { extractTextFromImage } from '@/lib/ocr/tesseract';
import { parseIngredientsFromText } from '@/lib/ocr/parser';
import { getSqliteDb } from '@/lib/db/init';
import { ocrCache } from '@/lib/ocr/cache';
import { checkRateLimit } from '@/lib/auth/rateLimiter';

// OCR runs Tesseract (CPU-heavy) per upload, so each user gets a hard limit
// to keep a single account from exhausting the server (security review).
const OCR_RATE_LIMIT = { maxRequests: 10, windowMs: 10 * 60 * 1000 };

export async function POST(request: NextRequest) {
  try {
    // Verify auth
    const auth = await authMiddlewareWithRefresh(request);
    if (!auth) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }
    const user = {
      userId: typeof auth.userId === 'string' ? parseInt(auth.userId, 10) : auth.userId,
    };

    const { allowed, retryAfterMs } = checkRateLimit(
      `ocr:user:${user.userId}`,
      OCR_RATE_LIMIT.maxRequests,
      OCR_RATE_LIMIT.windowMs
    );
    if (!allowed) {
      return NextResponse.json(
        { error: 'Too many OCR uploads. Please try again later.' },
        {
          status: 429,
          headers: { 'Retry-After': String(Math.ceil(retryAfterMs / 1000)) },
        }
      );
    }

    // Parse multipart form data
    const formData = await request.formData();
    const file = formData.get('file') as File;

    if (!file) {
      return NextResponse.json({ error: 'No file provided' }, { status: 400 });
    }

    // Validate file
    const validationError = getValidationError(file);
    if (validationError) {
      return NextResponse.json({ error: validationError }, { status: 400 });
    }

    // Convert file to buffer
    const uploadId = randomUUID();
    const buffer = Buffer.from(await file.arrayBuffer());

    // Start OCR processing (async)
    ocrCache.set(uploadId, { status: 'processing', userId: user.userId });

    processOcrAsync(uploadId, buffer, user.userId).catch((err) => {
      console.error(`[OCR POST] Processing error for ${uploadId}:`, err);
      ocrCache.set(uploadId, {
        status: 'error',
        userId: user.userId,
        error: 'OCR processing failed',
      });
    });

    return NextResponse.json(
      {
        uploadId,
        status: 'processing',
        estimatedTime: 5,
      },
      { status: 200 }
    );
  } catch (error) {
    console.error('Upload error:', error);
    return NextResponse.json({ error: 'Upload failed' }, { status: 500 });
  }
}

async function processOcrAsync(
  uploadId: string,
  imageBuffer: Buffer,
  userId: number
): Promise<void> {
  try {
    // Extract text
    const rawText = await extractTextFromImage(imageBuffer);

    // Get ingredients from database
    const db = getSqliteDb();
    const ingredients = db.prepare('SELECT * FROM ingredients').all() as any[];

    // Parse ingredients
    const parsed = parseIngredientsFromText(rawText, ingredients);

    // Store result
    ocrCache.set(uploadId, {
      status: 'complete',
      userId,
      raw_text: rawText,
      ingredients: parsed,
    });
  } catch (error) {
    console.error('OCR processing error:', error);
    ocrCache.set(uploadId, {
      status: 'error',
      userId,
      error: 'Failed to process image',
    });
  }
}
