'use client';

import React, { useState } from 'react';
import { Download, Share, BookOpen, Filter, Grid, List } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog';
import { RestorationCard } from './restorationcard';
import { ComparisonView } from './comparisonview';
import { cn } from '@/lib/utils';

interface RestorationResult {
  id: string;
  name: string;
  style: string;
  description: string;
  imageUrl: string;
  downloadUrl: string;
}

interface RestorationGridProps {
  restorations: RestorationResult[];
  originalImage: string;
  onDownloadSingle: (restoration: RestorationResult) => void;
  onDownloadAll: () => void;
  onSubmitToGallery?: (selectedRestorations: RestorationResult[]) => void;
  className?: string;
}

type ViewMode = 'grid' | 'comparison';
type FilterType = 'all' | 'enhanced' | 'artistic' | 'repair';

export function RestorationGrid({
  restorations,
  originalImage,
  onDownloadSingle,
  onDownloadAll,
  onSubmitToGallery,
  className,
}: RestorationGridProps) {
  const [viewMode, setViewMode] = useState<ViewMode>('grid');
  const [filter, setFilter] = useState<FilterType>('all');
  const [selectedRestorations, setSelectedRestorations] = useState<Set<string>>(new Set());
  const [favorites, setFavorites] = useState<Set<string>>(new Set());
  const [showGalleryDialog, setShowGalleryDialog] = useState(false);

  const filterRestorations = (restorations: RestorationResult[], filterType: FilterType) => {
    switch (filterType) {
      case 'enhanced':
        return restorations.filter(r => 
          r.name.includes('Enhancement') || r.name.includes('Basic')
        );
      case 'artistic':
        return restorations.filter(r => 
          r.name.includes('Artistic') || r.name.includes('Color')
        );
      case 'repair':
        return restorations.filter(r => 
          r.name.includes('Repair') || r.name.includes('Damage') || r.name.includes('Preservation')
        );
      default:
        return restorations;
    }
  };

  const filteredRestorations = filterRestorations(restorations, filter);

  const handleRestorationSelect = (restoration: RestorationResult, selected: boolean) => {
    const newSelected = new Set(selectedRestorations);
    if (selected) {
      newSelected.add(restoration.id);
    } else {
      newSelected.delete(restoration.id);
    }
    setSelectedRestorations(newSelected);
  };

  const handleFavorite = (restoration: RestorationResult) => {
    const newFavorites = new Set(favorites);
    if (favorites.has(restoration.id)) {
      newFavorites.delete(restoration.id);
    } else {
      newFavorites.add(restoration.id);
    }
    setFavorites(newFavorites);
  };

  const handleSubmitToGallery = () => {
    if (onSubmitToGallery) {
      const selected = restorations.filter(r => selectedRestorations.has(r.id));
      onSubmitToGallery(selected);
    }
    setShowGalleryDialog(false);
  };

  const handleSelectAll = () => {
    if (selectedRestorations.size === filteredRestorations.length) {
      setSelectedRestorations(new Set());
    } else {
      setSelectedRestorations(new Set(filteredRestorations.map(r => r.id)));
    }
  };

  return (
    <div className={cn('space-y-6', className)}>
      {/* Header */}
      <Card className="bg-white/80 backdrop-blur-sm border border-white/20 shadow-xl">
        <CardHeader>
          <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
            <div>
              <CardTitle className="text-xl sm:text-2xl">Restoration Results</CardTitle>
              <CardDescription>
                {restorations.length} restoration styles generated. Compare and download your favorites.
              </CardDescription>
            </div>
            
            <div className="flex items-center space-x-2">
              <Button
                onClick={onDownloadAll}
                variant="outline"
                className="border-2 border-blue-600 text-blue-600 hover:bg-blue-600 hover:text-white"
              >
                <Download className="w-4 h-4 mr-2" />
                Download All
              </Button>
              
              {onSubmitToGallery && (
                <Dialog open={showGalleryDialog} onOpenChange={setShowGalleryDialog}>
                  <DialogTrigger asChild>
                    <Button
                      disabled={selectedRestorations.size === 0}
                      className="bg-purple-600 hover:bg-purple-700 text-white"
                    >
                      <BookOpen className="w-4 h-4 mr-2" />
                      Add to Gallery
                    </Button>
                  </DialogTrigger>
                  <DialogContent>
                    <DialogHeader>
                      <DialogTitle>Submit to Gallery</DialogTitle>
                      <DialogDescription>
                        Add selected restorations to your public gallery. 
                        You have {selectedRestorations.size} restoration(s) selected.
                      </DialogDescription>
                    </DialogHeader>
                    <div className="flex items-center justify-end space-x-2 pt-4">
                      <Button
                        onClick={() => setShowGalleryDialog(false)}
                        variant="outline"
                      >
                        Cancel
                      </Button>
                      <Button
                        onClick={handleSubmitToGallery}
                        className="bg-purple-600 hover:bg-purple-700 text-white"
                      >
                        Submit to Gallery
                      </Button>
                    </div>
                  </DialogContent>
                </Dialog>
              )}
            </div>
          </div>
        </CardHeader>

        {/* Controls */}
        <CardContent className="pt-0 space-y-4">
          <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
            {/* View Mode Toggle */}
            <div className="flex items-center space-x-1 bg-gray-100 rounded-lg p-1">
              <button
                onClick={() => setViewMode('grid')}
                className={cn(
                  'px-3 py-2 rounded-md text-sm font-medium transition-all duration-200',
                  viewMode === 'grid'
                    ? 'bg-white text-gray-900 shadow-sm'
                    : 'text-gray-600 hover:text-gray-900'
                )}
              >
                <Grid className="w-4 h-4 mr-2 inline" />
                Grid
              </button>
              <button
                onClick={() => setViewMode('comparison')}
                className={cn(
                  'px-3 py-2 rounded-md text-sm font-medium transition-all duration-200',
                  viewMode === 'comparison'
                    ? 'bg-white text-gray-900 shadow-sm'
                    : 'text-gray-600 hover:text-gray-900'
                )}
              >
                <List className="w-4 h-4 mr-2 inline" />
                Compare
              </button>
            </div>

            {/* Filters */}
            <div className="flex items-center space-x-2">
              <Filter className="w-4 h-4 text-gray-500" />
              <select
                value={filter}
                onChange={(e) => setFilter(e.target.value as FilterType)}
                className="px-3 py-2 border border-gray-300 rounded-lg text-sm bg-white hover:border-gray-400 focus:border-blue-500 focus:ring-2 focus:ring-blue-500/20 transition-colors"
              >
                <option value="all">All Styles ({restorations.length})</option>
                <option value="enhanced">Enhanced ({filterRestorations(restorations, 'enhanced').length})</option>
                <option value="artistic">Artistic ({filterRestorations(restorations, 'artistic').length})</option>
                <option value="repair">Repair ({filterRestorations(restorations, 'repair').length})</option>
              </select>
            </div>
          </div>

          {/* Selection Controls */}
          {onSubmitToGallery && (
            <div className="flex items-center justify-between p-3 bg-gray-50 rounded-lg">
              <span className="text-sm text-gray-600">
                {selectedRestorations.size} of {filteredRestorations.length} selected
              </span>
              <Button
                onClick={handleSelectAll}
                size="sm"
                variant="ghost"
                className="text-blue-600 hover:text-blue-700"
              >
                {selectedRestorations.size === filteredRestorations.length ? 'Deselect All' : 'Select All'}
              </Button>
            </div>
          )}
        </CardContent>
      </Card>

      {/* Content */}
      {viewMode === 'grid' ? (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
          {filteredRestorations.map((restoration) => (
            <RestorationCard
              key={restoration.id}
              restoration={restoration}
              originalImage={originalImage}
              onDownload={onDownloadSingle}
              onFavorite={handleFavorite}
              onSelect={onSubmitToGallery ? handleRestorationSelect : undefined}
              isSelected={selectedRestorations.has(restoration.id)}
              isFavorited={favorites.has(restoration.id)}
              showComparison={true}
              showSelection={!!onSubmitToGallery}
            />
          ))}
        </div>
      ) : (
        <ComparisonView
          restorations={filteredRestorations}
          originalImage={originalImage}
          onDownload={onDownloadSingle}
          onFavorite={handleFavorite}
          onSelect={onSubmitToGallery ? handleRestorationSelect : undefined}
          selectedRestorations={selectedRestorations}
          favorites={favorites}
        />
      )}

      {filteredRestorations.length === 0 && (
        <div className="text-center py-12">
          <div className="text-gray-500">
            <Filter className="w-12 h-12 mx-auto mb-4 opacity-50" />
            <p className="text-lg font-medium mb-2">No restorations found</p>
            <p className="text-sm">Try changing the filter to see more results.</p>
          </div>
        </div>
      )}
    </div>
  );
}