/**
 * Media Library Service
 * Firestore CRUD operations for media file metadata
 */

import { getDb } from './firebase';
import {
  collection,
  getDocs,
  doc,
  updateDoc,
  getDoc,
  deleteDoc,
  addDoc,
  query,
  where,
  orderBy,
  writeBatch,
  limit,
  Timestamp,
} from 'firebase/firestore';
import {
  MediaFile,
  MediaFileInput,
  MediaFileUpdate,
  MediaFilter,
  MediaFolder,
  MediaFileType,
  getMediaTypeFromMime,
} from '@/types/media';

const COLLECTION_NAME = 'media';

/**
 * Create a new media file record
 */
export async function createMediaFile(data: MediaFileInput): Promise<string> {
  try {
    const now = new Date().toISOString();

    // Filter out undefined values - Firestore doesn't accept undefined
    const cleanData: Record<string, unknown> = {};
    Object.entries(data).forEach(([key, value]) => {
      if (value !== undefined) {
        cleanData[key] = value;
      }
    });

    const docRef = await addDoc(collection(getDb(), COLLECTION_NAME), {
      ...cleanData,
      usedInCount: 0,
      uploadedAt: now,
    });
    return docRef.id;
  } catch (error) {
    console.error('Error creating media file:', error);
    throw error;
  }
}

/**
 * Get all media files with optional filters
 */
export async function getAllMedia(filters?: MediaFilter): Promise<MediaFile[]> {
  try {
    let q = query(collection(getDb(), COLLECTION_NAME), orderBy('uploadedAt', 'desc'));

    // Apply folder filter
    if (filters?.folder && filters.folder !== 'all') {
      q = query(collection(getDb(), COLLECTION_NAME), where('folder', '==', filters.folder), orderBy('uploadedAt', 'desc'));
    }

    // Apply file type filter
    if (filters?.fileType && filters.fileType !== 'all') {
      q = query(collection(getDb(), COLLECTION_NAME), where('fileType', '==', filters.fileType), orderBy('uploadedAt', 'desc'));
    }

    const querySnapshot = await getDocs(q);
    let media = querySnapshot.docs.map((docSnap) => {
      const data = docSnap.data();
      return {
        id: docSnap.id,
        filename: data.filename || '',
        originalFilename: data.originalFilename || data.filename || '',
        fileType: data.fileType || 'image',
        mimeType: data.mimeType || '',
        fileSize: data.fileSize || 0,
        width: data.width,
        height: data.height,
        duration: data.duration,
        url: data.url || '',
        thumbnailUrl: data.thumbnailUrl,
        folder: data.folder || 'uploads',
        altText: data.altText,
        caption: data.caption,
        tags: data.tags || [],
        uploadedAt: data.uploadedAt || new Date().toISOString(),
        uploadedBy: data.uploadedBy || '',
        uploadedByName: data.uploadedByName,
        usedInCount: data.usedInCount || 0,
      } as MediaFile;
    });

    // Apply search filter (client-side for flexibility)
    if (filters?.search) {
      const searchLower = filters.search.toLowerCase();
      media = media.filter(
        (m) =>
          m.filename.toLowerCase().includes(searchLower) ||
          m.originalFilename.toLowerCase().includes(searchLower) ||
          (m.altText && m.altText.toLowerCase().includes(searchLower)) ||
          (m.caption && m.caption.toLowerCase().includes(searchLower)) ||
          (m.tags && m.tags.some((tag) => tag.toLowerCase().includes(searchLower)))
      );
    }

    // Apply date filters
    if (filters?.dateFrom) {
      const fromDate = new Date(filters.dateFrom).getTime();
      media = media.filter((m) => new Date(m.uploadedAt).getTime() >= fromDate);
    }

    if (filters?.dateTo) {
      const toDate = new Date(filters.dateTo).getTime();
      media = media.filter((m) => new Date(m.uploadedAt).getTime() <= toDate);
    }

    // Apply uploader filter
    if (filters?.uploadedBy) {
      media = media.filter((m) => m.uploadedBy === filters.uploadedBy);
    }

    return media;
  } catch (error) {
    console.error('Error fetching media:', error);
    return [];
  }
}

/**
 * Get a single media file by ID
 */
export async function getMediaById(id: string): Promise<MediaFile | null> {
  try {
    const docRef = doc(getDb(), COLLECTION_NAME, id);
    const docSnap = await getDoc(docRef);
    if (!docSnap.exists()) return null;

    const data = docSnap.data();
    return {
      id: docSnap.id,
      filename: data.filename || '',
      originalFilename: data.originalFilename || data.filename || '',
      fileType: data.fileType || 'image',
      mimeType: data.mimeType || '',
      fileSize: data.fileSize || 0,
      width: data.width,
      height: data.height,
      duration: data.duration,
      url: data.url || '',
      thumbnailUrl: data.thumbnailUrl,
      folder: data.folder || 'uploads',
      altText: data.altText,
      caption: data.caption,
      tags: data.tags || [],
      uploadedAt: data.uploadedAt || new Date().toISOString(),
      uploadedBy: data.uploadedBy || '',
      uploadedByName: data.uploadedByName,
      usedInCount: data.usedInCount || 0,
    } as MediaFile;
  } catch (error) {
    console.error('Error fetching media by ID:', error);
    return null;
  }
}

/**
 * Get media files by folder
 */
