// Storage service for handling file uploads
// Supports local preview fallback and Firebase Storage when configured

import { getStorage, ref, uploadBytes, getDownloadURL } from 'firebase/storage';
import { getAuth } from 'firebase/auth';
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

  // Upload from URL (for DALL-E images and migrations)
  uploadAssetFromUrl: async (sourceUrl: string): Promise<string> => {
    // Skip if already a Firebase Storage or GCS URL
    if (sourceUrl.includes('firebasestorage.googleapis.com') ||
        sourceUrl.includes('storage.googleapis.com')) {
      return sourceUrl;
    }

    try {
      console.log('[Storage] Fetching image from URL to persist...');

      let blob: Blob;
      let contentType = 'image/png';

      // Use server-side proxy to bypass CORS for external URLs
      try {
        console.log('[Storage] Using proxy API to fetch external image...');

        const auth = getAuth(app);
        const currentUser = auth.currentUser;
        if (!currentUser) {
          throw new Error('Authentication required for proxy');
        }
        const token = await currentUser.getIdToken();

        const proxyResponse = await fetch('/api/proxy-image', {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
            'Authorization': `Bearer ${token}`
          },
          body: JSON.stringify({ url: sourceUrl })
        });

        if (proxyResponse.ok) {
          const proxyData = await proxyResponse.json();
          if (proxyData.success && proxyData.dataUrl) {
            // Convert data URL back to blob
            const base64Data = proxyData.dataUrl.split(',')[1];
            const binaryString = atob(base64Data);
            const bytes = new Uint8Array(binaryString.length);
            for (let i = 0; i < binaryString.length; i++) {
              bytes[i] = binaryString.charCodeAt(i);
            }
            blob = new Blob([bytes], { type: proxyData.contentType });
            contentType = proxyData.contentType;
            console.log('[Storage] Proxy fetch successful, size:', proxyData.size);
          } else {
            throw new Error(proxyData.error || 'Proxy returned invalid data');
          }
        } else {
          throw new Error(`Proxy request failed: ${proxyResponse.status}`);
        }
      } catch (proxyError) {
        console.warn('[Storage] Proxy fetch failed, trying direct fetch:', proxyError);
        // Fallback to direct fetch (may fail due to CORS)
        const sourceResponse = await fetch(sourceUrl);
        if (!sourceResponse.ok) throw new Error("Failed to fetch source image");
        blob = await sourceResponse.blob();
        contentType = blob.type || 'image/png';
      }

      // Determine file extension from content type
      const extension = contentType.split('/')[1] || 'png';
      const fileName = `articles/${Date.now()}-${Math.random().toString(36).substring(7)}.${extension}`;

      // Try Firebase Storage first
      try {
        const storage = getStorage(app);
        const storageRef = ref(storage, fileName);

        console.log('[Storage] Uploading to Firebase Storage:', fileName);
        const snapshot = await uploadBytes(storageRef, blob);
        const downloadUrl = await getDownloadURL(snapshot.ref);
        console.log('[Storage] Image persisted successfully:', downloadUrl);
        return downloadUrl;
      } catch (firebaseError) {
        console.warn('[Storage] Firebase Storage upload failed, trying GCS fallback:', firebaseError);
      }

      // Fallback to Google Cloud Storage if configured
      const settings = getStorageSettings();
      if (settings && isValidBucketName(settings.bucketName)) {
        const gcsFileName = `articles/${Date.now()}-${Math.random().toString(36).substring(7)}.${extension}`;
        const uploadUrl = `https://storage.googleapis.com/upload/storage/v1/b/${settings.bucketName}/o?uploadType=media&name=${gcsFileName}`;

        const headers: Record<string, string> = {
          'Content-Type': contentType,
        };

        if (settings.token) {
          headers['Authorization'] = `Bearer ${settings.token}`;
        }

        const uploadResponse = await fetch(uploadUrl, {
          method: 'POST',
          headers: headers,
          body: blob
        });

        if (uploadResponse.ok) {
          const permanentUrl = `https://storage.googleapis.com/${settings.bucketName}/${gcsFileName}`;
          console.log('[Storage] Image persisted to GCS:', permanentUrl);
          return permanentUrl;
        }
      }

      console.warn('[Storage] All upload methods failed, returning original URL');
      return sourceUrl;
    } catch (error) {
      console.error('[Storage] Asset upload error:', error);
      return sourceUrl;
    }
  }
};
