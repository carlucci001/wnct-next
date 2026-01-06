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
  writeBatch,
  Timestamp,
} from 'firebase/firestore';
import { Business, DirectorySettings } from '@/types/business';

const BUSINESSES_COLLECTION = 'businesses';
const SETTINGS_COLLECTION = 'componentSettings';
const SETTINGS_DOC_ID = 'directory';

// ============ BUSINESS CRUD ============

// CREATE
export async function createBusiness(
  data: Omit<Business, 'id' | 'createdAt' | 'updatedAt'>
): Promise<string> {
  const docRef = doc(collection(db, BUSINESSES_COLLECTION));
  await setDoc(docRef, {
    ...data,
    id: docRef.id,
    createdAt: serverTimestamp(),
    updatedAt: serverTimestamp(),
  });
  return docRef.id;
}

// READ (List with filters)
export async function getBusinesses(filters?: {
  status?: Business['status'] | 'all';
  category?: string | 'all';
  featured?: boolean;
  limit?: number;
}): Promise<Business[]> {
  let q = query(collection(db, BUSINESSES_COLLECTION));

  if (filters?.status && filters.status !== 'all') {
    q = query(q, where('status', '==', filters.status));
  }
  if (filters?.category && filters.category !== 'all') {
    q = query(q, where('category', '==', filters.category));
  }
  if (filters?.featured !== undefined) {
    q = query(q, where('featured', '==', filters.featured));
  }

  q = query(q, orderBy('createdAt', 'desc'));

  if (filters?.limit) {
    q = query(q, limit(filters.limit));
  }

  const snapshot = await getDocs(q);
  return snapshot.docs.map((doc) => ({ ...doc.data(), id: doc.id } as Business));
}

// READ (Active businesses for public)
export async function getActiveBusinesses(category?: string): Promise<Business[]> {
  // Simple query - filter/sort client-side to avoid composite index requirement
  const q = query(
    collection(db, BUSINESSES_COLLECTION),
    where('status', '==', 'active')
  );

  const snapshot = await getDocs(q);
  let businesses = snapshot.docs.map((doc) => ({ ...doc.data(), id: doc.id } as Business));

  // Filter by category if specified
  if (category && category !== 'all') {
    businesses = businesses.filter(b => b.category === category);
  }

  // Sort: featured first, then by name
  return businesses.sort((a, b) => {
    if (a.featured !== b.featured) return a.featured ? -1 : 1;
    return a.name.localeCompare(b.name);
  });
}

// READ (Featured businesses)
export async function getFeaturedBusinesses(limitCount: number = 6): Promise<Business[]> {
  // Simple query - filter/sort client-side to avoid composite index requirement
  const q = query(
    collection(db, BUSINESSES_COLLECTION),
    where('status', '==', 'active')
  );

  const snapshot = await getDocs(q);
  const businesses = snapshot.docs.map((doc) => ({ ...doc.data(), id: doc.id } as Business));

  // Filter to featured only, sort by name, limit results
  return businesses
    .filter(b => b.featured)
    .sort((a, b) => a.name.localeCompare(b.name))
    .slice(0, limitCount);
}

// READ (By ID)
export async function getBusinessById(id: string): Promise<Business | null> {
  const docRef = doc(db, BUSINESSES_COLLECTION, id);
  const docSnap = await getDoc(docRef);
  return docSnap.exists() ? ({ ...docSnap.data(), id: docSnap.id } as Business) : null;
}

// READ (By slug)
export async function getBusinessBySlug(slug: string): Promise<Business | null> {
  const q = query(collection(db, BUSINESSES_COLLECTION), where('slug', '==', slug));
  const snapshot = await getDocs(q);
  if (snapshot.empty) return null;
  return { ...snapshot.docs[0].data(), id: snapshot.docs[0].id } as Business;
}

