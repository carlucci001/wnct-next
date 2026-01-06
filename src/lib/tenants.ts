import { db } from './firebase';
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
  limit,
} from 'firebase/firestore';
import {
  Tenant,
  TenantCreate,
  TenantStatus,
  TenantPlan,
  TenantSettings,
} from '@/types/tenant';
import { TRIAL_CREDITS, TRIAL_DURATION_DAYS, CREDIT_PACKAGES } from '@/config/creditPricing';

const TENANTS_COLLECTION = 'tenants';

// ============================================================================
// Tenant CRUD Operations
// ============================================================================

/**
 * Get all tenants (admin only)
 */
export async function getAllTenants(): Promise<Tenant[]> {
  try {
    const q = query(
      collection(db, TENANTS_COLLECTION),
      orderBy('createdAt', 'desc')
    );
    const snapshot = await getDocs(q);

    return snapshot.docs.map((docSnap) => {
      const data = docSnap.data();
      return {
        id: docSnap.id,
        ...data,
        createdAt: data.createdAt?.toDate ? data.createdAt.toDate() : new Date(data.createdAt),
        updatedAt: data.updatedAt?.toDate ? data.updatedAt.toDate() : new Date(data.updatedAt),
        trialEndsAt: data.trialEndsAt?.toDate ? data.trialEndsAt.toDate() : undefined,
      } as Tenant;
    });
  } catch (error) {
    console.error('Error fetching tenants:', error);
    return [];
  }
}

/**
 * Get a tenant by ID
 */
export async function getTenantById(tenantId: string): Promise<Tenant | null> {
  try {
    const tenantRef = doc(db, TENANTS_COLLECTION, tenantId);
    const tenantSnap = await getDoc(tenantRef);

    if (!tenantSnap.exists()) return null;

    const data = tenantSnap.data();
    return {
      id: tenantSnap.id,
      ...data,
      createdAt: data.createdAt?.toDate ? data.createdAt.toDate() : new Date(data.createdAt),
      updatedAt: data.updatedAt?.toDate ? data.updatedAt.toDate() : new Date(data.updatedAt),
      trialEndsAt: data.trialEndsAt?.toDate ? data.trialEndsAt.toDate() : undefined,
    } as Tenant;
  } catch (error) {
    console.error('Error fetching tenant:', error);
    return null;
  }
}

/**
 * Get a tenant by slug
 */
export async function getTenantBySlug(slug: string): Promise<Tenant | null> {
  try {
    const q = query(
      collection(db, TENANTS_COLLECTION),
      where('slug', '==', slug),
      limit(1)
    );
    const snapshot = await getDocs(q);

    if (snapshot.empty) return null;

    const docSnap = snapshot.docs[0];
    const data = docSnap.data();
    return {
      id: docSnap.id,
      ...data,
      createdAt: data.createdAt?.toDate ? data.createdAt.toDate() : new Date(data.createdAt),
      updatedAt: data.updatedAt?.toDate ? data.updatedAt.toDate() : new Date(data.updatedAt),
      trialEndsAt: data.trialEndsAt?.toDate ? data.trialEndsAt.toDate() : undefined,
    } as Tenant;
  } catch (error) {
    console.error('Error fetching tenant by slug:', error);
    return null;
  }
}

/**
 * Get a tenant by owner ID
 */
export async function getTenantByOwner(ownerId: string): Promise<Tenant | null> {
  try {
    const q = query(
      collection(db, TENANTS_COLLECTION),
      where('ownerId', '==', ownerId),
      limit(1)
    );
    const snapshot = await getDocs(q);

    if (snapshot.empty) return null;

    const docSnap = snapshot.docs[0];
    const data = docSnap.data();
    return {
      id: docSnap.id,
      ...data,
      createdAt: data.createdAt?.toDate ? data.createdAt.toDate() : new Date(data.createdAt),
      updatedAt: data.updatedAt?.toDate ? data.updatedAt.toDate() : new Date(data.updatedAt),
      trialEndsAt: data.trialEndsAt?.toDate ? data.trialEndsAt.toDate() : undefined,
    } as Tenant;
  } catch (error) {
    console.error('Error fetching tenant by owner:', error);
    return null;
  }
}

/**
 * Check if a slug is available
 */
export async function isSlugAvailable(slug: string): Promise<boolean> {
  const tenant = await getTenantBySlug(slug);
  return tenant === null;
}

/**
 * Generate a unique slug from a name
 */
export async function generateUniqueSlug(name: string): Promise<string> {
  const baseSlug = name
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, '-')
    .replace(/^-|-$/g, '');

  let slug = baseSlug;
  let counter = 1;

  while (!(await isSlugAvailable(slug))) {
    slug = `${baseSlug}-${counter}`;
    counter++;
  }

  return slug;
}

