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

---

## Restore Points

Known stable commits to revert to if something breaks:

| Date | Commit | Description |
|------|--------|-------------|
| Jan 31, 2026 | `57bd39f` | Dynamic article length + Firestore abstraction + Webpack dev |
| Jan 30, 2026 | `e0e0a30` | Custom image prompt + Force AI Generation toggle |
| Jan 30, 2026 | `813fb08` | Gemini image generation (replaced DALL-E) |
| Jan 30, 2026 | `7e609a6` | Category colors fix + Gemini 2.0 Flash (stable) |
| Jan 30, 2026 | `90825c5` | Reverted to Gemini 2.0 Flash for article generation |
| Jan 29, 2026 | `2b79f40` | Firebase Storage upload fix |

**To restore:**
```bash
git checkout <commit-hash> -- <file-path>   # Restore specific file
git revert <commit-hash>                     # Revert a commit
git reset --hard <commit-hash>               # Reset to commit (destructive)
```

---

## Recovery Procedures

### INCIDENT: Turbopack Crash + Corrupted node_modules (Jan 31, 2026)

**Symptoms:**
- Dev server shows "Turbopack panic" errors
- Error trying to read `c:\dev\wnct-next\nul` (Windows reserved filename)
- `npm install` says "up to date" but packages missing
- Mouse erratic behavior during crashes

**Root Cause:**
1. A crash created a file named `nul` in the project root (Windows reserved device name)
2. node_modules became corrupted
3. Turbopack panics trying to read the `nul` file

**The Fix:**
```bash
# 1. Kill all node processes
powershell -Command "Get-Process node -ErrorAction SilentlyContinue | Stop-Process -Force"

# 2. Delete the problematic nul file (requires special path prefix on Windows)
powershell -Command "Remove-Item -LiteralPath '\\?\c:\dev\wnct-next\nul' -Force"

# 3. Clear all caches
powershell -Command "Remove-Item 'c:\dev\wnct-next\.next' -Recurse -Force -ErrorAction SilentlyContinue"
powershell -Command "Remove-Item 'c:\dev\wnct-next\node_modules' -Recurse -Force -ErrorAction SilentlyContinue"

# 4. Clear npm cache and reinstall
npm cache clean --force
npm install

# 5. Run with Webpack instead of Turbopack
npm run dev  # package.json now has --webpack flag
```

**Prevention:**
- The dev script now uses `--webpack` flag by default
- Turbopack has Windows file system bugs with reserved filenames

### Quick Recovery Checklist

If something breaks badly:

1. **Check git status first** - Are there uncommitted changes to save?
2. **Check .env.local** - Are all credentials in place?
3. **Check node_modules** - Run `npm install` to ensure packages are valid
4. **Clear caches** - Delete `.next` folder
5. **Test locally** - Run `npm run dev` before pushing
6. **Rollback if needed** - Use restore points above

---

## AI Model Configuration

**Current Production Models (Jan 2026):**
- Article Generation: `gemini-2.0-flash` (stable, full-quality output)
- Fact-Checking: `gemini-2.0-flash`
- SEO Metadata: `gemini-2.0-flash`
- Editorial Review: `gemini-2.0-flash`

**Note:** Gemini 2.5 Flash produced abbreviated articles. Stick with 2.0 until March 2026 deprecation, then test 2.5 carefully before switching.
