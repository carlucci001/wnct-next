# WNC Times - RBAC Implementation Plan

## Current State Assessment

### What's Built (Good Foundation)

| Component | Status | Location |
|-----------|--------|----------|
| Role definitions | Complete | `src/types/user.ts`, `src/data/rolePermissions.ts` |
| Permission matrix | Complete | `src/data/rolePermissions.ts` (8 roles, 19 permissions) |
| Firebase Auth | Working | `src/contexts/AuthContext.tsx` |
| User role hook | Working | `src/hooks/useAuth.ts` |
| Login/Register UI | Working | `src/app/(main)/login/page.tsx` |
| Users admin page | Working | `src/app/admin/users/page.tsx` |
| User CRUD functions | Partial | `src/lib/users.ts` |

### What's Missing (Security Gaps)

| Gap | Risk Level | Description |
|-----|------------|-------------|
| User document creation | HIGH | New users don't get a Firestore document on registration |
| Firestore security rules | CRITICAL | No `firestore.rules` file - data is unprotected |
| Permission enforcement | HIGH | RBAC matrix exists but isn't checked before actions |
| Admin route protection | MEDIUM | Only checks login, not role |
| Dual auth systems | LOW | `AuthContext` and `useAuth` hook are separate |

---

## Implementation Plan

### Phase 1: User Registration Flow (Priority: CRITICAL)

**Problem:** When users register via Firebase Auth, no document is created in Firestore's `users` collection. This means roles can't be assigned.

**Tasks:**

1. **Update AuthContext to create user document on registration**
   - File: `src/contexts/AuthContext.tsx`
   - After `createUserWithEmailAndPassword`, create Firestore doc with default role

```typescript
// In registerWithEmail function:
const userCredential = await createUserWithEmailAndPassword(auth, email, password);
await updateProfile(userCredential.user, { displayName });

// ADD: Create Firestore user document
await setDoc(doc(db, 'users', userCredential.user.uid), {
  email: userCredential.user.email,
  displayName,
  role: 'reader', // Default role for new users
  status: 'active',
  createdAt: new Date(),
  updatedAt: new Date(),
});
```

2. **Handle Google sign-in user creation**
   - Same approach - check if doc exists, create if not

3. **Merge auth systems**
   - Consolidate `AuthContext` and `useAuth` hook into one
   - Expose `role` and `permissions` from context

---

### Phase 2: Firestore Security Rules (Priority: CRITICAL)

**Problem:** No security rules = anyone can read/write anything.

**Tasks:**

1. **Create `firestore.rules` file at project root**

```javascript
rules_version = '2';
service cloud.firestore {
  match /databases/{database}/documents {

    // Helper functions
    function isAuthenticated() {
      return request.auth != null;
    }

    function getUserRole() {
      return get(/databases/$(database)/documents/users/$(request.auth.uid)).data.role;
    }

    function isAdmin() {
      return isAuthenticated() && getUserRole() in ['admin', 'business-owner'];
    }

    function isEditor() {
      return isAuthenticated() && getUserRole() in ['admin', 'business-owner', 'editor-in-chief', 'editor'];
    }

    function isContributor() {
      return isAuthenticated() && getUserRole() in ['admin', 'business-owner', 'editor-in-chief', 'editor', 'content-contributor'];
    }

    // ARTICLES
    match /articles/{articleId} {
      // Anyone can read published articles
      allow read: if resource.data.status == 'published' || isEditor();

      // Contributors can create
      allow create: if isContributor();

      // Edit own articles OR editors can edit any
      allow update: if isContributor() &&
        (resource.data.author == request.auth.token.email || isEditor());

      // Delete: only admins/editors
      allow delete: if isEditor();
    }

    // USERS
    match /users/{userId} {
      // Users can read their own doc
      allow read: if isAuthenticated() && (request.auth.uid == userId || isAdmin());

      // Only admins can update roles
      allow update: if isAdmin();

      // Users can create their own doc on registration
      allow create: if isAuthenticated() && request.auth.uid == userId;
    }

    // SETTINGS
    match /settings/{document=**} {
      allow read: if true;
      allow write: if isAdmin();
    }
  }
}
```

2. **Deploy rules**
   ```bash
   firebase deploy --only firestore:rules
   ```

---

### Phase 3: Permission Enforcement in Code (Priority: HIGH)

**Problem:** The permission matrix exists but isn't used to gate actions.

**Tasks:**

1. **Create permission checking utility**
   - File: `src/lib/permissions.ts`

```typescript
import { UserRole, UserPermissions, ROLE_PERMISSIONS, getUserPermissions } from '@/data/rolePermissions';

export function canPerformAction(
  userRole: UserRole,
  action: keyof UserPermissions,
  context?: { isOwnContent?: boolean }
): boolean {
  const permissions = getUserPermissions({ role: userRole });
  const permission = permissions[action];

  if (typeof permission === 'boolean') {
    return permission;
  }

  // Handle 'all' | 'own' | 'none' permissions
  if (permission === 'all') return true;
  if (permission === 'none') return false;
  if (permission === 'own') return context?.isOwnContent ?? false;

  return false;
}
```

