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
  limit
} from 'firebase/firestore';
import { Event, EventsSettings } from '@/types/event';

const EVENTS_COLLECTION = 'events';
const SETTINGS_COLLECTION = 'componentSettings';
const SETTINGS_ID = 'events';

// --- Events CRUD ---

export async function createEvent(data: Omit<Event, 'id' | 'createdAt' | 'updatedAt'>): Promise<string> {
  const docRef = doc(collection(getDb(), EVENTS_COLLECTION));
  const now = serverTimestamp();
  await setDoc(docRef, {
    ...data,
    id: docRef.id,
    createdAt: now,
    updatedAt: now,
  });
  return docRef.id;
}

export async function getEvents(filters?: { 
  category?: string; 
  status?: Event['status'];
  featured?: boolean;
}): Promise<Event[]> {
  let q = query(collection(getDb(), EVENTS_COLLECTION), orderBy('startDate', 'asc'));

  if (filters?.status) {
    q = query(q, where('status', '==', filters.status));
  }
  
  if (filters?.category && filters.category !== 'all') {
    q = query(q, where('category', '==', filters.category));
  }

  if (filters?.featured !== undefined) {
    q = query(q, where('featured', '==', filters.featured));
  }

  const snapshot = await getDocs(q);
  return snapshot.docs.map(doc => ({ 
    ...doc.data(), 
    id: doc.id 
  } as Event));
}

export async function getUpcomingEvents(limitCount: number = 5): Promise<Event[]> {
  const now = Timestamp.now();
  const q = query(
    collection(getDb(), EVENTS_COLLECTION),
    where('status', '==', 'published'),
    where('startDate', '>=', now),
    orderBy('startDate', 'asc'),
    limit(limitCount)
  );
  
  const snapshot = await getDocs(q);
  return snapshot.docs.map(doc => ({ ...doc.data(), id: doc.id } as Event));
}

export async function getEventBySlug(slug: string): Promise<Event | null> {
  const q = query(collection(getDb(), EVENTS_COLLECTION), where('slug', '==', slug), limit(1));
  const snapshot = await getDocs(q);
  if (snapshot.empty) return null;
  return { ...snapshot.docs[0].data(), id: snapshot.docs[0].id } as Event;
}

export async function updateEvent(id: string, updates: Partial<Event>): Promise<void> {
  await updateDoc(doc(getDb(), EVENTS_COLLECTION, id), {
    ...updates,
    updatedAt: serverTimestamp(),
  });
}

export async function deleteEvent(id: string): Promise<void> {
  await deleteDoc(doc(getDb(), EVENTS_COLLECTION, id));
}

export async function deleteEvents(ids: string[]): Promise<void> {
  const batch = writeBatch(getDb());
  ids.forEach(id => {
    batch.delete(doc(getDb(), EVENTS_COLLECTION, id));
  });
  await batch.commit();
}

export async function updateEventsStatus(ids: string[], status: Event['status']): Promise<void> {
  const batch = writeBatch(getDb());
  const now = Timestamp.now();
  ids.forEach(id => {
    batch.update(doc(getDb(), EVENTS_COLLECTION, id), { 
      status,
      updatedAt: now
    });
  });
  await batch.commit();
}

// --- Settings ---

export async function getEventsSettings(): Promise<EventsSettings | null> {
  const docSnap = await getDoc(doc(getDb(), SETTINGS_COLLECTION, SETTINGS_ID));
  if (docSnap.exists()) {
    return docSnap.data() as EventsSettings;
  }
  return null;
}

export async function updateEventsSettings(settings: Partial<EventsSettings>): Promise<void> {
  await setDoc(doc(getDb(), SETTINGS_COLLECTION, SETTINGS_ID), settings, { merge: true });
}

// --- Utilities ---

export function generateSlug(title: string): string {
  return title
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, '-')
    .replace(/^-+|-+$/g, '');
}

export function formatEventDate(timestamp: Timestamp, allDay: boolean = false): string {
  const date = timestamp.toDate();
  if (allDay) {
    return date.toLocaleDateString('en-US', { 
      weekday: 'long', 
      month: 'long', 
      day: 'numeric', 
      year: 'numeric' 
    });
  }
  return date.toLocaleString('en-US', {
    weekday: 'long',
    month: 'long',
    day: 'numeric',
    year: 'numeric',
    hour: 'numeric',
    minute: '2-digit'
  });
}

export function isFree(price?: string): boolean {
  if (!price) return true;
  const p = price.toLowerCase();
  return p === 'free' || p === '0' || p === '$0';
}
