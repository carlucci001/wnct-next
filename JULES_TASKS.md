# Jules Tasks - WNC Times Next.js Migration

Repository: `c:\dev\wnct-next` (or your GitHub repo URL)
Reference docs: `old_react_mds/` folder contains architecture from previous React project

---

## Task 1: Create Article Type Definitions

**Description:**
Create TypeScript interfaces for the Article data model based on the existing Firebase Firestore structure.

**Context:**
- Firebase database name: `gwnct`
- Collection: `articles`
- Reference the old project structure in `old_react_mds/AI_HANDOFF.md`

**Acceptance Criteria:**
- Create `src/types/article.ts` with Article interface
- Include fields: id, title, content, slug, author, category, tags, status, publishedAt, createdAt, updatedAt, featuredImage
- Export the types for use throughout the app

---

## Task 2: Create Firebase Data Fetching Utilities

**Description:**
Create utility functions to fetch articles from Firebase Firestore.

**Context:**
- Firebase config exists at `src/lib/firebase.ts`
- Uses named database `gwnct` (not default)
- Collection name is `articles`

**Acceptance Criteria:**
- Create `src/lib/articles.ts`
- Implement `getArticles()` - fetch all published articles
- Implement `getArticleBySlug(slug: string)` - fetch single article
- Implement `getArticlesByCategory(category: string)` - filter by category
- Use proper TypeScript types from Task 1

---

## Task 3: Build Homepage with Article Grid

**Description:**
Replace the default Next.js homepage with a news homepage displaying articles from Firebase.

**Context:**
- This is a news website (WNC Times - Western North Carolina Times)
- Should display articles in a responsive grid
- Use Tailwind CSS for styling (already configured)

**Acceptance Criteria:**
- Update `src/app/page.tsx` to fetch and display articles
- Show article title, excerpt, featured image, category, date
- Responsive grid: 1 column mobile, 2 columns tablet, 3 columns desktop
- Link each article card to `/article/[slug]`

---

## Task 4: Create Article Detail Page

**Description:**
Create a dynamic route for displaying individual articles.

**Context:**
- Articles have a `slug` field for URL-friendly paths
- Need to fetch article by slug from Firebase

**Acceptance Criteria:**
- Create `src/app/article/[slug]/page.tsx`
- Fetch article by slug parameter
- Display: title, author, date, category, featured image, full content
- Handle 404 if article not found
- Add basic article styling with Tailwind

---

## Task 5: Create Site Header Component

**Description:**
Create a responsive header/navigation component for the news site.

**Context:**
- Site name: "WNC Times" or "Western North Carolina Times"
- Should include navigation to main sections

**Acceptance Criteria:**
- Create `src/components/Header.tsx`
- Include site logo/name
- Navigation links: Home, Categories (dropdown), About
- Mobile hamburger menu
- Add to `src/app/layout.tsx`

---

## Task 6: Create Site Footer Component

**Description:**
Create a footer component with site information.

**Acceptance Criteria:**
- Create `src/components/Footer.tsx`
- Include copyright, links, social media placeholders
- Add to `src/app/layout.tsx`

---

## Task 7: Create Category Pages

**Description:**
Create dynamic routes for browsing articles by category.

**Acceptance Criteria:**
- Create `src/app/category/[category]/page.tsx`
- Fetch and display articles filtered by category
- Reuse article grid styling from homepage
- Show category name as page title

---

## Task 8: Create Admin Login Page

**Description:**
Create an admin login page with Firebase Authentication.

**Context:**
- Firebase Auth is exported from `src/lib/firebase.ts`
- Support both email/password and Google OAuth
- Reference `old_react_mds/AUTHENTICATION_GUIDE.md` for auth flow

**Acceptance Criteria:**
- Create `src/app/admin/login/page.tsx`
- Email/password login form
- "Sign in with Google" button
- Redirect to `/admin` on successful login
- Show error messages for failed login

---

## Task 9: Create Auth Context/Provider

**Description:**
Create a React context for managing authentication state.

**Context:**
- Use Firebase Auth from `src/lib/firebase.ts`
- Need to track current user across the app

