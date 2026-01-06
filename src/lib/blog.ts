import { db } from '@/lib/firebase';
import {
  collection,
  doc,
  getDocs,
  getDoc,
  setDoc,
  updateDoc,
  deleteDoc,
  query,
  where,
  orderBy,
  limit,
  serverTimestamp,
  Timestamp,
  increment,
} from 'firebase/firestore';
import { BlogPost, BlogSettings, CreateBlogPostData, UpdateBlogPostData } from '@/types/blogPost';

const COLLECTION_NAME = 'blogPosts';
const SETTINGS_COLLECTION = 'componentSettings';
const SETTINGS_DOC = 'blog';

// Helper to generate slug from title
export function generateSlug(title: string): string {
  return title
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, '-')
    .replace(/(^-|-$)/g, '');
}

// Helper to calculate reading time
export function calculateReadingTime(content: string): number {
  const wordsPerMinute = 200;
  const wordCount = content.trim().split(/\s+/).length;
  return Math.ceil(wordCount / wordsPerMinute);
}

// CREATE
export async function createBlogPost(data: CreateBlogPostData): Promise<string> {
  const docRef = doc(collection(db, COLLECTION_NAME));
  await setDoc(docRef, {
    ...data,
    id: docRef.id,
    viewCount: 0,
    createdAt: serverTimestamp(),
    updatedAt: serverTimestamp(),
  });
  return docRef.id;
}

// READ (List all published posts)
export async function getBlogPosts(options?: {
  category?: string;
  status?: BlogPost['status'];
  limitCount?: number;
  includeAll?: boolean;
}): Promise<BlogPost[]> {
  let q;

  if (options?.includeAll) {
    // Admin view - get all posts
    q = query(collection(db, COLLECTION_NAME), orderBy('createdAt', 'desc'));
  } else if (options?.category && options.category !== 'all') {
    q = query(
      collection(db, COLLECTION_NAME),
      where('status', '==', options?.status || 'published'),
      where('category', '==', options.category),
      orderBy('publishedAt', 'desc')
    );
  } else {
    q = query(
      collection(db, COLLECTION_NAME),
      where('status', '==', options?.status || 'published'),
      orderBy('publishedAt', 'desc')
    );
  }

  if (options?.limitCount) {
    q = query(q, limit(options.limitCount));
  }

  const snapshot = await getDocs(q);
  return snapshot.docs.map((doc) => ({ ...doc.data(), id: doc.id } as BlogPost));
}

// READ (By slug)
export async function getBlogPostBySlug(slug: string): Promise<BlogPost | null> {
  const q = query(collection(db, COLLECTION_NAME), where('slug', '==', slug));
  const snapshot = await getDocs(q);
  if (snapshot.empty) return null;
  return { ...snapshot.docs[0].data(), id: snapshot.docs[0].id } as BlogPost;
}

// READ (By ID)
export async function getBlogPostById(id: string): Promise<BlogPost | null> {
  const docRef = doc(db, COLLECTION_NAME, id);
  const docSnap = await getDoc(docRef);
  if (!docSnap.exists()) return null;
  return { ...docSnap.data(), id: docSnap.id } as BlogPost;
}

// READ (By author)
export async function getBlogPostsByAuthor(
  authorId: string,
  options?: { limitCount?: number }
): Promise<BlogPost[]> {
  let q = query(
    collection(db, COLLECTION_NAME),
    where('authorId', '==', authorId),
    where('status', '==', 'published'),
    orderBy('publishedAt', 'desc')
  );

  if (options?.limitCount) {
    q = query(q, limit(options.limitCount));
  }

  const snapshot = await getDocs(q);
  return snapshot.docs.map((doc) => ({ ...doc.data(), id: doc.id } as BlogPost));
}

// READ (Recent posts for sidebar)
export async function getRecentBlogPosts(limitCount: number = 5): Promise<BlogPost[]> {
  const q = query(
    collection(db, COLLECTION_NAME),
    where('status', '==', 'published'),
    orderBy('publishedAt', 'desc'),
    limit(limitCount)
  );
  const snapshot = await getDocs(q);
  return snapshot.docs.map((doc) => ({ ...doc.data(), id: doc.id } as BlogPost));
}

