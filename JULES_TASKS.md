# Jules Task Specifications - WNC Times Components

> **Instructions for Jules**: These are 5 independent COMPONENT tasks (Directory, Blog, Advertising, Events, Community). Each can be worked on separately in parallel. Follow the Global Rules strictly.
>
> **CREATIVE FREEDOM**: You have full creative freedom to build out comprehensive features for each component. Add features that make sense for a local news website. Use your judgment to implement UX best practices, loading states, error handling, and intuitive interfaces. Make these components production-ready.
>
> **ISOLATION REQUIREMENT**: These components must be COMPLETELY SELF-CONTAINED. Do NOT modify any existing files outside of what's explicitly listed. The rest of the site is working perfectly - do not break anything.

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
- `src/app/(main)/community/page.tsx` - **CRITICAL: Pattern for frontend page layouts with sidebar**

### Frontend Layout Pattern (REQUIRED FOR ALL COMPONENTS)

Each component's main page.tsx MUST use a 2-column responsive layout with sidebar:

```tsx
// Example from community page - FOLLOW THIS PATTERN:
<div className="container mx-auto px-4 md:px-0 py-6 min-h-screen">
  <div className="flex flex-col lg:flex-row gap-8 items-start">

    {/* LEFT COLUMN: Main Content (2/3 width on desktop) */}
    <div className="lg:w-2/3 flex flex-col w-full">
      {/* Header with title and admin gear icon */}
      <div className="mb-6 flex justify-between items-end border-b border-gray-200 dark:border-gray-700 pb-4">
        <div>
          <h1 className="text-3xl font-serif font-bold text-gray-900 dark:text-white">Page Title</h1>
          <p className="text-gray-500 dark:text-gray-400 text-sm mt-1">Subtitle description</p>
        </div>
        {isAdmin && (
          <Button variant="ghost" size="icon" onClick={() => setConfigOpen(true)}>
            <Settings size={20} />
          </Button>
        )}
      </div>

      {/* Main content area */}
      {/* ... component-specific content ... */}
    </div>

    {/* RIGHT COLUMN: Sidebar (1/3 width, hidden on mobile) */}
    <div className="lg:w-1/3 hidden lg:flex flex-col sticky top-24 space-y-6">
      {/* Sidebar widgets: filters, featured items, related content, etc. */}
      <Card>
        <CardHeader>
          <CardTitle>Sidebar Widget</CardTitle>
        </CardHeader>
        <CardContent>
          {/* Widget content */}
        </CardContent>
      </Card>
    </div>

  </div>
</div>
```

**Sidebar Content by Component:**
- **Directory**: Category filters, featured businesses, search refinement
- **Blog**: Author bio, recent posts, category tags, archive links
- **Events**: Calendar mini-view, upcoming events, category filters
- **Advertising**: Contact form, pricing info, testimonials
- **Community**: Topic filters, trending posts, community stats

---

## TASK 1: Directory Component (Business Listings)

### Overview
Create a business directory where local businesses can be listed, searched, and displayed on the frontend.

