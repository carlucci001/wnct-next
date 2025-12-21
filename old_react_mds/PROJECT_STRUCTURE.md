# WNC Times - Clean Project Structure

**Git Commit:** 5e905d7 (v1.0-stable) ⭐ STABLE RESTORE POINT
**Live URL:** https://gen-lang-client-0242565142.web.app
**Date:** December 3, 2025

## Project Overview
A news website for Western North Carolina built with React, Firebase, and Vite.

## Core Technologies
- **React 19.2.0** - UI framework
- **Vite 6.4.1** - Build tool
- **Firebase Firestore** - Database (named database: 'gwnct')
- **Tailwind CSS** - Styling (via CDN)
- **TypeScript** - Type safety
- **HashRouter** - Client-side routing

## Key Files

### Configuration
- `firebase.ts` - Firebase initialization (connects to named database 'gwnct')
- `vite.config.ts` - Vite build configuration
- `package.json` - Dependencies
- `.firebaserc` - Firebase project ID
- `firebase.json` - Firebase hosting config

### Application Entry
- `index.html` - HTML entry point with Tailwind CDN and importmap
- `index.tsx` - React root
- `App.tsx` - Main app component with routes

### Services
- `services/api.ts` - Firestore data fetching (articles, categories, homepage)
- `services/db.ts` - IndexedDB caching layer (graceful fallback on errors)
- `services/firebase.ts` - REMOVED (was duplicate, now only use root firebase.ts)

### Pages
- `pages/Home.tsx` - Homepage with hero, articles, events
- `pages/Articles.tsx` - Article listing with filters
- `pages/ArticleDetail.tsx` - Single article view
- `pages/About.tsx` - About page
- `pages/Contact.tsx` - Contact page
- `pages/AdminDashboard.tsx` - Admin CMS

### Components
- `components/Header.tsx` - Navigation header
- `components/Footer.tsx` - Site footer
- `components/HeroSection.tsx` - Homepage hero
- `components/ArticleCard.tsx` - Article preview card
- `components/Sidebar.tsx` - Trending/categories sidebar
- `components/DirectoryCard.tsx` - Business directory card
- `components/Breadcrumbs.tsx` - Navigation breadcrumbs
- Plus more...

### Data
- `data/articles.json` - Fallback mock articles
- `types.ts` - TypeScript type definitions

## Firebase Structure

### Firestore Collections
- `articles` - All news articles (465+ documents)
- `categories` - Article categories (6 default categories)

### Named Database
- Database ID: `gwnct`
- Must use: `getFirestore(app, 'gwnct')`

## IndexedDB Caching
- Database: `wnc_platform_db`
- Version: 5
- Stores: articles, categories, comments, settings
- **Graceful degradation** - Falls back to Firestore if IndexedDB fails

## Build & Deploy

### Development
```bash
npm run dev  # Runs on http://localhost:3000
```

### Production Build
```bash
npm run build  # Outputs to dist/
```

### Deploy
```bash
firebase deploy --only hosting
```

## Important Notes

### Version Control
- **Always commit working state before major changes**
- **⭐ STABLE RESTORE POINT: `5e905d7` (v1.0-stable)** - USE THIS TO RESTORE
- Previous commits: `e2d14f7`, `b417d0c`, `41a59b7`, `c552e18`, `f5033a6`

### Database Configuration
- Must use named database 'gwnct' in firebase.ts
- WRONG: `getFirestore(app)` - connects to (default) database
- RIGHT: `getFirestore(app, 'gwnct')` - connects to gwnct database

### Common Issues
1. **IndexedDB errors** - Normal if browser blocks it, app falls back to Firestore
2. **Build fails on index.html** - Check for inline `<style>` tags or missing CSS references
3. **0 articles from Firestore** - Check database name in firebase.ts

## Files Removed (Not Needed)
- All `.cjs` migration/debug scripts
- `src/` folder (AI-related TypeScript types)
- `.env` file (Gemini API key)
- `index.css` / `index.html.backup`
- AI-related code (Gemini, RelatedArticles component)

## How to Restore to This Point

If anything breaks in the future, restore to this stable version:

```bash
git reset --hard 5e905d7
# OR use the tag
git reset --hard v1.0-stable
```

Then rebuild and deploy:
```bash
npm run build
firebase deploy --only hosting
```
