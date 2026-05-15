import { NextRequest, NextResponse } from 'next/server';
import { verifyAuth } from '@/lib/auth/middleware';
import { ocrCache } from '../route';

export async function GET(
  request: NextRequest,
  { params }: { params: { uploadId: string } }
) {
  try {
    // Verify auth
    const user = await verifyAuth(request);
    if (!user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const uploadId = params.uploadId;
    const result = ocrCache.get(uploadId);

    if (!result) {
      return NextResponse.json(
        { error: 'Upload not found' },
        { status: 404 }
      );
    }

    const statusCode = result.status === 'processing' ? 202 : 200;

    return NextResponse.json({
      status: statusCode,
      data: result,
    }, { status: statusCode });
  } catch (error) {
    console.error('Status check error:', error);
    return NextResponse.json(
      { error: 'Status check failed' },
      { status: 500 }
    );
  }
}
