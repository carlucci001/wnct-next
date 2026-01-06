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
  arrayUnion,
  arrayRemove,
  increment,
} from 'firebase/firestore';

// Types
export interface CommunityPostData {
  id: string;
  authorId: string;
  authorName: string;
  authorPhoto?: string;
  content: string;
  images?: string[];
  topic: string;
  likes: number;
  likedBy: string[];
  commentsCount: number;
  pinned: boolean;
  status: 'active' | 'hidden' | 'flagged';
  createdAt: Timestamp;
  updatedAt: Timestamp;
}

export interface CommunitySettings {
  enabled: boolean;
  title: string;
  showInNav: boolean;
  requireApproval: boolean;
  topics: string[];
}

// Default settings
const DEFAULT_SETTINGS: CommunitySettings = {
  enabled: true,
  title: 'Community Feed',
  showInNav: true,
  requireApproval: false,
  topics: ['general', 'alert', 'crime', 'event', 'question'],
};

// Collection references
const POSTS_COLLECTION = 'communityPosts';
const SETTINGS_COLLECTION = 'componentSettings';
const SETTINGS_DOC_ID = 'community';

// ============================================
// CRUD Operations for Community Posts
// ============================================

/**
 * Create a new community post
 */
export async function createCommunityPost(
  data: Omit<CommunityPostData, 'id' | 'createdAt' | 'updatedAt' | 'likes' | 'likedBy' | 'commentsCount' | 'pinned' | 'status'>
): Promise<string> {
  const docRef = doc(collection(db, POSTS_COLLECTION));
  await setDoc(docRef, {
    ...data,
    id: docRef.id,
    likes: 0,
    likedBy: [],
    commentsCount: 0,
    pinned: false,
    status: 'active',
    createdAt: serverTimestamp(),
    updatedAt: serverTimestamp(),
  });
  return docRef.id;
}

/**
 * Get all community posts with optional filters
 */
export async function getCommunityPosts(options?: {
  topic?: string;
  status?: 'active' | 'hidden' | 'flagged';
  limit?: number;
  includeHidden?: boolean;
}): Promise<CommunityPostData[]> {
  let q = query(collection(db, POSTS_COLLECTION), orderBy('createdAt', 'desc'));

  // Apply filters
  if (options?.topic && options.topic !== 'all') {
    q = query(collection(db, POSTS_COLLECTION), where('topic', '==', options.topic), orderBy('createdAt', 'desc'));
  }

  if (options?.status) {
    q = query(collection(db, POSTS_COLLECTION), where('status', '==', options.status), orderBy('createdAt', 'desc'));
  }

  if (options?.limit) {
    q = query(q, limit(options.limit));
  }

  const snapshot = await getDocs(q);
  let posts = snapshot.docs.map((doc) => ({ ...doc.data(), id: doc.id } as CommunityPostData));

  // Filter out hidden posts unless includeHidden is true
  if (!options?.includeHidden) {
    posts = posts.filter((post) => post.status === 'active');
  }

  return posts;
}

/**
 * Get a single post by ID
 */
export async function getCommunityPostById(id: string): Promise<CommunityPostData | null> {
  const docRef = doc(db, POSTS_COLLECTION, id);
  const docSnap = await getDoc(docRef);

  if (!docSnap.exists()) return null;
  return { ...docSnap.data(), id: docSnap.id } as CommunityPostData;
}

/**
 * Update a community post
 */
export async function updateCommunityPost(
  id: string,
  updates: Partial<Omit<CommunityPostData, 'id' | 'createdAt'>>
): Promise<void> {
  await updateDoc(doc(db, POSTS_COLLECTION, id), {
    ...updates,
    updatedAt: serverTimestamp(),
  });
}

/**
 * Delete a community post
 */
export async function deleteCommunityPost(id: string): Promise<void> {
  await deleteDoc(doc(db, POSTS_COLLECTION, id));
}

// ============================================
// Like Operations
// ============================================

/**
 * Like a post (optimistic UI supported)
 */
export async function likePost(postId: string, userId: string): Promise<void> {
  const postRef = doc(db, POSTS_COLLECTION, postId);
  await updateDoc(postRef, {
    likes: increment(1),
    likedBy: arrayUnion(userId),
    updatedAt: serverTimestamp(),
  });
}

/**
 * Unlike a post
 */
export async function unlikePost(postId: string, userId: string): Promise<void> {
  const postRef = doc(db, POSTS_COLLECTION, postId);
  await updateDoc(postRef, {
    likes: increment(-1),
    likedBy: arrayRemove(userId),
    updatedAt: serverTimestamp(),
  });
}

