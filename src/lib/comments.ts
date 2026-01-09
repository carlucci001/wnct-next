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
  increment,
  arrayUnion,
  arrayRemove,
  limit
} from 'firebase/firestore';
import { getDb } from './firebase';
import { Comment, CommentStatus, CommentSettings } from '@/types/comment';

const COLLECTION_NAME = 'comments';
const SETTINGS_DOC_ID = 'comments';

// CREATE
export async function createComment(data: Omit<Comment, 'id' | 'createdAt' | 'updatedAt' | 'likes' | 'likedBy' | 'repliesCount'>): Promise<string> {
  const docRef = doc(collection(getDb(), COLLECTION_NAME));
  const newComment = {
    ...data,
    id: docRef.id,
    likes: 0,
    likedBy: [],
    repliesCount: 0,
    status: data.status || 'approved', // Default to approved unless settings say otherwise
    createdAt: serverTimestamp(),
    updatedAt: serverTimestamp(),
  };
  
  await setDoc(docRef, newComment);
  return docRef.id;
}

// READ (List for Article)
export async function getCommentsForArticle(articleId: string, includeHidden = false): Promise<Comment[]> {
  // Simple query for all comments of an article
  const q = query(
    collection(getDb(), COLLECTION_NAME), 
    where('articleId', '==', articleId)
  );

  const snapshot = await getDocs(q);
  let comments = snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() } as Comment));

  // Sort by date manually to avoid the index requirement for where + orderBy
  comments.sort((a, b) => {
    const getMs = (date: any) => {
      if (!date) return 0;
      if (typeof date.toDate === 'function') return date.toDate().getTime();
      return new Date(date).getTime();
    };
    return getMs(b.createdAt) - getMs(a.createdAt);
  });

  // Filter approved only if not admin
  if (!includeHidden) {
    comments = comments.filter(c => c.status === 'approved');
  }

  return comments;
}

// READ (All for Admin)
export async function getAllComments(status?: CommentStatus, limitCount = 50): Promise<Comment[]> {
  // Simple query by date
  const q = query(collection(getDb(), COLLECTION_NAME), orderBy('createdAt', 'desc'), limit(limitCount));
  
  const snapshot = await getDocs(q);
  let comments = snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() } as Comment));

  // Filter by status client-side
  if (status) {
    comments = comments.filter(c => c.status === status);
  }

  return comments;
}

// UPDATE
export async function updateComment(id: string, updates: Partial<Comment>): Promise<void> {
  const docRef = doc(getDb(), COLLECTION_NAME, id);
  await updateDoc(docRef, {
    ...updates,
    updatedAt: serverTimestamp(),
  });
}

// DELETE
export async function deleteComment(id: string): Promise<void> {
  await deleteDoc(doc(getDb(), COLLECTION_NAME, id));
}

// LIKE/UNLIKE
export async function toggleLikeComment(commentId: string, userId: string, isLiking: boolean): Promise<void> {
  const docRef = doc(getDb(), COLLECTION_NAME, commentId);
  await updateDoc(docRef, {
    likes: increment(isLiking ? 1 : -1),
    likedBy: isLiking ? arrayUnion(userId) : arrayRemove(userId),
    updatedAt: serverTimestamp(),
  });
}

// SETTINGS
export async function getCommentSettings(): Promise<CommentSettings> {
  const docRef = doc(getDb(), 'componentSettings', SETTINGS_DOC_ID);
  const docSnap = await getDoc(docRef);
  
  if (docSnap.exists()) {
    return docSnap.data() as CommentSettings;
  }
  
  // Default Settings
  return {
    enabled: true,
    requireApproval: false,
    allowGuestComments: false,
    maxCharacters: 1000,
    blockedKeywords: [],
  };
}

export async function updateCommentSettings(settings: Partial<CommentSettings>): Promise<void> {
  const docRef = doc(getDb(), 'componentSettings', SETTINGS_DOC_ID);
  await setDoc(docRef, settings, { merge: true });
}
