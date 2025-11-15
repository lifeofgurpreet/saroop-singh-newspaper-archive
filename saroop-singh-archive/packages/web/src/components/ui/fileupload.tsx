'use client';

import React, { useCallback, useState } from 'react';
import { Upload, X, Image as ImageIcon, AlertCircle } from 'lucide-react';
import { cn } from '@/lib/utils';

interface FileUploadProps {
  onFileSelect: (file: File) => void;
  onFileRemove: () => void;
  accept?: string;
  maxSize?: number; // in MB
  className?: string;
  disabled?: boolean;
  file?: File | null;
}

export function FileUpload({
  onFileSelect,
  onFileRemove,
  accept = 'image/*',
  maxSize = 10,
  className,
  disabled = false,
  file = null,
}: FileUploadProps) {
  const [isDragOver, setIsDragOver] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const validateFile = useCallback((file: File) => {
    // Check file type
    if (!file.type.startsWith('image/')) {
      return 'Please select an image file';
    }

    // Check file size
    const sizeInMB = file.size / (1024 * 1024);
    if (sizeInMB > maxSize) {
      return `File size must be less than ${maxSize}MB`;
    }

    return null;
  }, [maxSize]);

  const handleFile = useCallback((selectedFile: File) => {
    setError(null);
    
    const validationError = validateFile(selectedFile);
    if (validationError) {
      setError(validationError);
      return;
    }

    onFileSelect(selectedFile);
  }, [validateFile, onFileSelect]);

  const handleDrop = useCallback(
    (e: React.DragEvent<HTMLDivElement>) => {
      e.preventDefault();
      setIsDragOver(false);

      if (disabled) return;

      const files = Array.from(e.dataTransfer.files);
      if (files.length > 0) {
        handleFile(files[0]);
      }
    },
    [disabled, handleFile]
  );

  const handleDragOver = useCallback((e: React.DragEvent<HTMLDivElement>) => {
    e.preventDefault();
    if (!disabled) {
      setIsDragOver(true);
    }
  }, [disabled]);

  const handleDragLeave = useCallback((e: React.DragEvent<HTMLDivElement>) => {
    e.preventDefault();
    setIsDragOver(false);
  }, []);

  const handleInputChange = useCallback(
    (e: React.ChangeEvent<HTMLInputElement>) => {
      const files = e.target.files;
      if (files && files.length > 0) {
        handleFile(files[0]);
      }
    },
    [handleFile]
  );

  const handleRemoveFile = useCallback(() => {
    setError(null);
    onFileRemove();
  }, [onFileRemove]);

  return (
    <div className={cn('w-full', className)}>
      {!file ? (
        <div
          className={cn(
            'relative border-2 border-dashed rounded-lg p-8 text-center transition-all',
            isDragOver
              ? 'border-blue-400 bg-blue-50'
              : 'border-gray-300 hover:border-gray-400',
            disabled && 'opacity-50 cursor-not-allowed',
            error && 'border-red-300 bg-red-50'
          )}
          onDrop={handleDrop}
          onDragOver={handleDragOver}
          onDragLeave={handleDragLeave}
        >
          <input
            type="file"
            accept={accept}
            onChange={handleInputChange}
            disabled={disabled}
            className="absolute inset-0 w-full h-full opacity-0 cursor-pointer"
            aria-label="Upload file"
          />
          
          <div className="flex flex-col items-center space-y-4">
            {error ? (
              <AlertCircle className="w-12 h-12 text-red-400" />
            ) : (
              <Upload className={cn(
                'w-12 h-12',
                isDragOver ? 'text-blue-500' : 'text-gray-400'
              )} />
            )}
            
            <div className="space-y-2">
              <p className={cn(
                'text-lg font-medium',
                error ? 'text-red-600' : 'text-gray-900'
              )}>
                {error ? 'Upload Error' : isDragOver ? 'Drop your image here' : 'Upload your photo'}
              </p>
              
              {error ? (
                <p className="text-sm text-red-500">{error}</p>
              ) : (
                <p className="text-sm text-gray-500">
                  Drag & drop an image here, or click to browse
                  <br />
                  <span className="text-xs">
                    Supports: JPG, PNG, WEBP (max {maxSize}MB)
                  </span>
                </p>
              )}
            </div>
          </div>
        </div>
      ) : (
        <div className="relative border rounded-lg p-4 bg-white">
          <div className="flex items-center space-x-4">
            <div className="flex-shrink-0">
              <ImageIcon className="w-8 h-8 text-gray-400" />
            </div>
            
            <div className="flex-grow min-w-0">
              <p className="text-sm font-medium text-gray-900 truncate">
                {file.name}
              </p>
              <p className="text-sm text-gray-500">
                {(file.size / (1024 * 1024)).toFixed(2)} MB
              </p>
            </div>
            
            <button
              onClick={handleRemoveFile}
              disabled={disabled}
              className={cn(
                'flex-shrink-0 p-1 rounded-full hover:bg-gray-100 transition-colors',
                disabled && 'opacity-50 cursor-not-allowed'
              )}
              aria-label="Remove file"
            >
              <X className="w-4 h-4 text-gray-400" />
            </button>
          </div>
          
          {file.type.startsWith('image/') && (
            <div className="mt-4">
              {/* eslint-disable-next-line @next/next/no-img-element */}
              <img
                src={URL.createObjectURL(file)}
                alt="Preview"
                className="max-w-full h-48 object-contain rounded-md mx-auto"
                onLoad={(e) => {
                  // Clean up the object URL to prevent memory leaks
                  const img = e.target as HTMLImageElement;
                  setTimeout(() => {
                    URL.revokeObjectURL(img.src);
                  }, 100);
                }}
              />
            </div>
          )}
        </div>
      )}
    </div>
  );
}