// ============================================
// Special Queries
// ============================================

/**
 * Get trending posts (most liked in last 7 days)
 */
export async function getTrendingPosts(maxPosts: number = 5): Promise<CommunityPostData[]> {
  const sevenDaysAgo = new Date();
  sevenDaysAgo.setDate(sevenDaysAgo.getDate() - 7);
  const sevenDaysAgoTimestamp = Timestamp.fromDate(sevenDaysAgo);

  // Query posts from last 7 days, ordered by likes
  const q = query(
    collection(db, POSTS_COLLECTION),
    where('status', '==', 'active'),
    where('createdAt', '>=', sevenDaysAgoTimestamp),
    orderBy('createdAt', 'desc'),
    limit(50) // Get more to filter by likes
  );

  const snapshot = await getDocs(q);
  const posts = snapshot.docs.map((doc) => ({ ...doc.data(), id: doc.id } as CommunityPostData));

  // Sort by likes and return top posts
  return posts.sort((a, b) => b.likes - a.likes).slice(0, maxPosts);
}

/**
 * Get pinned posts
 */
export async function getPinnedPosts(): Promise<CommunityPostData[]> {
  const q = query(
    collection(db, POSTS_COLLECTION),
    where('pinned', '==', true),
    where('status', '==', 'active'),
    orderBy('createdAt', 'desc')
  );

  const snapshot = await getDocs(q);
  return snapshot.docs.map((doc) => ({ ...doc.data(), id: doc.id } as CommunityPostData));
}

/**
 * Pin/Unpin a post (admin only)
 */
export async function togglePinPost(postId: string, pinned: boolean): Promise<void> {
  await updateDoc(doc(db, POSTS_COLLECTION, postId), {
    pinned,
    updatedAt: serverTimestamp(),
  });
}

/**
 * Flag a post for review
 */
export async function flagPost(postId: string): Promise<void> {
  await updateDoc(doc(db, POSTS_COLLECTION, postId), {
    status: 'flagged',
    updatedAt: serverTimestamp(),
  });
}

/**
 * Hide/Show a post (admin moderation)
 */
export async function setPostVisibility(postId: string, hidden: boolean): Promise<void> {
  await updateDoc(doc(db, POSTS_COLLECTION, postId), {
    status: hidden ? 'hidden' : 'active',
    updatedAt: serverTimestamp(),
  });
}

// ============================================
// Settings Operations
// ============================================

/**
 * Get community settings
 */
export async function getCommunitySettings(): Promise<CommunitySettings> {
  const docRef = doc(db, SETTINGS_COLLECTION, SETTINGS_DOC_ID);
  const docSnap = await getDoc(docRef);

  if (!docSnap.exists()) {
    // Return defaults if not configured
    return DEFAULT_SETTINGS;
  }

  return { ...DEFAULT_SETTINGS, ...docSnap.data() } as CommunitySettings;
}

/**
 * Update community settings (admin only)
 */
export async function updateCommunitySettings(
  updates: Partial<CommunitySettings>
): Promise<void> {
  const docRef = doc(db, SETTINGS_COLLECTION, SETTINGS_DOC_ID);
  await setDoc(docRef, updates, { merge: true });
}

// ============================================
// Stats
// ============================================

/**
 * Get community stats for sidebar
 */
export async function getCommunityStats(): Promise<{
  totalPosts: number;
  postsThisWeek: number;
  activeTopics: number;
}> {
  const sevenDaysAgo = new Date();
  sevenDaysAgo.setDate(sevenDaysAgo.getDate() - 7);
  const sevenDaysAgoTimestamp = Timestamp.fromDate(sevenDaysAgo);

  // Get all active posts
  const allPostsQuery = query(
    collection(db, POSTS_COLLECTION),
    where('status', '==', 'active')
  );
  const allPostsSnapshot = await getDocs(allPostsQuery);

  // Get posts from last week
  const recentPostsQuery = query(
    collection(db, POSTS_COLLECTION),
    where('status', '==', 'active'),
    where('createdAt', '>=', sevenDaysAgoTimestamp)
  );
  const recentPostsSnapshot = await getDocs(recentPostsQuery);

  // Count unique topics
  const topics = new Set<string>();
  allPostsSnapshot.docs.forEach((doc) => {
    const data = doc.data();
    if (data.topic) topics.add(data.topic);
  });

  return {
    totalPosts: allPostsSnapshot.size,
    postsThisWeek: recentPostsSnapshot.size,
    activeTopics: topics.size,
  };
}
