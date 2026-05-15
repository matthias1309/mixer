import { NextRequest, NextResponse } from 'next/server';
import { ocrCache } from '../route';

export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ uploadId: string }> }
) {
  try {
    const { uploadId } = await params;
    const result = ocrCache.get(uploadId);

    if (!result) {
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
