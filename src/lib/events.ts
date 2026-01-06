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
import { Event, EventsSettings, DEFAULT_EVENTS_SETTINGS } from '@/types/event';

const EVENTS_COLLECTION = 'events';
const SETTINGS_COLLECTION = 'componentSettings';
const SETTINGS_DOC_ID = 'events';

// ============ EVENT CRUD ============

// CREATE
export async function createEvent(
  data: Omit<Event, 'id' | 'createdAt' | 'updatedAt'>
): Promise<string> {
  const docRef = doc(collection(db, EVENTS_COLLECTION));
  await setDoc(docRef, {
    ...data,
    id: docRef.id,
    createdAt: serverTimestamp(),
    updatedAt: serverTimestamp(),
  });
  return docRef.id;
}

// READ (List with filters)
export async function getEvents(filters?: {
  status?: Event['status'] | 'all';
  category?: string | 'all';
  featured?: boolean;
  limit?: number;
}): Promise<Event[]> {
  let q = query(collection(db, EVENTS_COLLECTION));

  if (filters?.status && filters.status !== 'all') {
    q = query(q, where('status', '==', filters.status));
  }
  if (filters?.category && filters.category !== 'all') {
    q = query(q, where('category', '==', filters.category));
  }
  if (filters?.featured !== undefined) {
    q = query(q, where('featured', '==', filters.featured));
  }

  q = query(q, orderBy('startDate', 'asc'));

  if (filters?.limit) {
    q = query(q, limit(filters.limit));
  }

  const snapshot = await getDocs(q);
  return snapshot.docs.map((doc) => ({ ...doc.data(), id: doc.id } as Event));
}

// READ (Published events for public)
export async function getPublishedEvents(category?: string): Promise<Event[]> {
  const now = Timestamp.now();

  let q = query(
    collection(db, EVENTS_COLLECTION),
    where('status', '==', 'published'),
    where('startDate', '>=', now),
    orderBy('startDate', 'asc')
  );

  if (category && category !== 'all') {
    q = query(
      collection(db, EVENTS_COLLECTION),
      where('status', '==', 'published'),
      where('category', '==', category),
      where('startDate', '>=', now),
      orderBy('startDate', 'asc')
    );
  }

  const snapshot = await getDocs(q);
  return snapshot.docs.map((doc) => ({ ...doc.data(), id: doc.id } as Event));
}

// READ (Upcoming events - next N events)
export async function getUpcomingEvents(limitCount: number = 5): Promise<Event[]> {
  const now = Timestamp.now();

  const q = query(
    collection(db, EVENTS_COLLECTION),
    where('status', '==', 'published'),
    where('startDate', '>=', now),
    orderBy('startDate', 'asc'),
    limit(limitCount)
  );

  const snapshot = await getDocs(q);
  return snapshot.docs.map((doc) => ({ ...doc.data(), id: doc.id } as Event));
}

// READ (Featured events)
export async function getFeaturedEvents(limitCount: number = 3): Promise<Event[]> {
  const now = Timestamp.now();

  const q = query(
    collection(db, EVENTS_COLLECTION),
    where('status', '==', 'published'),
    where('featured', '==', true),
    where('startDate', '>=', now),
    orderBy('startDate', 'asc'),
    limit(limitCount)
  );

  const snapshot = await getDocs(q);
  return snapshot.docs.map((doc) => ({ ...doc.data(), id: doc.id } as Event));
}

// READ (Events by date range)
export async function getEventsByDateRange(
  startDate: Date,
  endDate: Date,
  category?: string
): Promise<Event[]> {
  const startTimestamp = Timestamp.fromDate(startDate);
  const endTimestamp = Timestamp.fromDate(endDate);

  let q = query(
    collection(db, EVENTS_COLLECTION),
    where('status', '==', 'published'),
    where('startDate', '>=', startTimestamp),
    where('startDate', '<=', endTimestamp),
    orderBy('startDate', 'asc')
  );

  if (category && category !== 'all') {
    q = query(
      collection(db, EVENTS_COLLECTION),
      where('status', '==', 'published'),
      where('category', '==', category),
      where('startDate', '>=', startTimestamp),
      where('startDate', '<=', endTimestamp),
      orderBy('startDate', 'asc')
    );
  }

  const snapshot = await getDocs(q);
  return snapshot.docs.map((doc) => ({ ...doc.data(), id: doc.id } as Event));
}

// READ (By ID)
export async function getEventById(id: string): Promise<Event | null> {
  const docRef = doc(db, EVENTS_COLLECTION, id);
  const docSnap = await getDoc(docRef);
  return docSnap.exists() ? ({ ...docSnap.data(), id: docSnap.id } as Event) : null;
}

// READ (By slug)
export async function getEventBySlug(slug: string): Promise<Event | null> {
  const q = query(collection(db, EVENTS_COLLECTION), where('slug', '==', slug));
  const snapshot = await getDocs(q);
  if (snapshot.empty) return null;
  return { ...snapshot.docs[0].data(), id: snapshot.docs[0].id } as Event;
}

// READ (Search)
export async function searchEvents(term: string): Promise<Event[]> {
  // Client-side search for now - for production, consider Algolia
  const events = await getPublishedEvents();
  const lowerTerm = term.toLowerCase();
  return events.filter(
    (e) =>
      e.title.toLowerCase().includes(lowerTerm) ||
      e.description?.toLowerCase().includes(lowerTerm) ||
      e.category.toLowerCase().includes(lowerTerm) ||
      e.location.name.toLowerCase().includes(lowerTerm) ||
      e.location.city.toLowerCase().includes(lowerTerm)
  );
}

