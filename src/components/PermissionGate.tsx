'use client';

import { ReactNode } from 'react';
import { useAuth } from '@/hooks/useAuth';
import { UserPermissions, ROLE_PERMISSIONS } from '@/data/rolePermissions';
import { UserRole } from '@/types/user';

interface PermissionGateProps {
  /** The permission to check */
  permission: keyof UserPermissions;
  /** Content to render if permission is granted */
  children: ReactNode;
  /** Optional content to render if permission is denied */
  fallback?: ReactNode;
  /** For 'own' permissions, whether this is the user's own content */
  isOwnContent?: boolean;
}

/**
 * Check if user has permission based on their role
 */
function checkPermission(
  role: UserRole | null,
  permission: keyof UserPermissions,
  isOwnContent?: boolean
): boolean {
  if (!role) return false;

  const permissions = ROLE_PERMISSIONS[role];
  if (!permissions) return false;

  const value = permissions[permission];

  // Boolean permissions
  if (typeof value === 'boolean') {
    return value;
  }

  // 'all' | 'own' | 'none' permissions
  if (value === 'all') return true;
  if (value === 'none') return false;
  if (value === 'own') return isOwnContent ?? false;

  return false;
}

/**
 * Component that conditionally renders children based on user permissions.
 *
 * @example
 * // Only show delete button if user can delete any article
 * <PermissionGate permission="canDeleteAnyArticle">
 *   <button onClick={handleDelete}>Delete</button>
 * </PermissionGate>
 *
 * @example
 * // Show edit button for own content
 * <PermissionGate permission="canViewDrafts" isOwnContent={article.authorId === user.uid}>
 *   <button onClick={handleEdit}>Edit</button>
 * </PermissionGate>
 *
 * @example
 * // Show fallback for unauthorized users
 * <PermissionGate permission="canPublishArticle" fallback={<span>Awaiting approval</span>}>
 *   <button onClick={handlePublish}>Publish</button>
 * </PermissionGate>
 */
export function PermissionGate({
  permission,
  children,
  fallback = null,
  isOwnContent,
}: PermissionGateProps) {
  const { role, loading } = useAuth();

  // Don't render anything while loading
  if (loading) return null;

  const hasPermission = checkPermission(role, permission, isOwnContent);

  return hasPermission ? <>{children}</> : <>{fallback}</>;
}

/**
 * Hook to check permissions programmatically
 */
export function usePermission(
  permission: keyof UserPermissions,
  isOwnContent?: boolean
): { hasPermission: boolean; loading: boolean } {
  const { role, loading } = useAuth();

  return {
    hasPermission: checkPermission(role, permission, isOwnContent),
    loading,
  };
}

/**
 * Hook to get all permissions for the current user
 */
export function usePermissions(): {
  permissions: UserPermissions | null;
  role: UserRole | null;
  loading: boolean;
} {
  const { role, loading } = useAuth();

  if (!role) {
    return { permissions: null, role: null, loading };
  }

  return {
    permissions: ROLE_PERMISSIONS[role] || null,
    role,
    loading,
  };
}
