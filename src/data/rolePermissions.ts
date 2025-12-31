export type UserRole =
  | 'admin'
  | 'business-owner'
  | 'editor-in-chief'
  | 'editor'
  | 'content-contributor'
  | 'commenter'
  | 'reader'
  | 'guest';

export interface UserPermissions {
  // Content Permissions
  canCreateArticle: boolean;
  canEditOwnArticle: boolean;
  canEditAnyArticle: boolean;
  canDeleteOwnArticle: boolean;
  canDeleteAnyArticle: boolean;
  canPublishArticle: boolean;
  canViewDrafts: 'all' | 'own' | 'none';
  canManageComments: 'all' | 'own' | 'none';

  // User Management Permissions
  canCreateUsers: boolean;
  canEditUsers: boolean;
  canDeleteUsers: boolean;
  canAssignRoles: boolean;
  canViewUserActivity: boolean;

  // Settings & System Permissions
  canAccessSiteSettings: boolean;
  canAccessApiConfig: boolean;
  canAccessThemeSettings: boolean;
  canManageCategories: boolean;
  canManageTags: boolean;
  canAccessMediaLibrary: boolean;
  canAccessInfrastructure: boolean;
}

/**
 * Default permissions for each role
 */
export const ROLE_PERMISSIONS: Record<UserRole, UserPermissions> = {
  'admin': {
    canCreateArticle: true,
    canEditOwnArticle: true,
    canEditAnyArticle: true,
    canDeleteOwnArticle: true,
    canDeleteAnyArticle: true,
    canPublishArticle: true,
    canViewDrafts: 'all',
    canManageComments: 'all',
    canCreateUsers: true,
    canEditUsers: true,
    canDeleteUsers: true,
    canAssignRoles: true,
    canViewUserActivity: true,
    canAccessSiteSettings: true,
    canAccessApiConfig: true,
    canAccessThemeSettings: true,
    canManageCategories: true,
    canManageTags: true,
    canAccessMediaLibrary: true,
    canAccessInfrastructure: true,
  },

  'business-owner': {
    canCreateArticle: true,
    canEditOwnArticle: true,
    canEditAnyArticle: true,
    canDeleteOwnArticle: true,
    canDeleteAnyArticle: true,
    canPublishArticle: true,
    canViewDrafts: 'all',
    canManageComments: 'all',
    canCreateUsers: true,
    canEditUsers: true,
    canDeleteUsers: true,
    canAssignRoles: true,
    canViewUserActivity: true,
    canAccessSiteSettings: true,
    canAccessApiConfig: true,
    canAccessThemeSettings: true,
    canManageCategories: true,
    canManageTags: true,
    canAccessMediaLibrary: true,
    canAccessInfrastructure: false,
  },

  'editor-in-chief': {
    canCreateArticle: true,
    canEditOwnArticle: true,
    canEditAnyArticle: true,
    canDeleteOwnArticle: true,
    canDeleteAnyArticle: true,
    canPublishArticle: true,
    canViewDrafts: 'all',
    canManageComments: 'all',
    canCreateUsers: true,
    canEditUsers: true,
    canDeleteUsers: false,
    canAssignRoles: true,
    canViewUserActivity: true,
    canAccessSiteSettings: false,
    canAccessApiConfig: false,
    canAccessThemeSettings: false,
    canManageCategories: true,
    canManageTags: true,
    canAccessMediaLibrary: true,
    canAccessInfrastructure: false,
  },

  'editor': {
    canCreateArticle: true,
    canEditOwnArticle: true,
    canEditAnyArticle: true,
    canDeleteOwnArticle: true,
    canDeleteAnyArticle: false,
    canPublishArticle: false,
    canViewDrafts: 'all',
    canManageComments: 'all',
    canCreateUsers: false,
    canEditUsers: false,
    canDeleteUsers: false,
    canAssignRoles: false,
    canViewUserActivity: false,
    canAccessSiteSettings: false,
    canAccessApiConfig: false,
    canAccessThemeSettings: false,
    canManageCategories: true,
    canManageTags: true,
    canAccessMediaLibrary: true,
    canAccessInfrastructure: false,
  },

  'content-contributor': {
    canCreateArticle: true,
    canEditOwnArticle: true,
    canEditAnyArticle: false,
    canDeleteOwnArticle: true,
    canDeleteAnyArticle: false,
    canPublishArticle: false,
    canViewDrafts: 'own',
    canManageComments: 'none',
    canCreateUsers: false,
    canEditUsers: false,
    canDeleteUsers: false,
    canAssignRoles: false,
    canViewUserActivity: false,
    canAccessSiteSettings: false,
    canAccessApiConfig: false,
    canAccessThemeSettings: false,
    canManageCategories: false,
    canManageTags: true,
    canAccessMediaLibrary: true,
    canAccessInfrastructure: false,
  },

  'commenter': {
    canCreateArticle: false,
    canEditOwnArticle: false,
    canEditAnyArticle: false,
    canDeleteOwnArticle: false,
    canDeleteAnyArticle: false,
    canPublishArticle: false,
    canViewDrafts: 'none',
    canManageComments: 'own',
    canCreateUsers: false,
    canEditUsers: false,
    canDeleteUsers: false,
    canAssignRoles: false,
    canViewUserActivity: false,
    canAccessSiteSettings: false,
    canAccessApiConfig: false,
    canAccessThemeSettings: false,
    canManageCategories: false,
    canManageTags: false,
    canAccessMediaLibrary: false,
    canAccessInfrastructure: false,
  },

  'reader': {
    canCreateArticle: false,
    canEditOwnArticle: false,
    canEditAnyArticle: false,
    canDeleteOwnArticle: false,
    canDeleteAnyArticle: false,
    canPublishArticle: false,
    canViewDrafts: 'none',
    canManageComments: 'none',
    canCreateUsers: false,
    canEditUsers: false,
    canDeleteUsers: false,
    canAssignRoles: false,
    canViewUserActivity: false,
    canAccessSiteSettings: false,
    canAccessApiConfig: false,
    canAccessThemeSettings: false,
    canManageCategories: false,
    canManageTags: false,
    canAccessMediaLibrary: false,
    canAccessInfrastructure: false,
  },

  'guest': {
    canCreateArticle: false,
    canEditOwnArticle: false,
    canEditAnyArticle: false,
    canDeleteOwnArticle: false,
    canDeleteAnyArticle: false,
    canPublishArticle: false,
    canViewDrafts: 'none',
    canManageComments: 'none',
    canCreateUsers: false,
    canEditUsers: false,
    canDeleteUsers: false,
    canAssignRoles: false,
    canViewUserActivity: false,
    canAccessSiteSettings: false,
    canAccessApiConfig: false,
    canAccessThemeSettings: false,
    canManageCategories: false,
    canManageTags: false,
    canAccessMediaLibrary: false,
    canAccessInfrastructure: false,
  },
};

