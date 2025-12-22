export type UserRole =
  | 'admin'
  | 'business-owner'
  | 'editor-in-chief'
  | 'editor'
  | 'content-contributor'
  | 'commenter'
  | 'reader';

export interface User {
  id: string;
  email: string;
  displayName?: string;
  role: UserRole;
  status: 'active' | 'blocked';
  photoURL?: string;
  createdAt: Date;
  updatedAt: Date;
}
