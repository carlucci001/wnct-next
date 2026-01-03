import { NextRequest, NextResponse } from 'next/server';
import { getAdminAuth } from '@/lib/firebase-admin';

/**
 * Server-side image proxy to bypass CORS restrictions
 * Used for fetching images from external URLs (DALL-E, Supabase, etc.)
 * so they can be re-uploaded to Firebase Storage.
 *
 * SECURITY:
 * - Requires Authentication (Firebase ID Token)
 * - Validates URL scheme (http/https only)
 * - Blocks private IP ranges to prevent SSRF
 */
export async function POST(request: NextRequest) {
  try {
    // 1. Authentication Check
    const authHeader = request.headers.get('Authorization');
    if (!authHeader?.startsWith('Bearer ')) {
      return NextResponse.json(
        { error: 'Unauthorized: Missing or invalid token' },
        { status: 401 }
      );
    }

    const token = authHeader.split('Bearer ')[1];
    try {
      await getAdminAuth().verifyIdToken(token);
    } catch (authError) {
      console.error('[Proxy Image] Auth failed:', authError);
      return NextResponse.json(
        { error: 'Unauthorized: Invalid token' },
        { status: 401 }
      );
    }

    // 2. Input Validation
    const { url } = await request.json();

    if (!url) {
      return NextResponse.json(
        { error: 'URL is required' },
        { status: 400 }
      );
    }

    if (!isValidUrl(url)) {
      return NextResponse.json(
        { error: 'Invalid URL: Must be a public HTTP/HTTPS URL' },
        { status: 400 }
      );
    }

    // 3. Fetch Image
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

    const contentType = response.headers.get('content-type');
    if (!contentType?.startsWith('image/')) {
       return NextResponse.json(
        { error: 'Invalid content type: URL does not point to an image' },
        { status: 400 }
      );
    }

    const arrayBuffer = await response.arrayBuffer();

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

function isValidUrl(urlString: string): boolean {
  try {
    const url = new URL(urlString);

    // Check protocol
    if (!['http:', 'https:'].includes(url.protocol)) {
      return false;
    }

    const hostname = url.hostname;

    // Block localhost
    if (hostname === 'localhost' || hostname === '127.0.0.1' || hostname === '::1' || hostname === '0.0.0.0') {
      return false;
    }

    // Block private IP ranges (simple string check, not exhaustive DNS resolution)
    // 10.0.0.0/8
    if (hostname.startsWith('10.')) return false;
    // 192.168.0.0/16
    if (hostname.startsWith('192.168.')) return false;
    // 172.16.0.0/12
    if (hostname.match(/^172\.(1[6-9]|2[0-9]|3[0-1])\./)) return false;
    // AWS/GCP Metadata
    if (hostname === '169.254.169.254') return false;

    return true;
  } catch {
    return false;
  }
}
