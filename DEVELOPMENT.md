# Development Workflow

## Deployment Protocol

### **CRITICAL: Never Auto-Push to Production**

When working with Claude Code or any AI assistant on this project:

1. ✅ **Make changes locally**
2. ✅ **Commit to git locally** (creates restore point)
3. ⏸️ **STOP - Wait for explicit approval**
4. ⏸️ **Test on local dev server** (`npm run dev`)
5. ⏸️ **Verify changes work correctly**
6. ✅ **Only push when explicitly instructed**

### Commands Workflow

```bash
# 1. Make changes, then commit locally
git add -A
git commit -m "Your commit message"

# 2. STOP HERE - Test locally first
npm run dev  # Test at http://localhost:3000

# 3. Only after approval, push to production
git push origin master
```

### Why This Matters

- **Production is live** - Changes deploy immediately via Vercel
- **Testing is required** - Catch issues before users see them
- **Rollback is harder** - Better to prevent than fix in production

## Emergency Hotfixes

For critical production bugs:

1. Confirm the issue exists on production
2. Fix locally and commit
3. Test the fix locally
4. Get explicit approval: "push this emergency fix"
5. Push to production
6. Monitor deployment on Vercel

## Local Development

### Dev Server
```bash
npm run dev
```
- Runs on `http://localhost:3000` (or `:3001` if 3000 is in use)
- Hot reload enabled
- First load can take 15-20 seconds for large pages (admin)

### Environment Setup
- Firebase credentials in `.env.local`
- Never commit `.env.local` to git
- Production uses environment variables in Vercel

### Testing Checklist Before Push

- [ ] Changes work on local dev server
- [ ] No console errors
- [ ] Functionality tested in browser
- [ ] Git commit created with descriptive message
- [ ] Explicit approval received to push

## Known Issues

### Admin Page Performance
- **File:** `src/app/admin/page.tsx`
- **Size:** 360KB / 7,630 lines (monolithic)
- **Impact:** 15-20 second load time in dev mode
- **Status:** Works fine in production, dev mode only
- **Note:** Consider refactoring into smaller components (low priority)

### Article Editor Architecture
- **Route:** `/admin/articles/new?id=ARTICLE_ID`
- **Flow:** Redirects to `/admin?action=edit-article&id=ARTICLE_ID`
- **Why:** Centralizes editor logic in main admin page
- **Optimization:** Could bypass redirect (documented as optional improvement)

## Git Best Practices

### Commit Messages Format
```
Brief description of what changed

Details:
- Specific change 1
- Specific change 2
- Why this change was needed

Co-Authored-By: Claude Sonnet 4.5 <noreply@anthropic.com>
```

### Branch Strategy
- **master** - Production branch (auto-deploys to Vercel)
- Feature branches optional for major work

## Documentation

### Key Files
- `README.md` - Project overview and setup
- `DEVELOPMENT.md` - This file (workflow and guidelines)
- `.env.local` - Local environment variables (not in git)
- `vercel.json` - Deployment and cron configuration

### Code Documentation
- Add comments for complex logic
- Use JSDoc for functions when helpful
- Keep README updated with setup changes

---

**Last Updated:** 2026-01-13
**Maintained By:** Development Team
