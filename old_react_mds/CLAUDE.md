# Claude Code Instructions

**Project**: WNC Times Clone - News Publishing Platform
**Stack**: React 19 + TypeScript + Vite + Firebase Firestore + Tailwind CSS

## Quick Reference

- **Dev server**: `npm run dev` (localhost:3001)
- **Build**: `npm run build`
- **Admin login**: admin / admin123
- **Firebase database**: `gwnct` (named database, not default)
- **Stable restore**: `git reset --hard v1.1-stable`

## Core Principle

**DO NOT modify files unless explicitly requested. When in doubt, ask first.**

## Protected Files - DO NOT MODIFY

### Critical Config
- `firebase.ts` - Database connection (uses named 'gwnct' database)
- `vite.config.ts` - Build configuration
- `package.json` / `package-lock.json` - Dependencies
- `index.html` - Entry point with importmap

### Core Services
- `services/db.ts` - IndexedDB cache (version 8 - NEVER change version)
- `services/api.ts` - Firestore data fetching
- `types.ts` - TypeScript definitions

### Layout Components (pixel-perfect - preserve exactly)
- `components/Header.tsx`
- `components/Footer.tsx`
- `components/HeroSection.tsx`
- `components/ArticleCard.tsx`
- `components/Sidebar.tsx`
- `components/BreakingNews.tsx`
- `components/CategoryFeaturedSlider.tsx`

## Strict Rules

1. **No layout/styling changes** unless explicitly requested
2. **No new dependencies** without approval
3. **No file moves or renames**
4. **No refactoring** surrounding code
5. **No unsolicited improvements**
6. **Minimum changes only** - surgical precision

## Allowed Without Asking

- Fix bugs that break functionality
- Add error handling to prevent crashes
- Update logic inside functions for requested features
- Create new components ONLY if explicitly requested

## Must Ask Permission For

- Layout or styling changes
- Firebase configuration changes
- Adding dependencies
- Component restructuring
- New pages or routing changes

## Before Committing

```bash
npm run build  # Must succeed
```

Commit messages: Be specific, reference user's request, no generic "improvements"

## Critical Technical Notes

### Firebase Connection
```typescript
// CORRECT - Named database
export const db = getFirestore(app, 'gwnct');

// WRONG - Will find 0 articles
export const db = getFirestore(app);
```

### IndexedDB
- Current version: 8
- NEVER increment without migration strategy
- Version bump = data loss without migration

## Documentation

- `AI_INSTRUCTIONS.md` - Full guardrails (detailed version)
- `AI_HANDOFF.md` - Architecture and technical decisions
- `data/prompts.ts` - AI agent configurations
- `data/rolePermissions.ts` - RBAC permission matrix

## Success Criteria

1. User's specific request fulfilled
2. Build passes
3. No protected files modified without approval
4. No layout/styling changes
5. Clean commit with specific message