### Files to Create
```
src/app/(main)/directory/
  page.tsx                      # Main directory listing page (2-col layout with sidebar)
  [slug]/page.tsx               # Individual business detail page

src/components/directory/
  DirectoryGrid.tsx             # Grid of business cards
  BusinessCard.tsx              # Individual business card
  BusinessDetail.tsx            # Full business page content
  DirectoryFilters.tsx          # Category/location filters
  DirectorySearch.tsx           # Search input
  DirectorySidebar.tsx          # RIGHT COLUMN: Featured businesses, category filters, search refinement
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

**Frontend (Public)**
- Search bar with autocomplete suggestions as user types
- Category filter chips (Restaurant, Retail, Services, Health, Entertainment, etc.)
- Location/area filter (Downtown, North, South, etc.)
- Grid of business cards with: logo, name, category, rating stars, address snippet
- Featured businesses highlighted section at top
- "Claim this business" link for unclaimed listings
- Business hours indicator (Open Now / Closed)
- Click-to-call phone links on mobile
- Share business button
- Loading skeleton states while fetching data
- Empty state with "No businesses found" message
- Infinite scroll or "Load More" pagination

**Business Detail Page**
- Hero section with business logo/images
- Full business info (address, phone, email, website, hours)
- Interactive hours display showing today's hours prominently
- Map embed showing location (optional - use static image if complex)
- Photo gallery if multiple images
- "Get Directions" link (opens Google Maps)
- Social sharing buttons
- Related businesses in same category

**Admin Features**
- Full CRUD for businesses
- Bulk import/export (CSV)
- Approve/reject pending submissions
- Mark as featured toggle
- Verify business toggle
- Category management
- Gear icon (admin only) opens DirectoryConfigModal

---

## TASK 2: Blog Component

### Overview
A blog section separate from news articles - for opinion pieces, staff blogs, guest columns.

### Files to Create
```
src/app/(main)/blog/
  page.tsx                      # Blog listing page (2-col layout with sidebar)
  [slug]/page.tsx               # Individual blog post

src/components/blog/
  BlogGrid.tsx                  # Grid/list of blog posts
  BlogPostCard.tsx              # Individual post card
  BlogPostDetail.tsx            # Full post content
  BlogSidebar.tsx               # RIGHT COLUMN: Author bio, recent posts, category tags, archive links
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

**Frontend (Public)**
- Blog listing with author photos and bylines
- Category tabs/chips (Opinion, Column, Guest Post, Lifestyle, etc.)
- Featured/pinned posts section at top
- Reading time estimate on each post card
- Author avatars with link to author page
- Tag cloud or popular tags display
- Search within blog posts
- Social sharing buttons on posts
- Related posts at bottom of article
- Responsive typography for comfortable reading
- Loading skeleton states
- "Load More" or pagination

**Blog Post Page**
- Clean, readable typography (like Medium)
- Author bio card with photo and bio
- Published date and reading time
- Category badge
- Table of contents for long posts (optional)
- Social sharing sticky sidebar or footer
- "More from this author" section
- Comments section (if allowComments is true)
- Next/Previous post navigation

**Author Page (optional but nice)**
- Author profile with photo and full bio
- List of all posts by that author
- Social links

**Admin Features**
- Rich text editor for content (can use simple textarea with markdown)
- Draft/Publish workflow
- Schedule posts for future publishing
- Category management
- Tag management
- Featured post toggle
- View count tracking
- Full CRUD with search and filters
- Gear icon (admin only) opens BlogConfigModal

---

## TASK 3: Advertising Component

### Overview
Ad placement management - banners, sponsored content, campaign tracking.

### Files to Create
```
src/app/(main)/advertise/
  page.tsx                      # "Advertise with us" info page (2-col layout with sidebar)

src/components/advertising/
  AdBanner.tsx                  # Reusable ad banner component
  AdSidebar.tsx                 # Sidebar ad placement (for use in other pages)
  AdvertiseSidebar.tsx          # RIGHT COLUMN: Contact form, pricing tiers, testimonials
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

**Advertise With Us Page (Public)**
- Hero section with compelling headline about reaching local audience
- Audience statistics (monthly readers, demographics if available)
- Ad placement options with visual mockups showing where ads appear
- Pricing tiers or "Contact for pricing" CTA
- Benefits of advertising (local reach, engaged readers, etc.)
- Testimonials from current advertisers (can be placeholder)
- Contact form for advertising inquiries
- FAQ section about advertising
- Sidebar with quick contact info and "Get Started" button

**Reusable Ad Components (for use site-wide)**
- `<AdBanner placement="header" size="728x90" />` - Leaderboard banner
- `<AdBanner placement="sidebar" size="300x250" />` - Medium rectangle
- `<AdSidebar />` - Sticky sidebar ad unit
- `<AdPlacement location="article-inline" />` - In-article placement
- `<SponsoredBadge />` - "Sponsored" or "Advertisement" label
- Fallback "Advertise Here" placeholder when no active ads
- Lazy loading for ad images
- Click tracking with UTM parameters
- Impression counting on view

**Admin Features**
- Campaign management dashboard
- Create/Edit ad campaigns with:
  - Upload ad creative (image)
  - Set destination URL
  - Choose placement(s)
  - Set start/end dates
  - Set priority (higher = more impressions)
- Campaign status management (draft, active, paused, expired)
- Basic analytics per campaign (impressions, clicks, CTR)
- Bulk pause/activate campaigns
- Calendar view of active campaigns
- Export campaign performance data
- Gear icon (admin only) opens AdConfigModal

---

## TASK 4: Events Component

### Overview
Community events calendar - local happenings, meetups, festivals.

### Files to Create
```
src/app/(main)/events/
  page.tsx                      # Events listing/calendar (2-col layout with sidebar)
  [slug]/page.tsx               # Individual event detail

