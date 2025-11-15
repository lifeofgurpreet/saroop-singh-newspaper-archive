'use client';

import React, { useState } from 'react';
import Image from 'next/image';
import { Download, Heart, ArrowLeft, ArrowRight, Eye, Check } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Card, CardContent } from '@/components/ui/card';
import { cn } from '@/lib/utils';

interface RestorationResult {
  id: string;
  name: string;
  style: string;
  description: string;
  imageUrl: string;
  downloadUrl: string;
}

interface ComparisonViewProps {
  restorations: RestorationResult[];
  originalImage: string;
  onDownload: (restoration: RestorationResult) => void;
  onFavorite: (restoration: RestorationResult) => void;
  onSelect?: (restoration: RestorationResult, selected: boolean) => void;
  selectedRestorations: Set<string>;
  favorites: Set<string>;
  className?: string;
}

export function ComparisonView({
  restorations,
  originalImage,
  onDownload,
  onFavorite,
  onSelect,
  selectedRestorations,
  favorites,
  className,
}: ComparisonViewProps) {
  const [currentIndex, setCurrentIndex] = useState(0);
  const [showOriginal, setShowOriginal] = useState(false);

  const currentRestoration = restorations[currentIndex];
  const isSelected = selectedRestorations.has(currentRestoration?.id);
  const isFavorited = favorites.has(currentRestoration?.id);

  const handlePrevious = () => {
    setCurrentIndex((prev) => (prev > 0 ? prev - 1 : restorations.length - 1));
  };

  const handleNext = () => {
    setCurrentIndex((prev) => (prev < restorations.length - 1 ? prev + 1 : 0));
  };

  const handleSelect = () => {
    if (onSelect && currentRestoration) {
      onSelect(currentRestoration, !isSelected);
    }
  };

  const handleFavorite = () => {
    if (currentRestoration) {
      onFavorite(currentRestoration);
    }
  };

  const handleDownload = () => {
    if (currentRestoration) {
      onDownload(currentRestoration);
    }
  };

  if (!currentRestoration) {
    return (
      <div className="text-center py-12">
        <p className="text-gray-500">No restorations available for comparison.</p>
      </div>
    );
  }

  return (
    <div className={cn('space-y-6', className)}>
      {/* Main Comparison Card */}
      <Card className="bg-white/80 backdrop-blur-sm border border-white/20 shadow-xl overflow-hidden">
        <div className="relative">
          {/* Main Image Display */}
          <div className="relative aspect-[4/3] sm:aspect-[16/10] bg-gray-100">
            {/* Original Image */}
            <div 
              className={cn(
                'absolute inset-0 transition-opacity duration-500',
                showOriginal ? 'opacity-100' : 'opacity-0'
              )}
            >
              <Image
                src={originalImage}
                alt="Original"
                fill
                className="object-contain bg-gray-50"
                sizes="(max-width: 640px) 100vw, (max-width: 1024px) 100vw, 100vw"
                priority={true}
              />
              <div className="absolute bottom-4 left-4 bg-black/80 text-white px-3 py-2 rounded-lg">
                <span className="text-sm font-medium">Original Photo</span>
              </div>
            </div>
            
            {/* Restored Image */}
            <div 
              className={cn(
                'absolute inset-0 transition-opacity duration-500',
                showOriginal ? 'opacity-0' : 'opacity-100'
              )}
            >
              <Image
                src={currentRestoration.imageUrl}
                alt={currentRestoration.name}
                fill
                className="object-contain bg-gray-50"
                sizes="(max-width: 640px) 100vw, (max-width: 1024px) 100vw, 100vw"
              />
              <div className="absolute bottom-4 left-4 bg-blue-600/90 text-white px-3 py-2 rounded-lg">
                <span className="text-sm font-medium">{currentRestoration.name}</span>
              </div>
            </div>

            {/* Toggle Button */}
            <button
              onClick={() => setShowOriginal(!showOriginal)}
              className={cn(
                'absolute top-4 right-4 bg-white/90 hover:bg-white text-gray-700 p-3 rounded-full shadow-lg transition-all duration-200 z-10',
                showOriginal && 'ring-2 ring-blue-500'
              )}
              aria-label="Toggle between original and restored"
            >
              <Eye className="w-5 h-5" />
            </button>

            {/* Selection Button */}
            {onSelect && (
              <button
                onClick={handleSelect}
                className={cn(
                  'absolute top-4 left-4 w-8 h-8 rounded-full border-2 flex items-center justify-center transition-all duration-200 z-10',
                  isSelected
                    ? 'bg-blue-600 border-blue-600 text-white shadow-lg'
                    : 'bg-white/90 border-gray-300 hover:border-blue-400 hover:bg-white'
                )}
                aria-label={isSelected ? 'Deselect restoration' : 'Select restoration'}
              >
                {isSelected && <Check className="w-4 h-4" />}
              </button>
            )}

            {/* Navigation */}
            <div className="absolute inset-y-0 left-0 flex items-center">
              <button
                onClick={handlePrevious}
                disabled={restorations.length <= 1}
                className="ml-4 bg-white/90 hover:bg-white text-gray-700 p-2 rounded-full shadow-lg transition-all duration-200 disabled:opacity-50 disabled:cursor-not-allowed"
                aria-label="Previous restoration"
              >
                <ArrowLeft className="w-5 h-5" />
              </button>
            </div>

            <div className="absolute inset-y-0 right-0 flex items-center">
              <button
                onClick={handleNext}
                disabled={restorations.length <= 1}
                className="mr-4 bg-white/90 hover:bg-white text-gray-700 p-2 rounded-full shadow-lg transition-all duration-200 disabled:opacity-50 disabled:cursor-not-allowed"
                aria-label="Next restoration"
              >
                <ArrowRight className="w-5 h-5" />
              </button>
            </div>
          </div>

          {/* Progress Indicator */}
          <div className="absolute bottom-4 left-1/2 transform -translate-x-1/2 flex items-center space-x-2">
            {restorations.map((_, index) => (
              <button
                key={index}
                onClick={() => setCurrentIndex(index)}
                className={cn(
                  'w-2 h-2 rounded-full transition-all duration-200',
                  index === currentIndex
                    ? 'bg-white w-6'
                    : 'bg-white/60 hover:bg-white/80'
                )}
                aria-label={`View restoration ${index + 1}`}
              />
            ))}
          </div>
        </div>

        {/* Content */}
        <CardContent className="p-6">
          <div className="flex flex-col sm:flex-row sm:items-start sm:justify-between gap-4">
            <div className="space-y-2 flex-1">
              <h3 className="text-xl font-semibold text-gray-900">
                {currentRestoration.name}
              </h3>
              <p className="text-gray-600 leading-relaxed">
                {currentRestoration.description}
              </p>
              
              {/* Style Info */}
              <div className="flex items-center space-x-4 text-sm text-gray-500">
                <span>Style: {currentRestoration.style}</span>
                <span>•</span>
                <span>{currentIndex + 1} of {restorations.length}</span>
              </div>
            </div>

            {/* Actions */}
            <div className="flex items-center space-x-3">
              <Button
                onClick={handleFavorite}
                size="sm"
                variant="ghost"
                className={cn(
                  'p-2 hover:bg-gray-100',
                  isFavorited && 'text-red-500 hover:text-red-600'
                )}
                aria-label={isFavorited ? 'Remove from favorites' : 'Add to favorites'}
              >
                <Heart className={cn('w-5 h-5', isFavorited && 'fill-current')} />
              </Button>

              <Button
                onClick={handleDownload}
                className="bg-blue-600 hover:bg-blue-700 text-white"
              >
                <Download className="w-4 h-4 mr-2" />
                Download
              </Button>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Thumbnail Navigation */}
      <div className="grid grid-cols-3 sm:grid-cols-6 lg:grid-cols-12 gap-2">
        {restorations.map((restoration, index) => (
          <button
            key={restoration.id}
            onClick={() => setCurrentIndex(index)}
            className={cn(
              'relative aspect-square rounded-lg overflow-hidden border-2 transition-all duration-200',
              index === currentIndex
                ? 'border-blue-600 ring-2 ring-blue-600/20'
                : 'border-gray-200 hover:border-gray-300'
            )}
          >
            <Image
              src={restoration.imageUrl}
              alt={restoration.name}
              fill
              className="object-cover"
              sizes="(max-width: 640px) 33vw, (max-width: 1024px) 16vw, 8vw"
            />
            <div className="absolute inset-0 bg-black/0 hover:bg-black/10 transition-colors duration-200" />
            
            {/* Selection Indicator */}
            {selectedRestorations.has(restoration.id) && (
              <div className="absolute top-1 right-1 w-4 h-4 bg-blue-600 rounded-full flex items-center justify-center">
                <Check className="w-2 h-2 text-white" />
              </div>
            )}

            {/* Favorite Indicator */}
            {favorites.has(restoration.id) && (
              <div className="absolute top-1 left-1">
                <Heart className="w-3 h-3 text-red-500 fill-current" />
              </div>
            )}
          </button>
        ))}
      </div>

      {/* Instructions */}
      <Card className="bg-blue-50 border-blue-200">
        <CardContent className="p-4">
          <div className="flex items-start space-x-3">
            <Eye className="w-5 h-5 text-blue-600 mt-0.5" />
            <div className="space-y-1">
              <p className="text-sm font-medium text-blue-900">Comparison Mode</p>
              <p className="text-sm text-blue-700">
                Click the eye icon or use keyboard arrows to compare the original with restored versions. 
                Click thumbnails below to switch between different restoration styles.
              </p>
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}