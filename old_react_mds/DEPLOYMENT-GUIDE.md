# Deployment & Environment Setup Guide

This guide ensures your production environment stays safe while AI Studio (or any developer) works on the `dev` branch.

---

## 🛡️ Part 1: GitHub Branch Protection (Recommended)

Protect your `main` branch from accidental direct commits or force pushes.

### Setup Steps:

1. **Go to GitHub Repository**
   - Navigate to: https://github.com/carlucci001/gwnct-core
   - Click **Settings** tab (top right)
   - Click **Branches** (left sidebar under "Code and automation")

2. **Add Branch Protection Rule**
   - Click **"Add branch protection rule"**
   - Branch name pattern: `main`

3. **Enable These Protection Rules:**

   #### ✅ Required Settings:
   - [x] **Require a pull request before merging**
     - This forces all changes to go through pull requests
     - Prevents direct commits to `main`

   - [x] **Require approvals** (optional but recommended)
     - Require 1 approval before merging
     - You can approve your own PRs if you're the only developer

   - [x] **Dismiss stale pull request approvals when new commits are pushed**
     - Ensures reviews stay current

   - [x] **Require review from Code Owners** (optional)
     - Only if you have multiple team members

   #### ✅ Additional Protections:
   - [x] **Require status checks to pass before merging** (optional)
     - Add build/test checks if you have CI/CD

   - [x] **Require branches to be up to date before merging**
     - Ensures no conflicts

   - [x] **Do not allow bypassing the above settings**
     - Applies rules even to admins (you can override if needed)

   - [x] **Lock branch** (extreme - not recommended for active development)
     - Makes branch read-only

4. **Click "Create" to Save**

### How This Protects You:

```
❌ BLOCKED: Direct commit to main
✅ ALLOWED: Create dev branch → Make changes → Open PR → Review → Merge to main
```

**With AI Studio:**
```
AI Studio modifies code → Commits to dev branch → You review on GitHub →
Create Pull Request → Review changes → Approve & Merge → main branch updated
```

---

## 🔥 Part 2: Separate Firebase Environments (Highly Recommended)

Create two Firebase projects: one for development, one for production.

### Why Two Environments?

| Aspect | Development | Production |
|--------|------------|------------|
| **Purpose** | Testing AI Studio changes | Live website for users |
| **URL** | `https://gwnct-dev.web.app` | `https://gen-lang-client-0242565142.web.app` |
| **Git Branch** | `dev` | `main` |
| **Database** | Test data, can break | Real user data |
| **Mistakes** | Safe to make | Must avoid |
| **Deploy Frequency** | Many times per day | Only after thorough testing |

---

### Step-by-Step Setup:

#### A. Create Development Firebase Project

1. **Go to Firebase Console**
   - Navigate to: https://console.firebase.google.com
   - Click **"Add project"** (or **"Create a project"**)

2. **Project Setup**
   - **Project name**: `gwnct-dev` (or `wnc-times-dev`)
   - **Google Analytics**: Yes (optional, recommended)
   - Click **"Create project"**

3. **Register Web App**
   - In the new project, click the **</> (Web)** icon
   - **App nickname**: "GWNCT Dev"
   - **Firebase Hosting**: ✅ Check this box
   - Click **"Register app"**

