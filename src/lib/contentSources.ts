import { getDb } from './firebase';
import {
  collection,
  getDocs,
  doc,
  updateDoc,
  getDoc,
  deleteDoc,
  addDoc,
  query,
  where,
  orderBy,
  writeBatch,
} from 'firebase/firestore';
import {
  ContentSource,
  ContentSourceInput,
  ContentItem,
  DEFAULT_RSS_SOURCES,
} from '@/types/contentSource';

const SOURCES_COLLECTION = 'contentSources';
const ITEMS_COLLECTION = 'contentItems';

// ============================================
// Content Source CRUD Operations
// ============================================

/**
 * Get all content sources
 */
export async function getAllContentSources(activeOnly: boolean = false): Promise<ContentSource[]> {
  try {
    const querySnapshot = await getDocs(collection(getDb(), SOURCES_COLLECTION));
    let sources = querySnapshot.docs.map((docSnap) => {
      const data = docSnap.data();
      return {
        id: docSnap.id,
        name: data.name || '',
        type: data.type || 'rss',
        url: data.url || '',
        categoryId: data.categoryId || undefined,
        region: data.region || '',
        keywords: data.keywords || [],
        isActive: data.isActive ?? true,
        priority: data.priority ?? 5,
        refreshIntervalMinutes: data.refreshIntervalMinutes ?? 60,
        lastFetchedAt: data.lastFetchedAt || undefined,
        createdAt: data.createdAt || new Date().toISOString(),
        updatedAt: data.updatedAt || new Date().toISOString(),
      } as ContentSource;
    });

    // Sort by priority (higher first)
    sources.sort((a, b) => b.priority - a.priority);

    if (activeOnly) {
      sources = sources.filter((s) => s.isActive);
    }

    return sources;
  } catch (error) {
    console.error('Error fetching content sources:', error);
    return [];
  }
}

/**
 * Get content sources for a specific category
 */
export async function getSourcesForCategory(categoryId: string): Promise<ContentSource[]> {
  try {
    const allSources = await getAllContentSources(true);
    // Return sources that are either for this category or not category-specific
    return allSources.filter((s) => !s.categoryId || s.categoryId === categoryId);
  } catch (error) {
    console.error('Error fetching sources for category:', error);
    return [];
  }
}

/**
 * Get a single content source
 */
export async function getContentSource(id: string): Promise<ContentSource | null> {
  try {
    const docRef = doc(getDb(), SOURCES_COLLECTION, id);
    const docSnap = await getDoc(docRef);
    if (!docSnap.exists()) return null;

    const data = docSnap.data();
    return {
      id: docSnap.id,
      name: data.name || '',
      type: data.type || 'rss',
      url: data.url || '',
      categoryId: data.categoryId || undefined,
      region: data.region || '',
      keywords: data.keywords || [],
      isActive: data.isActive ?? true,
      priority: data.priority ?? 5,
      refreshIntervalMinutes: data.refreshIntervalMinutes ?? 60,
      lastFetchedAt: data.lastFetchedAt || undefined,
      createdAt: data.createdAt || new Date().toISOString(),
      updatedAt: data.updatedAt || new Date().toISOString(),
    } as ContentSource;
  } catch (error) {
    console.error('Error fetching content source:', error);
    return null;
  }
}

/**
 * Create a new content source
 */
export async function createContentSource(data: ContentSourceInput): Promise<string> {
  try {
    const now = new Date().toISOString();
    const docRef = await addDoc(collection(getDb(), SOURCES_COLLECTION), {
      ...data,
      createdAt: now,
      updatedAt: now,
    });
    return docRef.id;
  } catch (error) {
    console.error('Error creating content source:', error);
    throw error;
  }
}

/**
 * Update a content source
 */
export async function updateContentSource(
  id: string,
  data: Partial<ContentSourceInput>
): Promise<void> {
  try {
    const docRef = doc(getDb(), SOURCES_COLLECTION, id);
    await updateDoc(docRef, {
      ...data,
      updatedAt: new Date().toISOString(),
    });
  } catch (error) {
    console.error('Error updating content source:', error);
    throw error;
  }
}

