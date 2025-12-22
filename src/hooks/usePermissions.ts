import { useAuth } from '@/context/AuthContext';
import { hasPermission, Permission } from '@/lib/permissions';

export function usePermissions() {
  const { user } = useAuth();

  const can = (permission: Permission) => {
    return hasPermission(user, permission);
  };

  return { can };
}
