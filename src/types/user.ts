export type UserRole =
  | 'admin'
  | 'business-owner'
  | 'editor-in-chief'
  | 'editor'
  | 'content-contributor'
  | 'commenter'
  | 'reader'
  | 'guest';

export type AccountType = 'free' | 'basic' | 'premium' | 'enterprise';

export interface User {
  id: string;
  email: string;
  displayName?: string;
  phone?: string;
  role: UserRole;
  accountType: AccountType;
  status: 'active' | 'blocked';
  photoURL?: string;
  createdAt: Date;
  updatedAt: Date;
  // SaaS Multi-Tenancy
  tenantId?: string;           // The tenant this user belongs to
  isTenantOwner?: boolean;     // Whether user owns the tenant
}

export interface UserUpdate {
  displayName?: string;
  phone?: string;
  role?: UserRole;
  accountType?: AccountType;
  status?: 'active' | 'blocked';
  photoURL?: string;
  tenantId?: string;
  isTenantOwner?: boolean;
}