/**
 * Delete a content source
 */
export async function deleteContentSource(id: string): Promise<void> {
  try {
    const docRef = doc(getDb(), SOURCES_COLLECTION, id);
    await deleteDoc(docRef);
  } catch (error) {
    console.error('Error deleting content source:', error);
    throw error;
  }
}

/**
 * Seed default RSS sources if none exist
 */
export async function seedDefaultSources(): Promise<number> {
  try {
    const existing = await getAllContentSources();
    if (existing.length > 0) {
      console.log('Content sources already exist, skipping seed');
      return 0;
    }

    const batch = writeBatch(getDb());
    const now = new Date().toISOString();

    DEFAULT_RSS_SOURCES.forEach((source) => {
      const docRef = doc(collection(getDb(), SOURCES_COLLECTION));
      batch.set(docRef, {
        ...source,
        createdAt: now,
        updatedAt: now,
      });
    });

    await batch.commit();
    console.log(`Seeded ${DEFAULT_RSS_SOURCES.length} default content sources`);
    return DEFAULT_RSS_SOURCES.length;
  } catch (error) {
    console.error('Error seeding default sources:', error);
    throw error;
  }
}

// ============================================
// Content Item Operations
// ============================================

/**
 * Save fetched content items
 */
export async function saveContentItems(items: Omit<ContentItem, 'id'>[]): Promise<string[]> {
  try {
    const batch = writeBatch(getDb());
    const ids: string[] = [];

    for (const item of items) {
      const docRef = doc(collection(getDb(), ITEMS_COLLECTION));
      batch.set(docRef, item);
      ids.push(docRef.id);
    }

    await batch.commit();
    return ids;
  } catch (error) {
    console.error('Error saving content items:', error);
    throw error;
  }
}

/**
 * Get unprocessed content items for a category
 */
export async function getUnprocessedItems(
  categorySlug?: string,
  limit: number = 10
): Promise<ContentItem[]> {
  try {
    const querySnapshot = await getDocs(collection(getDb(), ITEMS_COLLECTION));

    let items = querySnapshot.docs
      .map((docSnap) => {
        const data = docSnap.data();
        return {
          id: docSnap.id,
          sourceId: data.sourceId || '',
          sourceName: data.sourceName || '',
          title: data.title || '',
          description: data.description || '',
          url: data.url || '',
          publishedAt: data.publishedAt || '',
          fetchedAt: data.fetchedAt || '',
          category: data.category || '',
          keywords: data.keywords || [],
          imageUrl: data.imageUrl || '',
          relevanceScore: data.relevanceScore || 0,
          isProcessed: data.isProcessed ?? false,
          processedAt: data.processedAt || undefined,
          articleId: data.articleId || undefined,
        } as ContentItem;
      })
      .filter((item) => !item.isProcessed);

    // Filter by category if specified
    if (categorySlug) {
      items = items.filter(
        (item) => !item.category || item.category.toLowerCase() === categorySlug.toLowerCase()
      );
    }

    // Sort by relevance score and recency
    items.sort((a, b) => {
      if (b.relevanceScore !== a.relevanceScore) {
        return (b.relevanceScore || 0) - (a.relevanceScore || 0);
      }
      return new Date(b.publishedAt).getTime() - new Date(a.publishedAt).getTime();
    });

    return items.slice(0, limit);
  } catch (error) {
    console.error('Error fetching unprocessed items:', error);
    return [];
  }
}

/**
 * Mark a content item as processed
 */
export async function markItemProcessed(itemId: string, articleId?: string): Promise<void> {
  try {
    const docRef = doc(getDb(), ITEMS_COLLECTION, itemId);
    await updateDoc(docRef, {
      isProcessed: true,
      processedAt: new Date().toISOString(),
      articleId: articleId || null,
    });
  } catch (error) {
    console.error('Error marking item as processed:', error);
    throw error;
  }
}

