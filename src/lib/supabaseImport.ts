import { createClient, SupabaseClient } from '@supabase/supabase-js';
import { getDb } from './firebase';
import { collection, addDoc, getDocs, query, where } from 'firebase/firestore';
import { uploadMediaFile, MediaFolder } from './storage';

// Supabase Article type (expected schema)
export interface SupabaseArticle {
  id: string;
  title: string;
  content: string;
  slug: string;
  excerpt?: string;
  author_id?: string;
  author_name?: string;
  author?: string;
  category?: string;
  featured_image?: string;
  image_url?: string;
  status: string;
  published_at?: string;
  created_at: string;
  updated_at?: string;
  is_featured?: boolean;
  tags?: string[];
}

export interface SupabaseCategory {
  id: string;
  name: string;
  slug: string;
  description?: string;
  color?: string;
  is_active?: boolean;
}

export interface SupabaseAuthor {
  id: string;
  name: string;
  email?: string;
  bio?: string;
  avatar_url?: string;
}

export interface ImportStats {
  found: number;
  imported: number;
  skipped: number;
  errors: number;
}

export interface ImportResult {
  articles: ImportStats;
  images: ImportStats;
  categories: ImportStats;
  authors: ImportStats;
}

/**
 * Create a Supabase client for external database
 */
export function createSupabaseClient(url: string, key: string): SupabaseClient {
  return createClient(url, key);
}

/**
 * Test connection to Supabase - returns detailed error info
 */
export async function testSupabaseConnection(client: SupabaseClient): Promise<{ success: boolean; error?: string; details?: string }> {
  try {
    const { data, error } = await client.from('articles').select('id').limit(1);

    if (error) {
      return {
        success: false,
        error: error.message,
        details: `Code: ${error.code}, Hint: ${error.hint || 'none'}`
      };
    }

    return {
      success: true,
      details: `Connected! Found ${data?.length || 0} articles in test query.`
    };
  } catch (err) {
    return {
      success: false,
      error: err instanceof Error ? err.message : 'Unknown error',
      details: 'Exception during connection test'
    };
  }
}

/**
 * Fetch articles from Supabase with optional date range
 */
export async function fetchSupabaseArticles(
  client: SupabaseClient,
  dateFrom?: string,
  dateTo?: string
): Promise<SupabaseArticle[]> {
  let query = client
    .from('articles')
    .select('*')
    .order('created_at', { ascending: false });

  if (dateFrom) {
    query = query.gte('created_at', dateFrom);
  }
  if (dateTo) {
    query = query.lte('created_at', dateTo);
  }

  const { data, error } = await query;

  if (error) {
    console.error('Error fetching Supabase articles:', error);
    throw new Error(`Failed to fetch articles: ${error.message}`);
  }

  return data || [];
}

/**
 * Fetch categories from Supabase
 */
export async function fetchSupabaseCategories(client: SupabaseClient): Promise<SupabaseCategory[]> {
  const { data, error } = await client
    .from('categories')
    .select('*')
    .order('name');

  if (error) {
    console.error('Error fetching Supabase categories:', error);
    // Return empty array if table doesn't exist
    return [];
  }

  return data || [];
}

/**
 * Fetch authors/profiles from Supabase
 */
export async function fetchSupabaseAuthors(client: SupabaseClient): Promise<SupabaseAuthor[]> {
  // Try 'authors' table first, then 'profiles'
  let { data, error } = await client
    .from('authors')
    .select('*');

  if (error) {
    // Try profiles table
    const profilesResult = await client
      .from('profiles')
      .select('*');

    if (profilesResult.error) {
      console.error('Error fetching Supabase authors:', error);
      return [];
    }

    // Map profiles to author format
    return (profilesResult.data || []).map((p: Record<string, unknown>) => ({
      id: p.id as string,
      name: (p.full_name || p.display_name || p.name || 'Unknown') as string,
      email: p.email as string | undefined,
      bio: p.bio as string | undefined,
      avatar_url: (p.avatar_url || p.photo_url) as string | undefined,
    }));
  }

  return data || [];
}

/**
 * Check if article already exists in Firebase by slug
 */
async function articleExists(slug: string): Promise<boolean> {
  const articlesRef = collection(getDb(), 'articles');
  const q = query(articlesRef, where('slug', '==', slug));
  const snapshot = await getDocs(q);
  return !snapshot.empty;
}

/**
 * Check if category already exists in Firebase by slug
 */
async function categoryExists(slug: string): Promise<boolean> {
  const categoriesRef = collection(getDb(), 'categories');
  const q = query(categoriesRef, where('slug', '==', slug));
  const snapshot = await getDocs(q);
  return !snapshot.empty;
}

/**
 * Download image from URL and upload to Firebase Storage
 */
async function migrateImage(imageUrl: string): Promise<string | null> {
  if (!imageUrl) return null;

  try {
    // Check if it's already a Firebase Storage URL
    if (imageUrl.includes('firebasestorage.googleapis.com')) {
      return imageUrl;
    }

    // Fetch the image
    const response = await fetch(imageUrl);
    if (!response.ok) {
      console.error(`Failed to fetch image: ${imageUrl}`);
      return null;
    }

    const blob = await response.blob();

    // Extract filename from URL
    const urlParts = imageUrl.split('/');
    let filename = urlParts[urlParts.length - 1].split('?')[0];
    if (!filename || filename.length > 100) {
      filename = `imported-${Date.now()}.jpg`;
    }

    // Upload to Firebase Storage
    const file = new File([blob], filename, { type: blob.type || 'image/jpeg' });
    const result = await uploadMediaFile(file, {
      folder: 'articles' as MediaFolder,
      uploadedBy: 'supabase-import',
      uploadedByName: 'Supabase Import',
    });

    return result.url;
  } catch (error) {
    console.error(`Error migrating image ${imageUrl}:`, error);
    return null;
  }
}

