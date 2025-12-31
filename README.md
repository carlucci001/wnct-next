# WNC Times

A Next.js news platform for Western North Carolina.

## Getting Started

First, run the development server:

```bash
npm run dev
```

Open [http://localhost:3000](http://localhost:3000) with your browser to see the result.

## Firebase Configuration

This project uses Firebase for authentication, Firestore database, and storage.

### Required Environment Variables

Create a `.env.local` file in the project root with the following values:

```env
# Firebase Configuration
NEXT_PUBLIC_FIREBASE_API_KEY=AIzaSyCceXv2nP5B0dE6VvU5q8y6GnRUMSx00-8
NEXT_PUBLIC_FIREBASE_AUTH_DOMAIN=gen-lang-client-0242565142.firebaseapp.com
NEXT_PUBLIC_FIREBASE_PROJECT_ID=gen-lang-client-0242565142
NEXT_PUBLIC_FIREBASE_STORAGE_BUCKET=gen-lang-client-0242565142.firebasestorage.app
NEXT_PUBLIC_FIREBASE_MESSAGING_SENDER_ID=976122475870
NEXT_PUBLIC_FIREBASE_APP_ID=1:976122475870:web:6deaf0e9aeabc1a72f8bcf
NEXT_PUBLIC_FIREBASE_MEASUREMENT_ID=G-1GCRZ4QNVG
```

### Getting Firebase Config (if values change)

If you need to get fresh Firebase credentials:

1. Go to [Firebase Console](https://console.firebase.google.com)
2. Select project: `gen-lang-client-0242565142`
3. Click **gear icon** (Settings) → **Project settings**
4. Scroll to **Your apps** section
5. Click on the web app
6. Copy the `firebaseConfig` values

### Firestore Database

This project uses a named Firestore database called `gwnct` (not the default).

### After Changing `.env.local`

Always restart the dev server after modifying environment variables:

```bash
# Stop the server (Ctrl+C), then:
npm run dev
```

## Project Structure

- `src/app/(main)/` - Public-facing pages (homepage, articles, categories)
- `src/app/admin/` - Admin dashboard
- `src/components/` - Reusable React components
- `src/lib/` - Firebase config, utilities, API functions
- `src/contexts/` - React contexts (Auth)

## Learn More

- [Next.js Documentation](https://nextjs.org/docs)
- [Firebase Documentation](https://firebase.google.com/docs)
