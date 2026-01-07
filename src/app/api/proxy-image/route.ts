import { NextRequest, NextResponse } from 'next/server';
import { isSafeUrl } from '@/lib/security';

export const dynamic = 'force-dynamic';

/**
 * Server-side image proxy to bypass CORS restrictions
 * Used for fetching images from external URLs (DALL-E, Supabase, etc.)
 * so they can be re-uploaded to Firebase Storage
 */
export async function POST(request: NextRequest) {
  try {
    const { url } = await request.json();

    if (!url) {
      return NextResponse.json(
        { error: 'URL is required' },
        { status: 400 }
      );
    }

    // 2. Validate URL (SSRF Protection)
    if (!isSafeUrl(url)) {
      return NextResponse.json(
        { error: 'Forbidden URL' },
        { status: 403 }
      );
    }

    // Fetch the image server-side (no CORS restrictions)
    const response = await fetch(url, {
      headers: {
        'User-Agent': 'Mozilla/5.0 (compatible; NewsroomOS/1.0)',
      },
    });

    if (!response.ok) {
      return NextResponse.json(
        { error: `Failed to fetch image: ${response.status} ${response.statusText}` },
        { status: response.status }
      );
    }

    // 3. Validate Content Type
    const contentType = response.headers.get('content-type');
    if (!contentType?.startsWith('image/')) {
       return NextResponse.json(
        { error: 'Invalid content type' },
        { status: 400 }
      );
    }

    // 4. Validate Size (Max 5MB)
    const MAX_SIZE = 5 * 1024 * 1024;
    const contentLength = response.headers.get('content-length');
    if (contentLength && parseInt(contentLength) > MAX_SIZE) {
       return NextResponse.json(
        { error: 'Image too large' },
        { status: 400 }
      );
    }

    // Get the image as array buffer
    const arrayBuffer = await response.arrayBuffer();

    if (arrayBuffer.byteLength > MAX_SIZE) {
       return NextResponse.json(
        { error: 'Image too large' },
        { status: 400 }
      );
    }

    // Return the image data as base64
    const base64 = Buffer.from(arrayBuffer).toString('base64');
    const dataUrl = `data:${contentType};base64,${base64}`;

    return NextResponse.json({
      success: true,
      dataUrl,
      contentType,
      size: arrayBuffer.byteLength,
    });

  } catch (error) {
    console.error('[Proxy Image] Error:', error);
    return NextResponse.json(
      { error: error instanceof Error ? error.message : 'Failed to proxy image' },
      { status: 500 }
    );
  }
}
