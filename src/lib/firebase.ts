import { initializeApp, getApps, FirebaseApp } from 'firebase/app';
import { getFirestore, Firestore } from 'firebase/firestore';
import { getAuth, Auth } from 'firebase/auth';

const firebaseConfig = {
  apiKey: process.env.NEXT_PUBLIC_FIREBASE_API_KEY,
  authDomain: process.env.NEXT_PUBLIC_FIREBASE_AUTH_DOMAIN,
  projectId: process.env.NEXT_PUBLIC_FIREBASE_PROJECT_ID,
  storageBucket: process.env.NEXT_PUBLIC_FIREBASE_STORAGE_BUCKET,
  messagingSenderId: process.env.NEXT_PUBLIC_FIREBASE_MESSAGING_SENDER_ID,
  appId: process.env.NEXT_PUBLIC_FIREBASE_APP_ID,
  measurementId: process.env.NEXT_PUBLIC_FIREBASE_MEASUREMENT_ID,
};

// Initialize Firebase only if it hasn't been initialized already
let app: FirebaseApp;
let db: Firestore;
let auth: Auth;

try {
  if (!firebaseConfig.apiKey) {
    console.warn('Firebase API key is missing. Firebase features will be disabled.');
  }

  app = getApps().length === 0 ? initializeApp(firebaseConfig) : getApps()[0];

  // Point at the named Firestore database 'gwnct'
  db = getFirestore(app, 'gwnct');

  // Firebase Auth
  auth = getAuth(app);
} catch (error) {
  console.error('Error initializing Firebase:', error);
  // Prevent crash by assigning mocks or leaving undefined (handled by consumers)
  // Casting to any to avoid strict type issues with mocks for now
  app = {} as any;
  db = {} as any;
  auth = {} as any;
}

export { app, db, auth };
export default app;
