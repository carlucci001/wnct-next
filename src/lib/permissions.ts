import { User, UserRole } from '@/types/user';

export type Permission =
  | 'create_article'
  | 'edit_own_article'
  | 'edit_any_article'
  | 'delete_own_article'
  | 'delete_any_article'
  | 'publish_article'
  | 'view_drafts'
  | 'manage_comments'
  | 'create_users'
  | 'edit_users'
  | 'delete_users'
  | 'assign_roles'
  | 'view_user_activity'
  | 'site_settings'
  | 'api_configuration'
  | 'theme_design'
  | 'manage_categories'
  | 'manage_tags'
  | 'manage_media_library'
  | 'infrastructure';

export const ROLE_PERMISSIONS: Record<UserRole, Permission[]> = {
  admin: [
    'create_article',
    'edit_own_article',
    'edit_any_article',
    'delete_own_article',
    'delete_any_article',
    'publish_article',
    'view_drafts',
    'manage_comments',
    'create_users',
    'edit_users',
    'delete_users',
    'assign_roles',
    'view_user_activity',
    'site_settings',
    'api_configuration',
    'theme_design',
    'manage_categories',
    'manage_tags',
    'manage_media_library',
    'infrastructure',
  ],
  "business-owner": [
    'create_article',
    'edit_own_article',
    'edit_any_article',
    'delete_own_article',
    'delete_any_article',
    'publish_article',
    'view_drafts',
    'manage_comments',
    'create_users',
    'edit_users',
    'delete_users',
    'assign_roles',
    'view_user_activity',
    'site_settings',
    'api_configuration',
    'theme_design',
    'manage_categories',
    'manage_tags',
    'manage_media_library',
  ],
  "editor-in-chief": [
    'create_article',
    'edit_own_article',
    'edit_any_article',
    'delete_own_article',
    'delete_any_article',
    'publish_article',
    'view_drafts',
    'manage_comments',
    'create_users',
    // 'edit_users' - Limited, handling with custom logic if needed, but for now assuming 'edit_users' means general access
    'view_user_activity',
    'manage_categories',
    'manage_tags',
    'manage_media_library',
    // Limited permissions handling:
    // 'edit_users' and 'assign_roles' are "Limited".
    // I will include them here but logic might restrict which users they can edit/assign.
    // However, the matrix says "Limited". If I exclude them, they can't do it at all.
    // If I include them, they can do it. I'll include them and assume UI/backend logic handles the "Limited" scope (e.g., cannot edit admins).
    'edit_users',
    'assign_roles',
  ],
  editor: [
    'create_article',
    'edit_own_article',
    'edit_any_article',
    'delete_own_article',
    'view_drafts',
    'manage_comments',
    'manage_categories',
    'manage_tags',
    'manage_media_library',
  ],
  "content-contributor": [
    'create_article',
    'edit_own_article',
    'delete_own_article',
    // 'view_drafts' - Own Only. 'view_drafts' permission usually means viewing ALL drafts or accessing the drafts section.
    // If they can only view OWN drafts, they probably shouldn't have the global 'view_drafts' permission if that implies seeing others'.
    // However, the matrix says "Own Only". I'll omit 'view_drafts' here and assume the UI for "My Articles" handles showing their own drafts.
    // Or I can define 'view_own_drafts' vs 'view_any_drafts'.
    // Given the 20 permissions constraint, I'll assume 'view_drafts' means "Access Drafts List".
    // If Contributor has "Own Only", maybe they don't have the general permission.
    // But I will stick to the matrix: Contributor row for View Drafts says "Own Only".
    // I will NOT give them 'view_drafts' if 'view_drafts' means "See all drafts".
    'manage_tags',
    'manage_media_library',
  ],
  commenter: [
    // Manage comments: Own Only.
  ],
  reader: [],
  guest: [],
};

// Helper to check if a user has a specific permission
export function hasPermission(user: User | null | undefined, permission: Permission): boolean {
  if (!user) return false;

  const userPermissions = ROLE_PERMISSIONS[user.role];
  if (!userPermissions) return false;

  return userPermissions.includes(permission);
}
