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
}

export interface UserUpdate {
  displayName?: string;
  phone?: string;
  role?: UserRole;
  accountType?: AccountType;
  status?: 'active' | 'blocked';
  photoURL?: string;
}
