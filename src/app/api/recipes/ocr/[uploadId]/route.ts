import { NextRequest, NextResponse } from 'next/server';
import { ocrCache } from '@/lib/ocr/cache';
import { authMiddlewareWithRefresh } from '@/lib/auth/middleware';

export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ uploadId: string }> }
) {
  try {
    const auth = await authMiddlewareWithRefresh(request);
    if (!auth) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const { uploadId } = await params;
    const result = ocrCache.get(uploadId);

    if (!result) {
      return NextResponse.json({ error: 'Upload not found' }, { status: 404 });
    }

    if (result.userId !== parseInt(auth.userId, 10)) {
      return NextResponse.json({ error: 'Forbidden' }, { status: 403 });
    }

    return NextResponse.json({
      status: 200,
      data: result,
    });
  } catch (error) {
    console.error('OCR status check error:', error);
    return NextResponse.json({ error: 'Status check failed' }, { status: 500 });
  }
}
