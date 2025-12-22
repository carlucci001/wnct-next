import {
  collection,
  query,
  where,
  getDocs,
  orderBy,
  limit,
  doc,
  deleteDoc,
  Timestamp,
  type QueryDocumentSnapshot,
  type DocumentData
} from 'firebase/firestore';
import { db } from './firebase';
import { Article } from '@/types/article';

const ARTICLES_COLLECTION = 'articles';

// Helper to convert Firestore timestamp to ISO string if needed
// or just handle data as is.
// The interface says string, but Firestore returns Timestamp.
// We should convert Timestamp to string (ISO) or Date.
// Task 1 said publishedAt, createdAt, updatedAt.
// I will assume they are stored as Timestamps in Firestore and need conversion.

const convertDocToArticle = (doc: QueryDocumentSnapshot<DocumentData, DocumentData>): Article => {
  const data = doc.data();
  return {
    id: doc.id,
    title: data.title || '',
    content: data.content || '',
    slug: data.slug || '',
    author: data.author || '',
    category: data.category || 'Uncategorized',
    tags: data.tags || [],
    status: data.status || 'draft',
    publishedAt: data.publishedAt instanceof Timestamp ? data.publishedAt.toDate().toISOString() : data.publishedAt || '',
    createdAt: data.createdAt instanceof Timestamp ? data.createdAt.toDate().toISOString() : data.createdAt || '',
    updatedAt: data.updatedAt instanceof Timestamp ? data.updatedAt.toDate().toISOString() : data.updatedAt || '',
    featuredImage: data.featuredImage || '',
    excerpt: data.excerpt || '',
  } as Article;
};

/**
 * Fetch all published articles
 */
export async function getArticles(): Promise<Article[]> {
  try {
    const q = query(
      collection(db, ARTICLES_COLLECTION),
      where('status', '==', 'published'),
      orderBy('publishedAt', 'desc')
    );
    const querySnapshot = await getDocs(q);
    return querySnapshot.docs.map(convertDocToArticle);
  } catch (error) {
    console.error('Error fetching articles:', error);
    return [];
  }
}

/**
 * Fetch a single article by slug
 */
export async function getArticleBySlug(slug: string): Promise<Article | null> {
  try {
    const q = query(
      collection(db, ARTICLES_COLLECTION),
      where('slug', '==', slug),
      limit(1)
    );
    const querySnapshot = await getDocs(q);
    if (querySnapshot.empty) {
      return null;
    }
    return convertDocToArticle(querySnapshot.docs[0]);
  } catch (error) {
    console.error(`Error fetching article with slug ${slug}:`, error);
    return null;
  }
}

/**
 * Fetch articles by category
 */
export async function getArticlesByCategory(category: string): Promise<Article[]> {
  try {
    const q = query(
      collection(db, ARTICLES_COLLECTION),
      where('category', '==', category),
      where('status', '==', 'published'),
      orderBy('publishedAt', 'desc')
    );
    const querySnapshot = await getDocs(q);
    return querySnapshot.docs.map(convertDocToArticle);
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
    const q = query(
      collection(db, ARTICLES_COLLECTION),
      orderBy('createdAt', 'desc')
    );
    const querySnapshot = await getDocs(q);
    return querySnapshot.docs.map(convertDocToArticle);
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
