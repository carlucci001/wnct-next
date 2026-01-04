import { NextRequest, NextResponse } from 'next/server';
import { getAdminAuth } from '@/lib/firebase-admin';
import { isSafeUrl } from '@/lib/security';

/**
 * Server-side image proxy to bypass CORS restrictions
 * Used for fetching images from external URLs (DALL-E, Supabase, etc.)
 * so they can be re-uploaded to Firebase Storage
 */
export async function POST(request: NextRequest) {
  try {
    // 1. Authentication Check
    const authHeader = request.headers.get('Authorization');
    if (!authHeader?.startsWith('Bearer ')) {
      return NextResponse.json(
        { error: 'Unauthorized' },
        { status: 401 }
      );
    }

    const token = authHeader.split('Bearer ')[1];
    try {
      await getAdminAuth().verifyIdToken(token);
    } catch (error) {
      console.error('[Proxy Image] Invalid token:', error);
      return NextResponse.json(
        { error: 'Unauthorized: Invalid token' },
        { status: 401 }
      );
    }

    const { url } = await request.json();

    if (!url) {
      return NextResponse.json(
        { error: 'URL is required' },
        { status: 400 }
      );
    }

    // 2. SSRF Protection & URL Validation
    if (!isSafeUrl(url)) {
      return NextResponse.json(
        { error: 'Invalid or unsafe URL' },
        { status: 400 }
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

    // Get the image as array buffer
    const arrayBuffer = await response.arrayBuffer();
    const contentType = response.headers.get('content-type') || 'image/png';

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
