# Jules Task Specifications - WNC Times Components

> **Instructions for Jules**: These are 5 independent COMPONENT tasks (Directory, Blog, Advertising, Events, Community). Each can be worked on separately in parallel. Follow the Global Rules strictly.

---

## Global Rules for All Tasks

**CRITICAL - DO NOT VIOLATE:**
1. Only create NEW files - do not modify existing files unless explicitly listed
2. Use shadcn/ui components (Button, Card, Input, Badge, Tabs, etc.)
3. Support dark mode using Tailwind `dark:` prefix
4. Mobile responsive using Tailwind breakpoints (sm:, md:, lg:)
5. Use new Firestore collections - do not touch: `articles`, `users`, `settings`, `categories`
6. Follow existing patterns from `src/components/admin/` for consistency
7. Each component should be self-contained with its own types, lib functions, and UI
8. Admin gear icon for configuration when logged in as admin

### Reference Files
- `src/components/admin/AdminSidebar.tsx` - Pattern for sidebar components
- `src/components/admin/AdminHeader.tsx` - Pattern for header components
- `src/app/admin/page.tsx` - Pattern for admin CRUD interfaces
- `src/lib/firebase.ts` - Firebase config (uses named database `gwnct`)

---

## TASK 1: Directory Component (Business Listings)

### Overview
Create a business directory where local businesses can be listed, searched, and displayed on the frontend.

### Files to Create
```
src/app/(main)/directory/
  page.tsx                      # Main directory listing page
  [slug]/page.tsx               # Individual business detail page

src/components/directory/
  DirectoryGrid.tsx             # Grid of business cards
  BusinessCard.tsx              # Individual business card
  BusinessDetail.tsx            # Full business page content
  DirectoryFilters.tsx          # Category/location filters
  DirectorySearch.tsx           # Search input
  DirectoryConfigModal.tsx      # Admin config modal (gear icon)

src/lib/
  directory.ts                  # Firestore CRUD for businesses

src/types/
  business.ts                   # Business type definition
```

### Firestore Collection: `businesses`
```typescript
interface Business {
  id: string;
  name: string;
  slug: string;
  description: string;
  category: string;
  subcategory?: string;
  address: {
    street: string;
    city: string;
    state: string;
    zip: string;
  };
  phone?: string;
  email?: string;
  website?: string;
  hours?: Record<string, string>;
  images: string[];
  logo?: string;
  featured: boolean;
  verified: boolean;
  ownerId?: string;
  status: 'pending' | 'active' | 'suspended';
  createdAt: Timestamp;
  updatedAt: Timestamp;
}
```

### Firestore Collection: `componentSettings` (Document ID: 'directory')
```typescript
interface DirectorySettings {
  enabled: boolean;
  title: string;
  showInNav: boolean;
  categoriesEnabled: string[];
  featuredCount: number;
}
```

### Features Required
- Search bar with autocomplete
- Category filter chips
- Grid of business cards with logo, name, category
- Featured businesses section at top
- Gear icon (admin only) opens DirectoryConfigModal
- Full CRUD in admin panel

---

## TASK 2: Blog Component

### Overview
A blog section separate from news articles - for opinion pieces, staff blogs, guest columns.

### Files to Create
```
src/app/(main)/blog/
  page.tsx                      # Blog listing page
  [slug]/page.tsx               # Individual blog post

src/components/blog/
  BlogGrid.tsx                  # Grid/list of blog posts
  BlogPostCard.tsx              # Individual post card
  BlogPostDetail.tsx            # Full post content
  BlogSidebar.tsx               # Author bio, recent posts
  BlogConfigModal.tsx           # Admin config (gear icon)

src/lib/
  blog.ts                       # Firestore CRUD for blog posts

src/types/
  blogPost.ts                   # BlogPost type definition
```

### Firestore Collection: `blogPosts`
```typescript
interface BlogPost {
  id: string;
  title: string;
  slug: string;
  content: string;
  excerpt: string;
  featuredImage?: string;
  authorId: string;
  authorName: string;
  authorBio?: string;
  authorPhoto?: string;
  category: string;
  tags: string[];
  status: 'draft' | 'published' | 'archived';
  publishedAt?: Timestamp;
  createdAt: Timestamp;
  updatedAt: Timestamp;
  viewCount: number;
  allowComments: boolean;
}
```

