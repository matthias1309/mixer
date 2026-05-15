import { NextRequest, NextResponse } from 'next/server';
import { ocrCache } from '@/lib/ocr/cache';

export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ uploadId: string }> }
) {
  try {
    const { uploadId } = await params;
    console.log(`[OCR GET] Looking for uploadId: ${uploadId}`);
    console.log(`[OCR GET] Cache keys:`, Array.from(ocrCache.keys()));
    const result = ocrCache.get(uploadId);

    if (!result) {
      console.log(`[OCR GET] uploadId not found in cache`);
      return NextResponse.json(
        { error: 'Upload not found' },
        { status: 404 }
      );
    }

    return NextResponse.json({
      status: 200,
      data: result,
    });
  } catch (error) {
    console.error('OCR status check error:', error);
    return NextResponse.json(
      { error: 'Status check failed' },
      { status: 500 }
    );
  }
}
