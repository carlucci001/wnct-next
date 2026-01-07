import { NextResponse } from 'next/server';
import { getDb } from '@/lib/firebase';
import { collection, getDocs, addDoc, query, where } from 'firebase/firestore';
import { MediaFolder, MediaFileType } from '@/types/media';

// Force dynamic rendering - this route uses Firebase and cannot be prerendered
export const dynamic = 'force-dynamic';

/**
 * Media Migration API
 * Scans existing content collections and imports image URLs into the Media Manager
 *
 * Collections scanned:
 * - articles: featuredImage, imageUrl → folder: 'articles'
 * - businesses: images[], logo → folder: 'directory'
 * - advertisements: imageUrl → folder: 'advertising'
 * - blogPosts: featuredImage → folder: 'blog'
 * - events: featuredImage → folder: 'events'
 */

interface ImageSource {
  url: string;
  folder: MediaFolder;
  sourceCollection: string;
  sourceId: string;
  sourceTitle?: string;
  category?: string;  // Article category for tagging
}

interface CollectionStats {
  found: number;
  imported: number;
  skipped: number;
  errors: number;
}

// Helper to guess MIME type from URL extension
function getMimeTypeFromUrl(url: string): string {
  const extension = url.split('?')[0].split('.').pop()?.toLowerCase() || '';
  const mimeTypes: Record<string, string> = {
    'jpg': 'image/jpeg',
    'jpeg': 'image/jpeg',
    'png': 'image/png',
    'gif': 'image/gif',
    'webp': 'image/webp',
    'svg': 'image/svg+xml',
    'mp4': 'video/mp4',
    'webm': 'video/webm',
    'mov': 'video/quicktime',
    'mp3': 'audio/mpeg',
    'wav': 'audio/wav',
    'pdf': 'application/pdf',
  };
  return mimeTypes[extension] || 'image/jpeg'; // Default to JPEG for unknown
}

// Helper to get file type from MIME type
function getFileTypeFromMime(mimeType: string): MediaFileType {
  if (mimeType.startsWith('image/')) return 'image';
  if (mimeType.startsWith('video/')) return 'video';
  if (mimeType.startsWith('audio/')) return 'audio';
  if (mimeType === 'application/pdf') return 'document';
  return 'image'; // Default
}

// Helper to extract filename from URL
function getFilenameFromUrl(url: string): string {
  try {
    // Handle Firebase Storage URLs which have encoded paths
    const match = url.match(/\/o\/([^?]+)/);
    if (match) {
      return decodeURIComponent(match[1]).split('/').pop() || 'unknown';
    }
    // Handle regular URLs
    return url.split('?')[0].split('/').pop() || 'unknown';
  } catch {
    return 'unknown';
  }
}

// Helper to validate URL is an image/media URL
function isValidMediaUrl(url: string | null | undefined): boolean {
  if (!url || typeof url !== 'string') return false;
  if (url.trim() === '') return false;
  // Skip data URLs (too large to store as reference)
  if (url.startsWith('data:')) return false;
  // Must be a valid URL pattern
  return url.startsWith('http://') || url.startsWith('https://');
}

// Scan articles collection
async function scanArticles(): Promise<ImageSource[]> {
  const sources: ImageSource[] = [];
  const snapshot = await getDocs(collection(getDb(), 'articles'));

  snapshot.docs.forEach((doc) => {
    const data = doc.data();
    const title = data.title || 'Untitled Article';
    const category = data.category || 'Uncategorized';

    // Check featuredImage
    if (isValidMediaUrl(data.featuredImage)) {
      sources.push({
        url: data.featuredImage,
        folder: 'articles',
        sourceCollection: 'articles',
        sourceId: doc.id,
        sourceTitle: title,
        category: category,
      });
    }

    // Check imageUrl (if different from featuredImage)
    if (isValidMediaUrl(data.imageUrl) && data.imageUrl !== data.featuredImage) {
      sources.push({
        url: data.imageUrl,
        folder: 'articles',
        sourceCollection: 'articles',
        sourceId: doc.id,
        sourceTitle: title,
        category: category,
      });
    }
  });

  return sources;
}

// Scan businesses collection
async function scanBusinesses(): Promise<ImageSource[]> {
  const sources: ImageSource[] = [];
  const snapshot = await getDocs(collection(getDb(), 'businesses'));

  snapshot.docs.forEach((doc) => {
    const data = doc.data();
    const title = data.name || 'Unnamed Business';

    // Check logo
    if (isValidMediaUrl(data.logo)) {
      sources.push({
        url: data.logo,
        folder: 'directory',
        sourceCollection: 'businesses',
        sourceId: doc.id,
        sourceTitle: `${title} (logo)`,
      });
    }

    // Check images array
    if (Array.isArray(data.images)) {
      data.images.forEach((imgUrl: string, index: number) => {
        if (isValidMediaUrl(imgUrl)) {
          sources.push({
            url: imgUrl,
            folder: 'directory',
            sourceCollection: 'businesses',
            sourceId: doc.id,
            sourceTitle: `${title} (image ${index + 1})`,
          });
        }
      });
    }
  });

  return sources;
}

