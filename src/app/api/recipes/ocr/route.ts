import { NextRequest, NextResponse } from 'next/server';
import { verifyAuth } from '@/lib/auth/middleware';
import { randomUUID } from 'crypto';
import { getValidationError } from '@/config/upload';
import { extractTextFromImage } from '@/lib/ocr/tesseract';
import { parseIngredientsFromText } from '@/lib/ocr/parser';
import { getDatabase } from '@/lib/db/init';

// In-memory storage for OCR results (TODO: use Redis or DB in production)
export const ocrCache = new Map<string, {
  status: string;
  raw_text?: string;
  ingredients?: any[];
  error?: string;
}>();

export async function POST(request: NextRequest) {
  try {
    // Verify auth
    const user = await verifyAuth(request);
    if (!user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    // Parse multipart form data
    const formData = await request.formData();
    const file = formData.get('file') as File;

    if (!file) {
      return NextResponse.json(
        { error: 'No file provided' },
        { status: 400 }
      );
    }

    // Validate file
    const validationError = getValidationError(file);
    if (validationError) {
      return NextResponse.json(
        { error: validationError },
        { status: 400 }
      );
    }

    // Convert file to buffer
    const uploadId = randomUUID();
    const buffer = Buffer.from(await file.arrayBuffer());

    // Start OCR processing (async)
    ocrCache.set(uploadId, { status: 'processing' });

    processOcrAsync(uploadId, buffer, user.userId).catch(err => {
      ocrCache.set(uploadId, {
        status: 'error',
        error: 'OCR processing failed',
      });
    });

    return NextResponse.json({
      status: 200,
      uploadId,
      status: 'processing',
      estimatedTime: 5,
    });
  } catch (error) {
    console.error('Upload error:', error);
    return NextResponse.json(
      { error: 'Upload failed' },
      { status: 500 }
    );
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
    const db = await getDatabase();
    const ingredients = await db.all('SELECT * FROM ingredients');

    // Parse ingredients
    const parsed = parseIngredientsFromText(rawText, ingredients);

    // Store result
    ocrCache.set(uploadId, {
      status: 'complete',
      raw_text: rawText,
      ingredients: parsed,
    });
  } catch (error) {
    console.error('OCR processing error:', error);
    ocrCache.set(uploadId, {
      status: 'error',
      error: 'Failed to process image',
    });
  }
}
