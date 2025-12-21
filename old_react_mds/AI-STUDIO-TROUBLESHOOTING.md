# AI Studio Troubleshooting Guide

## Problem: AI Studio Preview Pane Spinning/Sluggish

### Common Causes & Solutions

#### 1. **Large Files in Project**
AI Studio tries to analyze all files in your repository, which can cause performance issues.

**Solution:** I've created a `.aistudioignore` file that excludes:
- `node_modules/` (can be 200MB+)
- `dist/` build folder
- `.firebase/` cache
- Log files
- IDE files

**Action:** Make sure AI Studio respects the `.aistudioignore` file when loading the project.

---

#### 2. **AI Studio Configuration**

**Recommended Settings When Opening Project:**

1. **Repository URL:** `https://github.com/carlucci001/gwnct-core.git`
2. **Branch:** `dev` (not main!)
3. **Auto-deploy:** **OFF** (you control deployments manually)
4. **Preview Mode:** Try disabling live preview initially

---

#### 3. **Browser Performance Issues**

AI Studio runs in the browser and can be resource-intensive.

**Solutions:**
- Close other tabs/applications
- Try in an incognito/private window (clears cache)
- Clear browser cache: Ctrl+Shift+Delete
- Try a different browser (Chrome works best for AI Studio)
- Check if browser extensions are interfering (disable ad blockers)

---

#### 4. **Project-Specific Issues**

**Current Project Stats:**
- **Files:** ~40 source files
- **Build Size:** ~950KB
- **Dependencies:** React 19, Vite, Firebase, Tailwind

**If still spinning:**

1. **Clone fresh copy to test:**
   ```bash
   cd c:\dev
   git clone https://github.com/carlucci001/gwnct-core.git wnc-test
   cd wnc-test
   git checkout dev
   ```
   Then try opening `c:\dev\wnc-test` in AI Studio

2. **Verify Git status is clean:**
   ```bash
   git status
   # Should show "working tree clean"
   ```

3. **Check for uncommitted changes:**
   - AI Studio may struggle if there are many uncommitted files
   - All changes should be committed to `dev` branch

---

#### 5. **AI Studio Server Issues**

Sometimes the issue is on Google's side.

**Check:**
- Is AI Studio slow for other projects too?
- Try again in 10-15 minutes
- Check Google's status page

---

#### 6. **Workaround: Use Local Development Instead**

If AI Studio continues to be sluggish, you can work locally and manually sync:

```bash
# Work locally
cd c:\dev\wnc-times-clone
git checkout dev
npm run dev

# Make changes in your editor (VS Code, etc.)

# Commit and push
git add .
git commit -m "Your changes"
git push origin dev

# AI Studio will pick up changes on next load
```

---

## Recommended AI Studio Workflow

### **Initial Setup:**

1. Go to AI Studio
2. Click "New Project" or "Import from GitHub"
3. Enter repository: `https://github.com/carlucci001/gwnct-core.git`
4. Select branch: `dev`
5. **Disable auto-deploy**
6. Click "Load Project"

### **If Preview Pane Spins:**

1. **Don't panic** - production site is safe
2. Try refreshing the AI Studio page (F5)
3. Close and reopen the project
4. Try the incognito window approach
5. Check `.aistudioignore` is working

### **Once Loaded:**

1. Navigate to specific files instead of loading entire project at once
2. Use AI Studio's file search to find components
3. Make changes to individual files
4. Test changes locally before committing

---

## Project Files Most Likely to Edit

**Frontend Components:**
- `components/Header.tsx` - Header and navigation
- `components/BreakingNews.tsx` - Breaking news ticker
- `components/WeatherWidget.tsx` - Weather display
- `components/ChatAssistant.tsx` - AI chat interface

**Admin Dashboard:**
- `pages/AdminDashboard.tsx` - Main admin interface (large file, ~1400 lines)

**Services:**
- `services/db.ts` - IndexedDB operations
- `services/api.ts` - API calls
- `services/auth.ts` - Authentication

**Configuration:**
- `data/prompts.ts` - AI agent definitions
- `firebase.ts` - Firebase config
- `vite.config.ts` - Build config

---

## Current Project Status

✅ **Production:** https://gen-lang-client-0242565142.web.app (deployed, live)
✅ **Branch:** `dev` (20+ commits ahead of origin/dev)
✅ **Local:** localhost:3000 (working)
✅ **Git:** All changes committed and pushed

**Latest Features Deployed:**
- Collapsible admin sidebar
- Integrations page for API keys
- Articles filtering/sorting
- Sanitization persistence fix
- Breaking news alignment

---

## Emergency Recovery

**If AI Studio breaks something:**

```bash
# View recent commits
git log --oneline -10

# Restore to last good state
git checkout <commit-hash>

# Or restore to tagged version
git checkout v1.3-session-complete

# Reinstall dependencies
npm install

# Test locally
npm run dev
```

**Safe Restore Points:**
- `v1.3-session-complete` - Latest working version with all features
- `v1.1-weather-stable` - Weather widget + header layout
- `v1.0-stable` - Initial clean baseline

---

## Performance Optimization Tips

1. **Work on specific files** - Don't load entire codebase at once
2. **Commit frequently** - Smaller commits load faster
3. **Use .aistudioignore** - Exclude unnecessary files
4. **Close preview when not needed** - Saves resources
5. **Work in feature branches** - Keep dev branch clean

---

## Contact & Support

**Repository:** https://github.com/carlucci001/gwnct-core
**Issues:** Create GitHub issue if persistent problems
**Documentation:** See `DEPLOYMENT-GUIDE.md` and `SESSION-SUMMARY.md`

---

**Last Updated:** 2025-12-03
**Current Project:** WNC Times Clone (GWNCT Core)
**Firebase Project:** gen-lang-client-0242565142