// Scan advertisements collection
async function scanAdvertisements(): Promise<ImageSource[]> {
  const sources: ImageSource[] = [];
  const snapshot = await getDocs(collection(getDb(), 'advertisements'));

  snapshot.docs.forEach((doc) => {
    const data = doc.data();
    const title = data.name || 'Unnamed Ad';

    if (isValidMediaUrl(data.imageUrl)) {
      sources.push({
        url: data.imageUrl,
        folder: 'advertising',
        sourceCollection: 'advertisements',
        sourceId: doc.id,
        sourceTitle: title,
      });
    }
  });

  return sources;
}

// Scan blogPosts collection
async function scanBlogPosts(): Promise<ImageSource[]> {
  const sources: ImageSource[] = [];
  const snapshot = await getDocs(collection(getDb(), 'blogPosts'));

  snapshot.docs.forEach((doc) => {
    const data = doc.data();
    const title = data.title || 'Untitled Post';

    if (isValidMediaUrl(data.featuredImage)) {
      sources.push({
        url: data.featuredImage,
        folder: 'blog',
        sourceCollection: 'blogPosts',
        sourceId: doc.id,
        sourceTitle: title,
      });
    }
  });

  return sources;
}

// Scan events collection
async function scanEvents(): Promise<ImageSource[]> {
  const sources: ImageSource[] = [];
  const snapshot = await getDocs(collection(getDb(), 'events'));

  snapshot.docs.forEach((doc) => {
    const data = doc.data();
    const title = data.title || 'Untitled Event';

    if (isValidMediaUrl(data.featuredImage)) {
      sources.push({
        url: data.featuredImage,
        folder: 'events',
        sourceCollection: 'events',
        sourceId: doc.id,
        sourceTitle: title,
      });
    }
  });

  return sources;
}

/**
 * GET /api/admin/migrate-media
 * Preview - shows what images would be imported without making changes
 */
export async function GET() {
  try {
    // Scan all collections
    const [articles, businesses, ads, blog, events] = await Promise.all([
      scanArticles(),
      scanBusinesses(),
      scanAdvertisements(),
      scanBlogPosts(),
      scanEvents(),
    ]);

    // Combine all sources
    const allSources = [...articles, ...businesses, ...ads, ...blog, ...events];

    // Deduplicate by URL
    const uniqueUrls = new Map<string, ImageSource>();
    const duplicates: string[] = [];

    allSources.forEach((source) => {
      if (uniqueUrls.has(source.url)) {
        duplicates.push(source.url);
      } else {
        uniqueUrls.set(source.url, source);
      }
    });

    // Check which URLs already exist in media collection
    const mediaSnapshot = await getDocs(collection(getDb(), 'media'));
    const existingUrls = new Set(mediaSnapshot.docs.map((doc) => doc.data().url));

    const toImport = Array.from(uniqueUrls.values()).filter((s) => !existingUrls.has(s.url));
    const alreadyImported = Array.from(uniqueUrls.values()).filter((s) => existingUrls.has(s.url));

    return NextResponse.json({
      success: true,
      message: 'Preview - no changes made. POST to this endpoint to import.',
      summary: {
        totalFound: allSources.length,
        uniqueUrls: uniqueUrls.size,
        duplicatesInSource: duplicates.length,
        alreadyInMedia: alreadyImported.length,
        toImport: toImport.length,
      },
      byCollection: {
        articles: { found: articles.length, unique: new Set(articles.map(a => a.url)).size },
        businesses: { found: businesses.length, unique: new Set(businesses.map(a => a.url)).size },
        advertisements: { found: ads.length, unique: new Set(ads.map(a => a.url)).size },
        blogPosts: { found: blog.length, unique: new Set(blog.map(a => a.url)).size },
        events: { found: events.length, unique: new Set(events.map(a => a.url)).size },
      },
      preview: toImport.slice(0, 20).map((s) => ({
        url: s.url.substring(0, 100) + (s.url.length > 100 ? '...' : ''),
        folder: s.folder,
        source: s.sourceCollection,
        title: s.sourceTitle,
      })),
    });
  } catch (error) {
    console.error('Error previewing media migration:', error);
    return NextResponse.json(
      { error: 'Failed to preview migration', details: error instanceof Error ? error.message : 'Unknown error' },
      { status: 500 }
    );
  }
}

/**
 * POST /api/admin/migrate-media
 * Execute - imports images into the media collection
 */
