import { 
  collection, 
  doc, 
  getDoc, 
  getDocs, 
  addDoc, 
  updateDoc, 
  deleteDoc, 
  query, 
  where, 
  orderBy, 
  limit, 
  increment, 
  serverTimestamp
} from 'firebase/firestore';
import { getDb } from './firebase';
import { AdCampaign, AdPosition } from '@/types/advertising';
import { Advertisement, AdvertisingSettings } from '@/types/advertisement';

const COLLECTION_NAME = 'advertising';

/**
 * Get all active ads for a specific position
 */
export async function getActiveAdsByPosition(position: AdPosition): Promise<AdCampaign[]> {
  const db = getDb();
  const adsRef = collection(db, COLLECTION_NAME);
  
  const q = query(
    adsRef,
    where('position', '==', position),
    where('status', '==', 'active'),
    // Note: Complex date filtering in Firestore often requires composite indexes.
    // We'll filter dates in memory for small sets, or rely on status updates.
    limit(5)
  );

  const querySnapshot = await getDocs(q);
  return querySnapshot.docs.map(doc => ({
    id: doc.id,
    ...doc.data()
  } as AdCampaign));
}

/**
 * Get campaigns for a specific client (User)
 */
export async function getClientCampaigns(clientId: string): Promise<AdCampaign[]> {
  const db = getDb();
  const adsRef = collection(db, COLLECTION_NAME);
  const q = query(
    adsRef,
    where('clientId', '==', clientId),
    orderBy('createdAt', 'desc')
  );

  const querySnapshot = await getDocs(q);
  return querySnapshot.docs.map(doc => ({
    id: doc.id,
    ...doc.data()
  } as AdCampaign));
}

/**
 * Record an impression (atomic increment)
 */
export async function recordImpression(adId: string) {
  const db = getDb();
  const adRef = doc(db, COLLECTION_NAME, adId);
  try {
    await updateDoc(adRef, {
      impressions: increment(1)
    });
  } catch (error) {
    console.error('Error recording impression:', error);
  }
}

/**
 * Record a click (atomic increment)
 */
export async function recordClick(adId: string) {
  const db = getDb();
  const adRef = doc(db, COLLECTION_NAME, adId);
  try {
    await updateDoc(adRef, {
      clicks: increment(1)
    });
  } catch (error) {
    console.error('Error recording click:', error);
  }
}

/**
 * Create a new campaign
 */
export async function createAdCampaign(ad: Omit<AdCampaign, 'id' | 'createdAt' | 'updatedAt' | 'impressions' | 'clicks'>) {
  const db = getDb();
  const adsRef = collection(db, COLLECTION_NAME);
  
  const newAd = {
    ...ad,
    impressions: 0,
    clicks: 0,
    createdAt: serverTimestamp(),
    updatedAt: serverTimestamp(),
  };

  const docRef = await addDoc(adsRef, newAd);
  return docRef.id;
}

/**
 * Update an existing campaign
 */
export async function updateAdCampaign(adId: string, updates: Partial<AdCampaign>) {
  const db = getDb();
  const adRef = doc(db, COLLECTION_NAME, adId);
  
  await updateDoc(adRef, {
    ...updates,
    updatedAt: serverTimestamp(),
  });
}

/**
 * Get all campaigns (Admin)
 */
export async function getAllCampaigns(): Promise<AdCampaign[]> {
  const db = getDb();
  const adsRef = collection(db, COLLECTION_NAME);
  const q = query(adsRef, orderBy('updatedAt', 'desc'));

  const querySnapshot = await getDocs(q);
  return querySnapshot.docs.map(doc => ({
    id: doc.id,
    ...doc.data()
  } as AdCampaign));
}

/**
 * Delete a campaign
 */
export async function deleteAdCampaign(adId: string) {
  const db = getDb();
  const adRef = doc(db, COLLECTION_NAME, adId);
  await deleteDoc(adRef);
}
/**
 * Get global advertising settings
 */
export async function getAdvertisingSettings(): Promise<AdvertisingSettings | null> {
  const db = getDb();
  const settingsRef = doc(db, 'settings', 'advertising');
  const settingsDoc = await getDoc(settingsRef);
  
  if (settingsDoc.exists()) {
    return settingsDoc.data() as AdvertisingSettings;
  }
  return null;
}

/**
 * Update global advertising settings
 */
export async function updateAdvertisingSettings(settings: AdvertisingSettings) {
  const db = getDb();
  const settingsRef = doc(db, 'settings', 'advertising');
  await updateDoc(settingsRef, {
    ...settings,
    updatedAt: serverTimestamp(),
  });
}

/**
 * Compatibility helper: Get ads by placement (from Advertisement type)
 */
export async function getAdsByPlacement(placement: string): Promise<Advertisement[]> {
  const db = getDb();
  const adsRef = collection(db, COLLECTION_NAME);
  const q = query(
    adsRef,
    where('placement', '==', placement),
    where('status', '==', 'active')
  );

  const querySnapshot = await getDocs(q);
  return querySnapshot.docs.map(doc => ({
    id: doc.id,
    ...doc.data()
  } as Advertisement));
}

/**
 * Compatibility helper: Get ads by type (sidebar, banner, etc)
 */
export async function getAdsByType(type: string): Promise<Advertisement[]> {
  const db = getDb();
  const adsRef = collection(db, COLLECTION_NAME);
  const q = query(
    adsRef,
    where('type', '==', type),
    where('status', '==', 'active'),
    orderBy('priority', 'desc')
  );

  const querySnapshot = await getDocs(q);
  return querySnapshot.docs.map(doc => ({
    id: doc.id,
    ...doc.data()
  } as Advertisement));
}

/**
 * Track impression (compatibility)
 */
export async function trackImpression(adId: string) {
  return recordImpression(adId);
}

/**
 * Track click (compatibility)
 */
export async function trackClick(adId: string) {
  return recordClick(adId);
}
