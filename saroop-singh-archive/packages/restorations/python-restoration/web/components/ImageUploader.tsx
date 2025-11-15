import React, { useState, useCallback, useRef } from 'react';
import { useDropzone } from 'react-dropzone';
import { motion, AnimatePresence } from 'framer-motion';
import { Upload, X, Image as ImageIcon, FileImage, AlertCircle } from 'lucide-react';
import { validateImageFile, formatFileSize, getImageDimensions, createImagePreview } from '@/lib/utils';

interface ImageFile {
  file: File;
  preview: string;
  dimensions?: { width: number; height: number };
  error?: string;
}

interface ImageUploaderProps {
  onImagesChange: (files: File[]) => void;
  maxFiles?: number;
  maxSize?: number; // in MB
  accept?: string[];
  disabled?: boolean;
  existingImages?: ImageFile[];
}

export default function ImageUploader({
  onImagesChange,
  maxFiles = 10,
  maxSize = 50,
  accept = ['image/jpeg', 'image/png', 'image/webp', 'image/tiff'],
  disabled = false,
  existingImages = []
}: ImageUploaderProps) {
  const [images, setImages] = useState<ImageFile[]>(existingImages);
  const [dragActive, setDragActive] = useState(false);
  const [loading, setLoading] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const processFiles = useCallback(async (files: File[]) => {
    setLoading(true);
    const processedImages: ImageFile[] = [];

    for (const file of files) {
      try {
        // Validate file
        const validation = validateImageFile(file);
        if (!validation.valid) {
          processedImages.push({
            file,
            preview: '',
            error: validation.error
          });
          continue;
        }

        // Create preview
        const preview = await createImagePreview(file);
        
        // Get dimensions
        let dimensions;
        try {
          dimensions = await getImageDimensions(file);
        } catch (error) {
          console.warn('Could not get image dimensions:', error);
        }

        processedImages.push({
          file,
          preview,
          dimensions
        });
      } catch (error) {
        processedImages.push({
          file,
          preview: '',
          error: 'Failed to process image'
        });
      }
    }

    setLoading(false);
    return processedImages;
  }, []);

  const onDrop = useCallback(async (acceptedFiles: File[]) => {
    if (disabled) return;

    const remainingSlots = maxFiles - images.length;
    const filesToProcess = acceptedFiles.slice(0, remainingSlots);
    
    if (filesToProcess.length < acceptedFiles.length) {
      console.warn(`Only ${filesToProcess.length} files will be added (maximum ${maxFiles} files allowed)`);
    }

    const processedImages = await processFiles(filesToProcess);
    const newImages = [...images, ...processedImages];
    
    setImages(newImages);
    onImagesChange(newImages.filter(img => !img.error).map(img => img.file));
  }, [images, maxFiles, disabled, processFiles, onImagesChange]);

  const {
    getRootProps,
    getInputProps,
    isDragActive,
    isDragReject,
    fileRejections
  } = useDropzone({
    onDrop,
    accept: accept.reduce((acc, type) => ({ ...acc, [type]: [] }), {}),
    maxSize: maxSize * 1024 * 1024,
    multiple: maxFiles > 1,
    disabled,
    onDragEnter: () => setDragActive(true),
    onDragLeave: () => setDragActive(false)
  });

  const removeImage = useCallback((index: number) => {
    const newImages = images.filter((_, i) => i !== index);
    setImages(newImages);
    onImagesChange(newImages.filter(img => !img.error).map(img => img.file));
  }, [images, onImagesChange]);

  const handleBrowseClick = () => {
    fileInputRef.current?.click();
  };

  return (
    <div className="space-y-6">
      <div>
        <h3 className="text-lg font-semibold text-gray-900 mb-2">Upload Images</h3>
        <p className="text-gray-600 text-sm">
          Upload up to {maxFiles} images for processing. Supported formats: {accept.map(type => type.split('/')[1].toUpperCase()).join(', ')}
        </p>
      </div>

      {/* Drop Zone */}
      <div
        {...getRootProps()}
        className={`
          upload-dropzone cursor-pointer
          ${isDragActive ? 'drag-active' : ''}
          ${isDragReject ? 'border-red-300 bg-red-50' : ''}
          ${disabled ? 'opacity-50 cursor-not-allowed' : ''}
        `}
      >
        <input {...getInputProps()} ref={fileInputRef} />
        
        <div className="flex flex-col items-center space-y-4">
          <div className="relative">
            <Upload className={`w-12 h-12 ${
              isDragReject ? 'text-red-400' : isDragActive ? 'text-primary-500' : 'text-gray-400'
            }`} />
            {loading && (
              <div className="absolute inset-0 flex items-center justify-center">
                <div className="w-12 h-12 border-2 border-primary-600 border-t-transparent rounded-full animate-spin" />
              </div>
            )}
          </div>
          
          <div className="text-center">
            <p className="text-lg font-medium text-gray-900 mb-1">
              {isDragActive ? 'Drop images here...' : 'Drag & drop images here'}
            </p>
            <p className="text-gray-600">
              or{' '}
              <button
                type="button"
                onClick={handleBrowseClick}
                className="text-primary-600 hover:text-primary-700 font-medium"
                disabled={disabled}
              >
                browse files
              </button>
            </p>
          </div>
          
          <div className="text-xs text-gray-500 space-y-1 text-center">
            <p>Maximum {maxFiles} files • Up to {maxSize}MB each</p>
            {images.length > 0 && (
              <p>{images.length} / {maxFiles} files selected</p>
            )}
          </div>
        </div>
      </div>

      {/* File Rejections */}
      {fileRejections.length > 0 && (
        <div className="bg-red-50 border border-red-200 rounded-lg p-4">
          <div className="flex items-start space-x-2">
            <AlertCircle className="w-5 h-5 text-red-400 mt-0.5 flex-shrink-0" />
            <div className="space-y-1">
              <p className="text-sm font-medium text-red-800">Some files were rejected:</p>
              <ul className="text-sm text-red-600 space-y-1">
                {fileRejections.map(({ file, errors }, index) => (
                  <li key={index}>
                    <span className="font-medium">{file.name}</span>
                    {errors.map(error => (
                      <span key={error.code} className="ml-2">
                        ({error.message})
                      </span>
                    ))}
                  </li>
                ))}
              </ul>
            </div>
          </div>
        </div>
      )}

      {/* Selected Images */}
      <AnimatePresence>
        {images.length > 0 && (
          <motion.div
            initial={{ opacity: 0, height: 0 }}
            animate={{ opacity: 1, height: 'auto' }}
            exit={{ opacity: 0, height: 0 }}
            transition={{ duration: 0.3 }}
            className="space-y-4"
          >
            <h4 className="font-medium text-gray-900">Selected Images ({images.length})</h4>
            
            <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 gap-4">
              {images.map((image, index) => (
                <motion.div
                  key={index}
                  initial={{ opacity: 0, scale: 0.8 }}
                  animate={{ opacity: 1, scale: 1 }}
                  exit={{ opacity: 0, scale: 0.8 }}
                  transition={{ duration: 0.2 }}
                  className={`relative group card p-2 ${
                    image.error ? 'border-red-200 bg-red-50' : ''
                  }`}
                >
                  {/* Remove button */}
                  <button
                    onClick={() => removeImage(index)}
                    className="absolute -top-2 -right-2 w-6 h-6 bg-red-500 text-white rounded-full flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity duration-200 z-10"
                  >
                    <X className="w-4 h-4" />
                  </button>

                  {/* Image preview or error */}
                  <div className="aspect-square rounded-lg overflow-hidden bg-gray-100 mb-2">
                    {image.error ? (
                      <div className="w-full h-full flex items-center justify-center">
                        <AlertCircle className="w-8 h-8 text-red-400" />
                      </div>
                    ) : image.preview ? (
                      <img
                        src={image.preview}
                        alt={image.file.name}
                        className="w-full h-full object-cover"
                      />
                    ) : (
                      <div className="w-full h-full flex items-center justify-center">
                        <FileImage className="w-8 h-8 text-gray-400" />
                      </div>
                    )}
                  </div>

                  {/* File info */}
                  <div className="text-xs space-y-1">
                    <p className="font-medium text-gray-900 truncate" title={image.file.name}>
                      {image.file.name}
                    </p>
                    
                    {image.error ? (
                      <p className="text-red-600">{image.error}</p>
                    ) : (
                      <div className="text-gray-500 space-y-0.5">
                        <p>{formatFileSize(image.file.size)}</p>
                        {image.dimensions && (
                          <p>{image.dimensions.width} × {image.dimensions.height}</p>
                        )}
                      </div>
                    )}
                  </div>
                </motion.div>
              ))}
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}