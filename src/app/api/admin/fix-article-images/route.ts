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
async function persistImageServerSide(imageUrl: string): Promise<string | null> {
  if (!imageUrl || !isExternalUrl(imageUrl)) return null;

  try {
    // Fetch the image directly (no CORS restrictions on server)
    console.log('[Migration] Fetching:', imageUrl.substring(0, 60));
    const response = await fetch(imageUrl, {
      headers: {
        'User-Agent': 'Mozilla/5.0 (compatible; NewsroomOS/1.0)',
      },
    });

    if (!response.ok) {
      console.log('[Migration] Fetch failed:', response.status);
      return null;
    }

    // Get the image as buffer
    const arrayBuffer = await response.arrayBuffer();
    const buffer = Buffer.from(arrayBuffer);
    const contentType = response.headers.get('content-type') || 'image/jpeg';

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

    console.log('[Migration] Uploading to:', fileName);
    const snapshot = await uploadBytes(storageRef, buffer, {
      contentType: contentType,
    });

    const downloadUrl = await getDownloadURL(snapshot.ref);
    console.log('[Migration] Success:', downloadUrl.substring(0, 60));
    return downloadUrl;

  } catch (error) {
    console.error('[Migration] Error:', error);
    return null;
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
      const newUrl = await persistImageServerSide(currentImageUrl);

      if (newUrl) {
        // Update the article
        await updateDoc(doc(db, 'articles', id), {
          featuredImage: newUrl,
          imageUrl: newUrl,
          updatedAt: new Date().toISOString(),
        });

        results.fixed++;
        results.details.push({
          id,
          title,
          action: 'fixed',
          oldUrl: currentImageUrl.substring(0, 80),
          newUrl: newUrl.substring(0, 80),
        });
      } else {
        results.failed++;
        results.details.push({
          id,
          title,
          action: 'failed',
          oldUrl: currentImageUrl.substring(0, 80),
          error: 'Could not fetch or upload image',
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

    for (const docSnap of snapshot.docs) {
      const data = docSnap.data();
      const imageUrl = data.featuredImage || data.imageUrl || '';
      total++;

      if (!imageUrl) {
        noImage++;
      } else if (imageUrl.includes('firebasestorage.googleapis.com')) {
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