/**
 * Import articles from Supabase to Firebase
 */
export async function importArticlesToFirebase(
  articles: SupabaseArticle[],
  migrateImages: boolean = true,
  onProgress?: (current: number, total: number, message: string) => void
): Promise<ImportStats> {
  const stats: ImportStats = { found: articles.length, imported: 0, skipped: 0, errors: 0 };

  for (let i = 0; i < articles.length; i++) {
    const article = articles[i];
    onProgress?.(i + 1, articles.length, `Importing: ${article.title.substring(0, 50)}...`);

    try {
      // Check if already exists
      if (await articleExists(article.slug)) {
        stats.skipped++;
        continue;
      }

      // Migrate featured image if requested
      let featuredImage = article.featured_image || article.image_url || '';
      if (migrateImages && featuredImage) {
        onProgress?.(i + 1, articles.length, `Migrating image for: ${article.title.substring(0, 40)}...`);
        const migratedUrl = await migrateImage(featuredImage);
        if (migratedUrl) {
          featuredImage = migratedUrl;
        }
      }

      // Map Supabase article to Firebase format
      const firebaseArticle = {
        title: article.title,
        content: article.content || '',
        slug: article.slug,
        excerpt: article.excerpt || '',
        author: article.author_name || article.author || 'Imported Author',
        category: article.category || 'News',
        featuredImage: featuredImage,
        status: mapStatus(article.status),
        publishedAt: article.published_at || article.created_at,
        createdAt: article.created_at,
        updatedAt: article.updated_at || new Date().toISOString(),
        isFeatured: article.is_featured || false,
        tags: article.tags || [],
        importedFrom: 'supabase',
        originalId: article.id,
      };

      await addDoc(collection(getDb(), 'articles'), firebaseArticle);
      stats.imported++;
    } catch (error) {
      console.error(`Error importing article ${article.slug}:`, error);
      stats.errors++;
    }
  }

  return stats;
}

/**
 * Import categories from Supabase to Firebase
 */
export async function importCategoriesToFirebase(
  categories: SupabaseCategory[],
  onProgress?: (current: number, total: number, message: string) => void
): Promise<ImportStats> {
  const stats: ImportStats = { found: categories.length, imported: 0, skipped: 0, errors: 0 };

  for (let i = 0; i < categories.length; i++) {
    const category = categories[i];
    onProgress?.(i + 1, categories.length, `Importing category: ${category.name}`);

    try {
      if (await categoryExists(category.slug)) {
        stats.skipped++;
        continue;
      }

      const firebaseCategory = {
        name: category.name,
        slug: category.slug,
        description: category.description || '',
        color: category.color || '#1d4ed8',
        isActive: category.is_active !== false,
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString(),
      };

      await addDoc(collection(getDb(), 'categories'), firebaseCategory);
      stats.imported++;
    } catch (error) {
      console.error(`Error importing category ${category.slug}:`, error);
      stats.errors++;
    }
  }

  return stats;
}

/**
 * Map Supabase status to Firebase status
 */
function mapStatus(status: string): string {
  const statusMap: Record<string, string> = {
    'published': 'published',
    'draft': 'draft',
    'pending': 'review',
    'review': 'review',
    'archived': 'archived',
    'trash': 'archived',
  };
  return statusMap[status?.toLowerCase()] || 'draft';
}

/**
 * Preview import - get counts without importing
 */
export async function previewImport(
  client: SupabaseClient,
  dateFrom?: string,
  dateTo?: string
): Promise<{
  articles: { found: number; wouldSkip: number };
  categories: { found: number; wouldSkip: number };
  authors: { found: number };
}> {
  const articles = await fetchSupabaseArticles(client, dateFrom, dateTo);
  const categories = await fetchSupabaseCategories(client);
  const authors = await fetchSupabaseAuthors(client);

  // Check how many would be skipped
  let articlesWouldSkip = 0;
  for (const article of articles) {
    if (await articleExists(article.slug)) {
      articlesWouldSkip++;
    }
  }

  let categoriesWouldSkip = 0;
  for (const category of categories) {
    if (await categoryExists(category.slug)) {
      categoriesWouldSkip++;
    }
  }

  return {
    articles: { found: articles.length, wouldSkip: articlesWouldSkip },
    categories: { found: categories.length, wouldSkip: categoriesWouldSkip },
    authors: { found: authors.length },
  };
}

/**
 * Clear ALL articles from Firebase (for fresh import)
 */
export async function clearAllArticles(): Promise<{ deleted: number; errors: number }> {
  const { deleteDoc, doc } = await import('firebase/firestore');

  let deleted = 0;
  let errors = 0;

  try {
    const articlesRef = collection(getDb(), 'articles');
    const snapshot = await getDocs(articlesRef);

    console.log(`Found ${snapshot.docs.length} articles to delete`);

    for (const docSnapshot of snapshot.docs) {
      try {
        await deleteDoc(doc(getDb(), 'articles', docSnapshot.id));
        deleted++;
      } catch (err) {
        console.error(`Failed to delete article ${docSnapshot.id}:`, err);
        errors++;
      }
    }

    return { deleted, errors };
  } catch (error) {
    console.error('Error clearing articles:', error);
    return { deleted, errors: errors + 1 };
  }
}
