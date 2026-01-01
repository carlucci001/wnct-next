import {
  collection,
  getDocs,
  getDoc,
  query,
  where,
  limit,
  doc,
  deleteDoc,
  updateDoc,
  writeBatch,
  Timestamp,
  type QueryDocumentSnapshot,
  type DocumentData
} from 'firebase/firestore';
import { db } from './firebase';
import { Article } from '@/types/article';

const ARTICLES_COLLECTION = 'articles';

const convertDocToArticle = (doc: QueryDocumentSnapshot<DocumentData, DocumentData>): Article => {
  const data = doc.data();

  // Handle date conversion
  const getDateString = (field: unknown): string => {
    if (field instanceof Timestamp) {
      return field.toDate().toISOString();
    }
    if (typeof field === 'string') {
      return field;
    }
    return '';
  };

  const publishedAt = getDateString(data.publishedAt);
  const createdAt = getDateString(data.createdAt);

  return {
    id: doc.id,
    title: data.title || '',
    content: data.content || '',
    slug: data.slug || doc.id,
    author: data.author || 'Staff Writer',
    category: data.category || 'Uncategorized',
    categoryColor: data.categoryColor || '#1d4ed8',
    tags: data.tags || [],
    status: data.status || 'draft',
    publishedAt,
    createdAt,
    updatedAt: getDateString(data.updatedAt),
    date: publishedAt || createdAt,
    featuredImage: data.featuredImage || data.imageUrl || '',
    imageUrl: data.imageUrl || data.featuredImage || '',
    excerpt: data.excerpt || (data.content ? data.content.substring(0, 150) + '...' : ''),
    isFeatured: data.isFeatured || false,
    isBreakingNews: data.isBreakingNews || false,
    breakingNewsTimestamp: getDateString(data.breakingNewsTimestamp),
    views: data.views || 0,
  } as Article;
};

// Helper to check if article is published (handles both cases)
const isPublished = (status?: string): boolean => {
  return status?.toLowerCase() === 'published';
};

// Helper to get sortable date
const getSortDate = (article: Article): number => {
  const dateStr = article.publishedAt || article.createdAt || article.date || '';
  return dateStr ? new Date(dateStr).getTime() : 0;
};

/**
 * Fetch all published articles (client-side filtering to avoid index)
 */
export async function getArticles(): Promise<Article[]> {
  try {
    const querySnapshot = await getDocs(collection(db, ARTICLES_COLLECTION));
    return querySnapshot.docs
      .map(convertDocToArticle)
      .filter(article => isPublished(article.status))
      .sort((a, b) => getSortDate(b) - getSortDate(a));
  } catch (error) {
    console.error('Error fetching articles:', error);
    return [];
  }
}

/**
 * Fetch a single article by slug or ID
 */
export async function getArticleBySlug(slugOrId: string): Promise<Article | null> {
  try {
    // First try to find by slug field
    const q = query(
      collection(db, ARTICLES_COLLECTION),
      where('slug', '==', slugOrId),
      limit(1)
    );
    const querySnapshot = await getDocs(q);
    if (!querySnapshot.empty) {
      return convertDocToArticle(querySnapshot.docs[0]);
    }

    // If not found by slug, try to fetch by document ID
    const docRef = doc(db, ARTICLES_COLLECTION, slugOrId);
    const docSnap = await getDoc(docRef);
    if (docSnap.exists()) {
      return convertDocToArticle(docSnap as QueryDocumentSnapshot<DocumentData, DocumentData>);
    }

    return null;
  } catch (error) {
    console.error(`Error fetching article with slug/id ${slugOrId}:`, error);
    return null;
  }
}

/**
 * Fetch articles by category (client-side filtering to avoid index)
 */
export async function getArticlesByCategory(category: string): Promise<Article[]> {
  try {
    const querySnapshot = await getDocs(collection(db, ARTICLES_COLLECTION));
    return querySnapshot.docs
      .map(convertDocToArticle)
      .filter(article => article.category.toLowerCase() === category.toLowerCase() && isPublished(article.status))
      .sort((a, b) => getSortDate(b) - getSortDate(a));
  } catch (error) {
    console.error(`Error fetching articles in category ${category}:`, error);
    return [];
  }
}

/**
 * Fetch ALL articles (including drafts) - for admin use
 */
export async function getAllArticles(): Promise<Article[]> {
  try {
    const querySnapshot = await getDocs(collection(db, ARTICLES_COLLECTION));
    return querySnapshot.docs
      .map(convertDocToArticle)
      .sort((a, b) => getSortDate(b) - getSortDate(a));
  } catch (error) {
    console.error('Error fetching all articles:', error);
    return [];
  }
}

/**
 * Delete an article by ID
 */
export async function deleteArticle(id: string): Promise<boolean> {
  try {
    await deleteDoc(doc(db, ARTICLES_COLLECTION, id));
    return true;
  } catch (error) {
    console.error(`Error deleting article ${id}:`, error);
    return false;
  }
}

