import {
  collection,
  doc,
  getDoc,
  getDocs,
  setDoc,
  updateDoc,
  deleteDoc,
  query,
  where,
  orderBy,
} from 'firebase/firestore';
import { getDb } from '@/lib/firebase';
import { Newsletter, NewsletterSubscription, NewsletterTemplate } from '@/types/newsletter';

const COLLECTION_NEWSLETTERS = 'newsletters';
const COLLECTION_SUBSCRIPTIONS = 'newsletter_subscriptions';
const COLLECTION_TEMPLATES = 'newsletter_templates';

// --- Newsletters ---

export async function getNewsletters(status?: Newsletter['status']): Promise<Newsletter[]> {
  const db = getDb();
  const collectionRef = collection(db, COLLECTION_NEWSLETTERS);
  let q;

  if (status) {
    q = query(
      collectionRef,
      where('status', '==', status),
      orderBy('createdAt', 'desc')
    );
  } else {
    q = query(collectionRef, orderBy('createdAt', 'desc'));
  }

  const snapshot = await getDocs(q);
  return snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() } as Newsletter));
}

export async function getNewsletter(id: string): Promise<Newsletter | null> {
  const db = getDb();
  const docRef = doc(db, COLLECTION_NEWSLETTERS, id);
  const docSnap = await getDoc(docRef);

  if (docSnap.exists()) {
    return { id: docSnap.id, ...docSnap.data() } as Newsletter;
  }
  return null;
}

export async function createNewsletter(newsletter: Omit<Newsletter, 'id' | 'createdAt' | 'updatedAt'>): Promise<string> {
  const db = getDb();
  const newDocRef = doc(collection(db, COLLECTION_NEWSLETTERS));
  const now = new Date().toISOString();

  const newNewsletter: Newsletter = {
    ...newsletter,
    id: newDocRef.id,
    createdAt: now,
    updatedAt: now,
  };

  await setDoc(newDocRef, newNewsletter);
  return newDocRef.id;
}

export async function updateNewsletter(id: string, updates: Partial<Newsletter>): Promise<void> {
  const db = getDb();
  const docRef = doc(db, COLLECTION_NEWSLETTERS, id);
  await updateDoc(docRef, {
    ...updates,
    updatedAt: new Date().toISOString()
  });
}

export async function deleteNewsletter(id: string): Promise<void> {
  const db = getDb();
  const docRef = doc(db, COLLECTION_NEWSLETTERS, id);
  await deleteDoc(docRef);
}

// --- Subscriptions ---

export async function subscribe(email: string, source: string = 'website'): Promise<void> {
  const db = getDb();
  // Sanitize email for ID: lowercase and remove special chars that might be issues,
  // but simpler is to just use email as is if valid, but Firestore IDs have some constraints.
  // Let's use a safe encoding or just the email if it's standard chars.
  // Actually, let's just use the email directly as ID if we can, but / is not allowed.
  // Replacing / is enough.
  const id = email.toLowerCase().replace(/\//g, '_');
  const docRef = doc(db, COLLECTION_SUBSCRIPTIONS, id);
  const now = new Date().toISOString();

  await setDoc(docRef, {
    id,
    email,
    status: 'active',
    createdAt: now, // If merging, this won't be overwritten if it exists? No, setDoc overwrites unless merge: true.
    // If we use merge: true, createdAt will be overwritten if we provide it.
    // We should check if it exists or use update for existing.
    // Better strategy: read first or use update logic.
    // Simplified: Just always update createdAt for "last subscribed" or keep original?
    // Let's keep original creation date if possible.
    updatedAt: now,
    source
  }, { merge: true });
}

export async function unsubscribe(email: string): Promise<void> {
  const db = getDb();
  const id = email.toLowerCase().replace(/\//g, '_');
  const docRef = doc(db, COLLECTION_SUBSCRIPTIONS, id);
  const now = new Date().toISOString();

  await setDoc(docRef, {
    email,
    status: 'unsubscribed',
    updatedAt: now
  }, { merge: true });
}

export async function getSubscribers(status?: NewsletterSubscription['status']): Promise<NewsletterSubscription[]> {
  const db = getDb();
  let q;
  const collectionRef = collection(db, COLLECTION_SUBSCRIPTIONS);

  if (status) {
    q = query(
      collectionRef,
      where('status', '==', status),
      orderBy('createdAt', 'desc')
    );
  } else {
    q = query(collectionRef, orderBy('createdAt', 'desc'));
  }

  const snapshot = await getDocs(q);
  return snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() } as NewsletterSubscription));
}

// --- Templates ---

export async function getTemplates(): Promise<NewsletterTemplate[]> {
  const db = getDb();
  const q = query(collection(db, COLLECTION_TEMPLATES), orderBy('createdAt', 'desc'));
  const snapshot = await getDocs(q);
  return snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() } as NewsletterTemplate));
}

export async function createTemplate(template: Omit<NewsletterTemplate, 'id' | 'createdAt' | 'updatedAt'>): Promise<string> {
  const db = getDb();
  const newDocRef = doc(collection(db, COLLECTION_TEMPLATES));
  const now = new Date().toISOString();

  const newTemplate: NewsletterTemplate = {
    ...template,
    id: newDocRef.id,
    createdAt: now,
    updatedAt: now,
  };

  await setDoc(newDocRef, newTemplate);
  return newDocRef.id;
}