// READ (Get unique categories from posts)
export async function getBlogCategories(): Promise<string[]> {
  const posts = await getBlogPosts();
  const categories = [...new Set(posts.map((post) => post.category))];
  return categories.filter(Boolean).sort();
}

// READ (Get posts by tag)
export async function getBlogPostsByTag(tag: string): Promise<BlogPost[]> {
  const q = query(
    collection(db, COLLECTION_NAME),
    where('status', '==', 'published'),
    where('tags', 'array-contains', tag),
    orderBy('publishedAt', 'desc')
  );
  const snapshot = await getDocs(q);
  return snapshot.docs.map((doc) => ({ ...doc.data(), id: doc.id } as BlogPost));
}

// READ (Get all unique tags)
export async function getAllBlogTags(): Promise<string[]> {
  const posts = await getBlogPosts();
  const tags = posts.flatMap((post) => post.tags || []);
  return [...new Set(tags)].filter(Boolean).sort();
}

// READ (Archive data - posts grouped by month/year)
export async function getBlogArchive(): Promise<{ month: string; year: number; count: number }[]> {
  const posts = await getBlogPosts();
  const archive: Record<string, number> = {};

  posts.forEach((post) => {
    if (post.publishedAt) {
      const date = post.publishedAt instanceof Timestamp
        ? post.publishedAt.toDate()
        : new Date(post.publishedAt);
      const key = `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, '0')}`;
      archive[key] = (archive[key] || 0) + 1;
    }
  });

  return Object.entries(archive)
    .map(([key, count]) => {
      const [year, month] = key.split('-');
      const monthName = new Date(parseInt(year), parseInt(month) - 1).toLocaleString('default', {
        month: 'long',
      });
      return { month: monthName, year: parseInt(year), count };
    })
    .sort((a, b) => {
      if (a.year !== b.year) return b.year - a.year;
      return new Date(`${b.month} 1`).getMonth() - new Date(`${a.month} 1`).getMonth();
    });
}

// UPDATE
export async function updateBlogPost(id: string, updates: UpdateBlogPostData): Promise<void> {
  await updateDoc(doc(db, COLLECTION_NAME, id), {
    ...updates,
    updatedAt: serverTimestamp(),
  });
}

// UPDATE (Increment view count)
export async function incrementViewCount(id: string): Promise<void> {
  await updateDoc(doc(db, COLLECTION_NAME, id), {
    viewCount: increment(1),
  });
}

// DELETE
export async function deleteBlogPost(id: string): Promise<void> {
  await deleteDoc(doc(db, COLLECTION_NAME, id));
}

// SETTINGS - Get
export async function getBlogSettings(): Promise<BlogSettings | null> {
  const docRef = doc(db, SETTINGS_COLLECTION, SETTINGS_DOC);
  const docSnap = await getDoc(docRef);
  if (!docSnap.exists()) return null;
  return docSnap.data() as BlogSettings;
}

// SETTINGS - Update
export async function updateBlogSettings(settings: Partial<BlogSettings>): Promise<void> {
  const docRef = doc(db, SETTINGS_COLLECTION, SETTINGS_DOC);
  const docSnap = await getDoc(docRef);

  if (docSnap.exists()) {
    await updateDoc(docRef, settings);
  } else {
    // Create default settings if they don't exist
    await setDoc(docRef, {
      enabled: true,
      title: 'Blog',
      showInNav: true,
      postsPerPage: 10,
      showAuthorBio: true,
      categories: ['Opinion', 'Column', 'Guest Post', 'Lifestyle', 'Community'],
      ...settings,
    });
  }
}

// Initialize default settings if needed
export async function initializeBlogSettings(): Promise<BlogSettings> {
  const existing = await getBlogSettings();
  if (existing) return existing;

  const defaultSettings: BlogSettings = {
    enabled: true,
    title: 'Blog',
    showInNav: true,
    postsPerPage: 10,
    showAuthorBio: true,
    categories: ['Opinion', 'Column', 'Guest Post', 'Lifestyle', 'Community'],
  };

  await setDoc(doc(db, SETTINGS_COLLECTION, SETTINGS_DOC), defaultSettings);
  return defaultSettings;
}