### Firestore Collection: `componentSettings` (Document ID: 'blog')
```typescript
interface BlogSettings {
  enabled: boolean;
  title: string;
  showInNav: boolean;
  postsPerPage: number;
  showAuthorBio: boolean;
  categories: string[];
}
```

### Features Required
- Blog listing with author photos
- Category tabs
- Full CRUD in admin panel
- Gear icon (admin only) opens BlogConfigModal

---

## TASK 3: Advertising Component

### Overview
Ad placement management - banners, sponsored content, campaign tracking.

### Files to Create
```
src/app/(main)/advertise/
  page.tsx                      # "Advertise with us" info page

src/components/advertising/
  AdBanner.tsx                  # Reusable ad banner component
  AdSidebar.tsx                 # Sidebar ad placement
  SponsoredBadge.tsx            # "Sponsored" label component
  AdConfigModal.tsx             # Admin config (gear icon)
  AdPlacement.tsx               # Smart ad placement wrapper

src/lib/
  advertising.ts                # Firestore CRUD for ads

src/types/
  advertisement.ts              # Ad type definitions
```

### Firestore Collection: `advertisements`
```typescript
interface Advertisement {
  id: string;
  name: string;
  type: 'banner' | 'sidebar' | 'sponsored' | 'native';
  placement: string;
  size: string;
  imageUrl: string;
  linkUrl: string;
  altText: string;
  advertiserId?: string;
  campaignName?: string;
  startDate: Timestamp;
  endDate: Timestamp;
  impressions: number;
  clicks: number;
  status: 'draft' | 'active' | 'paused' | 'expired';
  priority: number;
  createdAt: Timestamp;
}
```

### Firestore Collection: `componentSettings` (Document ID: 'advertising')
```typescript
interface AdvertisingSettings {
  enabled: boolean;
  showAdsToLoggedIn: boolean;
  headerBannerEnabled: boolean;
  sidebarAdsEnabled: boolean;
  inArticleAdsEnabled: boolean;
  adFrequency: number;
  defaultAdImage: string;
}
```

### Features Required
- Reusable ad components: `<AdBanner placement="header" size="728x90" />`
- Impression and click tracking
- Full CRUD in admin panel
- Gear icon (admin only) opens AdConfigModal

---

## TASK 4: Events Component

### Overview
Community events calendar - local happenings, meetups, festivals.

### Files to Create
```
src/app/(main)/events/
  page.tsx                      # Events listing/calendar
  [slug]/page.tsx               # Individual event detail

src/components/events/
  EventsCalendar.tsx            # Calendar view
  EventsList.tsx                # List view
  EventCard.tsx                 # Individual event card
  EventDetail.tsx               # Full event page
  EventFilters.tsx              # Date/category filters
  EventConfigModal.tsx          # Admin config (gear icon)
  EventSubmissionForm.tsx       # User event submission

src/lib/
  events.ts                     # Firestore CRUD for events

src/types/
  event.ts                      # Event type definition
```

### Firestore Collection: `events`
```typescript
interface Event {
  id: string;
  title: string;
  slug: string;
  description: string;
  content?: string;
  featuredImage?: string;
  category: string;
  startDate: Timestamp;
  endDate?: Timestamp;
  allDay: boolean;
  location: {
    name: string;
    address: string;
    city: string;
    coordinates?: { lat: number; lng: number };
  };
  organizer: {
    name: string;
    email?: string;
    phone?: string;
  };
  ticketUrl?: string;
  price?: string;
  featured: boolean;
  submittedBy?: string;
  status: 'pending' | 'approved' | 'published' | 'cancelled';
  createdAt: Timestamp;
  updatedAt: Timestamp;
}
```

### Firestore Collection: `componentSettings` (Document ID: 'events')
```typescript
interface EventsSettings {
  enabled: boolean;
  title: string;
  showInNav: boolean;
  defaultView: 'calendar' | 'list';
  allowSubmissions: boolean;
  requireApproval: boolean;
  categories: string[];
  featuredCount: number;
}
```

### Features Required
- Calendar view (month/week)
- List view toggle
- Category filter
- "This Weekend" quick filter
- Full CRUD in admin panel
- Gear icon (admin only) opens EventConfigModal

---

## TASK 5: Community Component (Enhancement)

### Overview
Enhance existing `/community` page with discussion forums, user posts.