src/components/events/
  EventsCalendar.tsx            # Calendar view
  EventsList.tsx                # List view
  EventCard.tsx                 # Individual event card
  EventDetail.tsx               # Full event page
  EventFilters.tsx              # Date/category filters
  EventsSidebar.tsx             # RIGHT COLUMN: Mini calendar, upcoming events, category filters
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

**Frontend (Public)**
- Calendar view (month view with event dots/indicators)
- List view toggle (chronological list)
- View toggle button (Calendar | List)
- Category filter chips (Festival, Concert, Sports, Community, Markets, etc.)
- Date quick filters: "Today", "This Weekend", "This Month"
- Search events by name/description
- Featured events highlighted section
- Event cards showing: image, title, date/time, location, category badge
- "Free" badge for free events
- Loading skeleton states
- Empty state for no events found
- Responsive design - list view on mobile, calendar on desktop

**Event Detail Page**
- Hero image with event title overlay
- Date and time prominently displayed
- Location with address and map link
- Organizer information
- Full event description
- Ticket/RSVP button (links to external ticketUrl)
- Price information
- "Add to Calendar" button (generates .ics file or Google Calendar link)
- Share buttons (Facebook, Twitter, copy link)
- Related events in same category
- Back to events link

**Event Submission (if enabled)**
- "Submit Your Event" button on main page
- Submission form with all event fields
- Preview before submit
- Success message with "pending approval" notice

**Sidebar Features**
- Mini calendar showing current month with event indicators
- Upcoming events list (next 5)
- Category quick links
- "Submit Event" CTA button

**Admin Features**
- Full CRUD for events
- Approve/reject user submissions
- Mark as featured toggle
- Bulk status changes
- Filter by status (pending, approved, published, cancelled)
- Calendar view of all events
- Export events to CSV
- Category management
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
  CommunitySidebar.tsx          # RIGHT COLUMN: Topic filters, trending posts, community stats (enhances existing map sidebar)
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

**NOTE**: The community page already exists at `src/app/(main)/community/page.tsx` with a map feature. Create NEW component files only - do not modify the existing page. These components can be integrated later.

**Frontend Components**
- Feed of community posts with: author avatar, name, timestamp, content, like count, comment count
- Post type indicators (same as existing: general, alert, crime, event, question)
- Like button with optimistic UI update
- Comment count that could link to comments (future)
- Topic/category filter tabs
- "New Post" button (requires login)
- Loading skeleton states
- Infinite scroll or "Load More"
- Pinned posts at top

**Post Creation Form**
- Textarea for content
- Post type selector dropdown
- Optional location toggle (reuse existing pattern)
- Image upload (optional, future enhancement)
- Character limit indicator
- Submit button with loading state
- Login required messaging for non-authenticated users