export async function POST() {
  try {
    // Scan all collections
    const [articles, businesses, ads, blog, events] = await Promise.all([
      scanArticles(),
      scanBusinesses(),
      scanAdvertisements(),
      scanBlogPosts(),
      scanEvents(),
    ]);

    // Initialize stats
    const stats: Record<string, CollectionStats> = {
      articles: { found: articles.length, imported: 0, skipped: 0, errors: 0 },
      businesses: { found: businesses.length, imported: 0, skipped: 0, errors: 0 },
      advertisements: { found: ads.length, imported: 0, skipped: 0, errors: 0 },
      blogPosts: { found: blog.length, imported: 0, skipped: 0, errors: 0 },
      events: { found: events.length, imported: 0, skipped: 0, errors: 0 },
    };

    // Combine all sources
    const allSources = [...articles, ...businesses, ...ads, ...blog, ...events];

    // Deduplicate by URL, keeping track of usage count
    const urlUsageCount = new Map<string, number>();
    const uniqueSources = new Map<string, ImageSource>();

    allSources.forEach((source) => {
      urlUsageCount.set(source.url, (urlUsageCount.get(source.url) || 0) + 1);
      if (!uniqueSources.has(source.url)) {
        uniqueSources.set(source.url, source);
      }
    });

    // Check which URLs already exist in media collection
    const mediaSnapshot = await getDocs(collection(getDb(), 'media'));
    const existingUrls = new Set(mediaSnapshot.docs.map((doc) => doc.data().url));

    // Import new media files
    let totalImported = 0;
    let totalSkipped = 0;
    let totalErrors = 0;

    const mediaCollection = collection(getDb(), 'media');
    const now = new Date().toISOString();

    for (const [url, source] of uniqueSources) {
      // Skip if already exists
      if (existingUrls.has(url)) {
        stats[source.sourceCollection === 'businesses' ? 'businesses' : source.sourceCollection].skipped++;
        totalSkipped++;
        continue;
      }

      try {
        const mimeType = getMimeTypeFromUrl(url);
        const fileType = getFileTypeFromMime(mimeType);
        const filename = getFilenameFromUrl(url);
        const usageCount = urlUsageCount.get(url) || 1;

        await addDoc(mediaCollection, {
          filename,
          originalFilename: filename,
          fileType,
          mimeType,
          fileSize: 0, // Unknown for external URLs
          url,
          folder: source.folder,
          uploadedAt: now,
          uploadedBy: 'migration',
          uploadedByName: 'Media Migration',
          usedInCount: usageCount,
          tags: source.category
            ? [source.sourceCollection, source.category.toLowerCase()]
            : [source.sourceCollection],
          altText: source.sourceTitle || '',
        });

        stats[source.sourceCollection === 'businesses' ? 'businesses' : source.sourceCollection].imported++;
        totalImported++;
      } catch (error) {
        console.error(`Failed to import ${url}:`, error);
        stats[source.sourceCollection === 'businesses' ? 'businesses' : source.sourceCollection].errors++;
        totalErrors++;
      }
    }

    return NextResponse.json({
      success: true,
      message: `Migration complete. Imported ${totalImported} media files.`,
      stats: {
        articles: stats.articles,
        directory: stats.businesses,
        advertising: stats.advertisements,
        blog: stats.blogPosts,
        events: stats.events,
      },
      totals: {
        totalFound: allSources.length,
        uniqueUrls: uniqueSources.size,
        imported: totalImported,
        skipped: totalSkipped,
        errors: totalErrors,
      },
    });
  } catch (error) {
    console.error('Error running media migration:', error);
    return NextResponse.json(
      { error: 'Failed to run migration', details: error instanceof Error ? error.message : 'Unknown error' },
      { status: 500 }
    );
  }
}

/**
 * DELETE /api/admin/migrate-media
 * Clears all previously migrated media records to allow fresh re-import
 */
export async function DELETE() {
  try {
    const { writeBatch, deleteDoc } = await import('firebase/firestore');

    // Find all migration-imported records
    const q = query(collection(getDb(), 'media'), where('uploadedBy', '==', 'migration'));
    const snapshot = await getDocs(q);

    if (snapshot.empty) {
      return NextResponse.json({
        success: true,
        message: 'No migration records to clear',
        deleted: 0,
      });
    }

    // Delete in batches of 500 (Firestore limit)
    const batch = writeBatch(getDb());
    let deleteCount = 0;

    for (const docSnapshot of snapshot.docs) {
      batch.delete(docSnapshot.ref);
      deleteCount++;
    }

    await batch.commit();

    return NextResponse.json({
      success: true,
      message: `Cleared ${deleteCount} migrated media records. You can now re-run the import.`,
      deleted: deleteCount,
    });
  } catch (error) {
    console.error('Error clearing migration:', error);
    return NextResponse.json(
      { error: 'Failed to clear migration', details: error instanceof Error ? error.message : 'Unknown error' },
      { status: 500 }
    );
  }
}
