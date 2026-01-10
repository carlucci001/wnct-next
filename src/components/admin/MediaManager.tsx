'use client';

import { useState, useEffect, useCallback, useRef } from 'react';
import {
  Image as ImageIcon, Video, Music, FileText, Upload, Trash2, Edit, Search,
  LayoutGrid, List, FolderOpen, Settings, Building2, Megaphone, BookOpen,
  Calendar, Check, X, ChevronLeft, ChevronRight, MoreHorizontal, Download,
  Copy, Eye, Filter, SortAsc, SortDesc
} from 'lucide-react';
import { Card, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Badge } from '@/components/ui/badge';
import {
  Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle,
} from '@/components/ui/dialog';
import {
  DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuSeparator, DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';
import {
  Select, SelectContent, SelectItem, SelectTrigger, SelectValue,
} from '@/components/ui/select';
import { Textarea } from '@/components/ui/textarea';
import { toast } from 'sonner';
import {
  MediaFile, MediaFolder, MediaFileType, MediaFilter, MediaUploadProgress,
  MEDIA_FOLDERS, MEDIA_TYPE_CONFIG, formatFileSize, validateFile, getAllAllowedMimeTypes
} from '@/types/media';
import {
  getAllMedia, createMediaFile, updateMediaFile, deleteMediaFile, bulkDeleteMedia, getFolderStats
} from '@/lib/media';
import { uploadMediaFile, deleteStorageFile } from '@/lib/storage';
import { useAuth } from '@/contexts/AuthContext';

interface MediaManagerProps {
  pickerMode?: boolean;
  allowedTypes?: MediaFileType[];
  maxSelection?: number;
  defaultFolder?: MediaFolder;
  onSelect?: (media: MediaFile[]) => void;
}

// Icon mapping for folders
const folderIcons: Record<string, React.ReactNode> = {
  system: <Settings size={18} />,
  directory: <Building2 size={18} />,
  advertising: <Megaphone size={18} />,
  blog: <BookOpen size={18} />,
  events: <Calendar size={18} />,
  articles: <FileText size={18} />,
  uploads: <Upload size={18} />,
};

// Icon mapping for file types
const fileTypeIcons: Record<MediaFileType, React.ReactNode> = {
  image: <ImageIcon size={18} />,
  video: <Video size={18} />,
  audio: <Music size={18} />,
  document: <FileText size={18} />,
};

export default function MediaManager({
  pickerMode = false,
  allowedTypes,
  maxSelection = 1,
  defaultFolder = 'articles',
  onSelect,
}: MediaManagerProps) {
  const { currentUser } = useAuth();

  // Media state
  const [media, setMedia] = useState<MediaFile[]>([]);
  const [loading, setLoading] = useState(true);
  const [folderStats, setFolderStats] = useState<Record<MediaFolder, number>>({
    system: 0, directory: 0, advertising: 0, blog: 0, events: 0, articles: 0, uploads: 0
  });

  // View state
  const [viewMode, setViewMode] = useState<'grid' | 'list'>('grid');
  const [currentFolder, setCurrentFolder] = useState<MediaFolder | 'all'>(defaultFolder);
  const [fileTypeFilter, setFileTypeFilter] = useState<MediaFileType | 'all'>('all');
  const [categoryFilter, setCategoryFilter] = useState<string>('all');
  const [searchTerm, setSearchTerm] = useState('');
  const [sortBy, setSortBy] = useState<'date' | 'name' | 'size'>('date');
  const [sortOrder, setSortOrder] = useState<'asc' | 'desc'>('desc');

  // Selection state
  const [selectedIds, setSelectedIds] = useState<Set<string>>(new Set());

  // Pagination
  const [currentPage, setCurrentPage] = useState(1);
  const pageSize = viewMode === 'grid' ? 24 : 12;

  // Upload state
  const [showUploadModal, setShowUploadModal] = useState(false);
  const [uploadFolder, setUploadFolder] = useState<MediaFolder>(defaultFolder);
  const [uploadProgress, setUploadProgress] = useState<MediaUploadProgress[]>([]);
  const [isDragging, setIsDragging] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);

  // Edit state
  const [showEditModal, setShowEditModal] = useState(false);
  const [editingMedia, setEditingMedia] = useState<MediaFile | null>(null);
  const [editForm, setEditForm] = useState({ altText: '', caption: '', folder: '' as MediaFolder });

  // Delete state
  const [showDeleteModal, setShowDeleteModal] = useState(false);
  const [deletingIds, setDeletingIds] = useState<string[]>([]);

  // Preview state
  const [showPreviewModal, setShowPreviewModal] = useState(false);
  const [previewMedia, setPreviewMedia] = useState<MediaFile | null>(null);

  // Migration state
  const [isMigrating, setIsMigrating] = useState(false);
  const [migrationStatus, setMigrationStatus] = useState<string>('');
  const [showMigrationModal, setShowMigrationModal] = useState(false);
  const [migrationPreview, setMigrationPreview] = useState<{
    summary?: { totalFound: number; toImport: number; alreadyInMedia: number };
    byCollection?: Record<string, { found: number; unique: number }>;
  } | null>(null);

  // Load media
  useEffect(() => {
    loadMedia();
    loadFolderStats();
  }, []);

  async function loadMedia() {
    setLoading(true);
    try {
      const data = await getAllMedia();
      setMedia(data);
    } catch (error) {
      console.error('Error loading media:', error);
      toast.error('Failed to load media library');
    } finally {
      setLoading(false);
    }
  }

  async function loadFolderStats() {
    try {
      const stats = await getFolderStats();
      setFolderStats(stats);
    } catch (error) {
      console.error('Error loading folder stats:', error);
    }
  }

  // Migration functions
  async function previewMigration() {
    // Show modal immediately with loading state
    setMigrationPreview(null);
    setShowMigrationModal(true);
    setIsMigrating(true);
    setMigrationStatus('Scanning collections...');

    try {
      const response = await fetch('/api/admin/migrate-media');
      const data = await response.json();
      if (data.success) {
        setMigrationPreview({
          summary: data.summary,
          byCollection: data.byCollection,
        });
      } else {
        toast.error(data.error || 'Failed to preview migration');
        setShowMigrationModal(false);
      }
    } catch (error) {
      console.error('Error previewing migration:', error);
      toast.error('Failed to preview migration');
      setShowMigrationModal(false);
    } finally {
      setIsMigrating(false);
      setMigrationStatus('');
    }
  }

  async function runMigration() {
    setIsMigrating(true);
    setMigrationStatus('Importing images...');
    try {
      const response = await fetch('/api/admin/migrate-media', { method: 'POST' });
      const data = await response.json();
      if (data.success) {
        setMigrationStatus('Complete!');
        toast.success(`Imported ${data.totals.imported} media files`);
        setShowMigrationModal(false);
        setMigrationPreview(null);
        // Reload media library
        await loadMedia();
        await loadFolderStats();
      } else {
        toast.error(data.error || 'Failed to run migration');
      }
    } catch (error) {
      console.error('Error running migration:', error);
      toast.error('Failed to run migration');
    } finally {
      setIsMigrating(false);
      setMigrationStatus('');
    }
  }

  async function clearAndReimport() {
    setIsMigrating(true);
    try {
      // Step 1: Clear existing migration records
      setMigrationStatus('Step 1/2: Clearing existing records...');
      const clearResponse = await fetch('/api/admin/migrate-media', { method: 'DELETE' });
      const clearData = await clearResponse.json();
      if (!clearData.success) {
        toast.error(clearData.error || 'Failed to clear existing records');
        return;
      }
      toast.success(`Cleared ${clearData.deleted} existing records`);

      // Step 2: Import with category tags
      setMigrationStatus('Step 2/2: Importing with category tags...');
      const importResponse = await fetch('/api/admin/migrate-media', { method: 'POST' });
      const importData = await importResponse.json();
      if (importData.success) {
        setMigrationStatus('Complete!');
        toast.success(`Imported ${importData.totals.imported} media files with category tags`);
        setShowMigrationModal(false);
        setMigrationPreview(null);
        // Reload media library
        await loadMedia();
        await loadFolderStats();
      } else {
        toast.error(importData.error || 'Failed to run migration');
      }
    } catch (error) {
      console.error('Error in clear and reimport:', error);
      toast.error('Failed to clear and reimport');
    } finally {
      setIsMigrating(false);
      setMigrationStatus('');
    }
  }

  // Extract unique categories from tags (excluding source collection names)
  const availableCategories = Array.from(
    new Set(
      media
        .flatMap((m) => m.tags || [])
        .filter((tag) => !['articles', 'businesses', 'advertisements', 'blogPosts', 'events', 'directory', 'advertising', 'blog'].includes(tag))
    )
  ).sort();

  // Filtering and sorting
  const filteredMedia = media
    .filter((m) => {
      // Folder filter
      if (currentFolder !== 'all' && m.folder !== currentFolder) return false;

      // File type filter
      if (fileTypeFilter !== 'all' && m.fileType !== fileTypeFilter) return false;

      // Category filter (check if tag includes the category)
      if (categoryFilter !== 'all' && (!m.tags || !m.tags.includes(categoryFilter))) return false;

      // Allowed types (picker mode)
      if (allowedTypes && !allowedTypes.includes(m.fileType)) return false;

      // Search
      if (searchTerm) {
        const search = searchTerm.toLowerCase();
        return (
          m.filename.toLowerCase().includes(search) ||
          m.originalFilename.toLowerCase().includes(search) ||
          (m.altText && m.altText.toLowerCase().includes(search)) ||
          (m.caption && m.caption.toLowerCase().includes(search))
        );
      }

      return true;
    })
    .sort((a, b) => {
      let comparison = 0;
      if (sortBy === 'date') {
        comparison = new Date(a.uploadedAt).getTime() - new Date(b.uploadedAt).getTime();
      } else if (sortBy === 'name') {
        comparison = a.filename.localeCompare(b.filename);
      } else if (sortBy === 'size') {
        comparison = a.fileSize - b.fileSize;
      }
      return sortOrder === 'asc' ? comparison : -comparison;
    });

  // Pagination
  const totalPages = Math.ceil(filteredMedia.length / pageSize);
  const paginatedMedia = filteredMedia.slice(
    (currentPage - 1) * pageSize,
    currentPage * pageSize
  );

  // Selection handlers
  function toggleSelect(id: string) {
    const newSelected = new Set(selectedIds);
    if (newSelected.has(id)) {
      newSelected.delete(id);
    } else {
      if (pickerMode && maxSelection === 1) {
        newSelected.clear();
      } else if (pickerMode && newSelected.size >= maxSelection) {
        toast.error(`Maximum ${maxSelection} files can be selected`);
        return;
      }
      newSelected.add(id);
    }
    setSelectedIds(newSelected);

    // In picker mode, immediately notify parent of selection changes
    if (pickerMode && onSelect) {
      const selectedMedia = media.filter((m) => newSelected.has(m.id));
      onSelect(selectedMedia);
    }
  }

  function toggleSelectAll() {
    if (selectedIds.size === paginatedMedia.length) {
      setSelectedIds(new Set());
    } else {
      const idsToSelect = paginatedMedia.map((m) => m.id);
      if (pickerMode) {
        setSelectedIds(new Set(idsToSelect.slice(0, maxSelection)));
      } else {
        setSelectedIds(new Set(idsToSelect));
      }
    }
  }

  // Drag and drop handlers
  const handleDragOver = useCallback((e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
    setIsDragging(true);
  }, []);

  const handleDragLeave = useCallback((e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
    setIsDragging(false);
  }, []);

  const handleDrop = useCallback((e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
    setIsDragging(false);

    const files = Array.from(e.dataTransfer.files);
    if (files.length > 0) {
      handleFilesSelected(files);
    }
  }, []);

  // File selection handler
  function handleFilesSelected(files: File[]) {
    const validFiles: File[] = [];
    const errors: string[] = [];

    files.forEach((file) => {
      const validation = validateFile(file);
      if (validation.valid) {
        validFiles.push(file);
      } else {
        errors.push(`${file.name}: ${validation.error}`);
      }
    });

    if (errors.length > 0) {
      toast.error(errors.join('\n'));
    }

    if (validFiles.length > 0) {
      setUploadProgress(validFiles.map((file) => ({
        file,
        filename: file.name,
        progress: 0,
        status: 'pending',
      })));
      setShowUploadModal(true);
    }
  }

  // Upload handler
  async function handleUpload() {
    if (uploadProgress.length === 0) return;

    for (let i = 0; i < uploadProgress.length; i++) {
      const upload = uploadProgress[i];
      if (upload.status !== 'pending') continue;

      // Update status to uploading
      setUploadProgress((prev) =>
        prev.map((u, idx) => idx === i ? { ...u, status: 'uploading' } : u)
      );

      try {
        const result = await uploadMediaFile(upload.file, {
          folder: uploadFolder,
          onProgress: (progress) => {
            setUploadProgress((prev) =>
              prev.map((u, idx) => idx === i ? { ...u, progress } : u)
            );
          },
        });

        // Create media record in Firestore
        const mediaId = await createMediaFile({
          filename: result.filename,
          originalFilename: result.originalFilename,
          fileType: result.fileType,
          mimeType: result.mimeType,
          fileSize: result.fileSize,
          width: result.width,
          height: result.height,
          duration: result.duration,
          url: result.url,
          folder: uploadFolder,
          uploadedBy: currentUser?.uid || 'unknown',
          uploadedByName: currentUser?.displayName || currentUser?.email || 'Unknown',
        });

        // Update status to complete
        setUploadProgress((prev) =>
          prev.map((u, idx) => idx === i ? {
            ...u,
            status: 'complete',
            progress: 100,
            mediaFile: { id: mediaId, ...result, folder: uploadFolder, uploadedAt: new Date().toISOString(), uploadedBy: currentUser?.uid || '' } as MediaFile
          } : u)
        );

        toast.success(`Uploaded ${upload.filename}`);
      } catch (error) {
        console.error('Upload error:', error);
        setUploadProgress((prev) =>
          prev.map((u, idx) => idx === i ? {
            ...u,
            status: 'error',
            error: error instanceof Error ? error.message : 'Upload failed'
          } : u)
        );
        toast.error(`Failed to upload ${upload.filename}`);
      }
    }

    // Reload media list
    await loadMedia();
    await loadFolderStats();
  }

  // Edit handler
  function openEditModal(mediaItem: MediaFile) {
    setEditingMedia(mediaItem);
    setEditForm({
      altText: mediaItem.altText || '',
      caption: mediaItem.caption || '',
      folder: mediaItem.folder,
    });
    setShowEditModal(true);
  }

  async function handleSaveEdit() {
    if (!editingMedia) return;

    try {
      await updateMediaFile(editingMedia.id, editForm);
      toast.success('Media updated successfully');
      setShowEditModal(false);
      await loadMedia();
      await loadFolderStats();
    } catch (error) {
      console.error('Error updating media:', error);
      toast.error('Failed to update media');
    }
  }

  // Delete handlers
  function openDeleteModal(ids: string[]) {
    setDeletingIds(ids);
    setShowDeleteModal(true);
  }

  async function handleDelete() {
    if (deletingIds.length === 0) return;

    try {
      // Delete from storage
      for (const id of deletingIds) {
        const mediaItem = media.find((m) => m.id === id);
        if (mediaItem) {
          try {
            await deleteStorageFile(mediaItem.url);
          } catch (e) {
            console.warn('Could not delete from storage:', e);
          }
        }
      }

      // Delete from Firestore
      await bulkDeleteMedia(deletingIds);

      toast.success(`Deleted ${deletingIds.length} file(s)`);
      setShowDeleteModal(false);
      setSelectedIds(new Set());
      await loadMedia();
      await loadFolderStats();
    } catch (error) {
      console.error('Error deleting media:', error);
      toast.error('Failed to delete media');
    }
  }

  // Preview handler
  function openPreview(mediaItem: MediaFile) {
    setPreviewMedia(mediaItem);
    setShowPreviewModal(true);
  }

  // Copy URL handler
  function copyUrl(url: string) {
    navigator.clipboard.writeText(url);
    toast.success('URL copied to clipboard');
  }

  // Confirm selection (picker mode)
  function confirmSelection() {
    const selected = media.filter((m) => selectedIds.has(m.id));
    if (onSelect) {
      onSelect(selected);
    }
  }

  // Get selected media for picker mode
  const selectedMedia = media.filter((m) => selectedIds.has(m.id));

  // Render file thumbnail
  function renderThumbnail(mediaItem: MediaFile, size: 'small' | 'medium' | 'large' = 'medium') {
    const sizeClasses = {
      small: 'w-12 h-12',
      medium: 'w-full h-32',
      large: 'w-full h-48',
    };

    if (mediaItem.fileType === 'image') {
      return (
        <img
          src={mediaItem.url}
          alt={mediaItem.altText || mediaItem.filename}
          className={`${sizeClasses[size]} object-cover rounded`}
        />
      );
    }

    // Placeholder for other types
    const Icon = fileTypeIcons[mediaItem.fileType];
    return (
      <div className={`${sizeClasses[size]} bg-gray-100 dark:bg-slate-800 rounded flex items-center justify-center`}>
        <div className="text-gray-400 dark:text-slate-500">
          {Icon}
        </div>
      </div>
    );
  }

  return (
    <div className={`${pickerMode ? 'h-full flex flex-col' : 'space-y-6'}`}>
      {/* Header */}
      {!pickerMode && (
        <div className="flex justify-between items-center">
          <div>
            <h1 className="text-3xl font-bold text-gray-900 dark:text-white">Media Library</h1>
            <p className="text-gray-500 dark:text-gray-400 mt-1">
              {filteredMedia.length} files {currentFolder !== 'all' && `in ${currentFolder}`}
            </p>
          </div>
          <div className="flex gap-2">
            <Button variant="outline" onClick={previewMigration}>
              <Download size={16} className="mr-2" /> Import Existing
            </Button>
            <Button onClick={() => { setUploadFolder(currentFolder === 'all' ? 'uploads' : currentFolder); setShowUploadModal(true); }}>
              <Upload size={16} className="mr-2" /> Upload Files
            </Button>
          </div>
        </div>
      )}

      <div className={`flex flex-col lg:flex-row gap-4 ${pickerMode ? 'flex-1 min-h-0' : 'gap-6'}`}>
        {/* Folder Sidebar */}
        <div className={`${pickerMode ? 'lg:w-44 shrink-0' : 'lg:w-56 shrink-0'}`}>
          <div className="bg-white dark:bg-slate-900 rounded-lg border border-gray-200 dark:border-slate-700 overflow-hidden">
            <div className="p-3 border-b border-gray-200 dark:border-slate-700">
              <h3 className="font-semibold text-gray-900 dark:text-white text-sm">Folders</h3>
            </div>
            <div className="p-2">
              {/* All Files */}
              <button
                onClick={() => { setCurrentFolder('all'); setCurrentPage(1); }}
                className={`w-full flex items-center gap-2 px-3 py-2 rounded-lg text-sm transition ${
                  currentFolder === 'all'
                    ? 'bg-blue-50 dark:bg-blue-900/30 text-blue-600 dark:text-blue-400'
                    : 'text-gray-700 dark:text-gray-300 hover:bg-gray-50 dark:hover:bg-slate-800'
                }`}
              >
                <FolderOpen size={18} />
                <span className="flex-1 text-left">All Files</span>
                <span className="text-xs text-gray-500 dark:text-gray-400">{media.length}</span>
              </button>

              {/* Folder list */}
              {MEDIA_FOLDERS.map((folder) => (
                <button
                  key={folder.value}
                  onClick={() => { setCurrentFolder(folder.value); setCurrentPage(1); }}
                  className={`w-full flex items-center gap-2 px-3 py-2 rounded-lg text-sm transition ${
                    currentFolder === folder.value
                      ? 'bg-blue-50 dark:bg-blue-900/30 text-blue-600 dark:text-blue-400'
                      : 'text-gray-700 dark:text-gray-300 hover:bg-gray-50 dark:hover:bg-slate-800'
                  }`}
                >
                  <span style={{ color: folder.color }}>{folderIcons[folder.value]}</span>
                  <span className="flex-1 text-left">{folder.label}</span>
                  <span className="text-xs text-gray-500 dark:text-gray-400">{folderStats[folder.value] || 0}</span>
                </button>
              ))}
            </div>
          </div>

          {/* Category Filter */}
          {availableCategories.length > 0 && (
            <div className="bg-white dark:bg-slate-900 rounded-lg border border-gray-200 dark:border-slate-700 overflow-hidden mt-3">
              <div className="p-2 border-b border-gray-200 dark:border-slate-700">
                <h3 className="font-semibold text-gray-900 dark:text-white text-sm">Categories</h3>
              </div>
              <div className="p-1 max-h-[200px] overflow-auto">
                <button
                  onClick={() => { setCategoryFilter('all'); setCurrentPage(1); }}
                  className={`w-full flex items-center gap-2 px-2 py-1.5 rounded text-sm transition ${
                    categoryFilter === 'all'
                      ? 'bg-blue-50 dark:bg-blue-900/30 text-blue-600 dark:text-blue-400'
                      : 'text-gray-700 dark:text-gray-300 hover:bg-gray-50 dark:hover:bg-slate-800'
                  }`}
                >
                  <span className="flex-1 text-left">All Categories</span>
                </button>
                {availableCategories.map((category) => (
                  <button
                    key={category}
                    onClick={() => { setCategoryFilter(category); setCurrentPage(1); }}
                    className={`w-full flex items-center gap-2 px-2 py-1.5 rounded text-sm transition ${
                      categoryFilter === category
                        ? 'bg-blue-50 dark:bg-blue-900/30 text-blue-600 dark:text-blue-400'
                        : 'text-gray-700 dark:text-gray-300 hover:bg-gray-50 dark:hover:bg-slate-800'
                    }`}
                  >
                    <span className="flex-1 text-left capitalize">{category}</span>
                    <span className="text-xs text-gray-500 dark:text-gray-400">
                      {media.filter((m) => m.tags?.includes(category)).length}
                    </span>
                  </button>
                ))}
              </div>
            </div>
          )}
        </div>

        {/* Main Content */}
        <div className={`flex-1 min-w-0 ${pickerMode ? 'flex flex-col min-h-0' : ''}`}>
          {/* Toolbar */}
          <div className={`bg-white dark:bg-slate-900 rounded-lg border border-gray-200 dark:border-slate-700 ${pickerMode ? 'p-3 mb-3' : 'p-4 mb-4'}`}>
            <div className={`flex flex-wrap ${pickerMode ? 'gap-2' : 'gap-4'} items-center`}>
              {/* Search */}
              <div className="relative flex-1 min-w-[200px]">
                <Search size={16} className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" />
                <Input
                  placeholder="Search files..."
                  value={searchTerm}
                  onChange={(e) => { setSearchTerm(e.target.value); setCurrentPage(1); }}
                  className="pl-9"
                />
              </div>

              {/* File type filter */}
              <Select value={fileTypeFilter} onValueChange={(v) => { setFileTypeFilter(v as MediaFileType | 'all'); setCurrentPage(1); }}>
                <SelectTrigger className="w-32">
                  <SelectValue placeholder="Type" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">All Types</SelectItem>
                  <SelectItem value="image">Images</SelectItem>
                  <SelectItem value="video">Videos</SelectItem>
                  <SelectItem value="audio">Audio</SelectItem>
                  <SelectItem value="document">Documents</SelectItem>
                </SelectContent>
              </Select>

              {/* Sort */}
              <Select value={sortBy} onValueChange={(v) => setSortBy(v as 'date' | 'name' | 'size')}>
                <SelectTrigger className="w-28">
                  <SelectValue placeholder="Sort" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="date">Date</SelectItem>
                  <SelectItem value="name">Name</SelectItem>
                  <SelectItem value="size">Size</SelectItem>
                </SelectContent>
              </Select>

              <Button
                variant="outline"
                size="icon"
                onClick={() => setSortOrder(sortOrder === 'asc' ? 'desc' : 'asc')}
              >
                {sortOrder === 'asc' ? <SortAsc size={16} /> : <SortDesc size={16} />}
              </Button>

              {/* View mode toggle */}
              <div className="flex border border-gray-200 dark:border-slate-700 rounded-lg overflow-hidden">
                <button
                  onClick={() => setViewMode('grid')}
                  className={`p-2 ${viewMode === 'grid' ? 'bg-gray-100 dark:bg-slate-800' : ''}`}
                >
                  <LayoutGrid size={16} />
                </button>
                <button
                  onClick={() => setViewMode('list')}
                  className={`p-2 ${viewMode === 'list' ? 'bg-gray-100 dark:bg-slate-800' : ''}`}
                >
                  <List size={16} />
                </button>
              </div>

              {/* Bulk actions */}
              {selectedIds.size > 0 && !pickerMode && (
                <Button
                  variant="destructive"
                  size="sm"
                  onClick={() => openDeleteModal(Array.from(selectedIds))}
                >
                  <Trash2 size={14} className="mr-1" /> Delete ({selectedIds.size})
                </Button>
              )}
            </div>
          </div>

          {/* Drop Zone Overlay */}
          {isDragging && (
            <div
              className="fixed inset-0 bg-blue-500/20 z-50 flex items-center justify-center"
              onDragOver={handleDragOver}
              onDragLeave={handleDragLeave}
              onDrop={handleDrop}
            >
              <div className="bg-white dark:bg-slate-900 rounded-xl p-8 shadow-2xl border-2 border-dashed border-blue-500">
                <Upload size={48} className="mx-auto text-blue-500 mb-4" />
                <p className="text-lg font-semibold text-gray-900 dark:text-white">Drop files to upload</p>
              </div>
            </div>
          )}

          {/* Media Grid/List */}
          <div
            className={`bg-white dark:bg-slate-900 rounded-lg border border-gray-200 dark:border-slate-700 ${pickerMode ? 'p-3 flex-1 overflow-auto' : 'p-4'}`}
            onDragOver={handleDragOver}
            onDragLeave={handleDragLeave}
            onDrop={handleDrop}
          >
            {loading ? (
              <div className="text-center py-12 text-gray-500 dark:text-gray-400">
                <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600 mx-auto mb-4"></div>
                Loading media...
              </div>
            ) : paginatedMedia.length === 0 ? (
              <div className="text-center py-12 text-gray-500 dark:text-gray-400">
                <ImageIcon size={48} className="mx-auto mb-4 opacity-20" />
                <p>{searchTerm ? 'No files match your search' : 'No files in this folder'}</p>
                <Button
                  variant="outline"
                  className="mt-4"
                  onClick={() => { setUploadFolder(currentFolder === 'all' ? 'uploads' : currentFolder); setShowUploadModal(true); }}
                >
                  <Upload size={16} className="mr-2" /> Upload Files
                </Button>
              </div>
            ) : viewMode === 'grid' ? (
              <div className={`grid gap-3 ${pickerMode ? 'grid-cols-2 sm:grid-cols-3 lg:grid-cols-4' : 'grid-cols-2 sm:grid-cols-3 md:grid-cols-4 gap-4'}`}>
                {paginatedMedia.map((mediaItem) => (
                  <div
                    key={mediaItem.id}
                    className={`group relative bg-gray-100 dark:bg-slate-800 rounded-lg overflow-hidden border-2 transition cursor-pointer ${pickerMode ? 'aspect-square' : 'aspect-[4/3]'} ${
                      selectedIds.has(mediaItem.id)
                        ? 'border-blue-500 ring-2 ring-blue-500/30'
                        : 'border-transparent hover:border-gray-300 dark:hover:border-slate-600'
                    }`}
                    onClick={() => toggleSelect(mediaItem.id)}
                  >
                    {/* Thumbnail */}
                    {mediaItem.fileType === 'image' ? (
                      <img
                        src={mediaItem.url}
                        alt={mediaItem.altText || mediaItem.filename}
                        className="w-full h-full object-cover"
                      />
                    ) : (
                      <div className="w-full h-full flex items-center justify-center">
                        <div className="text-gray-400 dark:text-slate-500 scale-150">
                          {fileTypeIcons[mediaItem.fileType]}
                        </div>
                      </div>
                    )}

                    {/* Selection checkbox */}
                    <div className={`absolute top-2 left-2 ${selectedIds.has(mediaItem.id) ? 'opacity-100' : 'opacity-0 group-hover:opacity-100'} transition`}>
                      <div className={`w-5 h-5 rounded border-2 flex items-center justify-center ${
                        selectedIds.has(mediaItem.id)
                          ? 'bg-blue-500 border-blue-500'
                          : 'bg-white/80 dark:bg-slate-900/80 border-gray-300 dark:border-slate-600'
                      }`}>
                        {selectedIds.has(mediaItem.id) && <Check size={12} className="text-white" />}
                      </div>
                    </div>

                    {/* File type badge */}
                    <div className="absolute top-2 right-2">
                      <Badge variant="secondary" className="text-xs">
                        {mediaItem.fileType}
                      </Badge>
                    </div>

                    {/* Hover overlay */}
                    <div className="absolute inset-0 bg-black/40 opacity-0 group-hover:opacity-100 transition flex items-center justify-center gap-2">
                      <button
                        onClick={(e) => { e.stopPropagation(); openPreview(mediaItem); }}
                        className="p-2 bg-white/90 dark:bg-slate-800/90 rounded-full hover:bg-white dark:hover:bg-slate-700"
                      >
                        <Eye size={16} />
                      </button>
                      {!pickerMode && (
                        <>
                          <button
                            onClick={(e) => { e.stopPropagation(); openEditModal(mediaItem); }}
                            className="p-2 bg-white/90 dark:bg-slate-800/90 rounded-full hover:bg-white dark:hover:bg-slate-700"
                          >
                            <Edit size={16} />
                          </button>
                          <button
                            onClick={(e) => { e.stopPropagation(); copyUrl(mediaItem.url); }}
                            className="p-2 bg-white/90 dark:bg-slate-800/90 rounded-full hover:bg-white dark:hover:bg-slate-700"
                          >
                            <Copy size={16} />
                          </button>
                        </>
                      )}
                    </div>

                    {/* Filename */}
                    <div className="absolute bottom-0 left-0 right-0 bg-gradient-to-t from-black/60 to-transparent p-2">
                      <p className="text-xs text-white truncate">{mediaItem.filename}</p>
                    </div>
                  </div>
                ))}
              </div>
            ) : (
              // List view
              <div className="space-y-2">
                {/* Select all header */}
                <div className="flex items-center gap-4 p-2 bg-gray-50 dark:bg-slate-800 rounded-lg text-sm font-medium text-gray-600 dark:text-gray-400">
                  <input
                    type="checkbox"
                    checked={selectedIds.size === paginatedMedia.length && paginatedMedia.length > 0}
                    onChange={toggleSelectAll}
                    className="w-4 h-4 text-blue-600 border-gray-300 rounded focus:ring-blue-500"
                  />
                  <span className="w-12">Type</span>
                  <span className="flex-1">Name</span>
                  <span className="w-24">Size</span>
                  <span className="w-32">Uploaded</span>
                  <span className="w-24">Actions</span>
                </div>

                {paginatedMedia.map((mediaItem) => (
                  <div
                    key={mediaItem.id}
                    className={`flex items-center gap-4 p-2 rounded-lg transition cursor-pointer ${
                      selectedIds.has(mediaItem.id)
                        ? 'bg-blue-50 dark:bg-blue-900/20'
                        : 'hover:bg-gray-50 dark:hover:bg-slate-800'
                    }`}
                    onClick={() => toggleSelect(mediaItem.id)}
                  >
                    <input
                      type="checkbox"
                      checked={selectedIds.has(mediaItem.id)}
                      onChange={() => toggleSelect(mediaItem.id)}
                      className="w-4 h-4 text-blue-600 border-gray-300 rounded focus:ring-blue-500"
                    />
                    <div className="w-12 h-12 shrink-0">
                      {renderThumbnail(mediaItem, 'small')}
                    </div>
                    <div className="flex-1 min-w-0">
                      <p className="font-medium text-gray-900 dark:text-white truncate">{mediaItem.filename}</p>
                      <p className="text-xs text-gray-500 dark:text-gray-400">{mediaItem.mimeType}</p>
                    </div>
                    <span className="w-24 text-sm text-gray-600 dark:text-gray-400">
                      {formatFileSize(mediaItem.fileSize)}
                    </span>
                    <span className="w-32 text-sm text-gray-600 dark:text-gray-400">
                      {new Date(mediaItem.uploadedAt).toLocaleDateString()}
                    </span>
                    <div className="w-24 flex gap-1">
                      <button
                        onClick={(e) => { e.stopPropagation(); openPreview(mediaItem); }}
                        className="p-1.5 rounded hover:bg-gray-100 dark:hover:bg-slate-700"
                      >
                        <Eye size={14} />
                      </button>
                      {!pickerMode && (
                        <>
                          <button
                            onClick={(e) => { e.stopPropagation(); openEditModal(mediaItem); }}
                            className="p-1.5 rounded hover:bg-gray-100 dark:hover:bg-slate-700"
                          >
                            <Edit size={14} />
                          </button>
                          <button
                            onClick={(e) => { e.stopPropagation(); openDeleteModal([mediaItem.id]); }}
                            className="p-1.5 rounded hover:bg-red-100 dark:hover:bg-red-900/30 text-red-600"
                          >
                            <Trash2 size={14} />
                          </button>
                        </>
                      )}
                    </div>
                  </div>
                ))}
              </div>
            )}

            {/* Pagination */}
            {totalPages > 1 && (
              <div className="flex justify-center items-center gap-2 mt-6">
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => setCurrentPage((p) => Math.max(1, p - 1))}
                  disabled={currentPage === 1}
                >
                  <ChevronLeft size={16} />
                </Button>
                <span className="text-sm text-gray-600 dark:text-gray-400">
                  Page {currentPage} of {totalPages}
                </span>
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => setCurrentPage((p) => Math.min(totalPages, p + 1))}
                  disabled={currentPage === totalPages}
                >
                  <ChevronRight size={16} />
                </Button>
              </div>
            )}
          </div>

          {/* Picker mode selection indicator - inline, not fixed */}
          {pickerMode && selectedIds.size > 0 && (
            <div className="mt-4 p-3 bg-blue-50 dark:bg-blue-900/20 rounded-lg flex items-center justify-between">
              <span className="text-sm text-blue-700 dark:text-blue-300 font-medium">
                {selectedIds.size} file(s) selected
              </span>
              <Button variant="ghost" size="sm" onClick={() => { setSelectedIds(new Set()); if (onSelect) onSelect([]); }}>
                Clear Selection
              </Button>
            </div>
          )}
        </div>
      </div>

      {/* Upload Modal */}
      <Dialog open={showUploadModal} onOpenChange={setShowUploadModal}>
        <DialogContent className="max-w-lg">
          <DialogHeader>
            <DialogTitle>Upload Files</DialogTitle>
            <DialogDescription>
              Upload files to your media library
            </DialogDescription>
          </DialogHeader>

          <div className="space-y-4">
            {/* Folder selection */}
            <div>
              <Label>Upload to folder</Label>
              <Select value={uploadFolder} onValueChange={(v) => setUploadFolder(v as MediaFolder)}>
                <SelectTrigger className="mt-1">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  {MEDIA_FOLDERS.map((folder) => (
                    <SelectItem key={folder.value} value={folder.value}>
                      {folder.label}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            {/* Drop zone / file input */}
            {uploadProgress.length === 0 ? (
              <div
                className="border-2 border-dashed border-gray-300 dark:border-slate-600 rounded-lg p-8 text-center cursor-pointer hover:border-blue-500 transition"
                onClick={() => fileInputRef.current?.click()}
              >
                <Upload size={32} className="mx-auto text-gray-400 mb-3" />
                <p className="text-gray-600 dark:text-gray-400">
                  Click to select files or drag and drop
                </p>
                <p className="text-xs text-gray-500 mt-2">
                  Images (10MB), Videos (100MB), Audio (50MB), PDFs (20MB)
                </p>
                <input
                  ref={fileInputRef}
                  type="file"
                  multiple
                  accept={getAllAllowedMimeTypes().join(',')}
                  onChange={(e) => e.target.files && handleFilesSelected(Array.from(e.target.files))}
                  className="hidden"
                />
              </div>
            ) : (
              <div className="space-y-3">
                {uploadProgress.map((upload, idx) => (
                  <div key={idx} className="flex items-center gap-3 p-3 bg-gray-50 dark:bg-slate-800 rounded-lg">
                    <div className="shrink-0">
                      {upload.status === 'complete' ? (
                        <div className="w-8 h-8 bg-green-100 dark:bg-green-900/30 rounded-full flex items-center justify-center">
                          <Check size={16} className="text-green-600" />
                        </div>
                      ) : upload.status === 'error' ? (
                        <div className="w-8 h-8 bg-red-100 dark:bg-red-900/30 rounded-full flex items-center justify-center">
                          <X size={16} className="text-red-600" />
                        </div>
                      ) : (
                        <div className="w-8 h-8 bg-blue-100 dark:bg-blue-900/30 rounded-full flex items-center justify-center">
                          <Upload size={16} className="text-blue-600" />
                        </div>
                      )}
                    </div>
                    <div className="flex-1 min-w-0">
                      <p className="text-sm font-medium text-gray-900 dark:text-white truncate">
                        {upload.filename}
                      </p>
                      {upload.status === 'uploading' && (
                        <div className="w-full bg-gray-200 dark:bg-slate-700 rounded-full h-1.5 mt-1">
                          <div
                            className="bg-blue-600 h-1.5 rounded-full transition-all"
                            style={{ width: `${upload.progress}%` }}
                          />
                        </div>
                      )}
                      {upload.status === 'error' && (
                        <p className="text-xs text-red-600 mt-1">{upload.error}</p>
                      )}
                    </div>
                    <span className="text-xs text-gray-500">
                      {upload.status === 'complete' ? 'Done' : upload.status === 'error' ? 'Failed' : `${Math.round(upload.progress)}%`}
                    </span>
                  </div>
                ))}

                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => fileInputRef.current?.click()}
                >
                  <Upload size={14} className="mr-1" /> Add more files
                </Button>
              </div>
            )}
          </div>

          <DialogFooter>
            <Button variant="outline" onClick={() => { setShowUploadModal(false); setUploadProgress([]); }}>
              Cancel
            </Button>
            <Button
              onClick={handleUpload}
              disabled={uploadProgress.length === 0 || uploadProgress.every((u) => u.status !== 'pending')}
            >
              Upload {uploadProgress.filter((u) => u.status === 'pending').length} file(s)
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Edit Modal */}
      <Dialog open={showEditModal} onOpenChange={setShowEditModal}>
        <DialogContent className="max-w-md">
          <DialogHeader>
            <DialogTitle>Edit Media</DialogTitle>
          </DialogHeader>

          {editingMedia && (
            <div className="space-y-4">
              {/* Preview */}
              <div className="rounded-lg overflow-hidden bg-gray-100 dark:bg-slate-800">
                {renderThumbnail(editingMedia, 'large')}
              </div>

              <div className="text-sm text-gray-600 dark:text-gray-400">
                <p><strong>Filename:</strong> {editingMedia.originalFilename}</p>
                <p><strong>Size:</strong> {formatFileSize(editingMedia.fileSize)}</p>
                <p><strong>Type:</strong> {editingMedia.mimeType}</p>
                {editingMedia.width && editingMedia.height && (
                  <p><strong>Dimensions:</strong> {editingMedia.width} x {editingMedia.height}</p>
                )}
              </div>

              <div>
                <Label htmlFor="altText">Alt Text</Label>
                <Input
                  id="altText"
                  value={editForm.altText}
                  onChange={(e) => setEditForm({ ...editForm, altText: e.target.value })}
                  placeholder="Describe the image for accessibility"
                  className="mt-1"
                />
              </div>

              <div>
                <Label htmlFor="caption">Caption</Label>
                <Textarea
                  id="caption"
                  value={editForm.caption}
                  onChange={(e) => setEditForm({ ...editForm, caption: e.target.value })}
                  placeholder="Optional caption or description"
                  className="mt-1"
                  rows={2}
                />
              </div>

              <div>
                <Label htmlFor="folder">Folder</Label>
                <Select value={editForm.folder} onValueChange={(v) => setEditForm({ ...editForm, folder: v as MediaFolder })}>
                  <SelectTrigger className="mt-1">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    {MEDIA_FOLDERS.map((folder) => (
                      <SelectItem key={folder.value} value={folder.value}>
                        {folder.label}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
            </div>
          )}

          <DialogFooter>
            <Button variant="outline" onClick={() => setShowEditModal(false)}>
              Cancel
            </Button>
            <Button onClick={handleSaveEdit}>
              Save Changes
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Delete Confirmation Modal */}
      <Dialog open={showDeleteModal} onOpenChange={setShowDeleteModal}>
        <DialogContent className="max-w-sm">
          <DialogHeader>
            <DialogTitle>Delete Media</DialogTitle>
            <DialogDescription>
              Are you sure you want to delete {deletingIds.length} file(s)? This action cannot be undone.
            </DialogDescription>
          </DialogHeader>
          <DialogFooter>
            <Button variant="outline" onClick={() => setShowDeleteModal(false)}>
              Cancel
            </Button>
            <Button variant="destructive" onClick={handleDelete}>
              Delete
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Preview Modal */}
      <Dialog open={showPreviewModal} onOpenChange={setShowPreviewModal}>
        <DialogContent className="max-w-3xl">
          <DialogHeader>
            <DialogTitle>{previewMedia?.originalFilename}</DialogTitle>
          </DialogHeader>

          {previewMedia && (
            <div className="space-y-4">
              {/* Preview content */}
              <div className="rounded-lg overflow-hidden bg-gray-100 dark:bg-slate-800 flex items-center justify-center min-h-[300px]">
                {previewMedia.fileType === 'image' && (
                  <img
                    src={previewMedia.url}
                    alt={previewMedia.altText || previewMedia.filename}
                    className="max-w-full max-h-[60vh] object-contain"
                  />
                )}
                {previewMedia.fileType === 'video' && (
                  <video
                    src={previewMedia.url}
                    controls
                    className="max-w-full max-h-[60vh]"
                  />
                )}
                {previewMedia.fileType === 'audio' && (
                  <audio src={previewMedia.url} controls className="w-full max-w-md" />
                )}
                {previewMedia.fileType === 'document' && (
                  <iframe
                    src={previewMedia.url}
                    className="w-full h-[60vh]"
                    title={previewMedia.filename}
                  />
                )}
              </div>

              {/* Metadata */}
              <div className="grid grid-cols-2 gap-4 text-sm">
                <div>
                  <span className="text-gray-500 dark:text-gray-400">Size:</span>
                  <span className="ml-2 text-gray-900 dark:text-white">{formatFileSize(previewMedia.fileSize)}</span>
                </div>
                <div>
                  <span className="text-gray-500 dark:text-gray-400">Type:</span>
                  <span className="ml-2 text-gray-900 dark:text-white">{previewMedia.mimeType}</span>
                </div>
                {previewMedia.width && previewMedia.height && (
                  <div>
                    <span className="text-gray-500 dark:text-gray-400">Dimensions:</span>
                    <span className="ml-2 text-gray-900 dark:text-white">{previewMedia.width} x {previewMedia.height}</span>
                  </div>
                )}
                {previewMedia.duration && (
                  <div>
                    <span className="text-gray-500 dark:text-gray-400">Duration:</span>
                    <span className="ml-2 text-gray-900 dark:text-white">{Math.round(previewMedia.duration)}s</span>
                  </div>
                )}
                <div>
                  <span className="text-gray-500 dark:text-gray-400">Uploaded:</span>
                  <span className="ml-2 text-gray-900 dark:text-white">
                    {new Date(previewMedia.uploadedAt).toLocaleString()}
                  </span>
                </div>
                <div>
                  <span className="text-gray-500 dark:text-gray-400">Folder:</span>
                  <span className="ml-2 text-gray-900 dark:text-white capitalize">{previewMedia.folder}</span>
                </div>
              </div>

              {/* URL */}
              <div>
                <Label>URL</Label>
                <div className="flex gap-2 mt-1">
                  <Input value={previewMedia.url} readOnly className="text-xs" />
                  <Button variant="outline" size="icon" onClick={() => copyUrl(previewMedia.url)}>
                    <Copy size={16} />
                  </Button>
                </div>
              </div>
            </div>
          )}
        </DialogContent>
      </Dialog>

      {/* Migration Modal */}
      <Dialog open={showMigrationModal} onOpenChange={setShowMigrationModal}>
        <DialogContent className="max-w-lg">
          <DialogHeader>
            <DialogTitle>Import Existing Images</DialogTitle>
            <DialogDescription>
              Scan your content collections and import existing images into the media library.
            </DialogDescription>
          </DialogHeader>

          {isMigrating ? (
            <div className="space-y-4 py-8">
              <div className="flex items-center justify-center gap-3">
                <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600" />
                <span className="text-gray-700 dark:text-gray-300 font-medium">{migrationStatus}</span>
              </div>
              <div className="w-full bg-gray-200 dark:bg-slate-700 rounded-full h-2 overflow-hidden">
                <div
                  className="bg-blue-600 h-2 rounded-full animate-pulse"
                  style={{ width: migrationStatus.includes('1/2') ? '50%' : migrationStatus.includes('2/2') ? '90%' : '70%' }}
                />
              </div>
              <p className="text-center text-sm text-gray-500 dark:text-gray-400">
                This may take a minute for large libraries...
              </p>
            </div>
          ) : migrationPreview ? (
            <div className="space-y-4">
              <div className="bg-blue-50 dark:bg-blue-900/20 rounded-lg p-4">
                <h4 className="font-semibold text-blue-800 dark:text-blue-200 mb-2">Summary</h4>
                <div className="text-sm space-y-1 text-blue-700 dark:text-blue-300">
                  <p>Total images found: <strong>{migrationPreview.summary?.totalFound || 0}</strong></p>
                  <p>Already in library: <strong>{migrationPreview.summary?.alreadyInMedia || 0}</strong></p>
                  <p>Ready to import: <strong>{migrationPreview.summary?.toImport || 0}</strong></p>
                </div>
              </div>

              {migrationPreview.byCollection && (
                <div className="bg-gray-50 dark:bg-slate-800 rounded-lg p-4">
                  <h4 className="font-semibold text-gray-900 dark:text-white mb-2">By Collection</h4>
                  <div className="grid grid-cols-2 gap-2 text-sm">
                    {Object.entries(migrationPreview.byCollection).map(([key, value]) => (
                      <div key={key} className="flex justify-between">
                        <span className="text-gray-600 dark:text-gray-400 capitalize">{key}:</span>
                        <span className="text-gray-900 dark:text-white">{value.found} ({value.unique} unique)</span>
                      </div>
                    ))}
                  </div>
                </div>
              )}

              {(migrationPreview.summary?.alreadyInMedia || 0) > 0 && (
                <div className="bg-amber-50 dark:bg-amber-900/20 rounded-lg p-4">
                  <h4 className="font-semibold text-amber-800 dark:text-amber-200 mb-2">Re-import Option</h4>
                  <p className="text-sm text-amber-700 dark:text-amber-300 mb-3">
                    {migrationPreview.summary?.alreadyInMedia} images are already imported. To update them with category tags, use Clear & Re-import.
                  </p>
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={clearAndReimport}
                    className="border-amber-500 text-amber-700 hover:bg-amber-100 dark:text-amber-300 dark:hover:bg-amber-900/30"
                  >
                    Clear & Re-import All
                  </Button>
                </div>
              )}
            </div>
          ) : (
            <div className="text-center py-8 text-gray-500">
              <Download size={48} className="mx-auto mb-4 opacity-20" />
              <p>Click the button below to scan for existing images</p>
            </div>
          )}

          <DialogFooter>
            <Button variant="outline" onClick={() => { setShowMigrationModal(false); setMigrationPreview(null); }} disabled={isMigrating}>
              Cancel
            </Button>
            {migrationPreview && !isMigrating ? (
              <Button
                onClick={runMigration}
                disabled={(migrationPreview.summary?.toImport || 0) === 0}
              >
                Import {migrationPreview.summary?.toImport || 0} New Images
              </Button>
            ) : !isMigrating ? (
              <Button onClick={previewMigration}>
                Scan for Images
              </Button>
            ) : null}
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