/**
 * Format and clean up HTML content for an article
 * Removes empty tags, excessive whitespace, and normalizes structure
 */
export function formatArticleContent(html: string): string {
  if (!html) return '';

  let formatted = html;

  // Remove empty paragraphs and divs
  formatted = formatted.replace(/<p>\s*<br\s*\/?>\s*<\/p>/gi, '');
  formatted = formatted.replace(/<p>\s*&nbsp;\s*<\/p>/gi, '');
  formatted = formatted.replace(/<p><\/p>/gi, '');
  formatted = formatted.replace(/<div>\s*<br\s*\/?>\s*<\/div>/gi, '');
  formatted = formatted.replace(/<div><\/div>/gi, '');

  // Remove excessive <br> tags (more than 2 in a row)
  formatted = formatted.replace(/(<br\s*\/?>\s*){3,}/gi, '<br><br>');

  // Remove empty spans
  formatted = formatted.replace(/<span>\s*<\/span>/gi, '');
  formatted = formatted.replace(/<span[^>]*>\s*<\/span>/gi, '');

  // Clean up multiple &nbsp;
  formatted = formatted.replace(/&nbsp;(&nbsp;)+/gi, ' ');
  formatted = formatted.replace(/&nbsp;/gi, ' ');

  // Remove problematic inline styles
  formatted = formatted.replace(/\s*style="[^"]*font-family:[^"]*"/gi, '');
  formatted = formatted.replace(/\s*style="[^"]*background-color:\s*transparent[^"]*"/gi, '');
  formatted = formatted.replace(/\s*style="[^"]*color:\s*rgb\([^)]+\)[^"]*"/gi, '');

  // Remove class attributes from common tags (often garbage from pasting)
  formatted = formatted.replace(/<(p|div|span)([^>]*)\s+class="[^"]*"([^>]*)>/gi, '<$1$2$3>');

  // Wrap loose text in paragraphs (text not inside any tag)
  // This is tricky - we'll skip it for safety

  // Clean up whitespace between tags
  formatted = formatted.replace(/>\s+</g, '><');

  // Add proper spacing back for readability
  formatted = formatted.replace(/<\/p><p>/g, '</p>\n<p>');
  formatted = formatted.replace(/<\/h([1-6])><([hp])/g, '</h$1>\n<$2');
  formatted = formatted.replace(/<\/blockquote><([hp])/g, '</blockquote>\n<$1');
  formatted = formatted.replace(/<\/ul><([hp])/g, '</ul>\n<$1');
  formatted = formatted.replace(/<\/ol><([hp])/g, '</ol>\n<$1');

  // Remove leading/trailing whitespace
  formatted = formatted.trim();

  // If content is just plain text (no HTML tags), wrap in paragraph
  if (!/<[^>]+>/.test(formatted) && formatted.length > 0) {
    formatted = `<p>${formatted}</p>`;
  }

  return formatted;
}

/**
 * Format excerpt - clean up and ensure proper length
 */
