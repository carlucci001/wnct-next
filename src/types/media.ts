/**
 * Media Manager Type Definitions
 * Types for the media library, upload system, and file management
 */

// Supported file types
export type MediaFileType = 'image' | 'video' | 'audio' | 'document';

// Predefined folder structure
export type MediaFolder =
  | 'system'      // Internal site images
  | 'directory'   // Business directory images
  | 'advertising' // Ad banners and creatives
  | 'blog'        // Blog post images
  | 'events'      // Event images
  | 'articles'    // News article images
  | 'uploads';    // General uploads (legacy)

// Main media file interface
export interface MediaFile {
  id: string;
  filename: string;
  originalFilename: string;    // Original name before sanitization
  fileType: MediaFileType;
  mimeType: string;            // e.g., 'image/jpeg', 'video/mp4', 'audio/mpeg'
  fileSize: number;            // Bytes
  width?: number;              // For images/videos
  height?: number;             // For images/videos
  duration?: number;           // For video/audio (seconds)
  url: string;                 // Full download URL from Firebase Storage
  thumbnailUrl?: string;       // Generated thumbnail for videos/PDFs
  folder: MediaFolder;
  altText?: string;
  caption?: string;
  tags?: string[];
  uploadedAt: string;          // ISO timestamp
  uploadedBy: string;          // User ID
  uploadedByName?: string;     // Cached display name
  usedInCount?: number;        // Count of articles/content using this
}

// Upload progress tracking
export interface MediaUploadProgress {
  file: File;
  filename: string;
  progress: number;            // 0-100
  status: 'pending' | 'uploading' | 'processing' | 'complete' | 'error';
  error?: string;
  mediaFile?: MediaFile;       // Populated on success
}

// Query filter options
export interface MediaFilter {
  folder?: MediaFolder | 'all';
  fileType?: MediaFileType | 'all';
  search?: string;
  uploadedBy?: string;
  dateFrom?: string;
  dateTo?: string;
}

// Media picker configuration
export interface MediaPickerConfig {
  allowMultiple?: boolean;
  allowedTypes?: MediaFileType[];
  maxFiles?: number;
  folder?: MediaFolder;        // Default folder for new uploads
}

// Input for creating new media file
export interface MediaFileInput {
  filename: string;
  originalFilename: string;
  fileType: MediaFileType;
  mimeType: string;
  fileSize: number;
  width?: number;
  height?: number;
  duration?: number;
  url: string;
  thumbnailUrl?: string;
  folder: MediaFolder;
  altText?: string;
  caption?: string;
  tags?: string[];
  uploadedBy: string;
  uploadedByName?: string;
}

// Update partial for editing media
export interface MediaFileUpdate {
  altText?: string;
  caption?: string;
  tags?: string[];
  folder?: MediaFolder;
}

// Folder metadata for display
export interface MediaFolderInfo {
  value: MediaFolder;
  label: string;
  icon: string;
  color: string;
  description: string;
}

export const MEDIA_FOLDERS: MediaFolderInfo[] = [
  { value: 'system', label: 'System', icon: 'Settings', color: '#64748b', description: 'Internal site assets and icons' },
  { value: 'articles', label: 'Articles', icon: 'FileText', color: '#3b82f6', description: 'News article images' },
  { value: 'directory', label: 'Directory', icon: 'Building2', color: '#8b5cf6', description: 'Business directory images' },
  { value: 'advertising', label: 'Advertising', icon: 'Megaphone', color: '#22c55e', description: 'Ad banners and creatives' },
  { value: 'blog', label: 'Blog', icon: 'BookOpen', color: '#f59e0b', description: 'Blog post images' },
  { value: 'events', label: 'Events', icon: 'Calendar', color: '#ec4899', description: 'Event posters and images' },
  { value: 'uploads', label: 'Uploads', icon: 'Upload', color: '#6b7280', description: 'General uploads' },
];

// File type configuration with extensions and limits
export interface MediaTypeConfig {
  extensions: string[];
  mimeTypes: string[];
  maxSize: number;  // MB
  icon: string;
}

export const MEDIA_TYPE_CONFIG: Record<MediaFileType, MediaTypeConfig> = {
  image: {
    extensions: ['.jpg', '.jpeg', '.png', '.gif', '.webp', '.svg'],
    mimeTypes: ['image/jpeg', 'image/png', 'image/gif', 'image/webp', 'image/svg+xml'],
    maxSize: 10,
    icon: 'Image',
  },
  video: {
    extensions: ['.mp4', '.webm', '.mov'],
    mimeTypes: ['video/mp4', 'video/webm', 'video/quicktime'],
    maxSize: 100,
    icon: 'Video',
  },
  audio: {
    extensions: ['.mp3', '.wav', '.ogg', '.m4a'],
    mimeTypes: ['audio/mpeg', 'audio/wav', 'audio/ogg', 'audio/mp4'],
    maxSize: 50,
    icon: 'Music',
  },
  document: {
    extensions: ['.pdf'],
    mimeTypes: ['application/pdf'],
    maxSize: 20,
    icon: 'FileText',
  },
};

// Helper to get all allowed MIME types
export function getAllAllowedMimeTypes(): string[] {
  return Object.values(MEDIA_TYPE_CONFIG).flatMap(config => config.mimeTypes);
}

// Helper to get file type from MIME type
export function getMediaTypeFromMime(mimeType: string): MediaFileType | null {
  for (const [type, config] of Object.entries(MEDIA_TYPE_CONFIG)) {
    if (config.mimeTypes.includes(mimeType)) {
      return type as MediaFileType;
    }
  }
  return null;
}

// Helper to format file size for display
export function formatFileSize(bytes: number): string {
  if (bytes === 0) return '0 B';
  const k = 1024;
  const sizes = ['B', 'KB', 'MB', 'GB'];
  const i = Math.floor(Math.log(bytes) / Math.log(k));
  return `${parseFloat((bytes / Math.pow(k, i)).toFixed(1))} ${sizes[i]}`;
}

// Helper to get max size for a file type in bytes
export function getMaxSizeBytes(fileType: MediaFileType): number {
  return MEDIA_TYPE_CONFIG[fileType].maxSize * 1024 * 1024;
}

// Helper to validate file against type config
export function validateFile(file: File): { valid: boolean; error?: string; fileType?: MediaFileType } {
  const fileType = getMediaTypeFromMime(file.type);

  if (!fileType) {
    return { valid: false, error: `File type "${file.type}" is not supported` };
  }

  const config = MEDIA_TYPE_CONFIG[fileType];
  const maxBytes = config.maxSize * 1024 * 1024;

  if (file.size > maxBytes) {
    return { valid: false, error: `File exceeds maximum size of ${config.maxSize}MB` };
  }

  return { valid: true, fileType };
}
