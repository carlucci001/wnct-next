# Development Guide - WNC Times

## Quick Reference for Common Issues

### Browser Cache Issues (Layout Not Updating)

If you make changes but don't see them reflected in the browser:

#### Method 1: Hard Refresh (Try This First)
- **Windows/Linux**: `Ctrl + Shift + R` or `Ctrl + F5`
- **Mac**: `Cmd + Shift + R`

#### Method 2: Clear Cache and Reload
1. Press `F12` to open DevTools
2. Right-click the refresh button
3. Select **"Empty Cache and Hard Reload"**

#### Method 3: Manual Cache Clear
1. Press `F12` to open DevTools
2. Go to **Application** tab (Chrome) or **Storage** tab (Firefox)
3. Under "Storage", click **"Clear site data"**
4. Refresh the page

#### Method 4: Clear Vite Cache and Restart
```bash
# Clear Vite's build cache
rm -rf node_modules/.vite

# Restart the dev server
npm run dev
```

### Verifying Changes Are Applied

To verify a specific component has updated:

1. **Open DevTools** (`F12`)
2. **Inspect the element** you modified
3. **Check for the changes** in the HTML/CSS
4. **Look at the Console** for any errors that might prevent loading

For the Admin Dashboard specifically, check if the `<main>` element has:
- Class: `max-w-[1800px] mx-auto px-4 md:px-6 py-6`
- Data attribute: `data-layout="constrained-v2"`

### Hot Module Replacement (HMR) Issues

If HMR stops working:

1. **Check the dev server terminal** for errors
2. **Restart the dev server**:
   ```bash
   # Stop with Ctrl+C, then:
   npm run dev
   ```

3. **If multiple servers are running**, kill all and start fresh:
   ```bash
   # Windows
   taskkill /F /IM node.exe

   # Mac/Linux
   killall node

   # Then restart
   npm run dev
   ```

### Git Best Practices

Before making significant changes:

1. **Check current status**:
   ```bash
   git status
   ```

2. **Create a checkpoint** (if needed):
   ```bash
   git add .
   git commit -m "Checkpoint before [description]"
   ```

3. **View recent changes**:
   ```bash
   git diff
   ```

### Common Development Workflows

#### Making Layout Changes

1. **Locate the file** you need to modify
2. **Read the file** to understand the structure
3. **Make the change** using your editor
4. **Wait for HMR** to update (watch terminal for "hmr update")
5. **Hard refresh browser** if changes don't appear
6. **Test thoroughly** at different screen sizes

#### Testing Responsive Design

1. Open DevTools (`F12`)
2. Click the device toolbar icon (or `Ctrl + Shift + M`)
3. Test these breakpoints:
   - **Mobile**: 375px (iPhone SE)
   - **Tablet**: 768px (iPad)
   - **Desktop**: 1024px, 1440px, 1920px

#### Debugging Authentication Issues

1. **Open DevTools Console** (`F12`)
2. **Check localStorage**:
   ```javascript
   // In browser console
   localStorage.getItem('wnc_users')
   localStorage.getItem('wnc_current_user')
   ```

3. **Clear auth data** (if needed):
   ```javascript
   localStorage.removeItem('wnc_users')
   localStorage.removeItem('wnc_current_user')
   ```

4. **Refresh** and login again

### Project Structure

```
wnc-times-clone/
├── components/          # Reusable React components
│   ├── Header.tsx
│   ├── Footer.tsx
│   ├── ProtectedRoute.tsx
│   └── ...
├── pages/              # Page components
│   ├── AdminDashboard.tsx
│   ├── Home.tsx
│   ├── Login.tsx
│   └── ...
├── services/           # Business logic & utilities
│   ├── auth.ts         # Authentication service
│   ├── googleAuth.ts   # Google OAuth
│   └── ...
├── data/               # Static data & configurations
│   ├── rolePermissions.ts
│   └── ...
├── types.ts            # TypeScript type definitions
└── App.tsx             # Main app component & routing
```

### Environment Variables

Required variables in `.env`:

```bash
# Firebase Configuration (for Google OAuth - Optional)
VITE_FIREBASE_API_KEY=your_api_key
VITE_FIREBASE_AUTH_DOMAIN=your_domain.firebaseapp.com
VITE_FIREBASE_PROJECT_ID=your_project_id
VITE_FIREBASE_STORAGE_BUCKET=your_bucket.appspot.com
VITE_FIREBASE_MESSAGING_SENDER_ID=your_sender_id
VITE_FIREBASE_APP_ID=your_app_id
```

**Note**: Never commit `.env` - it's already in `.gitignore`

### VSCode Settings

The project includes `.vscode/settings.json` with:
- Auto-save delay to prevent constant HMR triggers
- TypeScript and ESLint configurations
- Optimized file watching excludes
- Format on save enabled

### Performance Tips

1. **Limit console.logs** in production code
2. **Use React DevTools** to profile components
3. **Check bundle size** with build analysis:
   ```bash
   npm run build
   # Check dist/ folder size
   ```

4. **Optimize images** before adding to media library
5. **Use lazy loading** for heavy components (if needed)

### Troubleshooting Checklist

When something goes wrong:

- [ ] Clear browser cache (hard refresh)
- [ ] Check browser console for errors
- [ ] Check terminal for build errors
- [ ] Verify HMR is working (watch for "hmr update" messages)
- [ ] Restart dev server
- [ ] Clear Vite cache (`rm -rf node_modules/.vite`)
- [ ] Check if multiple dev servers are running
- [ ] Verify file changes are saved
- [ ] Check git status to see what actually changed
- [ ] Look for TypeScript errors in IDE

### Getting Help

1. **Check the guides**:
   - [AUTHENTICATION_GUIDE.md](AUTHENTICATION_GUIDE.md) - Auth & user management
   - [FIREBASE_SETUP.md](FIREBASE_SETUP.md) - Google OAuth setup
   - [ROLES_PERMISSIONS_STRUCTURE.md](ROLES_PERMISSIONS_STRUCTURE.md) - Permissions matrix

2. **Check browser console** for error messages
3. **Check terminal output** for build errors
4. **Verify environment variables** are set correctly

### Code Quality Guidelines

1. **Always read before editing** - Use Read tool to understand context
2. **Test changes immediately** - Don't batch multiple changes
3. **Use TypeScript types** - Don't use `any` unless necessary
4. **Follow existing patterns** - Keep code consistent
5. **Comment complex logic** - But prefer self-documenting code
6. **Mobile-first design** - Start with mobile, scale up

### Admin Dashboard Specific Notes

The Admin Dashboard ([pages/AdminDashboard.tsx](pages/AdminDashboard.tsx)) uses:

- **Max width constraint**: `max-w-[1800px]` prevents excessive stretching
- **Responsive padding**: `px-4 md:px-6` adjusts for screen size
- **Centered layout**: `mx-auto` centers content within viewport
- **Flex layout**: Sidebar + main content area using flexbox
- **Tab-based navigation**: Multiple render functions for different sections

**Key sections**:
- Lines 4070-4128: Sidebar navigation
- Lines 4130-4152: Main content area with width constraint
- Lines 4154+: Modal overlays (article editor, media picker)

### Known Limitations & Future Improvements

- Authentication is client-side only (localStorage)
- No backend API - all data in browser storage
- No real email service - password reset simulated
- No rate limiting on login attempts
- Images stored as base64 (size limitations)

See [AUTHENTICATION_GUIDE.md](AUTHENTICATION_GUIDE.md) for migration recommendations.

---

**Last Updated**: 2025-12-05
**Project**: WNC Times Clone
**Stack**: React 19, TypeScript, Vite, Tailwind CSS
