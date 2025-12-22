export type UserRole =
  | 'admin'
  | 'business_owner'
  | 'editor_in_chief'
  | 'editor'
  | 'content_contributor'
  | 'commenter'
  | 'reader';

export interface User {
  uid: string;
  email: string | null;
  displayName: string | null;
  role: UserRole;
  photoURL?: string | null;
}