// UPDATE
export async function updateEvent(
  id: string,
  updates: Partial<Event>
): Promise<void> {
  const docRef = doc(db, EVENTS_COLLECTION, id);
  await updateDoc(docRef, {
    ...updates,
    updatedAt: serverTimestamp(),
  });
}

// DELETE
export async function deleteEvent(id: string): Promise<void> {
  await deleteDoc(doc(db, EVENTS_COLLECTION, id));
}

// BULK DELETE
export async function deleteEvents(ids: string[]): Promise<void> {
  const batch = writeBatch(db);
  ids.forEach((id) => batch.delete(doc(db, EVENTS_COLLECTION, id)));
  await batch.commit();
}

// BULK UPDATE STATUS
export async function updateEventsStatus(
  ids: string[],
  status: Event['status']
): Promise<void> {
  const batch = writeBatch(db);
  ids.forEach((id) =>
    batch.update(doc(db, EVENTS_COLLECTION, id), {
      status,
      updatedAt: serverTimestamp(),
    })
  );
  await batch.commit();
}

// ============ EVENTS SETTINGS ============

// GET Settings
export async function getEventsSettings(): Promise<EventsSettings | null> {
  const docRef = doc(db, SETTINGS_COLLECTION, SETTINGS_DOC_ID);
  const docSnap = await getDoc(docRef);
  return docSnap.exists() ? (docSnap.data() as EventsSettings) : null;
}

// SAVE Settings
export async function saveEventsSettings(
  settings: EventsSettings
): Promise<void> {
  const docRef = doc(db, SETTINGS_COLLECTION, SETTINGS_DOC_ID);
  await setDoc(docRef, settings);
}

// Get default settings
export function getDefaultEventsSettings(): EventsSettings {
  return { ...DEFAULT_EVENTS_SETTINGS };
}

// ============ UTILITY FUNCTIONS ============

// Generate slug from event title
export function generateEventSlug(title: string): string {
  return title
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, '-')
    .replace(/(^-|-$)/g, '');
}

// Format event date for display
export function formatEventDate(timestamp: Timestamp, allDay: boolean = false): string {
  const date = timestamp.toDate();
  const options: Intl.DateTimeFormatOptions = {
    weekday: 'short',
    month: 'short',
    day: 'numeric',
  };

  if (!allDay) {
    options.hour = 'numeric';
    options.minute = '2-digit';
  }

  return date.toLocaleDateString('en-US', options);
}

// Format event time range
export function formatEventTimeRange(
  startDate: Timestamp,
  endDate?: Timestamp,
  allDay: boolean = false
): string {
  if (allDay) return 'All Day';

  const start = startDate.toDate();
  const timeOptions: Intl.DateTimeFormatOptions = {
    hour: 'numeric',
    minute: '2-digit',
  };

  let result = start.toLocaleTimeString('en-US', timeOptions);

  if (endDate) {
    const end = endDate.toDate();
    result += ` - ${end.toLocaleTimeString('en-US', timeOptions)}`;
  }

  return result;
}

// Check if event is free
export function isEventFree(price?: string): boolean {
  if (!price) return true;
  const lower = price.toLowerCase();
  return lower === 'free' || lower === '$0' || lower === '0';
}

// Get Google Maps URL
export function getEventMapUrl(location: Event['location']): string {
  const address = `${location.name}, ${location.address}, ${location.city}`;
  return `https://www.google.com/maps/search/?api=1&query=${encodeURIComponent(address)}`;
}

// Generate Google Calendar URL
export function getGoogleCalendarUrl(event: Event): string {
  const start = event.startDate.toDate();
  const end = event.endDate?.toDate() || new Date(start.getTime() + 2 * 60 * 60 * 1000); // Default 2 hours

  const formatDate = (d: Date) => d.toISOString().replace(/-|:|\.\d+/g, '');

  const params = new URLSearchParams({
    action: 'TEMPLATE',
    text: event.title,
    dates: `${formatDate(start)}/${formatDate(end)}`,
    details: event.description || '',
    location: `${event.location.name}, ${event.location.address}, ${event.location.city}`,
  });

  return `https://calendar.google.com/calendar/render?${params.toString()}`;
}

// Check if event is happening today
export function isEventToday(timestamp: Timestamp): boolean {
  const eventDate = timestamp.toDate();
  const today = new Date();
  return (
    eventDate.getDate() === today.getDate() &&
    eventDate.getMonth() === today.getMonth() &&
    eventDate.getFullYear() === today.getFullYear()
  );
}

// Check if event is this weekend
export function isEventThisWeekend(timestamp: Timestamp): boolean {
  const eventDate = timestamp.toDate();
  const today = new Date();
  const dayOfWeek = today.getDay();

  // Calculate days until Saturday and Sunday
  const daysUntilSaturday = (6 - dayOfWeek + 7) % 7 || 7;
  const saturday = new Date(today);
  saturday.setDate(today.getDate() + daysUntilSaturday);
  saturday.setHours(0, 0, 0, 0);

  const sunday = new Date(saturday);
  sunday.setDate(saturday.getDate() + 1);
  sunday.setHours(23, 59, 59, 999);

  return eventDate >= saturday && eventDate <= sunday;
}

// Get events for a specific month (for calendar view)
export async function getEventsForMonth(year: number, month: number): Promise<Event[]> {
  const startOfMonth = new Date(year, month, 1);
  const endOfMonth = new Date(year, month + 1, 0, 23, 59, 59, 999);

  return getEventsByDateRange(startOfMonth, endOfMonth);
}
