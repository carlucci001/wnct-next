"use client";

import { useState, useCallback } from 'react';
import { Upload, X, Image as ImageIcon, AlertCircle } from 'lucide-react';
import { storageService } from '@/lib/storage';

interface ImageUploaderProps {
  onUploadComplete: (url: string) => void;
  defaultUrl?: string;
  onSelectFromLibrary?: () => void;
}

export default function ImageUploader({ onUploadComplete, defaultUrl, onSelectFromLibrary }: ImageUploaderProps) {
  const [isDragging, setIsDragging] = useState(false);
  const [isUploading, setIsUploading] = useState(false);
  const [previewUrl, setPreviewUrl] = useState<string | null>(defaultUrl || null);
  const [error, setError] = useState<string | null>(null);

  const handleDragOver = useCallback((e: React.DragEvent) => {
    e.preventDefault();
    setIsDragging(true);
  }, []);

  const handleDragLeave = useCallback((e: React.DragEvent) => {
    e.preventDefault();
    setIsDragging(false);
  }, []);

  const processFile = async (file: File) => {
    if (!file.type.startsWith('image/')) {
      setError('Please upload an image file');
      return;
    }

    // Size check (5MB)
    if (file.size > 5 * 1024 * 1024) {
      setError('Image must be smaller than 5MB');
      return;
    }

    setIsUploading(true);
    setError(null);

    try {
      // Create local preview immediately
      const objectUrl = URL.createObjectURL(file);
      setPreviewUrl(objectUrl);

      // Upload to storage
      const uploadedUrl = await storageService.uploadFile(file);
      onUploadComplete(uploadedUrl);
    } catch (err) {
      console.error(err);
      setError('Upload failed. Please try again.');
    } finally {
      setIsUploading(false);
    }
  };

  const handleDrop = useCallback((e: React.DragEvent) => {
    e.preventDefault();
    setIsDragging(false);

    const files = e.dataTransfer.files;
    if (files && files.length > 0) {
      processFile(files[0]);
    }
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const handleFileSelect = (e: React.ChangeEvent<HTMLInputElement>) => {
    const files = e.target.files;
    if (files && files.length > 0) {
      processFile(files[0]);
    }
  };

  return (
    <div className="w-full">
      <div
        className={`border-2 border-dashed rounded-lg p-4 flex flex-col items-center justify-center transition-colors relative overflow-hidden ${
          isDragging ? 'border-blue-600 bg-blue-50' : 'border-gray-300 hover:border-blue-600'
        } ${error ? 'border-red-300 bg-red-50' : ''}`}
        onDragOver={handleDragOver}
        onDragLeave={handleDragLeave}
        onDrop={handleDrop}
      >
        {previewUrl ? (
          <div className="relative w-full h-32 bg-gray-100 rounded overflow-hidden group">
            <img src={previewUrl} alt="Preview" className="w-full h-full object-contain" />
            <div className="absolute inset-0 bg-black/50 flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity z-10">
              <button
                onClick={() => { setPreviewUrl(null); onUploadComplete(''); }}
                className="text-white bg-red-500 p-2 rounded-full hover:bg-red-600"
                title="Remove Image"
                type="button"
              >
                <X size={16} />
              </button>
            </div>
            {isUploading && (
              <div className="absolute inset-0 bg-white/80 flex items-center justify-center z-20">
                <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600"></div>
              </div>
            )}
          </div>
        ) : (
          <div className="text-center relative z-10 pointer-events-none">
            {isUploading ? (
              <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600 mx-auto mb-2"></div>
            ) : (
              <div className="w-10 h-10 bg-gray-100 text-gray-400 rounded-full flex items-center justify-center mx-auto mb-2">
                <Upload size={20} />
              </div>
            )}
            <p className="text-xs text-gray-500 font-bold mb-1">
              {isUploading ? 'Uploading...' : 'Click or Drag Image'}
            </p>
            <p className="text-[10px] text-gray-400">JPG, PNG, WEBP (Max 5MB)</p>
          </div>
        )}

        {/* Input Overlay */}
        {!previewUrl && !isUploading && (
          <input
            type="file"
            className="absolute inset-0 w-full h-full opacity-0 cursor-pointer z-20"
            accept="image/*"
            onChange={handleFileSelect}
            id="image-upload-input"
          />
        )}
      </div>
      {onSelectFromLibrary && (
        <button
          type="button"
          onClick={onSelectFromLibrary}
          className="mt-2 w-full py-1 text-xs font-bold text-blue-600 bg-blue-50 hover:bg-blue-100 rounded border border-blue-200"
        >
          Select from Library
        </button>
      )}
      {error && <p className="text-[10px] text-red-500 mt-1 flex items-center"><AlertCircle size={10} className="mr-1" /> {error}</p>}
    </div>
  );
}
