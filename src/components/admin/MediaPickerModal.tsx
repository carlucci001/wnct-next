'use client';

import { useState, useRef, useCallback } from 'react';
import { Upload, Image as ImageIcon, X, Check } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Label } from '@/components/ui/label';
import {
  Dialog, DialogContent, DialogFooter, DialogHeader, DialogTitle,
} from '@/components/ui/dialog';
import {
  Select, SelectContent, SelectItem, SelectTrigger, SelectValue,
} from '@/components/ui/select';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { toast } from 'sonner';
import {
  MediaFile, MediaFolder, MediaFileType, MediaUploadProgress,
  MEDIA_FOLDERS, getAllAllowedMimeTypes, validateFile
} from '@/types/media';
import { createMediaFile } from '@/lib/media';
import { uploadMediaFile } from '@/lib/storage';
import { useAuth } from '@/contexts/AuthContext';
import MediaManager from './MediaManager';

interface MediaPickerModalProps {
  open: boolean;
  onClose: () => void;
  onSelect: (media: MediaFile | MediaFile[]) => void;
  allowMultiple?: boolean;
  allowedTypes?: MediaFileType[];
  defaultFolder?: MediaFolder;
  title?: string;
}

export default function MediaPickerModal({
  open,
  onClose,
  onSelect,
  allowMultiple = false,
  allowedTypes,
  defaultFolder = 'articles',
  title = 'Select Media',
}: MediaPickerModalProps) {
  const { user } = useAuth();
  const [activeTab, setActiveTab] = useState<'library' | 'upload'>('library');
  const [selectedMedia, setSelectedMedia] = useState<MediaFile[]>([]);

  // Upload state
  const [uploadFolder, setUploadFolder] = useState<MediaFolder>(defaultFolder);
  const [uploadProgress, setUploadProgress] = useState<MediaUploadProgress[]>([]);
  const [isUploading, setIsUploading] = useState(false);
  const [isDragging, setIsDragging] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);

  // Reset state when modal closes
  const handleClose = () => {
    setSelectedMedia([]);
    setUploadProgress([]);
    setActiveTab('library');
    onClose();
  };

  // Handle selection from library
  const handleLibrarySelect = (media: MediaFile[]) => {
    setSelectedMedia(media);
  };

  // Confirm selection
  const handleConfirm = () => {
    if (selectedMedia.length === 0) {
      toast.error('Please select at least one file');
      return;
    }

    if (allowMultiple) {
      onSelect(selectedMedia);
    } else {
      onSelect(selectedMedia[0]);
    }
    handleClose();
  };

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
        // Check if file type is allowed
        if (allowedTypes && validation.fileType && !allowedTypes.includes(validation.fileType)) {
          errors.push(`${file.name}: File type not allowed`);
        } else {
          validFiles.push(file);
        }
      } else {
        errors.push(`${file.name}: ${validation.error}`);
      }
    });

    if (errors.length > 0) {
      toast.error(errors.join('\n'));
    }

    if (validFiles.length > 0) {
      // For single selection, only take first file
      const filesToUpload = allowMultiple ? validFiles : [validFiles[0]];
      setUploadProgress(filesToUpload.map((file) => ({
        file,
        filename: file.name,
        progress: 0,
        status: 'pending',
      })));
    }
  }

  // Upload handler
  async function handleUpload() {
    if (uploadProgress.length === 0) return;

    setIsUploading(true);
    const uploadedMedia: MediaFile[] = [];

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
          uploadedBy: user?.uid || 'unknown',
          uploadedByName: user?.displayName || user?.email || 'Unknown',
        });

        const newMedia: MediaFile = {
          id: mediaId,
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
          uploadedAt: new Date().toISOString(),
          uploadedBy: user?.uid || '',
          uploadedByName: user?.displayName || user?.email || 'Unknown',
        };

        uploadedMedia.push(newMedia);

        // Update status to complete
        setUploadProgress((prev) =>
          prev.map((u, idx) => idx === i ? {
            ...u,
            status: 'complete',
            progress: 100,
            mediaFile: newMedia
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

    setIsUploading(false);

    // Auto-select uploaded files
    if (uploadedMedia.length > 0) {
      if (allowMultiple) {
        onSelect(uploadedMedia);
      } else {
        onSelect(uploadedMedia[0]);
      }
      handleClose();
    }
  }

  // Clear uploads
  function clearUploads() {
    setUploadProgress([]);
  }

  // Get accept string for file input
  const acceptString = allowedTypes
    ? allowedTypes.map((t) => {
        if (t === 'image') return 'image/*';
        if (t === 'video') return 'video/*';
        if (t === 'audio') return 'audio/*';
        if (t === 'document') return 'application/pdf';
        return '';
      }).join(',')
    : getAllAllowedMimeTypes().join(',');

  return (
    <Dialog open={open} onOpenChange={(open) => !open && handleClose()}>
      <DialogContent className="w-[95vw] max-w-[1400px] min-w-[320px] sm:min-w-[600px] h-[85vh] flex flex-col">
        <DialogHeader>
          <DialogTitle>{title}</DialogTitle>
        </DialogHeader>

        <Tabs value={activeTab} onValueChange={(v) => setActiveTab(v as 'library' | 'upload')} className="flex-1 flex flex-col min-h-0 overflow-hidden">
          <TabsList className="w-full justify-start shrink-0">
            <TabsTrigger value="library">
              <ImageIcon size={16} className="mr-2" />
              Library
            </TabsTrigger>
            <TabsTrigger value="upload">
              <Upload size={16} className="mr-2" />
              Upload
            </TabsTrigger>
          </TabsList>

          <TabsContent value="library" className="flex-1 min-h-0 mt-4 overflow-hidden">
            <MediaManager
              pickerMode
              allowedTypes={allowedTypes}
              maxSelection={allowMultiple ? 10 : 1}
              defaultFolder={defaultFolder}
              onSelect={handleLibrarySelect}
            />
          </TabsContent>

          <TabsContent value="upload" className="flex-1 mt-4">
            <div className="space-y-4">
              {/* Folder selection */}
              <div>
                <Label>Upload to folder</Label>
                <Select value={uploadFolder} onValueChange={(v) => setUploadFolder(v as MediaFolder)}>
                  <SelectTrigger className="mt-1 w-48">
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

              {/* Drop zone / file list */}
              {uploadProgress.length === 0 ? (
                <div
                  className={`border-2 border-dashed rounded-lg p-12 text-center cursor-pointer transition ${
                    isDragging
                      ? 'border-blue-500 bg-blue-50 dark:bg-blue-900/20'
                      : 'border-gray-300 dark:border-slate-600 hover:border-blue-500'
                  }`}
                  onClick={() => fileInputRef.current?.click()}
                  onDragOver={handleDragOver}
                  onDragLeave={handleDragLeave}
                  onDrop={handleDrop}
                >
                  <Upload size={48} className="mx-auto text-gray-400 mb-4" />
                  <p className="text-gray-600 dark:text-gray-400 text-lg">
                    Click to select files or drag and drop
                  </p>
                  <p className="text-sm text-gray-500 mt-2">
                    {allowedTypes
                      ? `Allowed: ${allowedTypes.join(', ')}`
                      : 'Images, Videos, Audio, PDFs'}
                  </p>
                  <input
                    ref={fileInputRef}
                    type="file"
                    multiple={allowMultiple}
                    accept={acceptString}
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
                          <div className="w-10 h-10 bg-green-100 dark:bg-green-900/30 rounded-full flex items-center justify-center">
                            <Check size={20} className="text-green-600" />
                          </div>
                        ) : upload.status === 'error' ? (
                          <div className="w-10 h-10 bg-red-100 dark:bg-red-900/30 rounded-full flex items-center justify-center">
                            <X size={20} className="text-red-600" />
                          </div>
                        ) : (
                          <div className="w-10 h-10 bg-blue-100 dark:bg-blue-900/30 rounded-full flex items-center justify-center">
                            <Upload size={20} className="text-blue-600" />
                          </div>
                        )}
                      </div>
                      <div className="flex-1 min-w-0">
                        <p className="font-medium text-gray-900 dark:text-white truncate">
                          {upload.filename}
                        </p>
                        {upload.status === 'uploading' && (
                          <div className="w-full bg-gray-200 dark:bg-slate-700 rounded-full h-2 mt-2">
                            <div
                              className="bg-blue-600 h-2 rounded-full transition-all"
                              style={{ width: `${upload.progress}%` }}
                            />
                          </div>
                        )}
                        {upload.status === 'error' && (
                          <p className="text-sm text-red-600 mt-1">{upload.error}</p>
                        )}
                      </div>
                      <span className="text-sm text-gray-500">
                        {upload.status === 'complete' ? 'Done' : upload.status === 'error' ? 'Failed' : `${Math.round(upload.progress)}%`}
                      </span>
                    </div>
                  ))}

                  <div className="flex gap-2">
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={clearUploads}
                      disabled={isUploading}
                    >
                      Clear
                    </Button>
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => fileInputRef.current?.click()}
                      disabled={isUploading}
                    >
                      <Upload size={14} className="mr-1" /> Add more
                    </Button>
                  </div>
                </div>
              )}
            </div>
          </TabsContent>
        </Tabs>

        <DialogFooter className="mt-4">
          <Button variant="outline" onClick={handleClose}>
            Cancel
          </Button>
          {activeTab === 'library' ? (
            <Button onClick={handleConfirm} disabled={selectedMedia.length === 0}>
              Select ({selectedMedia.length})
            </Button>
          ) : (
            <Button
              onClick={handleUpload}
              disabled={uploadProgress.length === 0 || isUploading || uploadProgress.every((u) => u.status !== 'pending')}
            >
              {isUploading ? 'Uploading...' : `Upload ${uploadProgress.filter((u) => u.status === 'pending').length} file(s)`}
            </Button>
          )}
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
