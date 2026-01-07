import { collection, getDocs, query, orderBy, limit, where } from 'firebase/firestore';
import { getDb } from './firebase';
import { Article, DashboardStats } from './types';

export async function getDashboardStats(): Promise<DashboardStats> {
  try {
    const articlesRef = collection(getDb(), 'articles');
    const snapshot = await getDocs(articlesRef);
    const articles = snapshot.docs.map(doc => doc.data() as Article);

    const totalArticles = articles.length;
    const publishedArticles = articles.filter(a => a.status === 'published').length;
    const draftArticles = articles.filter(a => a.status === 'draft').length;

    return {
      totalArticles,
      publishedArticles,
      draftArticles
    };
  } catch (error) {
    console.error("Error fetching dashboard stats:", error);
    return {
      totalArticles: 0,
      publishedArticles: 0,
      draftArticles: 0
    };
  }
}

export async function getRecentArticles(count: number = 5): Promise<Article[]> {
  try {
    const articlesRef = collection(getDb(), 'articles');
    const q = query(articlesRef, orderBy('createdAt', 'desc'), limit(count));
    const querySnapshot = await getDocs(q);

    return querySnapshot.docs.map(doc => ({
      id: doc.id,
      ...doc.data()
    } as Article));
  } catch (error) {
    console.error("Error fetching recent articles:", error);
    return [];
  }
}