/**
 * Clean up old processed items (older than specified days)
 */
export async function cleanupOldItems(daysOld: number = 7): Promise<number> {
  try {
    const cutoffDate = new Date();
    cutoffDate.setDate(cutoffDate.getDate() - daysOld);
    const cutoff = cutoffDate.toISOString();

    const querySnapshot = await getDocs(collection(getDb(), ITEMS_COLLECTION));
    const itemsToDelete = querySnapshot.docs.filter((docSnap) => {
      const data = docSnap.data();
      return data.isProcessed && data.processedAt && data.processedAt < cutoff;
    });

    if (itemsToDelete.length === 0) return 0;

    const batch = writeBatch(getDb());
    itemsToDelete.forEach((docSnap) => {
      batch.delete(docSnap.ref);
    });

    await batch.commit();
    return itemsToDelete.length;
  } catch (error) {
    console.error('Error cleaning up old items:', error);
    throw error;
  }
}

/**
 * Update source's last fetched timestamp
 */
export async function updateSourceLastFetched(sourceId: string): Promise<void> {
  try {
    const docRef = doc(getDb(), SOURCES_COLLECTION, sourceId);
    await updateDoc(docRef, {
      lastFetchedAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
    });
  } catch (error) {
    console.error('Error updating source last fetched:', error);
    throw error;
  }
}

/**
 * Fetches full article content from URL
 * Attempts to extract main article text from HTML
 */
export async function fetchFullArticle(url: string): Promise<string | null> {
  try {
    const response = await fetch(url, {
      headers: {
        'User-Agent': 'WNCTimes-Bot/1.0 (Content Aggregator)'
      },
      next: { revalidate: 3600 } // Cache for 1 hour
    });

    if (!response.ok) {
      console.log(`[FullArticle] Failed to fetch ${url}: ${response.status}`);
      return null;
    }

    const html = await response.text();

    // Extract content from common article selectors (basic regex approach)
    // This works for most news sites without needing a heavy HTML parser
    let content = '';

    // Try to find article content using common patterns
    const patterns = [
      /<article[^>]*>([\s\S]*?)<\/article>/i,
      /<div[^>]*class="[^"]*article-content[^"]*"[^>]*>([\s\S]*?)<\/div>/i,
      /<div[^>]*class="[^"]*post-content[^"]*"[^>]*>([\s\S]*?)<\/div>/i,
      /<div[^>]*class="[^"]*entry-content[^"]*"[^>]*>([\s\S]*?)<\/div>/i,
      /<div[^>]*itemprop="articleBody"[^>]*>([\s\S]*?)<\/div>/i,
    ];

    for (const pattern of patterns) {
      const match = html.match(pattern);
      if (match && match[1]) {
        content = match[1];
        break;
      }
    }

    if (!content) {
      console.log(`[FullArticle] No article content found for ${url}`);
      return null;
    }

    // Clean up HTML tags and extra whitespace
    content = content
      .replace(/<script[^>]*>[\s\S]*?<\/script>/gi, '') // Remove scripts
      .replace(/<style[^>]*>[\s\S]*?<\/style>/gi, '')   // Remove styles
      .replace(/<[^>]+>/g, ' ')                          // Remove HTML tags
      .replace(/&nbsp;/g, ' ')                           // Replace &nbsp;
      .replace(/&amp;/g, '&')                            // Replace &amp;
      .replace(/&lt;/g, '<')                             // Replace &lt;
      .replace(/&gt;/g, '>')                             // Replace &gt;
      .replace(/&quot;/g, '"')                           // Replace &quot;
      .replace(/\s+/g, ' ')                              // Collapse whitespace
      .trim();

    // Limit to 5000 characters to avoid overwhelming the AI
    if (content.length > 5000) {
      content = content.substring(0, 5000) + '...';
    }

    return content.length > 100 ? content : null; // Only return if substantial content
  } catch (error) {
    console.error(`[FullArticle] Error fetching ${url}:`, error);
    return null;
  }
}
