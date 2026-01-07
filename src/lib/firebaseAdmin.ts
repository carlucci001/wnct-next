import { initializeApp, getApps, cert, App } from 'firebase-admin/app';
import { getStorage } from 'firebase-admin/storage';
import { getFirestore } from 'firebase-admin/firestore';

let adminApp: App | null = null;

/**
 * Initialize Firebase Admin SDK
 * Uses service account from environment variable or file
 */
export function getAdminApp(): App {
  if (adminApp) {
    return adminApp;
  }

  const existingApps = getApps();
  if (existingApps.length > 0) {
    adminApp = existingApps[0];
    return adminApp;
  }

  // Check for service account credentials
  const serviceAccountJson = process.env.FIREBASE_SERVICE_ACCOUNT;
  const storageBucket = process.env.NEXT_PUBLIC_FIREBASE_STORAGE_BUCKET;

  if (!storageBucket) {
    throw new Error('NEXT_PUBLIC_FIREBASE_STORAGE_BUCKET environment variable is required');
  }

  if (serviceAccountJson) {
    // Parse service account from environment variable
    try {
      const serviceAccount = JSON.parse(serviceAccountJson);
      adminApp = initializeApp({
        credential: cert(serviceAccount),
        storageBucket: storageBucket,
      });
    } catch (error) {
      console.error('Failed to parse FIREBASE_SERVICE_ACCOUNT:', error);
      throw new Error('Invalid FIREBASE_SERVICE_ACCOUNT JSON');
    }
  } else {
    // Try Application Default Credentials (works in Google Cloud environments)
    // Or initialize without credentials for Firestore-only operations
    adminApp = initializeApp({
      projectId: process.env.NEXT_PUBLIC_FIREBASE_PROJECT_ID,
      storageBucket: storageBucket,
    });
  }

  return adminApp;
}

/**
 * Get Firebase Admin Storage instance
 */
export function getAdminStorage() {
  const app = getAdminApp();
  return getStorage(app);
}

/**
 * Get Firebase Admin Firestore instance
 * Uses the 'gwnct' named database to match client-side Firebase
 */
export function getAdminFirestore() {
  const app = getAdminApp();
  // IMPORTANT: Must use the same database ID as client-side ('gwnct')
  return getFirestore(app, 'gwnct');
}

/**
 * Upload a file to Firebase Storage using Admin SDK
 */
export async function uploadToStorageAdmin(
  buffer: Buffer,
  filename: string,
  contentType: string,
  folder: string = 'articles'
): Promise<string> {
  const storage = getAdminStorage();
  const bucket = storage.bucket();

  const filePath = `${folder}/${Date.now()}-${filename}`;
  const file = bucket.file(filePath);

  await file.save(buffer, {
    metadata: {
      contentType: contentType,
    },
  });

  // Make the file publicly accessible
  await file.makePublic();

  // Get the public URL
  const publicUrl = `https://storage.googleapis.com/${bucket.name}/${filePath}`;

  return publicUrl;
}