export function formatExcerpt(excerpt: string, maxLength: number = 200): string {
  if (!excerpt) return '';

  // Strip HTML tags for excerpt
  let text = excerpt.replace(/<[^>]+>/g, '');

  // Decode HTML entities
  text = text.replace(/&nbsp;/g, ' ');
  text = text.replace(/&amp;/g, '&');
  text = text.replace(/&quot;/g, '"');
  text = text.replace(/&lt;/g, '<');
  text = text.replace(/&gt;/g, '>');
  text = text.replace(/&#39;/g, "'");

  // Clean up whitespace
  text = text.replace(/\s+/g, ' ').trim();

  // Truncate if needed
  if (text.length > maxLength) {
    text = text.substring(0, maxLength).trim();
    // Don't cut in the middle of a word
    const lastSpace = text.lastIndexOf(' ');
    if (lastSpace > maxLength - 30) {
      text = text.substring(0, lastSpace);
    }
    text += '...';
  }

  return text;
}

/**
 * Batch format all articles in Firestore
 * Returns the number of articles updated
 */
export async function batchFormatArticles(
  onProgress?: (current: number, total: number, message: string) => void
): Promise<{ updated: number; errors: string[] }> {
  const errors: string[] = [];
  let updated = 0;

  try {
    // Get all articles
    onProgress?.(0, 0, 'Fetching articles from database...');
    const querySnapshot = await getDocs(collection(db, ARTICLES_COLLECTION));
    const total = querySnapshot.docs.length;

    if (total === 0) {
      return { updated: 0, errors: ['No articles found in database'] };
    }

    onProgress?.(0, total, `Found ${total} articles. Starting format...`);

    // Process in batches of 500 (Firestore limit)
    const BATCH_SIZE = 500;
    let batchCount = 0;
    let batch = writeBatch(db);

    for (let i = 0; i < querySnapshot.docs.length; i++) {
      const docSnapshot = querySnapshot.docs[i];
      const data = docSnapshot.data();

      try {
        // Format content and excerpt
        const originalContent = data.content || '';
        const originalExcerpt = data.excerpt || '';

        const formattedContent = formatArticleContent(originalContent);
        const formattedExcerpt = formatExcerpt(originalExcerpt) ||
          formatExcerpt(formattedContent.replace(/<[^>]+>/g, ''), 200);

        // Only update if content changed
        if (formattedContent !== originalContent || formattedExcerpt !== originalExcerpt) {
          const docRef = doc(db, ARTICLES_COLLECTION, docSnapshot.id);
          batch.update(docRef, {
            content: formattedContent,
            excerpt: formattedExcerpt,
            updatedAt: new Date().toISOString()
          });
          batchCount++;
          updated++;
        }

        // Commit batch when it reaches the limit
        if (batchCount >= BATCH_SIZE) {
          onProgress?.(i + 1, total, `Committing batch of ${batchCount} updates...`);
          await batch.commit();
          batch = writeBatch(db);
          batchCount = 0;
        }

        onProgress?.(i + 1, total, `Processing article ${i + 1} of ${total}...`);
      } catch (err) {
        const errorMsg = `Error formatting article ${docSnapshot.id}: ${err}`;
        console.error(errorMsg);
        errors.push(errorMsg);
      }
    }

    // Commit any remaining updates
    if (batchCount > 0) {
      onProgress?.(total, total, `Committing final batch of ${batchCount} updates...`);
      await batch.commit();
    }

    onProgress?.(total, total, `Complete! Updated ${updated} articles.`);
    return { updated, errors };

  } catch (error) {
    const errorMsg = `Batch format failed: ${error}`;
    console.error(errorMsg);
    errors.push(errorMsg);
    return { updated, errors };
  }
}

/**
 * Batch migrate all article images to Firebase Storage
 * This will fetch images from temporary URLs and save them permanently
 */
export async function batchMigrateImages(
  onProgress?: (current: number, total: number, message: string) => void
): Promise<{ migrated: number; failed: number; errors: string[] }> {
  const errors: string[] = [];
  let migrated = 0;
  let failed = 0;

  try {
    // Dynamically import storage service to avoid circular deps
    const { storageService } = await import('./storage');

    onProgress?.(0, 0, 'Fetching all articles...');
    const querySnapshot = await getDocs(collection(db, ARTICLES_COLLECTION));
    const total = querySnapshot.docs.length;

    if (total === 0) {
      return { migrated: 0, failed: 0, errors: ['No articles found'] };
    }

    onProgress?.(0, total, `Found ${total} articles. Starting image migration...`);

    for (let i = 0; i < querySnapshot.docs.length; i++) {
      const docSnapshot = querySnapshot.docs[i];
      const data = docSnapshot.data();
      const imageUrl = data.featuredImage || data.imageUrl;

      // Skip if no image or already in Firebase Storage
      if (!imageUrl) {
        onProgress?.(i + 1, total, `Article ${i + 1}: No image, skipping`);
        continue;
      }

      if (imageUrl.includes('firebasestorage.googleapis.com') ||
          imageUrl.includes('storage.googleapis.com')) {
        onProgress?.(i + 1, total, `Article ${i + 1}: Already in Storage, skipping`);
        continue;
      }

      try {
        onProgress?.(i + 1, total, `Article ${i + 1}: Migrating image...`);

        // Try to fetch and upload the image
        const permanentUrl = await storageService.uploadAssetFromUrl(imageUrl);

        // If we got a different URL back, update the article
        if (permanentUrl !== imageUrl && permanentUrl.includes('firebasestorage.googleapis.com')) {
          await updateDoc(doc(db, ARTICLES_COLLECTION, docSnapshot.id), {
            featuredImage: permanentUrl,
            imageUrl: permanentUrl,
            updatedAt: new Date().toISOString()
          });
          migrated++;
          onProgress?.(i + 1, total, `Article ${i + 1}: ✓ Image migrated successfully`);
        } else {
          failed++;
          errors.push(`Article ${data.title || docSnapshot.id}: Could not migrate image`);
          onProgress?.(i + 1, total, `Article ${i + 1}: ✗ Migration failed`);
        }
      } catch (err) {
        failed++;
        const errorMsg = `Article ${data.title || docSnapshot.id}: ${err}`;
        errors.push(errorMsg);
        onProgress?.(i + 1, total, `Article ${i + 1}: ✗ Error - ${err}`);
      }
    }

    onProgress?.(total, total, `Complete! Migrated: ${migrated}, Failed: ${failed}`);
    return { migrated, failed, errors };

  } catch (error) {
    const errorMsg = `Batch migration failed: ${error}`;
    console.error(errorMsg);
    errors.push(errorMsg);
    return { migrated, failed, errors };
  }
}