// READ (Search)
export async function searchBusinesses(term: string): Promise<Business[]> {
  // Client-side search for now - for production, consider Algolia
  const businesses = await getActiveBusinesses();
  const lowerTerm = term.toLowerCase();
  return businesses.filter(
    (b) =>
      b.name.toLowerCase().includes(lowerTerm) ||
      b.description?.toLowerCase().includes(lowerTerm) ||
      b.category.toLowerCase().includes(lowerTerm)
  );
}

// UPDATE
export async function updateBusiness(
  id: string,
  updates: Partial<Business>
): Promise<void> {
  const docRef = doc(db, BUSINESSES_COLLECTION, id);
  await updateDoc(docRef, {
    ...updates,
    updatedAt: serverTimestamp(),
  });
}

// DELETE
export async function deleteBusiness(id: string): Promise<void> {
  await deleteDoc(doc(db, BUSINESSES_COLLECTION, id));
}

// BULK DELETE
export async function deleteBusinesses(ids: string[]): Promise<void> {
  const batch = writeBatch(db);
  ids.forEach((id) => batch.delete(doc(db, BUSINESSES_COLLECTION, id)));
  await batch.commit();
}

// BULK UPDATE STATUS
export async function updateBusinessesStatus(
  ids: string[],
  status: Business['status']
): Promise<void> {
  const batch = writeBatch(db);
  ids.forEach((id) =>
    batch.update(doc(db, BUSINESSES_COLLECTION, id), {
      status,
      updatedAt: serverTimestamp(),
    })
  );
  await batch.commit();
}

// ============ DIRECTORY SETTINGS ============

// GET Settings
export async function getDirectorySettings(): Promise<DirectorySettings | null> {
  const docRef = doc(db, SETTINGS_COLLECTION, SETTINGS_DOC_ID);
  const docSnap = await getDoc(docRef);
  return docSnap.exists() ? (docSnap.data() as DirectorySettings) : null;
}

// SAVE Settings
export async function saveDirectorySettings(
  settings: DirectorySettings
): Promise<void> {
  const docRef = doc(db, SETTINGS_COLLECTION, SETTINGS_DOC_ID);
  await setDoc(docRef, settings);
}

// Get default settings
export function getDefaultDirectorySettings(): DirectorySettings {
  return {
    enabled: true,
    title: 'Business Directory',
    showInNav: true,
    categoriesEnabled: [
      'Restaurant',
      'Retail',
      'Services',
      'Health & Wellness',
      'Entertainment',
    ],
    featuredCount: 6,
  };
}

// ============ UTILITY FUNCTIONS ============

// Generate slug from business name
export function generateSlug(name: string): string {
  return name
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, '-')
    .replace(/(^-|-$)/g, '');
}

// Check if business is open now
export function isBusinessOpen(hours?: Business['hours']): boolean {
  if (!hours) return false;

  const now = new Date();
  const dayNames = ['sunday', 'monday', 'tuesday', 'wednesday', 'thursday', 'friday', 'saturday'];
  const today = dayNames[now.getDay()] as keyof typeof hours;
  const todayHours = hours[today];

  if (!todayHours || todayHours.toLowerCase() === 'closed') return false;

  // Simple check - for production, parse actual times
  return true;
}

// Get today's hours
export function getTodayHours(hours?: Business['hours']): string {
  if (!hours) return 'Hours not available';

  const now = new Date();
  const dayNames = ['sunday', 'monday', 'tuesday', 'wednesday', 'thursday', 'friday', 'saturday'];
  const today = dayNames[now.getDay()] as keyof typeof hours;
  const todayHours = hours[today];

  return todayHours || 'Closed';
}

// Get Google Maps URL
export function getGoogleMapsUrl(address: Business['address']): string {
  const fullAddress = `${address.street}, ${address.city}, ${address.state} ${address.zip}`;
  return `https://www.google.com/maps/search/?api=1&query=${encodeURIComponent(fullAddress)}`;
}
