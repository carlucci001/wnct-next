# AI Instructions for WNC Times Project

**READ THIS FIRST BEFORE MAKING ANY CHANGES**

## Core Principle
**DO NOT modify files unless explicitly requested by the user. When in doubt, ask first.**

---

## 🚫 PROTECTED FILES - DO NOT MODIFY WITHOUT EXPLICIT APPROVAL

### Critical Configuration Files
- `firebase.ts` - Firebase database connection (connects to named 'gwnct' database)
- `vite.config.ts` - Build configuration
- `package.json` / `package-lock.json` - Dependencies
- `.firebaserc` - Firebase project configuration
- `firebase.json` - Firebase hosting configuration
- `index.html` - HTML entry point with importmap and Tailwind config

### Core Services (Modify only if explicitly requested)
- `services/api.ts` - Firestore data fetching logic
- `services/db.ts` - IndexedDB caching layer
- `types.ts` - TypeScript type definitions

### Layout & Styling Components (NO CHANGES unless explicitly requested)
- `components/Header.tsx` - Navigation header
- `components/Footer.tsx` - Site footer
- `components/HeroSection.tsx` - Homepage hero section
- `components/ArticleCard.tsx` - Article preview cards
- `components/Sidebar.tsx` - Trending/categories sidebar
- `components/Breadcrumbs.tsx` - Navigation breadcrumbs
- `components/DirectoryCard.tsx` - Business directory cards
- `components/CategoryFeaturedSlider.tsx` - Category slider
- `components/BreakingNews.tsx` - Breaking news banner

### Page Components (Layouts are pixel-perfect - preserve exactly)
- `pages/Home.tsx` - Homepage layout
- `pages/Articles.tsx` - Article listing page
- `pages/ArticleDetail.tsx` - Single article view
- `pages/About.tsx` - About page
- `pages/Contact.tsx` - Contact page
- `pages/AdminDashboard.tsx` - Admin CMS interface

---

## ⚠️ STRICT RULES

### 1. Layout & Styling
- **NO changes to component layouts, spacing, sizing, or positioning**
- **NO modifications to Tailwind classes unless explicitly requested**
- **NO refactoring component structure or JSX hierarchy**
- **NO adding new UI elements or changing existing ones**
- Layouts are considered pixel-perfect and production-ready

### 2. Firebase & Database
- **NEVER modify firebase.ts without explicit user approval**
- Database connection MUST use: `getFirestore(app, 'gwnct')`
- Named database is `gwnct` - NOT the default database
- **DO NOT change Firestore queries or collection names**

### 3. File Organization
- **NO moving files to different directories**
- **NO creating new directory structures**
- **NO renaming files or folders**
- Keep the existing flat structure (components/, pages/, services/ at root)

### 4. Dependencies
- **NO adding new npm packages without user approval**
- **NO updating existing package versions**
- **NO removing packages**

### 5. Build Configuration
- **NO changes to vite.config.ts**
- **NO modifications to index.html structure**
- **DO NOT remove or modify the importmap**

### 6. Scope Discipline
- **ONLY work on the specific task requested**
- **NO "improvements" or "optimizations" unless asked**
- **NO adding features "while you're at it"**
- **NO refactoring surrounding code**
- **NO adding comments or documentation unless requested**

---

## ✅ ALLOWED ACTIONS

### You MAY do these without asking:
1. Fix actual bugs that break functionality
2. Add error handling to prevent crashes
3. Update logic inside functions (not structure) for requested features
4. Add new utility functions in appropriate service files
5. Create new components ONLY if explicitly requested for a new feature

### You MUST ask permission for:
1. Any layout or styling changes
2. Component restructuring
3. File moves or renames
4. Firebase configuration changes
5. Adding new dependencies
6. Modifying build configuration
7. Changing routing structure
8. Adding new pages

---

## 🔧 WHEN MAKING CHANGES

### Before Starting
1. Read the user's request carefully
2. Identify EXACTLY what needs to change
3. Determine if any protected files are affected
4. If protected files need changes, **ASK FOR EXPLICIT APPROVAL FIRST**

### During Development
1. Make the MINIMUM changes necessary
2. Do NOT modify files adjacent to your work
3. Do NOT "clean up" code you didn't write
4. Preserve all existing formatting and style
5. Test that your changes don't break existing functionality

### Before Committing
1. Verify ONLY requested changes were made
2. No accidental modifications to protected files
3. No new files created unless explicitly needed
4. Build succeeds without errors

---

## 📝 COMMIT GUIDELINES

### Commit Messages
- Be specific about what changed and why
- Reference the user's request
- Example: "Add article search functionality per user request"
- NOT: "Improve codebase" or "Refactor components"

### Before Committing
Always verify the current state is working:
```bash
npm run build  # Must succeed
firebase deploy --only hosting  # If deploying
```

---

## 🚨 CRITICAL REMINDERS

### Firebase Database Connection
```typescript
// ✅ CORRECT - Named database
export const db = getFirestore(app, 'gwnct');

// ❌ WRONG - Default database (will find 0 articles)
export const db = getFirestore(app);
```

### IndexedDB Version
- Current version: 5
- Only increment if schema changes
- Graceful fallback to Firestore if IndexedDB fails

### Mock Data
- Used ONLY as fallback when Firestore is unavailable
- Should load real data from Firestore in production
- Mock data exists in `services/api.ts`

---

## 📊 PROJECT STATUS

### Current Stable Version
- **Commit:** `5e905d7`
- **Tag:** `v1.0-stable`
- **Status:** Production-ready, loading real Firestore data

### Restore Point
If anything breaks:
```bash
git reset --hard v1.0-stable
npm run build
firebase deploy --only hosting
```

---

## 🎯 TASK EXECUTION CHECKLIST

Before making ANY changes, verify:

- [ ] User explicitly requested this change
- [ ] I understand EXACTLY what needs to change
- [ ] No protected files will be modified without approval
- [ ] I'm not making unsolicited improvements
- [ ] I'm not touching layouts/styling unless requested
- [ ] I'm not reorganizing files or folders
- [ ] I have approval if adding dependencies
- [ ] Changes are minimal and focused

After making changes, verify:

- [ ] ONLY requested files were modified
- [ ] Build succeeds: `npm run build`
- [ ] No layout/styling was accidentally changed
- [ ] No files were moved or renamed
- [ ] Commit message is specific and clear
- [ ] Ready to create restore point if this is significant

---

## 💬 COMMUNICATION PROTOCOL

### When Uncertain
**ALWAYS ask the user before:**
- Modifying protected files
- Changing layouts or styling
- Adding new dependencies
- Restructuring code
- Adding features not explicitly requested

### Response Format
When proposing changes:
1. List exactly what files will be modified
2. Describe what will change in each file
3. Explain why it's necessary
4. Wait for explicit approval before proceeding

---

## 🏁 SUCCESS CRITERIA

A change is successful when:
1. ✅ User's specific request is fulfilled
2. ✅ Build completes without errors
3. ✅ Site loads real data from Firestore
4. ✅ No protected files were modified without approval
5. ✅ No layouts or styling were changed
6. ✅ No files were reorganized
7. ✅ Clean commit with specific message
8. ✅ Documentation updated if needed

---

**Remember: The goal is surgical precision, not comprehensive improvement. Do what's asked, nothing more.**