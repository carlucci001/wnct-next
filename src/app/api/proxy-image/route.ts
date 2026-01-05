import { NextRequest, NextResponse } from 'next/server';
import { isSafeUrl } from '@/lib/security';
import { getAdminAuth } from '@/lib/firebase-admin';

/**
 * Server-side image proxy to bypass CORS restrictions
 * Used for fetching images from external URLs (DALL-E, Supabase, etc.)
 * so they can be re-uploaded to Firebase Storage
 */
export async function POST(request: NextRequest) {
  try {
    // 1. Authenticate Request
    const authHeader = request.headers.get('Authorization');
    if (!authHeader?.startsWith('Bearer ')) {
      return NextResponse.json(
        { error: 'Unauthorized: Missing or invalid token' },
        { status: 401 }
      );
    }

    const token = authHeader.split('Bearer ')[1];
    try {
      const adminAuth = getAdminAuth();
      await adminAuth.verifyIdToken(token);
    } catch (authError) {
      console.error('[Proxy Image] Auth failed:', authError);
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

    // 2. Validate URL (SSRF Protection)
    if (!isSafeUrl(url)) {
      console.warn(`[Proxy Image] Blocked potentially unsafe URL: ${url}`);
      return NextResponse.json(
        { error: 'Forbidden: URL is not allowed' },
        { status: 403 }
      );
    }

    // Fetch the image server-side (no CORS restrictions)
    // 3. Set a timeout to prevent hanging requests
    const controller = new AbortController();
    const timeoutId = setTimeout(() => controller.abort(), 5000); // 5s timeout

    try {
        const response = await fetch(url, {
          headers: {
            'User-Agent': 'Mozilla/5.0 (compatible; NewsroomOS/1.0)',
          },
          signal: controller.signal,
          redirect: 'error', // 4. Prevent redirect following for SSRF protection
        });

        clearTimeout(timeoutId);

        if (!response.ok) {
          return NextResponse.json(
            { error: `Failed to fetch image: ${response.status} ${response.statusText}` },
            { status: response.status }
          );
        }

        // 5. Validate Content Type
        const contentType = response.headers.get('content-type');
        if (!contentType || !contentType.startsWith('image/')) {
             return NextResponse.json(
                { error: 'Invalid content type. Only images are allowed.' },
                { status: 400 }
              );
        }

        // 6. Size Limit (e.g., 5MB)
        const contentLength = response.headers.get('content-length');
        const MAX_SIZE = 5 * 1024 * 1024; // 5MB

        if (contentLength && parseInt(contentLength) > MAX_SIZE) {
             return NextResponse.json(
                { error: 'Image too large' },
                { status: 400 }
              );
        }

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

    } catch (fetchError: unknown) {
        clearTimeout(timeoutId);
        if (fetchError instanceof Error && fetchError.name === 'AbortError') {
             return NextResponse.json(
                { error: 'Request timeout' },
                { status: 504 }
              );
        }
        // Handle redirect errors specifically if needed, but they usually come as TypeError
        throw fetchError;
    }

  } catch (error) {
    console.error('[Proxy Image] Error:', error);
    return NextResponse.json(
      { error: error instanceof Error ? error.message : 'Failed to proxy image' },
      { status: 500 }
    );
  }
}
