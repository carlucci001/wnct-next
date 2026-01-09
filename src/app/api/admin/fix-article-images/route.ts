import { NextRequest, NextResponse } from 'next/server';
import { getDb, getStorageInstance } from '@/lib/firebase';
import { ref, uploadBytes, getDownloadURL } from 'firebase/storage';
import { collection, getDocs, doc, updateDoc } from 'firebase/firestore';

export const dynamic = 'force-dynamic';

/**
 * Check if a URL is an external URL (not Firebase Storage)
 */
function isExternalUrl(url: string): boolean {
  if (!url) return false;
  // Already in Firebase Storage - skip
  if (url.includes('firebasestorage.googleapis.com')) return false;
  // Already in Google Cloud Storage (alternate Firebase URL format) - skip
  if (url.includes('storage.googleapis.com')) return false;
  // Data URLs - skip
  if (url.startsWith('data:')) return false;
  // Local placeholder - skip
  if (url === '/placeholder.jpg' || url.startsWith('/')) return false;
  // It's an external URL
  return true;
}

/**
 * Fetch an external image and upload to Firebase Storage
 * Server-side version that works without proxy
 */
async function persistImageServerSide(imageUrl: string): Promise<{ url: string | null; error?: string }> {
  if (!imageUrl || !isExternalUrl(imageUrl)) return { url: null, error: 'Invalid URL' };

  try {
    // Fetch the image directly (no CORS restrictions on server)
    const response = await fetch(imageUrl, {
      headers: {
        'User-Agent': 'Mozilla/5.0 (compatible; NewsroomOS/1.0)',
      },
    });

    if (!response.ok) {
      return { url: null, error: `Fetch failed: ${response.status} ${response.statusText}` };
    }

    // Get the image as buffer
    const arrayBuffer = await response.arrayBuffer();
    const buffer = Buffer.from(arrayBuffer);
    const contentType = response.headers.get('content-type') || 'image/jpeg';

    // Check if it's actually an image
    if (!contentType.includes('image')) {
      return { url: null, error: `Not an image: ${contentType}` };
    }

    // Determine file extension
    let extension = 'jpg';
    if (contentType.includes('png')) extension = 'png';
    else if (contentType.includes('gif')) extension = 'gif';
    else if (contentType.includes('webp')) extension = 'webp';

    // Generate unique filename
    const fileName = `articles/${Date.now()}-${Math.random().toString(36).substring(7)}.${extension}`;

    // Upload to Firebase Storage
    const storage = getStorageInstance();
    const storageRef = ref(storage, fileName);

    const snapshot = await uploadBytes(storageRef, buffer, {
      contentType: contentType,
    });

    const downloadUrl = await getDownloadURL(snapshot.ref);
    return { url: downloadUrl };

  } catch (error) {
    const errMsg = error instanceof Error ? error.message : String(error);
    return { url: null, error: errMsg };
  }
}

/**
 * POST /api/admin/fix-article-images
 * Migrates external image URLs to Firebase Storage
 */
export async function POST(request: NextRequest) {
  const startTime = Date.now();

  try {
    const body = await request.json().catch(() => ({}));
    const { dryRun = false, batchSize = 50 } = body;

    const db = getDb();
    const articlesRef = collection(db, 'articles');

    // Get ALL articles to find ones with external URLs
    const allDocs = await getDocs(articlesRef);

    // Filter to only those needing migration
    const articlesToFix: Array<{ id: string; data: any }> = [];
    allDocs.forEach((docSnap) => {
      const data = docSnap.data();
      const imageUrl = data.featuredImage || data.imageUrl || '';
      if (isExternalUrl(imageUrl)) {
        articlesToFix.push({ id: docSnap.id, data });
      }
    });

    // Only process up to batchSize
    const toProcess = articlesToFix.slice(0, batchSize);

    const results = {
      totalWithExternalUrls: articlesToFix.length,
      processing: toProcess.length,
      fixed: 0,
      failed: 0,
      details: [] as Array<{
        id: string;
        title: string;
        action: 'fixed' | 'failed';
        oldUrl?: string;
        newUrl?: string;
        error?: string;
      }>,
    };

    for (const article of toProcess) {
      const { id, data } = article;
      const title = (data.title || 'Untitled').substring(0, 50);
      const currentImageUrl = data.featuredImage || data.imageUrl || '';

      if (dryRun) {
        results.fixed++;
        results.details.push({
          id,
          title,
          action: 'fixed',
          oldUrl: currentImageUrl.substring(0, 80),
          newUrl: '(dry run - would migrate)',
        });
        continue;
      }

      // Try to persist the image
      const result = await persistImageServerSide(currentImageUrl);

      if (result.url) {
        // Update the article
        await updateDoc(doc(db, 'articles', id), {
          featuredImage: result.url,
          imageUrl: result.url,
          updatedAt: new Date().toISOString(),
        });

        results.fixed++;
        results.details.push({
          id,
          title,
          action: 'fixed',
          oldUrl: currentImageUrl.substring(0, 80),
          newUrl: result.url.substring(0, 80),
        });
      } else {
        results.failed++;
        results.details.push({
          id,
          title,
          action: 'failed',
          oldUrl: currentImageUrl.substring(0, 80),
          error: result.error || 'Unknown error',
        });
      }
    }

    const duration = Date.now() - startTime;

    return NextResponse.json({
      success: true,
      dryRun,
      duration: `${duration}ms`,
      summary: {
        totalWithExternalUrls: results.totalWithExternalUrls,
        processed: results.processing,
        fixed: results.fixed,
        failed: results.failed,
        remaining: results.totalWithExternalUrls - results.processing,
      },
      details: results.details,
    });

  } catch (error) {
    console.error('[Fix Article Images] Error:', error);
    return NextResponse.json(
      { error: error instanceof Error ? error.message : 'Unknown error' },
      { status: 500 }
    );
  }
}

/**
 * GET /api/admin/fix-article-images
 * Returns stats about articles with external image URLs
 */
export async function GET() {
  try {
    const db = getDb();
    const articlesRef = collection(db, 'articles');
    const snapshot = await getDocs(articlesRef);

    let total = 0;
    let noImage = 0;
    let firebaseStorage = 0;
    let externalUrls = 0;
    let localPaths = 0;
    const noImageArticles: Array<{ id: string; title: string; isFeatured: boolean }> = [];

    for (const docSnap of snapshot.docs) {
      const data = docSnap.data();
      const imageUrl = data.featuredImage || data.imageUrl || '';
      total++;

      if (!imageUrl) {
        noImage++;
        noImageArticles.push({
          id: docSnap.id,
          title: (data.title || 'Untitled').substring(0, 50),
          isFeatured: data.isFeatured || false,
        });
      } else if (imageUrl.includes('firebasestorage.googleapis.com') || imageUrl.includes('storage.googleapis.com')) {
        firebaseStorage++;
      } else if (imageUrl.startsWith('/') || imageUrl.startsWith('data:')) {
        localPaths++;
      } else {
        externalUrls++;
      }
    }

    return NextResponse.json({
      total,
      breakdown: {
        noImage,
        firebaseStorage,
        externalUrls,
        localPaths,
      },
      noImageArticles,
      needsMigration: externalUrls,
      message: externalUrls > 0
        ? `${externalUrls} articles have external image URLs that should be migrated`
        : 'All article images are properly stored',
    });

  } catch (error) {
    console.error('[Fix Article Images] Error:', error);
    return NextResponse.json(
      { error: error instanceof Error ? error.message : 'Unknown error' },
      { status: 500 }
    );
  }
}
