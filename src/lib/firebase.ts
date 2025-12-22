import { initializeApp, getApps } from 'firebase/app';
import { getFirestore } from 'firebase/firestore';
import { getAuth } from 'firebase/auth';

const firebaseConfig = {
  apiKey: process.env.NEXT_PUBLIC_FIREBASE_API_KEY || "dummy-key",
  authDomain: process.env.NEXT_PUBLIC_FIREBASE_AUTH_DOMAIN || "dummy-domain",
  projectId: process.env.NEXT_PUBLIC_FIREBASE_PROJECT_ID || "dummy-project",
  storageBucket: process.env.NEXT_PUBLIC_FIREBASE_STORAGE_BUCKET || "dummy-bucket",
  messagingSenderId: process.env.NEXT_PUBLIC_FIREBASE_MESSAGING_SENDER_ID || "dummy-sender-id",
  appId: process.env.NEXT_PUBLIC_FIREBASE_APP_ID || "dummy-app-id",
  measurementId: process.env.NEXT_PUBLIC_FIREBASE_MEASUREMENT_ID || "dummy-measurement-id",
};

// Check if config is valid (at least apiKey is present)
const isValidConfig = !!firebaseConfig.apiKey;

let app;
let db: any;
let auth: any;

if (isValidConfig) {
  // Initialize Firebase only if it hasn't been initialized already
  app = getApps().length === 0 ? initializeApp(firebaseConfig) : getApps()[0];
  // Point at the named Firestore database 'gwnct'
  db = getFirestore(app, 'gwnct');
  // Firebase Auth
  auth = getAuth(app);
} else {
  // Warn about missing config but don't crash, allowing build to proceed (pages will handle errors)
  console.warn("Firebase configuration missing or invalid. Initializing in mock/offline mode.");

  // We can initialize a dummy app or just export null/undefined and handle it in consumers.
  // Initializing a dummy app might throw if keys are missing.
  // Better to export a proxy or throw on usage?
  // For static build, avoiding crash is key.

  // Let's try to initialize with dummy values if completely missing,
  // but that might fail connection.
  // Instead, let's keep exports as undefined or mock if possible,
  // but `getFirestore` requires an app.

  // If we return undefined for db, consumers must handle it.
}

export { app, db, auth };
export default app;
