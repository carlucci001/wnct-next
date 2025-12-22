import { useAuth } from '@/contexts/AuthContext';
import { Permission } from '@/lib/permissions';

export function usePermissions() {
  const { currentUser: user } = useAuth();

  // TODO: Implement proper role-based permissions when user profiles are added
  // For now, all authenticated users have all permissions
  const can = (permission: Permission): boolean => {
    if (!user) return false;
    // Temporary: grant all permissions to authenticated users
    return true;
  };

  return { can };
}
