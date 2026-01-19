# WNC Times Recovery Procedure

**Backup Date**: January 18, 2026
**Latest Commit**: 729ed46 - Fix Analytics to work on Vercel with env variables
**Branch**: master

## Available Backups

### 1. Git Snapshot Branch
**Location**: `production-snapshot-2026-01-18` branch in this repository
**Contains**: Complete source code at time of backup

### 2. Git Archive File
**Location**: `c:\dev\wnct-next-SAFE-BACKUP-2026-01-18.tar`
**Size**: 4.3 MB
**Contains**: Complete source code archive

## Recovery Methods

### Method 1: Restore from Git Snapshot Branch (Recommended)

```bash
# Switch to the snapshot branch
git checkout production-snapshot-2026-01-18

# Create a new branch from snapshot to continue work
git checkout -b recovery-from-snapshot-2026-01-18

# Or merge snapshot back into master
git checkout master
git merge production-snapshot-2026-01-18
```

### Method 2: Restore from Archive File

```bash
# Extract the archive to a new location
cd c:\dev
mkdir wnct-next-recovered
cd wnct-next-recovered
tar -xf ../wnct-next-SAFE-BACKUP-2026-01-18.tar

# Reinstall dependencies
npm install

# Copy over any .env files from original (if needed)
# cp ../wnct-next/.env.local .env.local
```

### Method 3: Reset to Specific Commit

```bash
# Reset to the latest commit before changes
git reset --hard 729ed46

# Or create a new branch from that commit
git checkout -b recovery-from-commit 729ed46
```

## Important Files NOT in Backup

The following files are excluded from Git backups and must be manually preserved:

- `.env.local` - Environment variables (Firebase, Stripe keys)
- `node_modules/` - Dependencies (reinstall with `npm install`)
- `.next/` - Build artifacts (rebuild with `npm run build`)
- Firebase service account keys (if any)

## Firestore Database Backup

**Current Database**: `gwnct` (named database)

To backup Firestore data:
```bash
npx firebase firestore:export gs://[YOUR-BUCKET]/backups/2026-01-18
```

To restore Firestore data:
```bash
npx firebase firestore:import gs://[YOUR-BUCKET]/backups/2026-01-18
```

## Verification Steps After Recovery

1. Install dependencies: `npm install`
2. Check environment variables exist: `ls .env.local`
3. Test dev server: `npm run dev`
4. Verify Firebase connection works
5. Check Firestore rules are deployed: `npx firebase deploy --only firestore`
6. Test production build: `npm run build`

## Emergency Contacts

- Firebase Console: https://console.firebase.google.com/project/wnc-times
- Vercel Dashboard: https://vercel.com/[your-team]/wnct-next
- Stripe Dashboard: https://dashboard.stripe.com

## Notes

- Always test recovery procedures before relying on them in production
- Keep multiple backup versions for redundancy
- Document any custom configuration or environment setup
- Update this document when making significant changes