export async function getMediaByFolder(folder: MediaFolder): Promise<MediaFile[]> {
  return getAllMedia({ folder });
}

/**
 * Get multiple media files by IDs
 */
export async function getMediaByIds(ids: string[]): Promise<MediaFile[]> {
  try {
    const mediaFiles: MediaFile[] = [];
    for (const id of ids) {
      const media = await getMediaById(id);
      if (media) {
        mediaFiles.push(media);
      }
    }
    return mediaFiles;
  } catch (error) {
    console.error('Error fetching media by IDs:', error);
    return [];
  }
}

/**
 * Update a media file's metadata
 */
export async function updateMediaFile(id: string, updates: MediaFileUpdate): Promise<void> {
  try {
    const docRef = doc(getDb(), COLLECTION_NAME, id);
    await updateDoc(docRef, {
      ...updates,
    });
  } catch (error) {
    console.error('Error updating media file:', error);
    throw error;
  }
}

/**
 * Move media files to a different folder
 */
export async function moveMediaToFolder(ids: string[], folder: MediaFolder): Promise<void> {
  try {
    const batch = writeBatch(getDb());
    ids.forEach((id) => {
      const docRef = doc(getDb(), COLLECTION_NAME, id);
      batch.update(docRef, { folder });
    });
    await batch.commit();
  } catch (error) {
    console.error('Error moving media to folder:', error);
    throw error;
  }
}

/**
 * Increment usage count for a media file
 */
export async function incrementUsageCount(id: string): Promise<void> {
  try {
    const media = await getMediaById(id);
    if (media) {
      const docRef = doc(getDb(), COLLECTION_NAME, id);
      await updateDoc(docRef, {
        usedInCount: (media.usedInCount || 0) + 1,
      });
    }
  } catch (error) {
    console.error('Error incrementing usage count:', error);
    throw error;
  }
}

/**
 * Decrement usage count for a media file
 */
export async function decrementUsageCount(id: string): Promise<void> {
  try {
    const media = await getMediaById(id);
    if (media) {
      const docRef = doc(getDb(), COLLECTION_NAME, id);
      await updateDoc(docRef, {
        usedInCount: Math.max(0, (media.usedInCount || 0) - 1),
      });
    }
  } catch (error) {
    console.error('Error decrementing usage count:', error);
    throw error;
  }
}

/**
 * Delete a media file record (doesn't delete from storage)
 */
export async function deleteMediaFile(id: string): Promise<void> {
  try {
    const docRef = doc(getDb(), COLLECTION_NAME, id);
    await deleteDoc(docRef);
  } catch (error) {
    console.error('Error deleting media file:', error);
    throw error;
  }
}

/**
 * Bulk delete media files
 */
export async function bulkDeleteMedia(ids: string[]): Promise<void> {
  try {
    const batch = writeBatch(getDb());
    ids.forEach((id) => {
      const docRef = doc(getDb(), COLLECTION_NAME, id);
      batch.delete(docRef);
    });
    await batch.commit();
  } catch (error) {
    console.error('Error bulk deleting media:', error);
    throw error;
  }
}

/**
 * Search media files by query string
 */
export async function searchMedia(searchQuery: string, filters?: MediaFilter): Promise<MediaFile[]> {
  return getAllMedia({ ...filters, search: searchQuery });
}

/**
 * Get folder statistics (count of files per folder)
 */
export async function getFolderStats(): Promise<Record<MediaFolder, number>> {
  try {
    const allMedia = await getAllMedia();
    const stats: Record<string, number> = {
      system: 0,
      directory: 0,
      advertising: 0,
      blog: 0,
      events: 0,
      articles: 0,
      uploads: 0,
    };

    allMedia.forEach((media) => {
      if (stats[media.folder] !== undefined) {
        stats[media.folder]++;
      } else {
        stats['uploads']++;
      }
    });

    return stats as Record<MediaFolder, number>;
  } catch (error) {
    console.error('Error getting folder stats:', error);
    return {
      system: 0,
      directory: 0,
      advertising: 0,
      blog: 0,
      events: 0,
      articles: 0,
      uploads: 0,
    };
  }
}

/**
 * Get recent media uploads
 */
export async function getRecentMedia(count: number = 10): Promise<MediaFile[]> {
  try {
    const q = query(
      collection(getDb(), COLLECTION_NAME),
      orderBy('uploadedAt', 'desc'),
      limit(count)
    );
    const querySnapshot = await getDocs(q);

    return querySnapshot.docs.map((docSnap) => {
      const data = docSnap.data();
      return {
        id: docSnap.id,
        filename: data.filename || '',
        originalFilename: data.originalFilename || data.filename || '',
        fileType: data.fileType || 'image',
        mimeType: data.mimeType || '',
        fileSize: data.fileSize || 0,
        width: data.width,
        height: data.height,
        duration: data.duration,
        url: data.url || '',
        thumbnailUrl: data.thumbnailUrl,
        folder: data.folder || 'uploads',
        altText: data.altText,
        caption: data.caption,
        tags: data.tags || [],
        uploadedAt: data.uploadedAt || new Date().toISOString(),
        uploadedBy: data.uploadedBy || '',
        uploadedByName: data.uploadedByName,
        usedInCount: data.usedInCount || 0,
      } as MediaFile;
    });
  } catch (error) {
    console.error('Error fetching recent media:', error);
    return [];
  }
}
