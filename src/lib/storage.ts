// Storage service for handling file uploads
// Supports local preview fallback and Firebase Storage when configured

import { ref, uploadBytes, getDownloadURL, deleteObject, uploadBytesResumable } from 'firebase/storage';
import { getStorageInstance } from './firebase';
import { MediaFolder, MediaFileType, getMediaTypeFromMime } from '@/types/media';

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
      const storage = getStorageInstance();
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
      const storage = getStorageInstance();
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
        const proxyResponse = await fetch('/api/proxy-image', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
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
        const storage = getStorageInstance();
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
  },

  // Upload from data URL (for Gemini base64 images)
  uploadAssetFromDataUrl: async (dataUrl: string): Promise<string> => {
    try {
      console.log('[Storage] Uploading from data URL...');

      // Parse data URL
      const matches = dataUrl.match(/^data:([^;]+);base64,(.+)$/);
      if (!matches) {
        throw new Error('Invalid data URL format');
      }

      const contentType = matches[1];
      const base64Data = matches[2];

      // Convert base64 to blob
      const binaryString = atob(base64Data);
      const bytes = new Uint8Array(binaryString.length);
      for (let i = 0; i < binaryString.length; i++) {
        bytes[i] = binaryString.charCodeAt(i);
      }
      const blob = new Blob([bytes], { type: contentType });

      // Determine file extension from content type
      const extension = contentType.split('/')[1] || 'png';
      const fileName = `articles/${Date.now()}-${Math.random().toString(36).substring(7)}.${extension}`;

      // Try Firebase Storage first
      try {
        const storage = getStorageInstance();
        const storageRef = ref(storage, fileName);

        console.log('[Storage] Uploading to Firebase Storage:', fileName);
        const snapshot = await uploadBytes(storageRef, blob);
        const downloadUrl = await getDownloadURL(snapshot.ref);
        console.log('[Storage] Data URL image persisted successfully');
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
          console.log('[Storage] Data URL image persisted to GCS:', permanentUrl);
          return permanentUrl;
        }
      }

      throw new Error('All upload methods failed');
    } catch (error) {
      console.error('[Storage] Data URL upload error:', error);
      throw error;
    }
  }
};

// ============================================================
// Media Manager Upload Functions
// ============================================================

export interface MediaUploadOptions {
  folder: MediaFolder;
  onProgress?: (progress: number) => void;
}

export interface MediaUploadResult {
  url: string;
  filename: string;
  originalFilename: string;
  mimeType: string;
  fileSize: number;
  fileType: MediaFileType;
  width?: number;
  height?: number;
  duration?: number;
}

/**
 * Sanitize filename for storage
 */
function sanitizeFilename(filename: string): string {
  return filename.replace(/[^a-zA-Z0-9.-]/g, '_');
}

/**
 * Get image dimensions from a File
 */
export async function getImageDimensions(file: File): Promise<{ width: number; height: number } | null> {
  return new Promise((resolve) => {
    if (!file.type.startsWith('image/')) {
      resolve(null);
      return;
    }

    const img = new Image();
    const objectUrl = URL.createObjectURL(file);

    img.onload = () => {
      URL.revokeObjectURL(objectUrl);
      resolve({ width: img.naturalWidth, height: img.naturalHeight });
    };

    img.onerror = () => {
      URL.revokeObjectURL(objectUrl);
      resolve(null);
    };

    img.src = objectUrl;
  });
}

/**
 * Get video dimensions and duration from a File
 */
export async function getVideoDimensions(file: File): Promise<{ width: number; height: number; duration: number } | null> {
  return new Promise((resolve) => {
    if (!file.type.startsWith('video/')) {
      resolve(null);
      return;
    }

    const video = document.createElement('video');
    const objectUrl = URL.createObjectURL(file);

    video.onloadedmetadata = () => {
      URL.revokeObjectURL(objectUrl);
      resolve({
        width: video.videoWidth,
        height: video.videoHeight,
        duration: video.duration,
      });
    };

    video.onerror = () => {
      URL.revokeObjectURL(objectUrl);
      resolve(null);
    };

    video.src = objectUrl;
  });
}

/**
 * Get audio duration from a File
 */