### Files to Create (New Only)
```
src/components/community/
  CommunityFeed.tsx             # Main feed of posts
  CommunityPost.tsx             # Individual post
  CommunityPostForm.tsx         # Create new post
  CommunityFilters.tsx          # Topic/date filters
  CommunityConfigModal.tsx      # Admin config (gear icon)

src/lib/
  community.ts                  # Firestore CRUD for posts
```

### Firestore Collection: `communityPosts`
```typescript
interface CommunityPost {
  id: string;
  authorId: string;
  authorName: string;
  authorPhoto?: string;
  content: string;
  images?: string[];
  topic: string;
  likes: number;
  likedBy: string[];
  commentsCount: number;
  pinned: boolean;
  status: 'active' | 'hidden' | 'flagged';
  createdAt: Timestamp;
  updatedAt: Timestamp;
}
```

### Firestore Collection: `componentSettings` (Document ID: 'community')
```typescript
interface CommunitySettings {
  enabled: boolean;
  title: string;
  showInNav: boolean;
  requireApproval: boolean;
  topics: string[];
}
```

### Features Required
- Post feed with like/comment counts
- Create new post form
- Topic filtering
- Full CRUD in admin panel
- Gear icon (admin only) opens CommunityConfigModal

---

## CRUD Pattern (Follow for ALL Components)

```typescript
// src/lib/{component}.ts

import { db } from '@/lib/firebase';
import { collection, doc, getDocs, getDoc, setDoc, updateDoc, deleteDoc, query, where, orderBy, serverTimestamp, writeBatch } from 'firebase/firestore';

// CREATE
export async function createItem(data: Omit<Item, 'id' | 'createdAt'>): Promise<string> {
  const docRef = doc(collection(db, 'collectionName'));
  await setDoc(docRef, {
    ...data,
    id: docRef.id,
    createdAt: serverTimestamp(),
    updatedAt: serverTimestamp(),
  });
  return docRef.id;
}

// READ (List)
export async function getItems(): Promise<Item[]> {
  const q = query(collection(db, 'collectionName'), orderBy('createdAt', 'desc'));
  const snapshot = await getDocs(q);
  return snapshot.docs.map(doc => ({ ...doc.data(), id: doc.id } as Item));
}

// READ (By slug)
export async function getItemBySlug(slug: string): Promise<Item | null> {
  const q = query(collection(db, 'collectionName'), where('slug', '==', slug));
  const snapshot = await getDocs(q);
  if (snapshot.empty) return null;
  return { ...snapshot.docs[0].data(), id: snapshot.docs[0].id } as Item;
}

// UPDATE
export async function updateItem(id: string, updates: Partial<Item>): Promise<void> {
  await updateDoc(doc(db, 'collectionName', id), {
    ...updates,
    updatedAt: serverTimestamp(),
  });
}

// DELETE
export async function deleteItem(id: string): Promise<void> {
  await deleteDoc(doc(db, 'collectionName', id));
}
```

---

## Gear Icon Pattern

```tsx
import { useAuth } from '@/contexts/AuthContext';
import { Settings } from 'lucide-react';
import { Button } from '@/components/ui/button';

function ComponentPage() {
  const { userProfile } = useAuth();
  const [configOpen, setConfigOpen] = useState(false);

  const isAdmin = userProfile?.role &&
    ['admin', 'business-owner', 'editor-in-chief'].includes(userProfile.role);

  return (
    <div className="container mx-auto px-4 py-8">
      <div className="flex items-center justify-between mb-6">
        <h1 className="text-3xl font-serif font-bold">Page Title</h1>
        {isAdmin && (
          <Button variant="ghost" size="icon" onClick={() => setConfigOpen(true)}>
            <Settings size={20} />
          </Button>
        )}
      </div>
      <ConfigModal open={configOpen} onClose={() => setConfigOpen(false)} />
    </div>
  );
}
```

---

## Safety Checklist

Before completing each task:
- [ ] No existing files modified (except those listed)
- [ ] New Firestore collections only (not articles, users, settings, categories)
- [ ] Dark mode works (`dark:` classes)
- [ ] Mobile responsive (375px width)
- [ ] Gear icon only for admin roles
- [ ] Config saves to `componentSettings` collection
- [ ] Full CRUD operations work
- [ ] Toast notifications for success/error
