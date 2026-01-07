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
  increment,
  Timestamp,
} from 'firebase/firestore';
import { Advertisement, AdvertisingSettings } from '@/types/advertisement';

const COLLECTION_NAME = 'advertisements';
const SETTINGS_COLLECTION = 'componentSettings';
const SETTINGS_DOC_ID = 'advertising';

// ==================== ADVERTISEMENT CRUD ====================

// CREATE
export async function createAd(
  data: Omit<Advertisement, 'id' | 'createdAt' | 'impressions' | 'clicks'>
): Promise<string> {
  const docRef = doc(collection(getDb(), COLLECTION_NAME));
  await setDoc(docRef, {
    ...data,
    id: docRef.id,
    impressions: 0,
    clicks: 0,
    createdAt: serverTimestamp(),
  });
  return docRef.id;
}

// READ (List all)
export async function getAds(): Promise<Advertisement[]> {
  const q = query(collection(getDb(), COLLECTION_NAME), orderBy('createdAt', 'desc'));
  const snapshot = await getDocs(q);
  return snapshot.docs.map((doc) => ({ ...doc.data(), id: doc.id } as Advertisement));
}

// READ (Active ads only)
export async function getActiveAds(): Promise<Advertisement[]> {
  const now = Timestamp.now();
  const q = query(
    collection(getDb(), COLLECTION_NAME),
    where('status', '==', 'active'),
    orderBy('priority', 'desc')
  );
  const snapshot = await getDocs(q);

  // Filter by date range client-side (Firestore compound queries limitation)
  return snapshot.docs
    .map((doc) => ({ ...doc.data(), id: doc.id } as Advertisement))
    .filter((ad) => {
      const startDate = ad.startDate instanceof Timestamp ? ad.startDate : Timestamp.fromDate(new Date(ad.startDate));
      const endDate = ad.endDate instanceof Timestamp ? ad.endDate : Timestamp.fromDate(new Date(ad.endDate));
      return startDate.toMillis() <= now.toMillis() && endDate.toMillis() >= now.toMillis();
    });
}

// READ (By placement)
export async function getAdsByPlacement(placement: string): Promise<Advertisement[]> {
  const now = Timestamp.now();
  const q = query(
    collection(getDb(), COLLECTION_NAME),
    where('status', '==', 'active'),
    where('placement', '==', placement),
    orderBy('priority', 'desc')
  );
  const snapshot = await getDocs(q);

  return snapshot.docs
    .map((doc) => ({ ...doc.data(), id: doc.id } as Advertisement))
    .filter((ad) => {
      const startDate = ad.startDate instanceof Timestamp ? ad.startDate : Timestamp.fromDate(new Date(ad.startDate));
      const endDate = ad.endDate instanceof Timestamp ? ad.endDate : Timestamp.fromDate(new Date(ad.endDate));
      return startDate.toMillis() <= now.toMillis() && endDate.toMillis() >= now.toMillis();
    });
}

// READ (By type)
export async function getAdsByType(type: Advertisement['type']): Promise<Advertisement[]> {
  const now = Timestamp.now();
  const q = query(
    collection(getDb(), COLLECTION_NAME),
    where('status', '==', 'active'),
    where('type', '==', type),
    orderBy('priority', 'desc')
  );
  const snapshot = await getDocs(q);

  return snapshot.docs
    .map((doc) => ({ ...doc.data(), id: doc.id } as Advertisement))
    .filter((ad) => {
      const startDate = ad.startDate instanceof Timestamp ? ad.startDate : Timestamp.fromDate(new Date(ad.startDate));
      const endDate = ad.endDate instanceof Timestamp ? ad.endDate : Timestamp.fromDate(new Date(ad.endDate));
      return startDate.toMillis() <= now.toMillis() && endDate.toMillis() >= now.toMillis();
    });
}

// READ (Single ad by ID)
export async function getAdById(id: string): Promise<Advertisement | null> {
  const docRef = doc(getDb(), COLLECTION_NAME, id);
  const docSnap = await getDoc(docRef);
  if (!docSnap.exists()) return null;
  return { ...docSnap.data(), id: docSnap.id } as Advertisement;
}

// UPDATE
export async function updateAd(id: string, updates: Partial<Advertisement>): Promise<void> {
  await updateDoc(doc(getDb(), COLLECTION_NAME, id), {
    ...updates,
  });
}

// DELETE
export async function deleteAd(id: string): Promise<void> {
  await deleteDoc(doc(getDb(), COLLECTION_NAME, id));
}

// ==================== TRACKING ====================

// Track Impression
export async function trackImpression(adId: string): Promise<void> {
  const docRef = doc(getDb(), COLLECTION_NAME, adId);
  await updateDoc(docRef, {
    impressions: increment(1),
  });
}

// Track Click
export async function trackClick(adId: string): Promise<void> {
  const docRef = doc(getDb(), COLLECTION_NAME, adId);
  await updateDoc(docRef, {
    clicks: increment(1),
  });
}

// ==================== SETTINGS ====================

// Get advertising settings
export async function getAdvertisingSettings(): Promise<AdvertisingSettings | null> {
  const docRef = doc(getDb(), SETTINGS_COLLECTION, SETTINGS_DOC_ID);
  const docSnap = await getDoc(docRef);
  if (!docSnap.exists()) return null;
  return docSnap.data() as AdvertisingSettings;
}

// Update advertising settings
export async function updateAdvertisingSettings(
  settings: Partial<AdvertisingSettings>
): Promise<void> {
  const docRef = doc(getDb(), SETTINGS_COLLECTION, SETTINGS_DOC_ID);
  const docSnap = await getDoc(docRef);

  if (!docSnap.exists()) {
    // Create default settings if they don't exist
    await setDoc(docRef, {
      enabled: true,
      showAdsToLoggedIn: true,
      headerBannerEnabled: true,
      sidebarAdsEnabled: true,
      inArticleAdsEnabled: true,
      adFrequency: 3,
      defaultAdImage: '',
      ...settings,
    });
  } else {
    await updateDoc(docRef, settings);
  }
}

// ==================== ANALYTICS HELPERS ====================

// Calculate CTR (Click-Through Rate)
export function calculateCTR(impressions: number, clicks: number): string {
  if (impressions === 0) return '0.00%';
  return ((clicks / impressions) * 100).toFixed(2) + '%';
}

// Get campaign analytics
export async function getCampaignAnalytics(campaignName: string): Promise<{
  totalImpressions: number;
  totalClicks: number;
  ctr: string;
  ads: Advertisement[];
}> {
  const q = query(
    collection(getDb(), COLLECTION_NAME),
    where('campaignName', '==', campaignName)
  );
  const snapshot = await getDocs(q);
  const ads = snapshot.docs.map((doc) => ({ ...doc.data(), id: doc.id } as Advertisement));

  const totalImpressions = ads.reduce((sum, ad) => sum + ad.impressions, 0);
  const totalClicks = ads.reduce((sum, ad) => sum + ad.clicks, 0);

  return {
    totalImpressions,
    totalClicks,
    ctr: calculateCTR(totalImpressions, totalClicks),
    ads,
  };
}