export async function getAudioDuration(file: File): Promise<number | null> {
  return new Promise((resolve) => {
    if (!file.type.startsWith('audio/')) {
      resolve(null);
      return;
    }

    const audio = document.createElement('audio');
    const objectUrl = URL.createObjectURL(file);

    audio.onloadedmetadata = () => {
      URL.revokeObjectURL(objectUrl);
      resolve(audio.duration);
    };

    audio.onerror = () => {
      URL.revokeObjectURL(objectUrl);
      resolve(null);
    };

    audio.src = objectUrl;
  });
}

/**
 * Upload a media file to a specific folder with progress tracking
 */
export async function uploadMediaFile(
  file: File,
  options: MediaUploadOptions
): Promise<MediaUploadResult> {
  const storage = getStorageInstance();
  const sanitizedName = sanitizeFilename(file.name);
  const fileName = `${options.folder}/${Date.now()}-${sanitizedName}`;
  const storageRef = ref(storage, fileName);

  // Get file type
  const fileType = getMediaTypeFromMime(file.type);
  if (!fileType) {
    throw new Error(`Unsupported file type: ${file.type}`);
  }

  // Get dimensions/duration based on file type
  let width: number | undefined;
  let height: number | undefined;
  let duration: number | undefined;

  if (fileType === 'image') {
    const dims = await getImageDimensions(file);
    if (dims) {
      width = dims.width;
      height = dims.height;
    }
  } else if (fileType === 'video') {
    const videoDims = await getVideoDimensions(file);
    if (videoDims) {
      width = videoDims.width;
      height = videoDims.height;
      duration = videoDims.duration;
    }
  } else if (fileType === 'audio') {
    duration = await getAudioDuration(file) || undefined;
  }

  // Upload with progress tracking
  // Explicitly set content type in metadata for Firebase Storage rules to work correctly
  const metadata = {
    contentType: file.type,
  };

  return new Promise((resolve, reject) => {
    const uploadTask = uploadBytesResumable(storageRef, file, metadata);

    uploadTask.on(
      'state_changed',
      (snapshot) => {
        const progress = (snapshot.bytesTransferred / snapshot.totalBytes) * 100;
        if (options.onProgress) {
          options.onProgress(progress);
        }
      },
      (error) => {
        console.error('[Storage] Media upload failed:', error);
        reject(error);
      },
      async () => {
        try {
          const downloadUrl = await getDownloadURL(uploadTask.snapshot.ref);
          resolve({
            url: downloadUrl,
            filename: sanitizedName,
            originalFilename: file.name,
            mimeType: file.type,
            fileSize: file.size,
            fileType,
            width,
            height,
            duration,
          });
        } catch (error) {
          reject(error);
        }
      }
    );
  });
}

/**
 * Upload multiple media files
 */
export async function uploadMultipleMediaFiles(
  files: File[],
  options: MediaUploadOptions,
  onFileProgress?: (fileIndex: number, progress: number) => void
): Promise<MediaUploadResult[]> {
  const results: MediaUploadResult[] = [];

  for (let i = 0; i < files.length; i++) {
    const file = files[i];
    const result = await uploadMediaFile(file, {
      ...options,
      onProgress: (progress) => {
        if (onFileProgress) {
          onFileProgress(i, progress);
        }
      },
    });
    results.push(result);
  }

  return results;
}

/**
 * Delete a file from Firebase Storage by URL
 */
export async function deleteStorageFile(url: string): Promise<void> {
  try {
    // Only handle Firebase Storage URLs
    if (!url.includes('firebasestorage.googleapis.com')) {
      console.warn('[Storage] Cannot delete non-Firebase URL:', url);
      return;
    }

    const storage = getStorageInstance();

    // Extract the path from the Firebase Storage URL
    // URLs look like: https://firebasestorage.googleapis.com/v0/b/bucket/o/path%2Fto%2Ffile?token=xxx
    const match = url.match(/\/o\/([^?]+)/);
    if (!match) {
      console.warn('[Storage] Could not extract path from URL:', url);
      return;
    }

    const filePath = decodeURIComponent(match[1]);
    const fileRef = ref(storage, filePath);

    await deleteObject(fileRef);
    console.log('[Storage] File deleted successfully:', filePath);
  } catch (error) {
    console.error('[Storage] Error deleting file:', error);
    throw error;
  }
}
