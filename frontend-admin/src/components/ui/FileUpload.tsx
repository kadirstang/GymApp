'use client';

import { useState, useRef, ChangeEvent } from 'react';
import Image from 'next/image';
import { Upload, X, Image as ImageIcon, Loader2 } from 'lucide-react';
import { Button } from './Button';

interface FileUploadProps {
  label?: string;
  accept?: string;
  maxSize?: number; // in bytes
  value?: string | null;
  onChange: (file: File | null) => void;
  onUpload?: (file: File) => Promise<string>;
  preview?: boolean;
  disabled?: boolean;
  error?: string;
  helperText?: string;
}

export function FileUpload({
  label = 'Upload File',
  accept = 'image/*',
  maxSize = 5 * 1024 * 1024, // 5MB default
  value,
  onChange,
  onUpload,
  preview = true,
  disabled = false,
  error,
  helperText,
}: FileUploadProps) {
  const [uploading, setUploading] = useState(false);
  const [previewUrl, setPreviewUrl] = useState<string | null>(value || null);
  const [localError, setLocalError] = useState<string | null>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const handleFileSelect = async (e: ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    // Validate file size
    if (file.size > maxSize) {
      const sizeMB = (maxSize / (1024 * 1024)).toFixed(0);
      setLocalError(`File size must be less than ${sizeMB}MB`);
      return;
    }

    // Validate file type
    if (accept && !file.type.match(accept.replace('*', '.*'))) {
      setLocalError('Invalid file type');
      return;
    }

    setLocalError(null);

    // Create preview for images
    if (preview && file.type.startsWith('image/')) {
      const reader = new FileReader();
      reader.onloadend = () => {
        setPreviewUrl(reader.result as string);
      };
      reader.readAsDataURL(file);
    }

    // If onUpload is provided, upload immediately
    if (onUpload) {
      try {
        setUploading(true);
        const uploadedUrl = await onUpload(file);
        setPreviewUrl(uploadedUrl);
        onChange(file);
      } catch (err: unknown) {
        const message = err instanceof Error ? err.message : 'Upload failed';
        setLocalError(message);
        setPreviewUrl(null);
      } finally {
        setUploading(false);
      }
    } else {
      // Otherwise just pass the file to parent
      onChange(file);
    }
  };

  const handleRemove = () => {
    setPreviewUrl(null);
    setLocalError(null);
    onChange(null);
    if (fileInputRef.current) {
      fileInputRef.current.value = '';
    }
  };

  const handleClick = () => {
    fileInputRef.current?.click();
  };

  const displayError = error || localError;

  return (
    <div className="space-y-2">
      {label && (
        <label className="block text-sm font-medium text-gray-700">
          {label}
        </label>
      )}

      <div className="space-y-3">
        {/* Preview */}
        {previewUrl && preview && (
          <div className="relative inline-block">
            <div className="relative w-48 h-48 rounded-lg border-2 border-gray-200 overflow-hidden bg-gray-50">
              <Image
                src={previewUrl}
                alt="Preview"
                fill
                className="object-cover"
                unoptimized
              />
              {!disabled && (
                <button
                  type="button"
                  onClick={handleRemove}
                  className="absolute top-2 right-2 p-1 bg-red-500 text-white rounded-full hover:bg-red-600 transition-colors"
                  disabled={uploading}
                >
                  <X className="w-4 h-4" />
                </button>
              )}
              {uploading && (
                <div className="absolute inset-0 bg-black bg-opacity-50 flex items-center justify-center">
                  <Loader2 className="w-8 h-8 text-white animate-spin" />
                </div>
              )}
            </div>
          </div>
        )}

        {/* Upload Button/Area */}
        {!previewUrl && (
          <div
            onClick={handleClick}
            className={`
              relative border-2 border-dashed rounded-lg p-8
              transition-colors duration-200
              ${disabled ? 'bg-gray-50 cursor-not-allowed border-gray-200' : 'cursor-pointer hover:border-primary-500 hover:bg-primary-50 border-gray-300'}
              ${displayError ? 'border-red-500 bg-red-50' : ''}
              ${uploading ? 'opacity-50 pointer-events-none' : ''}
            `}
          >
            <div className="flex flex-col items-center justify-center space-y-3">
              {uploading ? (
                <>
                  <Loader2 className="w-10 h-10 text-primary-600 animate-spin" />
                  <p className="text-sm text-gray-600">Uploading...</p>
                </>
              ) : (
                <>
                  {accept.includes('image') ? (
                    <ImageIcon className="w-10 h-10 text-gray-400" />
                  ) : (
                    <Upload className="w-10 h-10 text-gray-400" />
                  )}
                  <div className="text-center">
                    <p className="text-sm text-gray-600">
                      Click to upload or drag and drop
                    </p>
                    <p className="text-xs text-gray-500 mt-1">
                      {accept === 'image/*' ? 'PNG, JPG, GIF, WEBP' : accept.toUpperCase()}
                      {' up to '}
                      {(maxSize / (1024 * 1024)).toFixed(0)}MB
                    </p>
                  </div>
                </>
              )}
            </div>
          </div>
        )}

        {/* Hidden input */}
        <input
          ref={fileInputRef}
          type="file"
          accept={accept}
          onChange={handleFileSelect}
          className="hidden"
          disabled={disabled || uploading}
        />

        {/* Change button for when preview exists */}
        {previewUrl && !disabled && (
          <Button
            type="button"
            variant="outline"
            onClick={handleClick}
            disabled={uploading}
            className="w-full sm:w-auto"
          >
            <Upload className="w-4 h-4 mr-2" />
            Change File
          </Button>
        )}
      </div>

      {/* Helper text or error */}
      {helperText && !displayError && (
        <p className="text-sm text-gray-500">{helperText}</p>
      )}
      {displayError && (
        <p className="text-sm text-red-600">{displayError}</p>
      )}
    </div>
  );
}
