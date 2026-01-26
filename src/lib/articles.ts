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
import { getDb } from './firebase';
import { Article } from '@/types/article';
import { User } from '@/types/user';

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
    authorId: data.authorId || '',
    authorPhotoURL: data.authorPhotoURL || '',
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
    // SEO & Social Metadata
    metaDescription: data.metaDescription || '',
    keywords: data.keywords || [],
    hashtags: data.hashtags || [],
    localKeywords: data.localKeywords || [],
    geoTags: data.geoTags || [],
    entities: data.entities || { people: [], organizations: [], locations: [], topics: [] },
    imageAltText: data.imageAltText || '',
    schema: data.schema || '',
    // Additional metadata
    imageAttribution: data.imageAttribution || '',
    sourceUrl: data.sourceUrl || '',
    sourceTitle: data.sourceTitle || '',
    generationCosts: data.generationCosts || null,
    factCheckStatus: data.factCheckStatus || null,
    factCheckSummary: data.factCheckSummary || '',
    factCheckConfidence: data.factCheckConfidence || null,
    factCheckedAt: getDateString(data.factCheckedAt),
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
    const querySnapshot = await getDocs(collection(getDb(), ARTICLES_COLLECTION));
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
      collection(getDb(), ARTICLES_COLLECTION),
      where('slug', '==', slugOrId),
      limit(1)
    );
    const querySnapshot = await getDocs(q);
    if (!querySnapshot.empty) {
      return convertDocToArticle(querySnapshot.docs[0]);
    }

    // If not found by slug, try to fetch by document ID
    const docRef = doc(getDb(), ARTICLES_COLLECTION, slugOrId);
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
    const querySnapshot = await getDocs(collection(getDb(), ARTICLES_COLLECTION));
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
    const querySnapshot = await getDocs(collection(getDb(), ARTICLES_COLLECTION));
    return querySnapshot.docs
      .map(convertDocToArticle)
      .sort((a, b) => getSortDate(b) - getSortDate(a));
  } catch (error) {
    console.error('Error fetching all articles:', error);
    return [];
  }
}

/**
 * Search parameters for advanced search
 */
export interface SearchParams {
  query: string;
  category?: string;
  author?: string;
  dateFrom?: string;
  dateTo?: string;
  sortBy?: 'relevance' | 'date' | 'title';
}

/**
 * Search articles by query string and optional filters
 */
export async function searchArticles(params: SearchParams): Promise<Article[]> {
  try {
    const querySnapshot = await getDocs(collection(getDb(), ARTICLES_COLLECTION));
    const searchTerms = params.query.toLowerCase().split(/\s+/).filter(t => t.length > 0);

    const results = querySnapshot.docs
      .map(convertDocToArticle)
      .filter(article => {
        // Only search published articles
        if (!isPublished(article.status)) return false;

        // Text search across title, content, excerpt, author, tags
        if (searchTerms.length > 0) {
          const searchableText = [
            article.title,
            article.content,
            article.excerpt,
            article.author,
            ...(article.tags || [])
          ].join(' ').toLowerCase();

          // All search terms must match
          const matchesQuery = searchTerms.every(term => searchableText.includes(term));
          if (!matchesQuery) return false;
        }

        // Category filter
        if (params.category && article.category.toLowerCase() !== params.category.toLowerCase()) {
          return false;
        }

        // Author filter
        if (params.author && !article.author.toLowerCase().includes(params.author.toLowerCase())) {
          return false;
        }

        // Date range filter
        const articleDate = getSortDate(article);
        if (params.dateFrom) {
          const fromDate = new Date(params.dateFrom).getTime();
          if (articleDate < fromDate) return false;
        }
        if (params.dateTo) {
          const toDate = new Date(params.dateTo).getTime() + 86400000; // Include end date
          if (articleDate > toDate) return false;
        }

        return true;
      });

    // Sort results
    if (params.sortBy === 'title') {
      results.sort((a, b) => a.title.localeCompare(b.title));
    } else if (params.sortBy === 'relevance' && searchTerms.length > 0) {
      // Score by number of term matches in title (weighted higher) vs content
      results.sort((a, b) => {
        const scoreA = searchTerms.reduce((score, term) => {
          return score +
            (a.title.toLowerCase().includes(term) ? 10 : 0) +
            ((a.excerpt || '').toLowerCase().includes(term) ? 3 : 0) +
            ((a.content || '').toLowerCase().includes(term) ? 1 : 0);
        }, 0);
        const scoreB = searchTerms.reduce((score, term) => {
          return score +
            (b.title.toLowerCase().includes(term) ? 10 : 0) +
            ((b.excerpt || '').toLowerCase().includes(term) ? 3 : 0) +
            ((b.content || '').toLowerCase().includes(term) ? 1 : 0);
        }, 0);
        return scoreB - scoreA;
      });
    } else {
      // Default: sort by date
      results.sort((a, b) => getSortDate(b) - getSortDate(a));
    }

    return results;
  } catch (error) {
    console.error('Error searching articles:', error);
    return [];
  }
}

