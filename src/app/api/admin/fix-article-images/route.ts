import { NextRequest, NextResponse } from 'next/server';
import { getDb } from '@/lib/firebase';
import { collection, getDocs, doc, updateDoc, query, orderBy, limit, startAfter, DocumentSnapshot } from 'firebase/firestore';
import { storageService } from '@/lib/storage';

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
 * Check if a URL is broken (returns 404 or error)
 */
async function isUrlBroken(url: string): Promise<boolean> {
  if (!url || url.startsWith('/') || url.startsWith('data:')) return false;

  try {
    const response = await fetch(url, {
      method: 'HEAD',
      headers: { 'User-Agent': 'Mozilla/5.0 (compatible; NewsroomOS/1.0)' }
    });
    return !response.ok;
  } catch {
    return true;
  }
}

/**
 * POST /api/admin/fix-article-images
 * Migrates external image URLs to Firebase Storage
 *
 * Body options:
 * - dryRun: boolean - Just report what would be fixed, don't actually fix
 * - batchSize: number - How many articles to process (default 50)
 * - onlyBroken: boolean - Only fix URLs that are actually broken (slower)
 */
export async function POST(request: NextRequest) {
  const startTime = Date.now();

  try {
    const body = await request.json().catch(() => ({}));
    const { dryRun = false, batchSize = 50, onlyBroken = false } = body;

    const db = getDb();
    const articlesRef = collection(db, 'articles');

    // Get articles ordered by creation date (newest first)
    const q = query(articlesRef, orderBy('createdAt', 'desc'), limit(batchSize));
    const snapshot = await getDocs(q);

    const results = {
      total: snapshot.size,
      processed: 0,
      fixed: 0,
      skipped: 0,
      errors: 0,
      details: [] as Array<{
        id: string;
        title: string;
        action: 'fixed' | 'skipped' | 'error';
        oldUrl?: string;
        newUrl?: string;
        reason?: string;
      }>,
    };

    for (const docSnap of snapshot.docs) {
      const data = docSnap.data();
      const articleId = docSnap.id;
      const title = (data.title || 'Untitled').substring(0, 50);
      const currentImageUrl = data.featuredImage || data.imageUrl || '';

      results.processed++;

      // Skip if no image or already in Firebase Storage
      if (!isExternalUrl(currentImageUrl)) {
        results.skipped++;
        results.details.push({
          id: articleId,
          title,
          action: 'skipped',
          reason: currentImageUrl ? 'Already in Firebase Storage or local' : 'No image URL',
        });
        continue;
      }

      // If onlyBroken is true, check if URL is actually broken
      if (onlyBroken) {
        const broken = await isUrlBroken(currentImageUrl);
        if (!broken) {
          results.skipped++;
          results.details.push({
            id: articleId,
            title,
            action: 'skipped',
            oldUrl: currentImageUrl.substring(0, 80),
            reason: 'URL still works',
          });
          continue;
        }
      }

      // Try to persist the image
      if (dryRun) {
        results.fixed++;
        results.details.push({
          id: articleId,
          title,
          action: 'fixed',
          oldUrl: currentImageUrl.substring(0, 80),
          reason: 'Would be migrated (dry run)',
        });
        continue;
      }

      try {
        const newUrl = await storageService.uploadAssetFromUrl(currentImageUrl);

        // Only update if we got a different URL (successfully persisted)
        if (newUrl && newUrl !== currentImageUrl) {
          await updateDoc(doc(db, 'articles', articleId), {
            featuredImage: newUrl,
            imageUrl: newUrl,
            updatedAt: new Date().toISOString(),
          });

          results.fixed++;
          results.details.push({
            id: articleId,
            title,
            action: 'fixed',
            oldUrl: currentImageUrl.substring(0, 80),
            newUrl: newUrl.substring(0, 80),
          });
        } else {
          results.skipped++;
          results.details.push({
            id: articleId,
            title,
            action: 'skipped',
            oldUrl: currentImageUrl.substring(0, 80),
            reason: 'Could not persist (URL may be inaccessible)',
          });
        }
      } catch (error) {
        results.errors++;
        results.details.push({
          id: articleId,
          title,
          action: 'error',
          oldUrl: currentImageUrl.substring(0, 80),
          reason: error instanceof Error ? error.message : 'Unknown error',
        });
      }
    }

    const duration = Date.now() - startTime;

    return NextResponse.json({
      success: true,
      dryRun,
      duration: `${duration}ms`,
      summary: {
        total: results.total,
        processed: results.processed,
        fixed: results.fixed,
        skipped: results.skipped,
        errors: results.errors,
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
