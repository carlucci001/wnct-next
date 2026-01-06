import { UserRole } from '@/types/user';
import {
  User,
  Bookmark,
  MessageCircle,
  Users,
  FileText,
  PenTool,
  Building2,
  Megaphone,
  Shield,
  LucideIcon,
} from 'lucide-react';

export type AccountTab =
  | 'profile'
  | 'saved'
  | 'comments'
  | 'community'
  | 'my-articles'
  | 'submit-article'
  | 'businesses'
  | 'ads';

export interface MenuItem {
  id: AccountTab;
  label: string;
  icon: LucideIcon;
  iconColor?: string;
  description?: string;
}

export interface MenuSection {
  id: string;
  label: string;
  icon?: LucideIcon;
  iconColor?: string;
  items: MenuItem[];
}

// Base menu items available to all authenticated users
const baseMenuItems: MenuItem[] = [
  {
    id: 'profile',
    label: 'My Profile',
    icon: User,
    iconColor: 'text-blue-600',
    description: 'Manage your account settings',
  },
  {
    id: 'saved',
    label: 'Saved Articles',
    icon: Bookmark,
    iconColor: 'text-amber-600',
    description: 'Your bookmarked articles',
  },
];

// Community items for commenters and above
const communityMenuItems: MenuItem[] = [
  {
    id: 'comments',
    label: 'My Comments',
    icon: MessageCircle,
    iconColor: 'text-green-600',
    description: 'Your comment history',
  },
  {
    id: 'community',
    label: 'Community',
    icon: Users,
    iconColor: 'text-purple-600',
    description: 'Community engagement',
  },
];

// Content contributor items
const contributorMenuItems: MenuItem[] = [
  {
    id: 'my-articles',
    label: 'My Articles',
    icon: FileText,
    iconColor: 'text-blue-600',
    description: 'View your submitted articles',
  },
  {
    id: 'submit-article',
    label: 'Submit Article',
    icon: PenTool,
    iconColor: 'text-indigo-600',
    description: 'Submit a new article for review',
  },
];

// Business owner items
const businessMenuItems: MenuItem[] = [
  {
    id: 'businesses',
    label: 'My Businesses',
    icon: Building2,
    iconColor: 'text-emerald-600',
    description: 'Manage your business listings',
  },
  {
    id: 'ads',
    label: 'My Ads',
    icon: Megaphone,
    iconColor: 'text-orange-600',
    description: 'Manage your ad campaigns',
  },
];

// Role hierarchy for permission checks
const roleHierarchy: Record<UserRole, number> = {
  guest: 0,
  reader: 1,
  commenter: 2,
  'content-contributor': 3,
  'business-owner': 4,
  editor: 5,
  'editor-in-chief': 6,
  admin: 7,
};

export function hasRole(userRole: UserRole, requiredRole: UserRole): boolean {
  return roleHierarchy[userRole] >= roleHierarchy[requiredRole];
}

export function getAccountMenuSections(role: UserRole): MenuSection[] {
  const sections: MenuSection[] = [];

  // Account section - available to all
  sections.push({
    id: 'account',
    label: 'Account',
    icon: User,
    iconColor: 'text-blue-500',
    items: [...baseMenuItems],
  });

  // Community section - for commenters and above
  if (hasRole(role, 'commenter')) {
    sections.push({
      id: 'community',
      label: 'Community',
      icon: Users,
      iconColor: 'text-purple-500',
      items: [...communityMenuItems],
    });
  }

  // Content section - for content contributors and above
  if (hasRole(role, 'content-contributor')) {
    sections.push({
      id: 'content',
      label: 'Content',
      icon: FileText,
      iconColor: 'text-indigo-500',
      items: [...contributorMenuItems],
    });
  }

  // Business section - for business owners and admin
  if (role === 'business-owner' || role === 'admin') {
    sections.push({
      id: 'business',
      label: 'Business',
      icon: Building2,
      iconColor: 'text-emerald-500',
      items: [...businessMenuItems],
    });
  }

  return sections;
}

// Get flat list of all menu items for a role
export function getAccountMenuItems(role: UserRole): MenuItem[] {
  const sections = getAccountMenuSections(role);
  return sections.flatMap((section) => section.items);
}

// Check if user has access to a specific tab
export function canAccessTab(role: UserRole, tab: AccountTab): boolean {
  const items = getAccountMenuItems(role);
  return items.some((item) => item.id === tab);
}

// Get the default tab for a role
export function getDefaultTab(role: UserRole): AccountTab {
  return 'profile';
}

// Admin roles that can access admin panel
export const ADMIN_ROLES: UserRole[] = [
  'admin',
  'business-owner',
  'editor-in-chief',
  'editor',
  'content-contributor',
];

export function canAccessAdmin(role: UserRole): boolean {
  return ADMIN_ROLES.includes(role);
}