4. **Copy Firebase Config**
   - Copy the config object that appears:
   ```javascript
   const firebaseConfig = {
     apiKey: "AIzaSy...",
     authDomain: "gwnct-dev.firebaseapp.com",
     projectId: "gwnct-dev",
     storageBucket: "gwnct-dev.appspot.com",
     messagingSenderId: "...",
     appId: "...",
     measurementId: "..."
   };
   ```
   - Save this somewhere (you'll need it later)

5. **Enable Firestore Database**
   - Go to **Build** → **Firestore Database**
   - Click **"Create database"**
   - **Start mode**: Production mode (recommended) or Test mode
   - **Location**: `us-central` (or your preferred region)
   - Click **"Enable"**

6. **Create Named Database (Important!)**
   - In Firestore, click the **"⋮"** menu next to "(default)"
   - Select **"Create database"**
   - **Database ID**: `gwnct` (must match your production)
   - Click **"Create"**

7. **Enable Hosting**
   - Go to **Build** → **Hosting**
   - Click **"Get started"**
   - Follow the setup wizard (you'll configure this in the terminal)

---

#### B. Configure Local Project for Multiple Environments

Now we'll set up your local project to support both environments.

##### 1. Update `.firebaserc` File

Open `c:\dev\wnc-times-clone\.firebaserc` and update it:

```json
{
  "projects": {
    "default": "gen-lang-client-0242565142",
    "production": "gen-lang-client-0242565142",
    "dev": "gwnct-dev"
  },
  "targets": {},
  "etags": {}
}
```

**What this does:**
- `default`: Points to production (safe default)
- `production`: Explicit alias for production project
- `dev`: New development environment

##### 2. Create Environment-Specific Firebase Config Files

Create a new file: `c:\dev\wnc-times-clone\firebase.config.dev.ts`

```typescript
import { initializeApp } from 'firebase/app';
import { getFirestore } from 'firebase/firestore';

const firebaseConfig = {
  apiKey: 'YOUR_DEV_API_KEY_HERE',
  authDomain: 'gwnct-dev.firebaseapp.com',
  projectId: 'gwnct-dev',
  storageBucket: 'gwnct-dev.appspot.com',
  messagingSenderId: 'YOUR_DEV_MESSAGING_ID',
  appId: 'YOUR_DEV_APP_ID',
  measurementId: 'YOUR_DEV_MEASUREMENT_ID',
};

const app = initializeApp(firebaseConfig);

// Point at the named Firestore database 'gwnct' (same as production)
export const db = getFirestore(app, 'gwnct');
```

**Keep your existing production file:** `firebase.ts` (don't change it)

##### 3. Add Environment Switching to Vite Config

Update `c:\dev\wnc-times-clone\vite.config.ts`:

```typescript
import path from 'path';
import { defineConfig, loadEnv } from 'vite';
import react from '@vitejs/plugin-react';

export default defineConfig(({ mode }) => {
  const env = loadEnv(mode, '.', '');

  return {
    server: {
      port: 3000,
      host: '0.0.0.0',
    },
    plugins: [react()],
    define: {
      'process.env.API_KEY': JSON.stringify(env.VITE_GEMINI_API_KEY),
      'process.env.NODE_ENV': JSON.stringify(mode), // Add this
    },
    resolve: {
      alias: {
        '@': path.resolve(__dirname, '.'),
        // Use different firebase config based on environment
        '@/firebase': path.resolve(__dirname, mode === 'development' ? 'firebase.config.dev.ts' : 'firebase.ts')
      }
    }
  };
});
```

---

#### C. Deploy to Development Environment

##### 1. Switch to Dev Environment

```bash
# Switch to dev Firebase project
firebase use dev

# Verify you're on the right project
firebase projects:list
# Should show "gwnct-dev" with (current) next to it
```

##### 2. Switch to Dev Git Branch

```bash
git checkout dev
```

##### 3. Build and Deploy

```bash
# Install dependencies (if needed)
npm install

# Build the project
npm run build

# Deploy to dev environment
firebase deploy

# You should see: "Deploying to 'gwnct-dev'..."
```

##### 4. Access Dev Site

After deployment completes, you'll see:
```
✔  Deploy complete!

Project Console: https://console.firebase.google.com/project/gwnct-dev/overview
Hosting URL: https://gwnct-dev.web.app
```

Visit `https://gwnct-dev.web.app` to test!

---

### Daily Development Workflow

#### Working on Features (Safe):

```bash
# 1. Make sure you're on dev branch
git checkout dev

# 2. Switch to dev Firebase
firebase use dev

# 3. Start local development
npm run dev
# Test at http://localhost:3000

# 4. Make changes, test locally

# 5. Commit changes
git add .
git commit -m "Add new feature"

# 6. Push to GitHub
git push origin dev

# 7. Deploy to dev environment (optional, for remote testing)
npm run build
firebase deploy
# Visit https://gwnct-dev.web.app
```

#### Deploying to Production (After Testing):

```bash
# 1. Switch to main branch
git checkout main

# 2. Merge dev into main (or use GitHub Pull Request)
git merge dev

# 3. Switch to production Firebase
firebase use production

# 4. Build production version
npm run build

# 5. Deploy to production
firebase deploy

# 6. Push main branch to GitHub
git push origin main
```

---

## 📊 Quick Reference Commands

### Firebase Project Switching

```bash
# List all projects
firebase projects:list

# Switch to dev
firebase use dev

# Switch to production
firebase use production

# Check current project
firebase use
```

### Git Branch Operations

```bash
# Check current branch
git branch

# Switch to dev
git checkout dev

# Switch to main
git checkout main

# Create and switch to new feature branch
git checkout -b feature/new-feature

# Merge dev into main
git checkout main
git merge dev
```

### Deployment Commands

```bash
# Deploy to current Firebase project
firebase deploy

# Deploy only hosting (faster)
firebase deploy --only hosting

# Deploy only Firestore rules
firebase deploy --only firestore:rules

# Preview deployment (doesn't deploy)
firebase hosting:channel:deploy preview
```

---

## 🚨 Safety Checklist Before Production Deploy

Before deploying to production, verify:

- [ ] All features tested on dev environment (`https://gwnct-dev.web.app`)
- [ ] Local build works: `npm run build` (no errors)
- [ ] Currently on `main` branch: `git branch`
- [ ] Currently using production Firebase: `firebase use`
- [ ] All changes committed and pushed to GitHub
- [ ] Database backup downloaded (Admin → Infrastructure → Download Backup)
- [ ] API keys configured in production settings
- [ ] No console errors in browser dev tools

---

## 🔒 Security Best Practices

### Environment Variables

Create separate `.env` files for each environment:

**`.env.development` (for dev):**
```env
VITE_GEMINI_API_KEY=your_dev_gemini_key
VITE_FIREBASE_PROJECT=gwnct-dev
```

**`.env.production` (for production):**
```env
VITE_GEMINI_API_KEY=your_production_gemini_key
VITE_FIREBASE_PROJECT=gen-lang-client-0242565142
```

**Add to `.gitignore`:**
```
.env
.env.local
.env.development
.env.production
```

### Firestore Security Rules

Create separate security rules for dev and production:

**Development (lenient for testing):**
```javascript
rules_version = '2';
service cloud.firestore {
  match /databases/{database}/documents {
    match /{document=**} {
      allow read, write: if true; // Open for testing
    }
  }
}
```

**Production (strict):**
```javascript
rules_version = '2';
service cloud.firestore {
  match /databases/{database}/documents {
    match /{document=**} {
      allow read: if true; // Public read
      allow write: if request.auth != null; // Authenticated write only
    }
  }
}
```

---

## 🆘 Troubleshooting

### Issue: "Permission denied" when deploying
**Solution:** Make sure you're logged into Firebase CLI:
```bash
firebase login
firebase projects:list
```

### Issue: Wrong Firebase project deployed
**Solution:** Always verify before deploying:
```bash
firebase use  # Check current project
firebase use dev  # Switch if needed
```

### Issue: Can't switch branches (uncommitted changes)
**Solution:** Commit or stash changes first:
```bash
git stash  # Temporarily save changes
git checkout main
git stash pop  # Restore changes
```

### Issue: Build fails on production
**Solution:** Clean and rebuild:
```bash
rm -rf node_modules dist
npm install
npm run build
```

---

## 📞 AI Studio Integration

When connecting AI Studio to your repository:

### Recommended Settings:
- **Repository**: `https://github.com/carlucci001/gwnct-core.git`
- **Branch**: `dev` (always!)
- **Auto-deploy**: Disabled (you control deployments manually)
- **Environment**: Development (test on https://gwnct-dev.web.app)

### AI Studio Workflow:
```
1. AI Studio makes changes → Commits to dev branch on GitHub
2. You pull changes: git pull origin dev
3. You test locally: npm run dev
4. You deploy to dev: firebase use dev && firebase deploy
5. You test on https://gwnct-dev.web.app
6. If good: Merge dev → main via GitHub PR
7. You deploy to production: firebase use production && firebase deploy
```

**Your production NEVER updates unless YOU deploy it manually.**

---

## ✅ Summary

### What We Set Up:

1. **GitHub Branch Protection**
   - `main` branch requires pull requests
   - Prevents accidental direct commits
   - All changes reviewed before merging

2. **Two Firebase Environments**
   - **Dev**: `https://gwnct-dev.web.app` (test everything here)
   - **Production**: `https://gen-lang-client-0242565142.web.app` (live site)

3. **Safe Workflow**
   - AI Studio → `dev` branch → Test on dev Firebase → Review → Merge to `main` → Deploy to production

### Your Protection:

- ✅ `main` branch is protected by GitHub rules
- ✅ Production Firebase requires manual deployment
- ✅ Dev environment for safe testing
- ✅ All changes go through review process
- ✅ You control every production deployment

**Bottom Line:** Even if AI Studio goes rogue, your production site and `main` branch are 100% safe. Nothing deploys without your explicit action.

---

**Ready to set this up? Follow the steps in order, and you'll have bulletproof protection for your production environment!**