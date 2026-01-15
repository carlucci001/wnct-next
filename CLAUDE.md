# Claude Code Instructions

**Project**: WNC Times - News Publishing Platform
**Stack**: Next.js 15 + TypeScript + Firebase Firestore + Tailwind CSS

## Quick Reference

- **Dev server**: `npm run dev`
- **Build**: `npm run build`
- **Firebase database**: `gwnct` (named database, not default)
- **Deploy rules**: `npx firebase deploy --only firestore`

## Firebase Configuration

### Database Setup
The app uses a **named Firestore database** called `gwnct`, not the default database.

```typescript
// In src/lib/firebase.ts
export function getDb(): Firestore {
  if (!_db) {
    _db = getFirestore(getApp(), 'gwnct');
  }
  return _db;
}
```

### Multiple Databases
The project has 3 Firestore databases:
- `(default)` - Firebase default
- `default` - Named "default"
- `gwnct` - **The app uses this one**

All three should have the same rules deployed. See `firebase.json`:
```json
{
  "firestore": [
    { "database": "(default)", "rules": "firestore.rules" },
    { "database": "default", "rules": "firestore.rules" },
    { "database": "gwnct", "rules": "firestore.rules" }
  ]
}
```

---

## Troubleshooting Guide

### INCIDENT: Site Down - Firestore Permission Denied (Jan 2025)

**Symptoms:**
- Production site loads but shows no articles/content
- Browser console shows: `FirebaseError: Missing or insufficient permissions`
- Firebase Functions logs show `PERMISSION_DENIED` for collections

**Root Cause:**
The app uses Firebase **Client SDK** (not Admin SDK) for server-side rendering. When Next.js SSR runs on Firebase Functions, there's NO authenticated user context. Firestore rules that require `isAuthenticated()` or `isEditor()` for READ operations will fail on server-side.

**Collections that need `allow read: if true`:**
- `articles` - Public content
- `blogPosts` - Public content
- `categories` - Navigation/filtering
- `settings` - Site configuration
- `componentSettings` - UI configuration
- `aiJournalists` - Displayed on articles
- `contentSources` - Content management
- `contentItems` - Content management
- `scheduledTasks` - Task management
- `personas` - Chat functionality
- `advertising` - Ads display
- `ads` - Legacy ads
- `community` - Public community content

**The Fix:**
1. Update `firestore.rules` to allow public read on content collections
2. Deploy to ALL databases: `npx firebase deploy --only firestore`
3. Verify deployment shows "released rules" for each database

**Key Insight:**
If `npx firebase deploy --only firestore:rules` finishes instantly without showing "released rules firestore.rules to cloud.firestore", the rules didn't actually deploy. Use `npx firebase deploy --only firestore` (without `:rules`) to force a full deploy.

**Correct Deploy Output Should Show:**
```
i  firestore: uploading rules firestore.rules...
+  firestore: released rules firestore.rules to cloud.firestore
+  firestore: released rules firestore.rules to cloud.firestore
+  firestore: released rules firestore.rules to cloud.firestore
```

---

## Protected Files - Exercise Caution

### Firebase Config
- `firebase.json` - Hosting and Firestore database config
- `firestore.rules` - Security rules (changes affect all users!)
- `.firebaserc` - Project configuration
- `src/lib/firebase.ts` - Database connection

### Core Services
- `src/lib/articles.ts` - Article fetching
- `src/lib/categories.ts` - Category management
- `src/lib/personas.ts` - Chat personas

## Deployment

```bash
# Deploy just Firestore rules
npx firebase deploy --only firestore

# Deploy everything (hosting + rules)
npx firebase deploy

# Check databases
npx firebase firestore:databases:list
```