/**
 * Get all unique categories from published articles
 */
export async function getCategories(): Promise<string[]> {
  try {
    const querySnapshot = await getDocs(collection(getDb(), ARTICLES_COLLECTION));
    const categories = new Set<string>();

    querySnapshot.docs.forEach(doc => {
      const data = doc.data();
      if (isPublished(data.status) && data.category) {
        categories.add(data.category);
      }
    });

    return Array.from(categories).sort();
  } catch (error) {
    console.error('Error fetching categories:', error);
    return [];
  }
}

/**
 * Get all unique authors from published articles
 */
export async function getAuthors(): Promise<string[]> {
  try {
    const querySnapshot = await getDocs(collection(getDb(), ARTICLES_COLLECTION));
    const authors = new Set<string>();

    querySnapshot.docs.forEach(doc => {
      const data = doc.data();
      if (isPublished(data.status) && data.author) {
        authors.add(data.author);
      }
    });

    return Array.from(authors).sort();
  } catch (error) {
    console.error('Error fetching authors:', error);
    return [];
  }
}

/**
 * Delete an article by ID
 */
export async function deleteArticle(id: string): Promise<boolean> {
  try {
    await deleteDoc(doc(getDb(), ARTICLES_COLLECTION, id));
    return true;
  } catch (error) {
    console.error(`Error deleting article ${id}:`, error);
    return false;
  }
}

/**
 * Update an article by ID
 */
export async function updateArticle(
  id: string,
  updates: Partial<Article>
): Promise<boolean> {
  try {
    const docRef = doc(getDb(), ARTICLES_COLLECTION, id);
    await updateDoc(docRef, {
      ...updates,
      updatedAt: new Date().toISOString(),
    });
    return true;
  } catch (error) {
    console.error(`Error updating article ${id}:`, error);
    return false;
  }
}

/**
 * Bulk delete articles by IDs
 */
export async function deleteArticles(ids: string[]): Promise<boolean> {
  try {
    const batch = writeBatch(getDb());
    ids.forEach((id) => batch.delete(doc(getDb(), ARTICLES_COLLECTION, id)));
    await batch.commit();
    return true;
  } catch (error) {
    console.error('Error bulk deleting articles:', error);
    return false;
  }
}

/**
 * Bulk update articles status
 */
export async function updateArticlesStatus(
  ids: string[],
  status: Article['status']
): Promise<boolean> {
  try {
    const batch = writeBatch(getDb());
    ids.forEach((id) =>
      batch.update(doc(getDb(), ARTICLES_COLLECTION, id), {
        status,
        updatedAt: new Date().toISOString(),
      })
    );
    await batch.commit();
    return true;
  } catch (error) {
    console.error('Error bulk updating articles status:', error);
    return false;
  }
}

/**
 * Bulk update articles category
 */
export async function updateArticlesCategory(
  ids: string[],
  category: string,
  categoryColor?: string
): Promise<boolean> {
  try {
    const batch = writeBatch(getDb());
    const updateData: Record<string, unknown> = {
      category,
      updatedAt: new Date().toISOString(),
    };
    if (categoryColor) {
      updateData.categoryColor = categoryColor;
    }
    ids.forEach((id) =>
      batch.update(doc(getDb(), ARTICLES_COLLECTION, id), updateData)
    );
    await batch.commit();
    return true;
  } catch (error) {
    console.error('Error bulk updating articles category:', error);
    return false;
  }
}

/**
 * Toggle featured status for an article
 */
export async function toggleArticleFeatured(
  id: string,
  isFeatured: boolean
): Promise<boolean> {
  try {
    const docRef = doc(getDb(), ARTICLES_COLLECTION, id);
    await updateDoc(docRef, {
      isFeatured,
      updatedAt: new Date().toISOString(),
    });
    return true;
  } catch (error) {
    console.error(`Error toggling featured for article ${id}:`, error);
    return false;
  }
}

