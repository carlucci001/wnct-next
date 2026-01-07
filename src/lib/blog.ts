import { getDb } from '@/lib/firebase';
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
  serverTimestamp, 
  writeBatch,
  Timestamp,
  limit,
  increment
} from 'firebase/firestore';
import { BlogPost, BlogSettings } from '@/types/blogPost';

const BLOG_COLLECTION = 'blogPosts';
const SETTINGS_COLLECTION = 'componentSettings';
const SETTINGS_ID = 'blog';

// --- Blog CRUD ---

export async function createBlogPost(data: Omit<BlogPost, 'id' | 'createdAt' | 'updatedAt' | 'viewCount'>): Promise<string> {
  const docRef = doc(collection(getDb(), BLOG_COLLECTION));
  const now = serverTimestamp();
  await setDoc(docRef, {
    ...data,
    id: docRef.id,
    viewCount: 0,
    createdAt: now,
    updatedAt: now,
  });
  return docRef.id;
}

export async function getBlogPosts(filters?: { 
  category?: string; 
  status?: BlogPost['status'];
  limit?: number;
}): Promise<BlogPost[]> {
  let q = query(collection(getDb(), BLOG_COLLECTION), orderBy('createdAt', 'desc'));

  if (filters?.status) {
    q = query(q, where('status', '==', filters.status));
  }
  
  if (filters?.category && filters.category !== 'all') {
    q = query(q, where('category', '==', filters.category));
  }

  if (filters?.limit) {
    q = query(q, limit(filters.limit));
  }

  const snapshot = await getDocs(q);
  return snapshot.docs.map(doc => ({ 
    ...doc.data(), 
    id: doc.id 
  } as BlogPost));
}

export async function getBlogPostBySlug(slug: string): Promise<BlogPost | null> {
  const q = query(collection(getDb(), BLOG_COLLECTION), where('slug', '==', slug), limit(1));
  const snapshot = await getDocs(q);
  if (snapshot.empty) return null;
  
  const post = { ...snapshot.docs[0].data(), id: snapshot.docs[0].id } as BlogPost;
  
  // Increment view count
  updateDoc(doc(getDb(), BLOG_COLLECTION, post.id), {
    viewCount: increment(1)
  });
  
  return post;
}

export async function updateBlogPost(id: string, updates: Partial<BlogPost>): Promise<void> {
  await updateDoc(doc(getDb(), BLOG_COLLECTION, id), {
    ...updates,
    updatedAt: serverTimestamp(),
  });
}

export async function deleteBlogPost(id: string): Promise<void> {
  await deleteDoc(doc(getDb(), BLOG_COLLECTION, id));
}

export async function deleteBlogPosts(ids: string[]): Promise<void> {
  const batch = writeBatch(getDb());
  ids.forEach(id => {
    batch.delete(doc(getDb(), BLOG_COLLECTION, id));
  });
  await batch.commit();
}

// --- Settings ---

export async function getBlogSettings(): Promise<BlogSettings | null> {
  const docSnap = await getDoc(doc(getDb(), SETTINGS_COLLECTION, SETTINGS_ID));
  if (docSnap.exists()) {
    return docSnap.data() as BlogSettings;
  }
  return null;
}

export async function updateBlogSettings(settings: Partial<BlogSettings>): Promise<void> {
  await setDoc(doc(getDb(), SETTINGS_COLLECTION, SETTINGS_ID), settings, { merge: true });
}

// --- Utilities ---

export function generateBlogSlug(title: string): string {
  return title
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, '-')
    .replace(/^-+|-+$/g, '');
}

export function formatBlogDate(timestamp: Timestamp | Date): string {
  const date = timestamp instanceof Timestamp ? timestamp.toDate() : timestamp;
  return date.toLocaleDateString('en-US', {
    month: 'long',
    day: 'numeric',
    year: 'numeric'
  });
}
