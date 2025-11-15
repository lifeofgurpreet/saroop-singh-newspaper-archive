'use client';

import React, { useState, useEffect } from 'react';
import { Search, Filter, Calendar, User, Tag, Grid, List, Download } from 'lucide-react';
import { ResponsiveContainer } from '@/components/layout/responsivecontainer';
import { VStack } from '@/components/layout/flexlayout';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { cn } from '@/lib/utils';
import Image from 'next/image';

interface GalleryItem {
  id: string;
  title: string;
  date: string;
  familyMember?: string;
  tags: string[];
  isPublic: boolean;
  submittedAt: string;
  thumbnailUrl: string;
  restorationCount: number;
}

interface GalleryResponse {
  success: boolean;
  items: GalleryItem[];
  total: number;
  page: number;
  limit: number;
  totalPages: number;
  hasNextPage: boolean;
  hasPreviousPage: boolean;
}

type SortOption = 'newest' | 'oldest' | 'title';
type ViewMode = 'grid' | 'list';

export default function GalleryPage() {
  const [galleryItems, setGalleryItems] = useState<GalleryItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [page, setPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);
  const [hasNextPage, setHasNextPage] = useState(false);
  const [hasPreviousPage, setHasPreviousPage] = useState(false);
  
  // Filter and search states
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedFamily, setSelectedFamily] = useState('');
  const [selectedTag, setSelectedTag] = useState('');
  const [sortBy, setSortBy] = useState<SortOption>('newest');
  const [viewMode, setViewMode] = useState<ViewMode>('grid');
  const [showPublicOnly, setShowPublicOnly] = useState(true);

  // Get unique values for filters
  const [familyMembers, setFamilyMembers] = useState<string[]>([]);
  const [availableTags, setAvailableTags] = useState<string[]>([]);

  const fetchGalleryItems = async () => {
    setLoading(true);
    setError(null);

    try {
      const params = new URLSearchParams({
        page: page.toString(),
        limit: '12',
        public: showPublicOnly.toString(),
        sort: sortBy,
      });

      if (selectedFamily) params.append('family', selectedFamily);
      if (selectedTag) params.append('tag', selectedTag);

      const response = await fetch(`/api/gallery?${params}`);
      
      if (!response.ok) {
        throw new Error('Failed to fetch gallery items');
      }

      const data: GalleryResponse = await response.json();
      
      setGalleryItems(data.items);
      setTotalPages(data.totalPages);
      setHasNextPage(data.hasNextPage);
      setHasPreviousPage(data.hasPreviousPage);

      // Extract unique family members and tags for filters
      const families = new Set<string>();
      const tags = new Set<string>();
      
      data.items.forEach(item => {
        if (item.familyMember) families.add(item.familyMember);
        item.tags.forEach(tag => tags.add(tag));
      });

      setFamilyMembers(Array.from(families).sort());
      setAvailableTags(Array.from(tags).sort());

    } catch (err) {
      setError(err instanceof Error ? err.message : 'An error occurred');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchGalleryItems();
  }, [page, selectedFamily, selectedTag, sortBy, showPublicOnly]);

  // Filter items by search term (client-side)
  const filteredItems = galleryItems.filter(item =>
    searchTerm === '' ||
    item.title.toLowerCase().includes(searchTerm.toLowerCase()) ||
    item.tags.some(tag => tag.toLowerCase().includes(searchTerm.toLowerCase()))
  );

  const handleDownloadItem = async (item: GalleryItem) => {
    try {
      // This would typically download the item's restorations
      alert(`Download functionality for ${item.title} - would download ${item.restorationCount} restorations`);
    } catch (err) {
      setError('Failed to download item');
    }
  };

  const handleNextPage = () => {
    if (hasNextPage) {
      setPage(prev => prev + 1);
    }
  };

  const handlePreviousPage = () => {
    if (hasPreviousPage) {
      setPage(prev => prev - 1);
    }
  };

  const clearFilters = () => {
    setSearchTerm('');
    setSelectedFamily('');
    setSelectedTag('');
    setSortBy('newest');
    setPage(1);
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-purple-50 via-white to-blue-50">
      <ResponsiveContainer className="py-8 sm:py-12">
        <VStack gap="xl">
          {/* Header */}
          <div className="text-center space-y-4">
            <h1 className="text-3xl sm:text-4xl lg:text-5xl font-bold text-gray-900">
              Restoration Gallery
            </h1>
            <p className="text-lg sm:text-xl text-gray-600 leading-relaxed max-w-3xl mx-auto">
              Browse through our collection of AI-restored historical photographs. 
              Each restoration preserves precious memories while bringing them back to life.
            </p>
          </div>

          {/* Filters and Search */}
          <Card className="bg-white/80 backdrop-blur-sm border border-white/20 shadow-xl">
            <CardHeader>
              <CardTitle className="flex items-center space-x-2">
                <Filter className="w-5 h-5" />
                <span>Search & Filter</span>
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              {/* Search Bar */}
              <div className="relative">
                <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 w-5 h-5 text-gray-400" />
                <input
                  type="text"
                  placeholder="Search by title or tags..."
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                  className="w-full pl-10 pr-4 py-3 border border-gray-300 rounded-lg bg-white focus:border-blue-500 focus:ring-2 focus:ring-blue-500/20 transition-colors"
                />
              </div>

              {/* Filter Controls */}
              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
                {/* Family Member Filter */}
                <div className="space-y-2">
                  <label className="text-sm font-medium text-gray-700 flex items-center">
                    <User className="w-4 h-4 mr-1" />
                    Family Member
                  </label>
                  <select
                    value={selectedFamily}
                    onChange={(e) => setSelectedFamily(e.target.value)}
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg bg-white hover:border-gray-400 focus:border-blue-500 focus:ring-2 focus:ring-blue-500/20 transition-colors"
                  >
                    <option value="">All Members</option>
                    {familyMembers.map(member => (
                      <option key={member} value={member}>{member}</option>
                    ))}
                  </select>
                </div>

                {/* Tag Filter */}
                <div className="space-y-2">
                  <label className="text-sm font-medium text-gray-700 flex items-center">
                    <Tag className="w-4 h-4 mr-1" />
                    Style Tag
                  </label>
                  <select
                    value={selectedTag}
                    onChange={(e) => setSelectedTag(e.target.value)}
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg bg-white hover:border-gray-400 focus:border-blue-500 focus:ring-2 focus:ring-blue-500/20 transition-colors"
                  >
                    <option value="">All Styles</option>
                    {availableTags.map(tag => (
                      <option key={tag} value={tag}>{tag}</option>
                    ))}
                  </select>
                </div>

                {/* Sort Options */}
                <div className="space-y-2">
                  <label className="text-sm font-medium text-gray-700 flex items-center">
                    <Calendar className="w-4 h-4 mr-1" />
                    Sort By
                  </label>
                  <select
                    value={sortBy}
                    onChange={(e) => setSortBy(e.target.value as SortOption)}
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg bg-white hover:border-gray-400 focus:border-blue-500 focus:ring-2 focus:ring-blue-500/20 transition-colors"
                  >
                    <option value="newest">Newest First</option>
                    <option value="oldest">Oldest First</option>
                    <option value="title">Title A-Z</option>
                  </select>
                </div>

                {/* View Mode */}
                <div className="space-y-2">
                  <label className="text-sm font-medium text-gray-700">View Mode</label>
                  <div className="flex items-center space-x-1 bg-gray-100 rounded-lg p-1">
                    <button
                      onClick={() => setViewMode('grid')}
                      className={cn(
                        'flex-1 px-3 py-2 rounded-md text-sm font-medium transition-all duration-200',
                        viewMode === 'grid'
                          ? 'bg-white text-gray-900 shadow-sm'
                          : 'text-gray-600 hover:text-gray-900'
                      )}
                    >
                      <Grid className="w-4 h-4 mr-1 inline" />
                      Grid
                    </button>
                    <button
                      onClick={() => setViewMode('list')}
                      className={cn(
                        'flex-1 px-3 py-2 rounded-md text-sm font-medium transition-all duration-200',
                        viewMode === 'list'
                          ? 'bg-white text-gray-900 shadow-sm'
                          : 'text-gray-600 hover:text-gray-900'
                      )}
                    >
                      <List className="w-4 h-4 mr-1 inline" />
                      List
                    </button>
                  </div>
                </div>
              </div>

              {/* Filter Actions */}
              <div className="flex items-center justify-between pt-2 border-t border-gray-200">
                <div className="text-sm text-gray-600">
                  Showing {filteredItems.length} of {galleryItems.length} items
                </div>
                <Button
                  onClick={clearFilters}
                  size="sm"
                  variant="ghost"
                  className="text-gray-600 hover:text-gray-900"
                >
                  Clear Filters
                </Button>
              </div>
            </CardContent>
          </Card>

          {/* Gallery Content */}
          {loading ? (
            <div className="text-center py-12">
              <div className="animate-spin w-8 h-8 border-4 border-blue-600 border-t-transparent rounded-full mx-auto mb-4"></div>
              <p className="text-gray-600">Loading gallery items...</p>
            </div>
          ) : error ? (
            <div className="text-center py-12">
              <div className="text-red-600 mb-4">
                <p className="text-lg font-semibold">Error loading gallery</p>
                <p className="text-sm">{error}</p>
              </div>
              <Button onClick={fetchGalleryItems} variant="outline">
                Try Again
              </Button>
            </div>
          ) : filteredItems.length === 0 ? (
            <div className="text-center py-12">
              <div className="text-gray-500">
                <Search className="w-12 h-12 mx-auto mb-4 opacity-50" />
                <p className="text-lg font-medium mb-2">No items found</p>
                <p className="text-sm">Try adjusting your search or filter criteria.</p>
              </div>
            </div>
          ) : (
            <>
              {/* Gallery Items */}
              {viewMode === 'grid' ? (
                <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
                  {filteredItems.map((item) => (
                    <Card
                      key={item.id}
                      className="group bg-white border border-gray-200 shadow-md hover:shadow-lg transition-all duration-300 overflow-hidden"
                    >
                      <div className="aspect-square relative overflow-hidden bg-gray-100">
                        <Image
                          src={item.thumbnailUrl}
                          alt={item.title}
                          fill
                          className="object-cover group-hover:scale-105 transition-transform duration-300"
                          sizes="(max-width: 640px) 100vw, (max-width: 1024px) 50vw, 25vw"
                          unoptimized
                        />
                      </div>
                      <CardContent className="p-4 space-y-3">
                        <div className="space-y-1">
                          <h3 className="font-semibold text-gray-900 line-clamp-2">{item.title}</h3>
                          <p className="text-sm text-gray-600">{new Date(item.date).toLocaleDateString()}</p>
                          <p className="text-sm text-blue-600">{item.restorationCount} restorations</p>
                        </div>
                        
                        {item.tags.length > 0 && (
                          <div className="flex flex-wrap gap-1">
                            {item.tags.slice(0, 2).map((tag) => (
                              <span
                                key={tag}
                                className="px-2 py-1 bg-gray-100 text-xs text-gray-700 rounded-full"
                              >
                                {tag}
                              </span>
                            ))}
                            {item.tags.length > 2 && (
                              <span className="px-2 py-1 bg-gray-100 text-xs text-gray-700 rounded-full">
                                +{item.tags.length - 2}
                              </span>
                            )}
                          </div>
                        )}

                        <Button
                          onClick={() => handleDownloadItem(item)}
                          size="sm"
                          variant="outline"
                          className="w-full border border-gray-300 hover:border-blue-600 hover:text-blue-600"
                        >
                          <Download className="w-4 h-4 mr-2" />
                          Download
                        </Button>
                      </CardContent>
                    </Card>
                  ))}
                </div>
              ) : (
                <div className="space-y-4">
                  {filteredItems.map((item) => (
                    <Card
                      key={item.id}
                      className="bg-white border border-gray-200 shadow-sm hover:shadow-md transition-all duration-300"
                    >
                      <CardContent className="p-6">
                        <div className="flex items-center space-x-4">
                          <div className="w-20 h-20 flex-shrink-0 rounded-lg overflow-hidden bg-gray-100 relative">
                            <Image
                              src={item.thumbnailUrl}
                              alt={item.title}
                              fill
                              className="object-cover"
                              sizes="80px"
                              unoptimized
                            />
                          </div>
                          
                          <div className="flex-grow space-y-2">
                            <div className="flex items-start justify-between">
                              <div>
                                <h3 className="text-lg font-semibold text-gray-900">{item.title}</h3>
                                <p className="text-sm text-gray-600">
                                  {new Date(item.date).toLocaleDateString()} • {item.restorationCount} restorations
                                </p>
                              </div>
                              
                              <Button
                                onClick={() => handleDownloadItem(item)}
                                size="sm"
                                variant="outline"
                                className="border border-gray-300 hover:border-blue-600 hover:text-blue-600"
                              >
                                <Download className="w-4 h-4 mr-2" />
                                Download
                              </Button>
                            </div>
                            
                            {item.tags.length > 0 && (
                              <div className="flex flex-wrap gap-1">
                                {item.tags.map((tag) => (
                                  <span
                                    key={tag}
                                    className="px-2 py-1 bg-gray-100 text-xs text-gray-700 rounded-full"
                                  >
                                    {tag}
                                  </span>
                                ))}
                              </div>
                            )}
                          </div>
                        </div>
                      </CardContent>
                    </Card>
                  ))}
                </div>
              )}

              {/* Pagination */}
              {totalPages > 1 && (
                <div className="flex items-center justify-center space-x-4">
                  <Button
                    onClick={handlePreviousPage}
                    disabled={!hasPreviousPage}
                    variant="outline"
                  >
                    Previous
                  </Button>
                  
                  <span className="text-sm text-gray-600">
                    Page {page} of {totalPages}
                  </span>
                  
                  <Button
                    onClick={handleNextPage}
                    disabled={!hasNextPage}
                    variant="outline"
                  >
                    Next
                  </Button>
                </div>
              )}
            </>
          )}
        </VStack>
      </ResponsiveContainer>
    </div>
  );
}