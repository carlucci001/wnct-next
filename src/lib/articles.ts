import { db } from './firebase';
import { collection, getDocs, query, where, orderBy, limit, doc, getDoc, Timestamp } from 'firebase/firestore';
import { Article } from '@/types/article';

const ARTICLES_COLLECTION = 'articles';

export async function getArticles(): Promise<Article[]> {
  try {
    const articlesRef = collection(db, ARTICLES_COLLECTION);
    const q = query(
      articlesRef,
      where('status', '==', 'published'),
      orderBy('publishedAt', 'desc')
    );

    const snapshot = await getDocs(q);
    return snapshot.docs.map(doc => ({
      id: doc.id,
      ...doc.data()
    } as Article));
  } catch (error) {
    console.error('Error fetching articles:', error);
    return [];
  }
}

export async function getArticleBySlug(slug: string): Promise<Article | null> {
  try {
    const articlesRef = collection(db, ARTICLES_COLLECTION);
    const q = query(
      articlesRef,
      where('slug', '==', slug),
      where('status', '==', 'published'),
      limit(1)
    );

    const snapshot = await getDocs(q);
    if (snapshot.empty) {
      return null;
    }

    const doc = snapshot.docs[0];
    return {
      id: doc.id,
      ...doc.data()
    } as Article;
  } catch (error) {
    console.error('Error fetching article by slug:', error);
    return null;
  }
}

export async function getArticlesByCategory(category: string): Promise<Article[]> {
  try {
    const articlesRef = collection(db, ARTICLES_COLLECTION);

    // Note: This query requires a composite index in Firestore
    // If it fails, check the console for a link to create the index
    const q = query(
      articlesRef,
      where('category', '==', category),
      where('status', '==', 'published'),
      orderBy('publishedAt', 'desc')
    );

    const snapshot = await getDocs(q);
    return snapshot.docs.map(doc => ({
      id: doc.id,
      ...doc.data()
    } as Article));
  } catch (error) {
    console.error(`Error fetching articles for category ${category}:`, error);
    return [];
  }
}
