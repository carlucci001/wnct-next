import { collection, getDocs, query, orderBy, limit } from 'firebase/firestore';
import { db } from './firebase';
import { Article } from '../types';

export async function getArticles(): Promise<Article[]> {
  try {
    const articlesRef = collection(db, 'articles');
    // We try to order by date, but if the index is missing, this might fail in dev.
    // Ideally we'd have error handling or fallback.
    const q = query(articlesRef, orderBy('date', 'desc'), limit(20));

    const querySnapshot = await getDocs(q);
    const articles: Article[] = [];

    querySnapshot.forEach((doc) => {
      const data = doc.data();

      // Helper to safely convert Firestore Timestamp to string
      let dateStr = new Date().toISOString();
      if (data.date) {
         if (typeof data.date.toDate === 'function') {
             dateStr = data.date.toDate().toISOString();
         } else if (typeof data.date === 'string') {
             dateStr = data.date;
         } else if (data.date instanceof Date) {
             dateStr = data.date.toISOString();
         }
      }

      articles.push({
        id: doc.id,
        title: data.title || 'Untitled',
        excerpt: data.excerpt || '',
        featuredImage: data.featuredImage || '',
        category: data.category || 'Uncategorized',
        date: dateStr,
        slug: data.slug || doc.id,
      });
    });

    return articles;
  } catch (error) {
    console.error("Error fetching articles:", error);
    // Return empty array or throw, depending on desired behavior.
    // For homepage, empty array is safer than crashing.
    return [];
  }
}
