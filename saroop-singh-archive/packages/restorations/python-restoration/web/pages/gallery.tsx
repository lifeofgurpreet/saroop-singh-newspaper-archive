import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { useRouter } from 'next/router';
import Head from 'next/head';
import { 
  ArrowLeft,
  Grid,
  List,
  Search,
  Filter,
  Download,
  Eye,
  Calendar,
  Clock,
  Tag,
  X,
  ChevronDown,
  Image as ImageIcon,
  RefreshCw
} from 'lucide-react';
import ResultViewer from '@/components/ResultViewer';
import { ProcessingJob, apiClient } from '@/lib/api-client';
import { formatRelativeTime, getStatusColor, cn } from '@/lib/utils';

type ViewMode = 'grid' | 'list';
type FilterStatus = 'all' | 'completed' | 'processing' | 'failed' | 'pending';
type SortOption = 'newest' | 'oldest' | 'name' | 'status';

export default function GalleryPage() {
  const router = useRouter();
  const [jobs, setJobs] = useState<ProcessingJob[]>([]);
  const [filteredJobs, setFilteredJobs] = useState<ProcessingJob[]>([]);
  const [selectedJob, setSelectedJob] = useState<ProcessingJob | null>(null);
  const [viewMode, setViewMode] = useState<ViewMode>('grid');
  const [searchQuery, setSearchQuery] = useState('');
  const [filterStatus, setFilterStatus] = useState<FilterStatus>('all');
  const [sortBy, setSortBy] = useState<SortOption>('newest');
  const [showFilters, setShowFilters] = useState(false);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    loadJobs();
  }, []);

  useEffect(() => {
    // Handle job selection from URL
    if (router.query.job && jobs.length > 0) {
      const jobId = router.query.job as string;
      const job = jobs.find(j => j.id === jobId);
      if (job) {
        setSelectedJob(job);
      }
    }
  }, [router.query.job, jobs]);

  useEffect(() => {
    applyFiltersAndSort();
  }, [jobs, searchQuery, filterStatus, sortBy]);

  const loadJobs = async () => {
    try {
      setLoading(true);
      const jobsData = await apiClient.getJobs(100);
      
      // Add mock data for demonstration
      const mockJobs: ProcessingJob[] = [
        {
          id: 'job_1',
          status: 'completed',
          progress: 100,
          originalImage: '/mock/original1.jpg',
          processedImage: '/mock/processed1.jpg',
          workflow: {
            id: '1',
            name: 'Photo Restoration',
            description: 'Basic photo restoration',
            category: 'restoration',
            parameters: {},
            estimatedTime: 300,
            complexity: 'moderate',
            tags: ['restoration']
          },
          createdAt: new Date(Date.now() - 1000 * 60 * 30).toISOString(),
          completedAt: new Date(Date.now() - 1000 * 60 * 25).toISOString(),
          metadata: {
            fileSize: 2.5 * 1024 * 1024,
            dimensions: { width: 1920, height: 1080 },
            format: 'jpeg'
          }
        },
        {
          id: 'job_2',
          status: 'processing',
          progress: 65,
          originalImage: '/mock/original2.jpg',
          workflow: {
            id: '2',
            name: 'Colorization',
            description: 'Add colors to black and white photos',
            category: 'enhancement',
            parameters: {},
            estimatedTime: 600,
            complexity: 'complex',
            tags: ['colorization']
          },
          createdAt: new Date(Date.now() - 1000 * 60 * 15).toISOString(),
          metadata: {
            fileSize: 1.8 * 1024 * 1024,
            dimensions: { width: 1600, height: 1200 },
            format: 'png'
          }
        },
        {
          id: 'job_3',
          status: 'completed',
          progress: 100,
          originalImage: '/mock/original3.jpg',
          processedImage: '/mock/processed3.jpg',
          workflow: {
            id: '3',
            name: 'Super Resolution',
            description: 'Enhance image resolution',
            category: 'enhancement',
            parameters: {},
            estimatedTime: 180,
            complexity: 'simple',
            tags: ['upscaling']
          },
          createdAt: new Date(Date.now() - 1000 * 60 * 60 * 2).toISOString(),
          completedAt: new Date(Date.now() - 1000 * 60 * 60).toISOString(),
          metadata: {
            fileSize: 5.2 * 1024 * 1024,
            dimensions: { width: 3840, height: 2160 },
            format: 'png'
          }
        },
        {
          id: 'job_4',
          status: 'failed',
          progress: 45,
          originalImage: '/mock/original4.jpg',
          workflow: {
            id: '4',
            name: 'Damage Repair',
            description: 'Repair severe damage',
            category: 'restoration',
            parameters: {},
            estimatedTime: 900,
            complexity: 'complex',
            tags: ['repair']
          },
          createdAt: new Date(Date.now() - 1000 * 60 * 60 * 6).toISOString(),
          error: 'Processing failed due to insufficient image quality',
          metadata: {
            fileSize: 800 * 1024,
            dimensions: { width: 800, height: 600 },
            format: 'jpeg'
          }
        }
      ];

      setJobs([...jobsData, ...mockJobs]);
    } catch (error) {
      console.error('Failed to load jobs:', error);
      setJobs([]);
    } finally {
      setLoading(false);
    }
  };

  const applyFiltersAndSort = () => {
    let filtered = [...jobs];

    // Apply search filter
    if (searchQuery) {
      filtered = filtered.filter(job =>
        job.workflow.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
        job.id.toLowerCase().includes(searchQuery.toLowerCase()) ||
        job.workflow.tags.some(tag => tag.toLowerCase().includes(searchQuery.toLowerCase()))
      );
    }

    // Apply status filter
    if (filterStatus !== 'all') {
      filtered = filtered.filter(job => job.status === filterStatus);
    }

    // Apply sorting
    filtered.sort((a, b) => {
      switch (sortBy) {
        case 'newest':
          return new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime();
        case 'oldest':
          return new Date(a.createdAt).getTime() - new Date(b.createdAt).getTime();
        case 'name':
          return a.workflow.name.localeCompare(b.workflow.name);
        case 'status':
          return a.status.localeCompare(b.status);
        default:
          return 0;
      }
    });

    setFilteredJobs(filtered);
  };

  const handleViewJob = (job: ProcessingJob) => {
    setSelectedJob(job);
    router.push(`/gallery?job=${job.id}`, undefined, { shallow: true });
  };

  const handleCloseViewer = () => {
    setSelectedJob(null);
    router.push('/gallery', undefined, { shallow: true });
  };

  const handleDownloadJob = async (jobId: string, format: 'original' | 'processed' = 'processed') => {
    try {
      const blob = await apiClient.downloadResult(jobId, format);
      const url = URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = `${format}-${jobId}.jpg`;
      document.body.appendChild(a);
      a.click();
      document.body.removeChild(a);
      URL.revokeObjectURL(url);
    } catch (error) {
      console.error('Failed to download job:', error);
    }
  };

  const getStatusCounts = () => {
    return {
      all: jobs.length,
      completed: jobs.filter(j => j.status === 'completed').length,
      processing: jobs.filter(j => j.status === 'processing').length,
      failed: jobs.filter(j => j.status === 'failed').length,
      pending: jobs.filter(j => j.status === 'pending').length
    };
  };

  const statusCounts = getStatusCounts();

  if (selectedJob) {
    return (
      <ResultViewer
        job={selectedJob}
        onDownload={handleDownloadJob}
        onClose={handleCloseViewer}
        fullscreen
      />
    );
  }

  return (
    <>
      <Head>
        <title>Gallery - Photo Restoration Studio</title>
      </Head>

      <div className="min-h-screen bg-gray-50">
        {/* Header */}
        <header className="bg-white shadow-sm border-b border-gray-200">
          <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-4">
            <div className="flex items-center justify-between">
              <div className="flex items-center space-x-4">
                <button
                  onClick={() => router.push('/')}
                  className="p-2 hover:bg-gray-100 rounded-lg transition-colors duration-200"
                >
                  <ArrowLeft className="w-5 h-5 text-gray-600" />
                </button>
                
                <div>
                  <h1 className="text-2xl font-bold text-gray-900">Gallery</h1>
                  <p className="text-gray-600 text-sm">
                    {filteredJobs.length} of {jobs.length} images
                  </p>
                </div>
              </div>

              <div className="flex items-center space-x-4">
                {/* Search */}
                <div className="relative">
                  <Search className="w-4 h-4 text-gray-400 absolute left-3 top-1/2 transform -translate-y-1/2" />
                  <input
                    type="text"
                    placeholder="Search images..."
                    value={searchQuery}
                    onChange={(e) => setSearchQuery(e.target.value)}
                    className="pl-10 pr-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-primary-500 focus:border-primary-500 w-64"
                  />
                  {searchQuery && (
                    <button
                      onClick={() => setSearchQuery('')}
                      className="absolute right-3 top-1/2 transform -translate-y-1/2"
                    >
                      <X className="w-4 h-4 text-gray-400 hover:text-gray-600" />
                    </button>
                  )}
                </div>

                {/* View Mode Toggle */}
                <div className="flex items-center bg-gray-100 rounded-lg p-1">
                  <button
                    onClick={() => setViewMode('grid')}
                    className={`p-2 rounded transition-colors duration-200 ${
                      viewMode === 'grid' ? 'bg-white shadow-sm' : 'hover:bg-gray-200'
                    }`}
                  >
                    <Grid className="w-4 h-4" />
                  </button>
                  <button
                    onClick={() => setViewMode('list')}
                    className={`p-2 rounded transition-colors duration-200 ${
                      viewMode === 'list' ? 'bg-white shadow-sm' : 'hover:bg-gray-200'
                    }`}
                  >
                    <List className="w-4 h-4" />
                  </button>
                </div>

                {/* Filters */}
                <button
                  onClick={() => setShowFilters(!showFilters)}
                  className={`btn-secondary ${showFilters ? 'bg-primary-100 text-primary-700' : ''}`}
                >
                  <Filter className="w-4 h-4 mr-2" />
                  Filters
                  <ChevronDown className={`w-4 h-4 ml-2 transition-transform duration-200 ${
                    showFilters ? 'rotate-180' : ''
                  }`} />
                </button>
              </div>
            </div>

            {/* Filter Panel */}
            <AnimatePresence>
              {showFilters && (
                <motion.div
                  initial={{ opacity: 0, height: 0 }}
                  animate={{ opacity: 1, height: 'auto' }}
                  exit={{ opacity: 0, height: 0 }}
                  transition={{ duration: 0.2 }}
                  className="mt-4 pt-4 border-t border-gray-200"
                >
                  <div className="flex flex-wrap items-center gap-4">
                    {/* Status Filter */}
                    <div className="flex items-center space-x-2">
                      <span className="text-sm font-medium text-gray-700">Status:</span>
                      <div className="flex space-x-1">
                        {(['all', 'completed', 'processing', 'pending', 'failed'] as FilterStatus[]).map(status => (
                          <button
                            key={status}
                            onClick={() => setFilterStatus(status)}
                            className={`px-3 py-1 text-sm rounded-full transition-colors duration-200 ${
                              filterStatus === status
                                ? 'bg-primary-600 text-white'
                                : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
                            }`}
                          >
                            {status.charAt(0).toUpperCase() + status.slice(1)}
                            <span className="ml-1 text-xs opacity-75">
                              ({statusCounts[status]})
                            </span>
                          </button>
                        ))}
                      </div>
                    </div>

                    {/* Sort */}
                    <div className="flex items-center space-x-2">
                      <span className="text-sm font-medium text-gray-700">Sort by:</span>
                      <select
                        value={sortBy}
                        onChange={(e) => setSortBy(e.target.value as SortOption)}
                        className="px-3 py-1 text-sm border border-gray-300 rounded focus:outline-none focus:ring-2 focus:ring-primary-500 focus:border-primary-500"
                      >
                        <option value="newest">Newest first</option>
                        <option value="oldest">Oldest first</option>
                        <option value="name">Name</option>
                        <option value="status">Status</option>
                      </select>
                    </div>
                  </div>
                </motion.div>
              )}
            </AnimatePresence>
          </div>
        </header>

        <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
          {loading ? (
            <div className="space-y-4">
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
                {Array.from({ length: 8 }).map((_, i) => (
                  <div key={i} className="card animate-pulse">
                    <div className="aspect-square bg-gray-200 rounded-lg mb-4" />
                    <div className="h-4 bg-gray-200 rounded w-3/4 mb-2" />
                    <div className="h-3 bg-gray-200 rounded w-1/2" />
                  </div>
                ))}
              </div>
            </div>
          ) : filteredJobs.length === 0 ? (
            <div className="text-center py-16">
              <div className="text-gray-400 mb-4">
                <ImageIcon className="w-16 h-16 mx-auto" />
              </div>
              <h3 className="text-xl font-semibold text-gray-900 mb-2">
                {jobs.length === 0 ? 'No images yet' : 'No matching images'}
              </h3>
              <p className="text-gray-600 mb-6">
                {jobs.length === 0 
                  ? 'Start processing your first images to see them here.'
                  : 'Try adjusting your search or filters to find what you\'re looking for.'
                }
              </p>
              {jobs.length === 0 && (
                <button
                  onClick={() => router.push('/process')}
                  className="btn-primary"
                >
                  Start Processing
                </button>
              )}
            </div>
          ) : (
            <div className={
              viewMode === 'grid'
                ? 'grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6'
                : 'space-y-4'
            }>
              {filteredJobs.map((job, index) => (
                <motion.div
                  key={job.id}
                  initial={{ opacity: 0, y: 20 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ delay: index * 0.05 }}
                  className={
                    viewMode === 'grid'
                      ? 'card-hover cursor-pointer group'
                      : 'card-hover cursor-pointer flex items-center space-x-4 p-4'
                  }
                  onClick={() => handleViewJob(job)}
                >
                  {viewMode === 'grid' ? (
                    <>
                      {/* Image */}
                      <div className="aspect-square bg-gray-100 rounded-lg overflow-hidden mb-4 relative">
                        {job.processedImage || job.originalImage ? (
                          <img
                            src={job.processedImage || job.originalImage}
                            alt={job.workflow.name}
                            className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-200"
                          />
                        ) : (
                          <div className="w-full h-full flex items-center justify-center">
                            <ImageIcon className="w-8 h-8 text-gray-400" />
                          </div>
                        )}
                        
                        {/* Status badge */}
                        <div className="absolute top-2 right-2">
                          <span className={cn(
                            'px-2 py-1 text-xs font-medium rounded-full',
                            getStatusColor(job.status)
                          )}>
                            {job.status}
                          </span>
                        </div>

                        {/* Processing indicator */}
                        {job.status === 'processing' && (
                          <div className="absolute bottom-2 left-2 right-2">
                            <div className="progress-bar bg-black/20">
                              <div 
                                className="progress-fill bg-white"
                                style={{ width: `${job.progress}%` }}
                              />
                            </div>
                          </div>
                        )}
                      </div>

                      {/* Info */}
                      <div className="space-y-2">
                        <h3 className="font-medium text-gray-900 group-hover:text-primary-600 transition-colors">
                          {job.workflow.name}
                        </h3>
                        
                        <div className="flex items-center space-x-2 text-xs text-gray-500">
                          <Calendar className="w-3 h-3" />
                          <span>{formatRelativeTime(job.createdAt)}</span>
                        </div>

                        <div className="flex items-center space-x-2">
                          {job.workflow.tags.slice(0, 2).map(tag => (
                            <span key={tag} className="px-2 py-1 bg-gray-100 text-gray-600 rounded text-xs">
                              {tag}
                            </span>
                          ))}
                        </div>
                      </div>
                    </>
                  ) : (
                    <>
                      {/* Thumbnail */}
                      <div className="w-16 h-16 bg-gray-100 rounded-lg overflow-hidden flex-shrink-0">
                        {job.processedImage || job.originalImage ? (
                          <img
                            src={job.processedImage || job.originalImage}
                            alt={job.workflow.name}
                            className="w-full h-full object-cover"
                          />
                        ) : (
                          <div className="w-full h-full flex items-center justify-center">
                            <ImageIcon className="w-6 h-6 text-gray-400" />
                          </div>
                        )}
                      </div>

                      {/* Info */}
                      <div className="flex-1 min-w-0">
                        <h3 className="font-medium text-gray-900 truncate">
                          {job.workflow.name}
                        </h3>
                        <p className="text-sm text-gray-600 truncate">
                          {job.id} • {job.metadata.dimensions.width} × {job.metadata.dimensions.height}
                        </p>
                        <div className="flex items-center space-x-4 mt-1">
                          <div className="flex items-center space-x-1 text-xs text-gray-500">
                            <Calendar className="w-3 h-3" />
                            <span>{formatRelativeTime(job.createdAt)}</span>
                          </div>
                          
                          {job.status === 'processing' && (
                            <div className="flex items-center space-x-2">
                              <div className="w-16 progress-bar">
                                <div 
                                  className="progress-fill"
                                  style={{ width: `${job.progress}%` }}
                                />
                              </div>
                              <span className="text-xs text-gray-500">{job.progress}%</span>
                            </div>
                          )}
                        </div>
                      </div>

                      {/* Status and actions */}
                      <div className="flex items-center space-x-2">
                        <span className={cn(
                          'px-2 py-1 text-xs font-medium rounded-full',
                          getStatusColor(job.status)
                        )}>
                          {job.status}
                        </span>
                        
                        {job.status === 'completed' && (
                          <button
                            onClick={(e) => {
                              e.stopPropagation();
                              handleDownloadJob(job.id);
                            }}
                            className="p-1.5 text-gray-400 hover:text-primary-600 transition-colors duration-200"
                            title="Download"
                          >
                            <Download className="w-4 h-4" />
                          </button>
                        )}
                      </div>
                    </>
                  )}
                </motion.div>
              ))}
            </div>
          )}
        </main>
      </div>
    </>
  );
}