/**
 * Format and clean up HTML content for an article
 * Converts plain text with line breaks to proper HTML paragraphs
 * Removes empty tags, excessive whitespace, and normalizes structure
 * Also splits giant single-paragraph content into multiple paragraphs
 */
export function formatArticleContent(html: string): string {
  if (!html) return '';

  let formatted = html.trim();

  // Check if content is mostly plain text (no block-level HTML tags)
  const hasBlockTags = /<(p|div|h[1-6]|ul|ol|li|blockquote|pre|table|article|section)[^>]*>/i.test(formatted);

  if (!hasBlockTags) {
    // Content is plain text - convert line breaks to paragraphs
    // First, normalize line endings
    formatted = formatted.replace(/\r\n/g, '\n').replace(/\r/g, '\n');

    // Split by double newlines (paragraph breaks)
    const paragraphs = formatted.split(/\n\n+/).filter(p => p.trim());

    if (paragraphs.length > 0) {
      // Convert each paragraph, preserving single line breaks as <br>
      const newFormatted = paragraphs.map(p => {
        // Replace single newlines with <br> within paragraphs
        const withBreaks = p.trim().replace(/\n/g, '<br>');
        return `<p>${withBreaks}</p>`;
      }).join('\n');
      formatted = newFormatted;
    } else if (formatted.length > 0) {
      // Single block of text
      formatted = `<p>${formatted.replace(/\n/g, '<br>')}</p>`;
    }
  }

  // CRITICAL: Split giant single-paragraph content into multiple paragraphs
  // This handles cases where AI returned everything in one <p> tag
  const pTagCount = (formatted.match(/<p[^>]*>/gi) || []).length;
  const textContent = formatted.replace(/<[^>]+>/g, '');
  const contentLength = textContent.length;

  if (pTagCount <= 1 && contentLength > 500) {
    // Extract the text content
    const text = textContent.trim();

    // Split on sentence endings that typically mark paragraph breaks
    const sentences = text.match(/[^.!?]+[.!?]+(?:\s+|$)/g) || [text];
    const paragraphs: string[] = [];
    let currentParagraph = '';
    let sentenceCount = 0;

    for (const sentence of sentences) {
      currentParagraph += sentence;
      sentenceCount++;

      // Start new paragraph after: quotes end, or every 3-4 sentences, or long enough
      const isQuoteEnd = sentence.includes('" ') || sentence.includes('." ') || sentence.includes('," ');
      const isLongEnough = sentenceCount >= 3 && currentParagraph.length > 200;

      if (isQuoteEnd || isLongEnough || sentenceCount >= 4) {
        paragraphs.push(currentParagraph.trim());
        currentParagraph = '';
        sentenceCount = 0;
      }
    }

    // Don't forget the last paragraph
    if (currentParagraph.trim()) {
      paragraphs.push(currentParagraph.trim());
    }

    // Rebuild with proper paragraph tags if we split successfully
    if (paragraphs.length > 1) {
      formatted = paragraphs.map(p => `<p>${p}</p>`).join('\n');
    }
  }

  // Now clean up the HTML

  // Remove empty paragraphs and divs
  formatted = formatted.replace(/<p>\s*<br\s*\/?>\s*<\/p>/gi, '');
  formatted = formatted.replace(/<p>\s*&nbsp;\s*<\/p>/gi, '');
  formatted = formatted.replace(/<p><\/p>/gi, '');
  formatted = formatted.replace(/<p>\s*<\/p>/gi, '');
  formatted = formatted.replace(/<div>\s*<br\s*\/?>\s*<\/div>/gi, '');
  formatted = formatted.replace(/<div><\/div>/gi, '');

  // Remove excessive <br> tags (more than 2 in a row)
  formatted = formatted.replace(/(<br\s*\/?>\s*){3,}/gi, '<br><br>');

  // Remove empty spans
  formatted = formatted.replace(/<span>\s*<\/span>/gi, '');
  formatted = formatted.replace(/<span[^>]*>\s*<\/span>/gi, '');

  // Clean up multiple &nbsp;
  formatted = formatted.replace(/&nbsp;(&nbsp;)+/gi, ' ');

  // Remove problematic inline styles that break formatting
  formatted = formatted.replace(/\s*style="[^"]*font-family:[^"]*"/gi, '');
  formatted = formatted.replace(/\s*style="[^"]*background-color:\s*transparent[^"]*"/gi, '');

  // Remove class attributes from common tags (often garbage from pasting)
  formatted = formatted.replace(/<(p|div|span)([^>]*)\s+class="[^"]*"([^>]*)>/gi, '<$1$2$3>');

  // Clean up extra whitespace but preserve structure
  formatted = formatted.replace(/>\s+</g, '>\n<');

  // Remove leading/trailing whitespace
  formatted = formatted.trim();

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
    const querySnapshot = await getDocs(collection(getDb(), ARTICLES_COLLECTION));
    const total = querySnapshot.docs.length;

    if (total === 0) {
      return { updated: 0, errors: ['No articles found in database'] };
    }

    onProgress?.(0, total, `Found ${total} articles. Starting format...`);

    // Process in batches of 500 (Firestore limit)
    const BATCH_SIZE = 500;
    let batchCount = 0;
    let batch = writeBatch(getDb());

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
          const docRef = doc(getDb(), ARTICLES_COLLECTION, docSnapshot.id);
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
          batch = writeBatch(getDb());
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
    const querySnapshot = await getDocs(collection(getDb(), ARTICLES_COLLECTION));
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
          await updateDoc(doc(getDb(), ARTICLES_COLLECTION, docSnapshot.id), {
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

/**
 * Batch assign all articles to a specific user
 * Finds user by display name and updates all articles with their info
 */
export async function batchAssignArticlesToUser(
  displayName: string,
  onProgress?: (current: number, total: number, message: string) => void,
  directPhotoURL?: string
): Promise<{ updated: number; errors: string[] }> {
  const errors: string[] = [];
  let updated = 0;

  try {
    // Find user by display name
    onProgress?.(0, 0, `Searching for user "${displayName}"...`);
    const usersSnapshot = await getDocs(collection(getDb(), 'users'));

    let targetUser: User | null = null;
    for (const userDoc of usersSnapshot.docs) {
      const userData = userDoc.data();
      if (userData.displayName?.toLowerCase() === displayName.toLowerCase()) {
        targetUser = {
          id: userDoc.id,
          email: userData.email,
          displayName: userData.displayName,
          photoURL: userData.photoURL,
          role: userData.role,
          accountType: userData.accountType,
          status: userData.status,
        } as User;
        break;
      }
    }

    if (!targetUser) {
      return { updated: 0, errors: [`User "${displayName}" not found`] };
    }

    const photoURLToUse = directPhotoURL || targetUser.photoURL || null;

    onProgress?.(0, 0, `Found user: ${targetUser.displayName} (Photo: ${photoURLToUse ? 'Yes' : 'No'})`);

    // Get all articles
    const querySnapshot = await getDocs(collection(getDb(), ARTICLES_COLLECTION));
    const total = querySnapshot.docs.length;

    if (total === 0) {
      return { updated: 0, errors: ['No articles found in database'] };
    }

    onProgress?.(0, total, `Found ${total} articles. Starting assignment...`);

    // Process in batches of 500 (Firestore limit)
    const BATCH_SIZE = 500;
    let batchCount = 0;
    let batch = writeBatch(getDb());

    for (let i = 0; i < querySnapshot.docs.length; i++) {
      const docSnapshot = querySnapshot.docs[i];

      try {
        const docRef = doc(getDb(), ARTICLES_COLLECTION, docSnapshot.id);
        batch.update(docRef, {
          author: targetUser.displayName || displayName,
          authorId: targetUser.id,
          authorPhotoURL: photoURLToUse,
          updatedAt: new Date().toISOString()
        });
        batchCount++;
        updated++;

        // Commit batch when it reaches the limit
        if (batchCount >= BATCH_SIZE) {
          onProgress?.(i + 1, total, `Committing batch of ${batchCount} updates...`);
          await batch.commit();
          batch = writeBatch(getDb());
          batchCount = 0;
        }

        onProgress?.(i + 1, total, `Assigning article ${i + 1} of ${total}...`);
      } catch (err) {
        const errorMsg = `Error updating article ${docSnapshot.id}: ${err}`;
        console.error(errorMsg);
        errors.push(errorMsg);
      }
    }

    // Commit any remaining updates
    if (batchCount > 0) {
      onProgress?.(total, total, `Committing final batch of ${batchCount} updates...`);
      await batch.commit();
    }

    onProgress?.(total, total, `Complete! Assigned ${updated} articles to ${targetUser.displayName}.`);
    return { updated, errors };

  } catch (error) {
    const errorMsg = `Batch assign failed: ${error}`;
    console.error(errorMsg);
    errors.push(errorMsg);
    return { updated, errors };
  }
}