**Sidebar Features**
- Topic quick filters
- Trending posts (most liked in last 7 days)
- Community guidelines link
- Stats: total posts, active members (placeholder)
- "Join the conversation" CTA for logged out users

**Admin Features**
- Moderation dashboard
- View all posts with filters (status, topic, date)
- Hide/unhide posts
- Flag review queue
- Pin/unpin posts
- Ban users from posting (future)
- Topic management
- Bulk moderation actions
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

## TASK 6: Conversational Admin Assistant

### Overview
An AI-powered chat interface that allows admins to manage the site through natural language commands instead of clicking through UI. Uses existing Gemini API integration.

### Example Commands Users Can Say
```
"Feature the article about the fire department"
"Unpublish all articles older than 30 days"
"Move Sports to position 1 in the category menu"
"Show me all articles in review status"
"Publish the top 5 draft articles"
"Make Alex Chen's next article featured"
"Reorder categories: News, Sports, Business, Entertainment"
```

### Files to Create
```
src/app/api/admin-assistant/
  route.ts                        # Chat API endpoint with Gemini integration

src/lib/
  adminCommands.ts                # Admin command execution functions

src/types/
  adminCommand.ts                 # Command type definitions

src/components/admin/
  AdminAssistantChat.tsx          # Chat UI component
  AdminAssistantHistory.tsx       # Command history sidebar
  CommandConfirmDialog.tsx        # Confirmation before destructive actions
```

### Command Types
```typescript
interface AdminCommand {
  id: string;
  type: 'article' | 'category' | 'user' | 'settings' | 'query';
  action: string;
  params: Record<string, unknown>;
  requiresConfirmation: boolean;
  executed: boolean;
  result?: {
    success: boolean;
    message: string;
    affectedItems?: string[];
  };
  timestamp: string;
  undoable: boolean;
}

type ArticleAction = 'publish' | 'unpublish' | 'feature' | 'unfeature' | 'delete' | 'set-breaking' | 'list' | 'search';
type CategoryAction = 'reorder' | 'activate' | 'deactivate' | 'list';
```

### Features Required

**Chat Interface**
- Chat input at bottom of admin panel (new tab or floating widget)
- Message history showing user commands and AI responses
- Typing indicator while AI processes
- Keyboard shortcut to open (Cmd+K or similar)

**Command Processing**
- Natural language parsing via existing Gemini API
- Intent detection (what action to perform)
- Entity extraction (which articles/categories)
- Fuzzy matching for article/category names
- Clear error messages when command is ambiguous

**Safety Features**
- Confirmation dialog before bulk operations (3+ items)
- Confirmation before delete/unpublish operations
- Preview of affected items before execution
- Undo support for recent commands
- Command history log for audit trail

**Supported Operations**
- Article: publish, unpublish, feature, unfeature, set-breaking, delete, list, search
- Category: reorder, activate, deactivate, list
- Query: "Show me...", "How many...", "List all..."

### Integration Points
- Reuse existing `src/lib/articles.ts` functions
- Reuse existing `src/lib/categories.ts` functions
- Reuse existing Gemini API setup from `/api/chat`
- Add to admin panel as new "ASSISTANT" tab

### Effort Estimate
- MVP (basic commands): 2-4 hours
- Full version with undo/history: 1-2 days

---

## Safety Checklist

Before completing each task:
- [ ] No existing files modified (except those listed)
- [ ] New Firestore collections only (not articles, users, settings, categories)
- [ ] Dark mode works (`dark:` classes)
- [ ] Mobile responsive (375px width)
- [ ] **Frontend page uses 2-column layout with sidebar (lg:w-2/3 + lg:w-1/3)**
- [ ] **Sidebar hidden on mobile, sticky on desktop (sticky top-24)**
- [ ] Gear icon only for admin roles
- [ ] Config saves to `componentSettings` collection
- [ ] Full CRUD operations work
- [ ] Toast notifications for success/error