/**
 * Create a new tenant
 */
export async function createTenant(data: TenantCreate): Promise<Tenant> {
  try {
    // Ensure slug is unique
    const slug = await generateUniqueSlug(data.slug || data.name);

    // Calculate trial end date
    const trialEndsAt = new Date();
    trialEndsAt.setDate(trialEndsAt.getDate() + TRIAL_DURATION_DAYS);

    // Default settings
    const defaultSettings: TenantSettings = {
      siteName: data.name,
      tagline: '',
      primaryColor: '#3b82f6',
      ...data.settings,
    };

    const tenantRef = doc(collection(db, TENANTS_COLLECTION));

    const tenant: Omit<Tenant, 'id'> = {
      name: data.name,
      slug,
      ownerId: data.ownerId,
      status: 'trial',
      plan: data.plan || 'starter',
      credits: TRIAL_CREDITS,
      createdAt: new Date(),
      updatedAt: new Date(),
      settings: defaultSettings,
      trialEndsAt,
    };

    await setDoc(tenantRef, tenant);

    return {
      id: tenantRef.id,
      ...tenant,
    };
  } catch (error) {
    console.error('Error creating tenant:', error);
    throw error;
  }
}

/**
 * Update a tenant
 */
export async function updateTenant(
  tenantId: string,
  updates: Partial<Omit<Tenant, 'id' | 'createdAt'>>
): Promise<void> {
  try {
    const tenantRef = doc(db, TENANTS_COLLECTION, tenantId);
    await updateDoc(tenantRef, {
      ...updates,
      updatedAt: new Date(),
    });
  } catch (error) {
    console.error('Error updating tenant:', error);
    throw error;
  }
}

/**
 * Update tenant settings
 */
export async function updateTenantSettings(
  tenantId: string,
  settings: Partial<TenantSettings>
): Promise<void> {
  try {
    const tenant = await getTenantById(tenantId);
    if (!tenant) throw new Error('Tenant not found');

    const updatedSettings = {
      ...tenant.settings,
      ...settings,
    };

    await updateTenant(tenantId, { settings: updatedSettings });
  } catch (error) {
    console.error('Error updating tenant settings:', error);
    throw error;
  }
}

/**
 * Update tenant status
 */
export async function updateTenantStatus(
  tenantId: string,
  status: TenantStatus
): Promise<void> {
  await updateTenant(tenantId, { status });
}

/**
 * Upgrade tenant plan
 */
export async function upgradeTenantPlan(
  tenantId: string,
  plan: TenantPlan
): Promise<void> {
  await updateTenant(tenantId, {
    plan,
    status: 'active', // Upgrading activates the account
  });
}

/**
 * Delete a tenant (soft delete by setting status to cancelled)
 */
export async function deleteTenant(tenantId: string): Promise<void> {
  await updateTenantStatus(tenantId, 'cancelled');
}

/**
 * Permanently delete a tenant and all data (admin only)
 */
export async function permanentlyDeleteTenant(tenantId: string): Promise<void> {
  try {
    const tenantRef = doc(db, TENANTS_COLLECTION, tenantId);
    await deleteDoc(tenantRef);
    // Note: In production, you'd also delete all tenant data (articles, users, etc.)
  } catch (error) {
    console.error('Error permanently deleting tenant:', error);
    throw error;
  }
}

// ============================================================================
// Tenant Queries
// ============================================================================

/**
 * Get tenants by status
 */
export async function getTenantsByStatus(status: TenantStatus): Promise<Tenant[]> {
  try {
    const q = query(
      collection(db, TENANTS_COLLECTION),
      where('status', '==', status),
      orderBy('createdAt', 'desc')
    );
    const snapshot = await getDocs(q);

    return snapshot.docs.map((docSnap) => {
      const data = docSnap.data();
      return {
        id: docSnap.id,
        ...data,
        createdAt: data.createdAt?.toDate ? data.createdAt.toDate() : new Date(data.createdAt),
        updatedAt: data.updatedAt?.toDate ? data.updatedAt.toDate() : new Date(data.updatedAt),
        trialEndsAt: data.trialEndsAt?.toDate ? data.trialEndsAt.toDate() : undefined,
      } as Tenant;
    });
  } catch (error) {
    console.error('Error fetching tenants by status:', error);
    return [];
  }
}

/**
 * Get tenants by plan
 */
