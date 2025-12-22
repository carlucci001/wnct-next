import { db } from './firebase';
import { collection, getDocs, deleteDoc, doc, query, orderBy, Timestamp } from 'firebase/firestore';
import { Article } from '@/types/article';

const ARTICLES_COLLECTION = 'articles';

// Dummy data for when Firebase is not available
const DUMMY_ARTICLES: Article[] = [
  {
    id: '1',
    title: 'Welcome to WNC Times',
    content: 'This is a sample article.',
    slug: 'welcome-to-wnc-times',
    author: {
      id: 'admin',
      name: 'Admin User',
      email: 'admin@example.com'
    },
    category: 'News',
    tags: ['welcome', 'news'],
    status: 'published',
    publishedAt: new Date().toISOString(),
    createdAt: new Date().toISOString(),
    updatedAt: new Date().toISOString(),
  },
  {
    id: '2',
    title: 'Draft Article Example',
    content: 'This article is a draft.',
    slug: 'draft-article',
    author: {
      id: 'editor',
      name: 'Editor User',
      email: 'editor@example.com'
    },
    category: 'Opinion',
    tags: ['draft'],
    status: 'draft',
    createdAt: new Date().toISOString(),
    updatedAt: new Date().toISOString(),
  }
];

export async function getAllArticles(): Promise<Article[]> {
  try {
    // If db is not initialized (e.g. missing config), return dummy data
    if (!db || !db.type) {
      console.warn('Firebase DB not initialized, returning dummy data');
      return DUMMY_ARTICLES;
    }

    const articlesRef = collection(db, ARTICLES_COLLECTION);
    // Order by createdAt desc by default
    const q = query(articlesRef, orderBy('createdAt', 'desc'));
    const snapshot = await getDocs(q);

    return snapshot.docs.map(doc => {
      const data = doc.data();
      return {
        id: doc.id,
        ...data,
        // Ensure dates are converted to strings if they are timestamps
        createdAt: data.createdAt instanceof Timestamp ? data.createdAt.toDate().toISOString() : data.createdAt,
        updatedAt: data.updatedAt instanceof Timestamp ? data.updatedAt.toDate().toISOString() : data.updatedAt,
        publishedAt: data.publishedAt instanceof Timestamp ? data.publishedAt.toDate().toISOString() : data.publishedAt,
      } as Article;
    });
  } catch (error) {
    console.error('Error fetching articles:', error);
    // Fallback to dummy data on error for development if env vars are missing
    return DUMMY_ARTICLES;
  }
}

export async function deleteArticle(id: string): Promise<void> {
  try {
     if (!db || !db.type) {
      console.warn('Firebase DB not initialized, pretending to delete');
      return;
    }
    await deleteDoc(doc(db, ARTICLES_COLLECTION, id));
  } catch (error) {
    console.error('Error deleting article:', error);
    throw error;
  }
}