**Acceptance Criteria:**
- Create `src/contexts/AuthContext.tsx`
- Provide: currentUser, loading, signIn, signOut functions
- Wrap app in provider via `src/app/layout.tsx`
- Persist auth state across page refreshes

---

## Task 10: Create Protected Route Component

**Description:**
Create a component/middleware to protect admin routes.

**Acceptance Criteria:**
- Create `src/components/ProtectedRoute.tsx`
- Redirect to `/admin/login` if not authenticated
- Show loading state while checking auth
- Use in admin layout

---

## Task 11: Create Admin Layout

**Description:**
Create a layout for admin pages with sidebar navigation.

**Context:**
- Reference `old_react_mds/AI_HANDOFF.md` for admin features list

**Acceptance Criteria:**
- Create `src/app/admin/layout.tsx`
- Sidebar with links: Dashboard, Articles, Users, Categories, Settings
- Header with user info and logout button
- Wrap content in ProtectedRoute
- Responsive: collapsible sidebar on mobile

---

## Task 12: Create Admin Dashboard Page

**Description:**
Create the main admin dashboard with overview stats.

**Acceptance Criteria:**
- Create `src/app/admin/page.tsx`
- Show counts: total articles, published, drafts
- Recent articles list
- Quick action buttons: New Article, View Site

---

## Task 13: Create Articles List Admin Page

**Description:**
Create admin page for managing all articles.

**Acceptance Criteria:**
- Create `src/app/admin/articles/page.tsx`
- Table/list of all articles (not just published)
- Show: title, status, author, date, actions
- Filter by status (draft, published, etc.)
- Link to edit each article
- Delete article button with confirmation

---

## Task 14: Create Article Editor Page

**Description:**
Create a page for creating and editing articles.

**Context:**
- Articles have: title, content, slug, category, tags, status, featuredImage

**Acceptance Criteria:**
- Create `src/app/admin/articles/new/page.tsx`
- Create `src/app/admin/articles/[id]/edit/page.tsx`
- Form fields for all article properties
- Rich text editor for content (can use simple textarea initially)
- Auto-generate slug from title
- Save as draft or publish buttons
- Save to Firebase Firestore

---

## Task 15: Create Users Admin Page

**Description:**
Create admin page for managing users.

**Context:**
- Reference `old_react_mds/ROLES_PERMISSIONS_STRUCTURE.md` for role system
- 7 roles: admin, business-owner, editor-in-chief, editor, content-contributor, commenter, reader

**Acceptance Criteria:**
- Create `src/app/admin/users/page.tsx`
- List all users with their roles
- Ability to change user roles
- Block/unblock users
- Only admins can access this page

---

## Task 16: Implement Role-Based Access Control

**Description:**
Create a permission system based on user roles.

**Context:**
- See `old_react_mds/ROLES_PERMISSIONS_STRUCTURE.md` for full matrix
- 20 permissions across 7 roles

**Acceptance Criteria:**
- Create `src/lib/permissions.ts`
- Define role hierarchy and permissions
- Create `hasPermission(user, permission)` helper
- Create `usePermissions()` hook
- Apply to admin pages (e.g., only editors+ can edit articles)

---

## Notes for Jules

### Firebase Connection
The Firebase config at `src/lib/firebase.ts` connects to a **named database** called `gwnct`, not the default. This is critical:
```typescript
export const db = getFirestore(app, 'gwnct');  // CORRECT
// NOT: getFirestore(app)  // WRONG - would connect to (default)
```

### Environment Variables
Firebase credentials are in `.env.local` with `NEXT_PUBLIC_` prefix.

### Reference Documentation
The `old_react_mds/` folder contains extensive documentation from the previous React+Vite version of this project. Key files:
- `AI_HANDOFF.md` - Full architecture overview
- `AUTHENTICATION_GUIDE.md` - Auth implementation details
- `ROLES_PERMISSIONS_STRUCTURE.md` - RBAC system
- `CLAUDE.md` - Quick reference

### Tech Stack
- Next.js 16 with App Router
- React 19
- TypeScript
- Tailwind CSS 4
- Firebase (Firestore + Auth)
