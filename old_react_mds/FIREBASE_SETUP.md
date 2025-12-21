# Firebase Setup for Google Sign-In

This guide will help you set up Google OAuth authentication using Firebase.

## Prerequisites

- A Google account
- Your WNC Times application running locally

## Step 1: Create a Firebase Project

1. Go to [Firebase Console](https://console.firebase.google.com/)
2. Click **"Add project"** or **"Create a project"**
3. Enter a project name (e.g., "WNC Times")
4. Click **Continue**
5. (Optional) Disable Google Analytics if you don't need it
6. Click **Create project**
7. Wait for the project to be created, then click **Continue**

## Step 2: Register Your App

1. In the Firebase console, click the **Web icon** (</>) to add a web app
2. Enter an app nickname (e.g., "WNC Times Web")
3. **Do NOT** check "Also set up Firebase Hosting"
4. Click **Register app**
5. You'll see your Firebase configuration - **keep this page open**

## Step 3: Enable Google Authentication

1. In the left sidebar, click **Build** → **Authentication**
2. Click **Get started**
3. Click on the **Sign-in method** tab
4. Find **Google** in the providers list
5. Click on **Google** to configure it
6. Toggle the **Enable** switch to ON
7. Enter a **Project support email** (your email)
8. Click **Save**

## Step 4: Add Authorized Domains

1. Still in **Authentication** → **Settings** tab
2. Scroll down to **Authorized domains**
3. Add your local development domain if needed:
   - `localhost` (should already be there)
   - Add your production domain when you deploy

## Step 5: Get Your Configuration

From the Firebase project settings, you'll need these values:

```javascript
{
  apiKey: "AIza...",
  authDomain: "your-project.firebaseapp.com",
  projectId: "your-project-id",
  storageBucket: "your-project.appspot.com",
  messagingSenderId: "123456789",
  appId: "1:123:web:abc..."
}
```

## Step 6: Configure Your .env File

1. Copy `.env.example` to `.env`:
   ```bash
   cp .env.example .env
   ```

2. Edit `.env` and add your Firebase credentials:
   ```bash
   # Firebase Configuration (for Google OAuth)
   VITE_FIREBASE_API_KEY=AIza...
   VITE_FIREBASE_AUTH_DOMAIN=your-project.firebaseapp.com
   VITE_FIREBASE_PROJECT_ID=your-project-id
   VITE_FIREBASE_STORAGE_BUCKET=your-project.appspot.com
   VITE_FIREBASE_MESSAGING_SENDER_ID=123456789
   VITE_FIREBASE_APP_ID=1:123:web:abc...
   ```

3. Save the file

## Step 7: Restart Your Development Server

1. Stop your current dev server (Ctrl+C)
2. Restart it:
   ```bash
   npm run dev
   ```

## Step 8: Test Google Sign-In

1. Go to [http://localhost:3000/#/login](http://localhost:3000/#/login)
2. Click the **"Sign in with Google"** button
3. Choose your Google account
4. You should be redirected and logged in!

## Troubleshooting

### "Pop-up blocked by browser"
- Enable pop-ups for your localhost in browser settings
- Some browsers block pop-ups by default

### "This app is not verified"
- During development, you'll see this warning
- Click **"Advanced"** → **"Go to [your-app] (unsafe)"**
- For production, you'll need to verify your app with Google

### "Google Sign-In is not configured"
- Make sure all 6 `VITE_FIREBASE_*` variables are set in `.env`
- Restart your dev server after changing `.env`
- Check browser console for any errors

### Still not working?
1. Check that all environment variables are set correctly
2. Verify Google authentication is enabled in Firebase Console
3. Check browser console for error messages
4. Make sure you're using the correct Firebase project

## Security Notes

- **Never commit your `.env` file** - it contains sensitive API keys
- The `.env` file is already in `.gitignore`
- For production deployment, set these as environment variables in your hosting platform
- Firebase API keys are safe to expose in client-side code (they're restricted by domain)

## Next Steps

Once Google Sign-In is working:
- Test registration with a new Google account
- Verify users get the "Commenter" role by default
- Check the Admin Dashboard → Users to see new Google users
- Consider adding other OAuth providers (GitHub, Twitter, etc.)

## Production Deployment

When deploying to production:

1. Add your production domain to Firebase **Authorized domains**
2. Set environment variables in your hosting platform:
   - Vercel: Project Settings → Environment Variables
   - Netlify: Site Settings → Build & deploy → Environment
   - Firebase Hosting: Use `firebase functions:config:set`

3. Update OAuth consent screen in Google Cloud Console if needed

## Learn More

- [Firebase Authentication Docs](https://firebase.google.com/docs/auth)
- [Google Sign-In for Websites](https://developers.google.com/identity/sign-in/web)
- [WNC Times Authentication Guide](./AUTHENTICATION_GUIDE.md)

---

**Need help?** Check the [Authentication Guide](./AUTHENTICATION_GUIDE.md) or open an issue.