export async function getTenantsByPlan(plan: TenantPlan): Promise<Tenant[]> {
  try {
    const q = query(
      collection(db, TENANTS_COLLECTION),
      where('plan', '==', plan),
      orderBy('createdAt', 'desc')
    );
    const snapshot = await getDocs(q);

    return snapshot.docs.map((docSnap) => {
      const data = docSnap.data();
      return {
        id: docSnap.id,
        ...data,
        createdAt: data.createdAt?.toDate ? data.createdAt.toDate() : new Date(data.createdAt),
        updatedAt: data.updatedAt?.toDate ? data.updatedAt.toDate() : new Date(data.updatedAt),
        trialEndsAt: data.trialEndsAt?.toDate ? data.trialEndsAt.toDate() : undefined,
      } as Tenant;
    });
  } catch (error) {
    console.error('Error fetching tenants by plan:', error);
    return [];
  }
}

/**
 * Get expired trial tenants
 */
export async function getExpiredTrials(): Promise<Tenant[]> {
  try {
    const now = new Date();
    const q = query(
      collection(db, TENANTS_COLLECTION),
      where('status', '==', 'trial'),
      where('trialEndsAt', '<', now)
    );
    const snapshot = await getDocs(q);

    return snapshot.docs.map((docSnap) => {
      const data = docSnap.data();
      return {
        id: docSnap.id,
        ...data,
        createdAt: data.createdAt?.toDate ? data.createdAt.toDate() : new Date(data.createdAt),
        updatedAt: data.updatedAt?.toDate ? data.updatedAt.toDate() : new Date(data.updatedAt),
        trialEndsAt: data.trialEndsAt?.toDate ? data.trialEndsAt.toDate() : undefined,
      } as Tenant;
    });
  } catch (error) {
    console.error('Error fetching expired trials:', error);
    return [];
  }
}

/**
 * Get low credit tenants (below threshold)
 */
export async function getLowCreditTenants(threshold: number = 10): Promise<Tenant[]> {
  try {
    const q = query(
      collection(db, TENANTS_COLLECTION),
      where('status', 'in', ['trial', 'active']),
      where('credits', '<', threshold)
    );
    const snapshot = await getDocs(q);

    return snapshot.docs.map((docSnap) => {
      const data = docSnap.data();
      return {
        id: docSnap.id,
        ...data,
        createdAt: data.createdAt?.toDate ? data.createdAt.toDate() : new Date(data.createdAt),
        updatedAt: data.updatedAt?.toDate ? data.updatedAt.toDate() : new Date(data.updatedAt),
        trialEndsAt: data.trialEndsAt?.toDate ? data.trialEndsAt.toDate() : undefined,
      } as Tenant;
    });
  } catch (error) {
    console.error('Error fetching low credit tenants:', error);
    return [];
  }
}

// ============================================================================
// Tenant Statistics
// ============================================================================

/**
 * Get tenant statistics (admin dashboard)
 */
export async function getTenantStats(): Promise<{
  total: number;
  byStatus: Record<TenantStatus, number>;
  byPlan: Record<TenantPlan, number>;
  totalCredits: number;
}> {
  try {
    const tenants = await getAllTenants();

    const byStatus: Record<TenantStatus, number> = {
      trial: 0,
      active: 0,
      suspended: 0,
      cancelled: 0,
    };

    const byPlan: Record<TenantPlan, number> = {
      starter: 0,
      growth: 0,
      professional: 0,
      enterprise: 0,
    };

    let totalCredits = 0;

    tenants.forEach((tenant) => {
      byStatus[tenant.status]++;
      byPlan[tenant.plan]++;
      totalCredits += tenant.credits;
    });

    return {
      total: tenants.length,
      byStatus,
      byPlan,
      totalCredits,
    };
  } catch (error) {
    console.error('Error getting tenant stats:', error);
    return {
      total: 0,
      byStatus: { trial: 0, active: 0, suspended: 0, cancelled: 0 },
      byPlan: { starter: 0, growth: 0, professional: 0, enterprise: 0 },
      totalCredits: 0,
    };
  }
}

// ============================================================================
// Tenant Validation
// ============================================================================

/**
 * Check if tenant is active (can use features)
 */
export async function isTenantActive(tenantId: string): Promise<boolean> {
  const tenant = await getTenantById(tenantId);
  if (!tenant) return false;

  if (tenant.status === 'active') return true;

  if (tenant.status === 'trial' && tenant.trialEndsAt) {
    return new Date() < tenant.trialEndsAt;
  }

  return false;
}

/**
 * Get days remaining in trial
 */
export async function getTrialDaysRemaining(tenantId: string): Promise<number> {
  const tenant = await getTenantById(tenantId);
  if (!tenant || tenant.status !== 'trial' || !tenant.trialEndsAt) {
    return 0;
  }

  const now = new Date();
  const diff = tenant.trialEndsAt.getTime() - now.getTime();
  return Math.max(0, Math.ceil(diff / (1000 * 60 * 60 * 24)));
}
