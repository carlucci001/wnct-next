import { db } from './firebase';
import { collection, query, where, getDocs, Timestamp } from 'firebase/firestore';

export interface Article {
  id?: string;
  slug: string;
  title: string;
  author: string;
  date: string;
  category: string;
  featuredImage: string;
  content: string;
}

export async function getArticleBySlug(slug: string): Promise<Article | null> {
  try {
    const q = query(collection(db, 'articles'), where('slug', '==', slug));
    const querySnapshot = await getDocs(q);

    if (querySnapshot.empty) {
      return null;
    }

    const doc = querySnapshot.docs[0];
    const data = doc.data();

    // Helper to format date
    let dateStr = new Date().toISOString();
    if (data.date) {
        if (data.date instanceof Timestamp) {
            dateStr = data.date.toDate().toLocaleDateString();
        } else if (typeof data.date === 'string') {
            dateStr = data.date;
        }
    }

    return {
      id: doc.id,
      slug: data.slug,
      title: data.title,
      author: data.author,
      date: dateStr,
      category: data.category,
      featuredImage: data.featuredImage,
      content: data.content,
    } as Article;
  } catch (error) {
    console.error("Error fetching article:", error);
    return null;
  }
}