/**
 * Role display names
 */
export const ROLE_LABELS: Record<UserRole, string> = {
  'admin': 'Administrator',
  'business-owner': 'Business Owner',
  'editor-in-chief': 'Editor-in-Chief',
  'editor': 'Editor',
  'content-contributor': 'Content Contributor',
  'commenter': 'Commenter',
  'reader': 'Reader',
  'guest': 'Guest',
};

/**
 * Role descriptions
 */
export const ROLE_DESCRIPTIONS: Record<UserRole, string> = {
  'admin': 'Full system access with all permissions',
  'business-owner': 'Manages business settings and content team',
  'editor-in-chief': 'Oversees editorial workflow and publishes content',
  'editor': 'Reviews and edits articles, manages assignments',
  'content-contributor': 'Creates and submits articles for review',
  'commenter': 'Can comment on published articles',
  'reader': 'Read-only access to published content',
  'guest': 'No authenticated access',
};

/**
 * Permission labels for display
 */
export const PERMISSION_LABELS: Record<keyof UserPermissions, string> = {
  canCreateArticle: 'Create Articles',
  canEditOwnArticle: 'Edit Own Articles',
  canEditAnyArticle: 'Edit Any Article',
  canDeleteOwnArticle: 'Delete Own Articles',
  canDeleteAnyArticle: 'Delete Any Article',
  canPublishArticle: 'Publish Articles',
  canViewDrafts: 'View Drafts',
  canManageComments: 'Manage Comments',
  canCreateUsers: 'Create Users',
  canEditUsers: 'Edit Users',
  canDeleteUsers: 'Delete Users',
  canAssignRoles: 'Assign Roles',
  canViewUserActivity: 'View User Activity',
  canAccessSiteSettings: 'Access Site Settings',
  canAccessApiConfig: 'Access API Config',
  canAccessThemeSettings: 'Access Theme Settings',
  canManageCategories: 'Manage Categories',
  canManageTags: 'Manage Tags',
  canAccessMediaLibrary: 'Access Media Library',
  canAccessInfrastructure: 'Access Infrastructure',
};

/**
 * Get permissions for a user (role defaults + custom overrides)
 */
export function getUserPermissions(user: { role: UserRole; permissions?: Partial<UserPermissions> }): UserPermissions {
  const roleDefaults = ROLE_PERMISSIONS[user.role] || ROLE_PERMISSIONS['guest'];
  return { ...roleDefaults, ...user.permissions };
}

/**
 * Check if user has a specific permission
 */
export function hasPermission(
  user: { role: UserRole; permissions?: Partial<UserPermissions> },
  permission: keyof UserPermissions
): boolean {
  const permissions = getUserPermissions(user);
  const value = permissions[permission];
  return value === true || value === 'all';
}
