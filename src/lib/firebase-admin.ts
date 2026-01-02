import { initializeApp, getApps, cert, App, applicationDefault } from 'firebase-admin/app';
import { getFirestore, Firestore } from 'firebase-admin/firestore';

let app: App | undefined;
let firestoreDb: Firestore | undefined;

function getFirebaseAdmin(): App {
  if (app) return app;

  if (getApps().length > 0) {
    app = getApps()[0];
    return app;
  }

  const projectId = process.env.FIREBASE_PROJECT_ID || process.env.NEXT_PUBLIC_FIREBASE_PROJECT_ID;

  // Option 1: Use service account JSON from environment variable
  const serviceAccountKey = process.env.FIREBASE_SERVICE_ACCOUNT_KEY;
  if (serviceAccountKey) {
    try {
      const serviceAccount = JSON.parse(serviceAccountKey);
      app = initializeApp({
        credential: cert(serviceAccount),
        projectId,
      });
      console.log('[Firebase Admin] Initialized with service account key');
      return app;
    } catch (error) {
      console.error('[Firebase Admin] Failed to parse FIREBASE_SERVICE_ACCOUNT_KEY:', error);
    }
  }

  // Option 2: Use individual environment variables
  const clientEmail = process.env.FIREBASE_CLIENT_EMAIL;
  const privateKey = process.env.FIREBASE_PRIVATE_KEY?.replace(/\\n/g, '\n');
  if (projectId && clientEmail && privateKey) {
    app = initializeApp({
      credential: cert({
        projectId,
        clientEmail,
        privateKey,
      }),
    });
    console.log('[Firebase Admin] Initialized with individual credentials');
    return app;
  }

  // Option 3: Use Application Default Credentials (works on Firebase Hosting, Cloud Run, etc.)
  try {
    app = initializeApp({
      credential: applicationDefault(),
      projectId,
    });
    console.log('[Firebase Admin] Initialized with Application Default Credentials');
    return app;
  } catch (error) {
    console.log('[Firebase Admin] ADC not available, trying without credentials');
  }

  // Option 4: Initialize without explicit credentials (for Firebase emulators)
  if (projectId) {
    app = initializeApp({ projectId });
    console.log('[Firebase Admin] Initialized with project ID only');
    return app;
  }

  throw new Error(
    'Firebase Admin SDK not configured. Set FIREBASE_SERVICE_ACCOUNT_KEY, individual FIREBASE_* environment variables, or deploy to a Google Cloud environment with ADC.'
  );
}

export function getAdminFirestore(): Firestore {
  if (firestoreDb) return firestoreDb;

  getFirebaseAdmin();
  firestoreDb = getFirestore();
  return firestoreDb;
}

export { getFirebaseAdmin };
