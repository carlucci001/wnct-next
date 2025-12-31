// Storage service for handling file uploads
// Supports local preview fallback and Firebase Storage when configured

import { getStorage, ref, uploadBytes, getDownloadURL } from 'firebase/storage';
import app from './firebase';

interface StorageSettings {
  bucketName: string;
  projectId: string;
  token?: string;
}

const getStorageSettings = (): StorageSettings | null => {
  if (typeof window === 'undefined') return null;

  const saved = localStorage.getItem('wnc_settings');
  if (!saved) return null;
  try {
    const parsed = JSON.parse(saved);
    if (parsed.googleCloudBucket) {
      return {
        bucketName: parsed.googleCloudBucket.trim(),
        projectId: parsed.googleCloudProjectId || '',
        token: parsed.googleCloudToken || ''
      };
    }
  } catch (e) {
    console.error("Failed to parse settings", e);
  }
  return null;
};

// Helper to validate bucket name format
const isValidBucketName = (name: string): boolean => {
  const regex = /^[a-z0-9][a-z0-9._-]{1,61}[a-z0-9]$/;
  return regex.test(name);
};

export const storageService = {

  // Upload a logo file to the logos folder
  uploadLogo: async (file: File): Promise<string> => {
    try {
      const storage = getStorage(app);
      const fileName = `logos/${Date.now()}-${file.name.replace(/[^a-zA-Z0-9.-]/g, '')}`;
      const storageRef = ref(storage, fileName);

      console.log('[Storage] Uploading logo to Firebase Storage:', fileName);
      const snapshot = await uploadBytes(storageRef, file);
      const downloadUrl = await getDownloadURL(snapshot.ref);
      console.log('[Storage] Logo upload successful:', downloadUrl);
      return downloadUrl;
    } catch (firebaseError) {
      console.error('[Storage] Logo upload failed:', firebaseError);
      // Fall back to data URL for logos
      return new Promise((resolve) => {
        const reader = new FileReader();
        reader.onloadend = () => resolve(reader.result as string);
        reader.readAsDataURL(file);
      });
    }
  },

  // Upload a File object
  uploadFile: async (file: File): Promise<string> => {
    // Try Firebase Storage first
    try {
      const storage = getStorage(app);
      const fileName = `uploads/${Date.now()}-${file.name.replace(/[^a-zA-Z0-9.-]/g, '')}`;
      const storageRef = ref(storage, fileName);

      console.log('[Storage] Uploading file to Firebase Storage:', fileName);
      const snapshot = await uploadBytes(storageRef, file);
      const downloadUrl = await getDownloadURL(snapshot.ref);
      console.log('[Storage] Upload successful:', downloadUrl);
      return downloadUrl;
    } catch (firebaseError) {
      console.warn('[Storage] Firebase Storage upload failed, trying GCS fallback:', firebaseError);
    }

    // Check for Google Cloud Storage settings
    const settings = getStorageSettings();
    if (settings && isValidBucketName(settings.bucketName)) {
      const fileName = `${Date.now()}-${file.name.replace(/[^a-zA-Z0-9.-]/g, '')}`;
      const uploadUrl = `https://storage.googleapis.com/upload/storage/v1/b/${settings.bucketName}/o?uploadType=media&name=${fileName}`;

      const headers: Record<string, string> = {
        'Content-Type': file.type,
      };

      if (settings.token) {
        headers['Authorization'] = `Bearer ${settings.token}`;
      }

      try {
        const response = await fetch(uploadUrl, {
          method: 'POST',
          headers: headers,
          body: file
        });

        if (response.ok) {
          return `https://storage.googleapis.com/${settings.bucketName}/${fileName}`;
        }
      } catch (gcsError) {
        console.warn('GCS upload failed:', gcsError);
      }
    }

    // Fallback to local data URL
    return new Promise((resolve) => {
      const reader = new FileReader();
      reader.onloadend = () => resolve(reader.result as string);
      reader.readAsDataURL(file);
    });
  },

  // Upload from URL (for migrations)
  uploadAssetFromUrl: async (sourceUrl: string): Promise<string> => {
    const settings = getStorageSettings();
    if (!settings || !isValidBucketName(settings.bucketName)) {
      return sourceUrl;
    }

    try {
      const sourceResponse = await fetch(sourceUrl);
      if (!sourceResponse.ok) throw new Error("Failed to fetch source image");
      const blob = await sourceResponse.blob();

      const fileName = `migrated-${Date.now()}-${Math.random().toString(36).substring(7)}.jpg`;
      const uploadUrl = `https://storage.googleapis.com/upload/storage/v1/b/${settings.bucketName}/o?uploadType=media&name=${fileName}`;

      const headers: Record<string, string> = {
        'Content-Type': blob.type,
      };

      if (settings.token) {
        headers['Authorization'] = `Bearer ${settings.token}`;
      }

      const uploadResponse = await fetch(uploadUrl, {
        method: 'POST',
        headers: headers,
        body: blob
      });

      if (!uploadResponse.ok) {
        console.warn("GCS Upload failed during migration, using original URL.");
        return sourceUrl;
      }

      return `https://storage.googleapis.com/${settings.bucketName}/${fileName}`;
    } catch (error) {
      console.error("Asset Migration Error", error);
      return sourceUrl;
    }
  }
};