2. **Create PermissionGate component**
   - File: `src/components/PermissionGate.tsx`

```typescript
'use client';
import { useAuth } from '@/hooks/useAuth';
import { canPerformAction } from '@/lib/permissions';
import { UserPermissions } from '@/data/rolePermissions';

interface PermissionGateProps {
  permission: keyof UserPermissions;
  children: React.ReactNode;
  fallback?: React.ReactNode;
  isOwnContent?: boolean;
}

export function PermissionGate({ permission, children, fallback, isOwnContent }: PermissionGateProps) {
  const { role, loading } = useAuth();

  if (loading) return null;
  if (!role) return fallback ?? null;

  const hasPermission = canPerformAction(role, permission, { isOwnContent });

  return hasPermission ? <>{children}</> : (fallback ?? null);
}
```

3. **Wrap admin UI elements with PermissionGate**

```tsx
// Example in admin page
<PermissionGate permission="canDeleteAnyArticle">
  <button onClick={handleDelete}>Delete</button>
</PermissionGate>

<PermissionGate permission="canPublishArticle">
  <button onClick={handlePublish}>Publish</button>
</PermissionGate>
```

4. **Add permission checks to API/action functions**

```typescript
// In article deletion
export async function deleteArticle(articleId: string, userRole: UserRole, isOwnArticle: boolean) {
  if (!canPerformAction(userRole, 'canDeleteAnyArticle') &&
      !(isOwnArticle && canPerformAction(userRole, 'canDeleteOwnArticle'))) {
    throw new Error('Permission denied');
  }
  // ... proceed with deletion
}
```

---

### Phase 4: Admin Route Protection (Priority: MEDIUM)

**Tasks:**

1. **Update admin layout to check roles**
   - File: `src/app/admin/layout.tsx`

```typescript
'use client';
import { useAuth } from '@/hooks/useAuth';
import { useRouter } from 'next/navigation';
import { useEffect } from 'react';

const ADMIN_ROLES = ['admin', 'business-owner', 'editor-in-chief', 'editor', 'content-contributor'];

export default function AdminLayout({ children }: { children: React.ReactNode }) {
  const { role, loading } = useAuth();
  const router = useRouter();

  useEffect(() => {
    if (!loading) {
      if (!role) {
        router.push('/login');
      } else if (!ADMIN_ROLES.includes(role)) {
        router.push('/'); // No admin access
      }
    }
  }, [role, loading, router]);

  if (loading) return <LoadingSpinner />;
  if (!role || !ADMIN_ROLES.includes(role)) return null;

  return <>{children}</>;
}
```

2. **Add role-based menu filtering in admin dashboard**
   - Hide menu items user can't access

---

### Phase 5: Consolidate Auth Systems (Priority: LOW)

**Tasks:**

1. **Merge useAuth hook into AuthContext**
   - Add `role` and `permissions` to AuthContext
   - Single source of truth for auth state

2. **Update all components to use unified context**

---

## Implementation Order

```
Week 1: Phase 1 (User Registration) + Phase 2 (Security Rules)
Week 2: Phase 3 (Permission Enforcement)
Week 3: Phase 4 (Route Protection) + Phase 5 (Consolidation)
```

---

## Testing Checklist

- [ ] New user registration creates Firestore document
- [ ] Google sign-in creates Firestore document (first time only)
- [ ] Non-admin users cannot access admin routes
- [ ] Content contributors can only edit their own articles
- [ ] Editors can edit any article but cannot delete others' articles
- [ ] Admins have full access
- [ ] Blocked users cannot access the site
- [ ] Firestore rules reject unauthorized writes

---

## Security Best Practices Already Followed

- No hardcoded API keys in client code (stored in Firestore settings)
- Firebase Auth handles password security
- Using Next.js App Router (modern patterns)
- TypeScript for type safety

## Security Improvements Needed

- [ ] Add rate limiting to auth endpoints
- [ ] Implement CSRF protection
- [ ] Add audit logging for sensitive actions
- [ ] Consider adding 2FA for admin accounts

---

## Files to Create/Modify

| File | Action | Priority |
|------|--------|----------|
| `firestore.rules` | Create | CRITICAL |
| `src/contexts/AuthContext.tsx` | Modify | CRITICAL |
| `src/lib/permissions.ts` | Create | HIGH |
| `src/components/PermissionGate.tsx` | Create | HIGH |
| `src/app/admin/layout.tsx` | Modify | MEDIUM |
| `src/app/admin/page.tsx` | Modify | MEDIUM |
| `src/lib/articles.ts` | Modify | MEDIUM |

---

## Notes for Jules

This plan can be executed in phases. The most critical items are:

1. **Firestore security rules** - Without these, your database is open to anyone
2. **User document creation** - Without this, roles can't work

Start with Phase 1 and 2 together as they're foundational. The permission enforcement (Phase 3) builds on top of that.

Each phase is designed to be independently deployable and testable.
