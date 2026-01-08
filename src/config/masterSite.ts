// Master Site Configuration
// This file controls features that are ONLY available on the master site (wnctimes.com)
// Clones/Paper Partners will NOT have these features enabled

// Super Admin UID - only this user can access SaaS management
export const SUPER_ADMIN_UID = 'MxwvZX7bBtWewey59ckuhNpp1r73';

// Check if this is the master site (set in .env.local on wnctimes.com only)
export const IS_MASTER_SITE = process.env.NEXT_PUBLIC_IS_MASTER_SITE === 'true';

/**
 * Check if user is the super admin (Carl)
 * Only the super admin can manage paper partners
 */
export function isSuperAdmin(uid: string | undefined | null): boolean {
  if (!uid) return false;
  return uid === SUPER_ADMIN_UID;
}

/**
 * Check if super admin features should be shown
 * Requires both: master site AND super admin user
 */
export function canAccessSuperAdmin(uid: string | undefined | null): boolean {
  return IS_MASTER_SITE && isSuperAdmin(uid);
}

/**
 * Check if paper partner features should be shown
 * Paper partners can access their portal on any site (including clones)
 * but the super admin management is only on master
 */
export function canAccessPartnerPortal(tenantId: string | undefined | null): boolean {
  return !!tenantId;
}

// Routes that are master-site only
export const MASTER_ONLY_ROUTES = [
  '/admin/partners',
  '/admin/partners/tenants',
  '/admin/partners/orders',
  '/admin/partners/credits',
];

// Routes for paper partner portal (available to tenant owners)
export const PARTNER_PORTAL_ROUTES = [
  '/partner-portal',
  '/partner-portal/settings',
  '/partner-portal/billing',
  '/partner-portal/team',
];
