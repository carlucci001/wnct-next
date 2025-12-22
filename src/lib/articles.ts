import {
  collection,
  getDocs,
  query,
  where,
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
 * Fetch all published articles (client-side filtering to avoid index)
 */
export async function getArticles(): Promise<Article[]> {
  try {
    const querySnapshot = await getDocs(collection(db, ARTICLES_COLLECTION));
    return querySnapshot.docs
      .map(convertDocToArticle)
      .filter(article => article.status === 'published')
      .sort((a, b) => {
        const dateA = new Date(a.publishedAt || a.createdAt).getTime();
        const dateB = new Date(b.publishedAt || b.createdAt).getTime();
        return dateB - dateA;
      });
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
 * Fetch articles by category (client-side filtering to avoid index)
 */
export async function getArticlesByCategory(category: string): Promise<Article[]> {
  try {
    const querySnapshot = await getDocs(collection(db, ARTICLES_COLLECTION));
    return querySnapshot.docs
      .map(convertDocToArticle)
      .filter(article => article.category === category && article.status === 'published')
      .sort((a, b) => {
        const dateA = new Date(a.publishedAt || a.createdAt).getTime();
        const dateB = new Date(b.publishedAt || b.createdAt).getTime();
        return dateB - dateA;
      });
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
      .sort((a, b) => {
        const dateA = new Date(a.createdAt).getTime();
        const dateB = new Date(b.createdAt).getTime();
        return dateB - dateA;
      });
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
