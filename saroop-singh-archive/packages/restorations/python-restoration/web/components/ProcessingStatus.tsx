import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { 
  Clock, 
  CheckCircle, 
  XCircle, 
  Loader2, 
  Play, 
  Pause, 
  RotateCcw,
  Download,
  Eye,
  AlertTriangle
} from 'lucide-react';
import { ProcessingJob } from '@/lib/api-client';
import { formatDuration, formatRelativeTime, getStatusColor, cn } from '@/lib/utils';

interface ProcessingStatusProps {
  jobs: ProcessingJob[];
  onRetry?: (jobId: string) => void;
  onCancel?: (jobId: string) => void;
  onDownload?: (jobId: string) => void;
  onView?: (job: ProcessingJob) => void;
  showControls?: boolean;
  compact?: boolean;
}

export default function ProcessingStatus({
  jobs = [],
  onRetry,
  onCancel,
  onDownload,
  onView,
  showControls = true,
  compact = false
}: ProcessingStatusProps) {
  const [expandedJobs, setExpandedJobs] = useState<Set<string>>(new Set());

  const toggleJobExpansion = (jobId: string) => {
    const newExpanded = new Set(expandedJobs);
    if (newExpanded.has(jobId)) {
      newExpanded.delete(jobId);
    } else {
      newExpanded.add(jobId);
    }
    setExpandedJobs(newExpanded);
  };

  const getStatusIcon = (status: string) => {
    switch (status) {
      case 'pending':
        return <Clock className="w-5 h-5 text-gray-500" />;
      case 'processing':
        return <Loader2 className="w-5 h-5 text-blue-500 animate-spin" />;
      case 'completed':
        return <CheckCircle className="w-5 h-5 text-green-500" />;
      case 'failed':
        return <XCircle className="w-5 h-5 text-red-500" />;
      default:
        return <AlertTriangle className="w-5 h-5 text-gray-500" />;
    }
  };

  const getProgressBarColor = (status: string) => {
    switch (status) {
      case 'processing':
        return 'bg-blue-500';
      case 'completed':
        return 'bg-green-500';
      case 'failed':
        return 'bg-red-500';
      default:
        return 'bg-gray-300';
    }
  };

  if (jobs.length === 0) {
    return (
      <div className="text-center py-12">
        <div className="text-gray-400 mb-2">
          <Clock className="w-12 h-12 mx-auto" />
        </div>
        <h3 className="text-lg font-medium text-gray-900 mb-2">No processing jobs</h3>
        <p className="text-gray-600">Upload images to start processing</p>
      </div>
    );
  }

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <h3 className="text-lg font-semibold text-gray-900">
          Processing Status ({jobs.length})
        </h3>
        
        {/* Overall progress summary */}
        <div className="flex items-center space-x-4 text-sm">
          <div className="flex items-center space-x-1">
            <div className="w-3 h-3 bg-gray-300 rounded-full"></div>
            <span className="text-gray-600">{jobs.filter(j => j.status === 'pending').length} pending</span>
          </div>
          <div className="flex items-center space-x-1">
            <div className="w-3 h-3 bg-blue-500 rounded-full"></div>
            <span className="text-blue-600">{jobs.filter(j => j.status === 'processing').length} processing</span>
          </div>
          <div className="flex items-center space-x-1">
            <div className="w-3 h-3 bg-green-500 rounded-full"></div>
            <span className="text-green-600">{jobs.filter(j => j.status === 'completed').length} completed</span>
          </div>
          <div className="flex items-center space-x-1">
            <div className="w-3 h-3 bg-red-500 rounded-full"></div>
            <span className="text-red-600">{jobs.filter(j => j.status === 'failed').length} failed</span>
          </div>
        </div>
      </div>

      <div className="space-y-3">
        <AnimatePresence>
          {jobs.map((job, index) => (
            <motion.div
              key={job.id}
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -20 }}
              transition={{ delay: index * 0.05 }}
              className="card border border-gray-200 hover:border-gray-300 transition-colors duration-200"
            >
              <div className="space-y-4">
                {/* Job Header */}
                <div className="flex items-start space-x-4">
                  <div className="flex-shrink-0 mt-1">
                    {getStatusIcon(job.status)}
                  </div>
                  
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center justify-between mb-2">
                      <div>
                        <h4 className="font-medium text-gray-900 truncate">
                          {job.workflow.name}
                        </h4>
                        <p className="text-sm text-gray-600 truncate">
                          Job ID: {job.id}
                        </p>
                      </div>
                      
                      <div className="flex items-center space-x-2">
                        <span className={cn(
                          'px-2 py-1 rounded-full text-xs font-medium capitalize',
                          getStatusColor(job.status)
                        )}>
                          {job.status}
                        </span>
                        
                        {!compact && (
                          <button
                            onClick={() => toggleJobExpansion(job.id)}
                            className="text-gray-400 hover:text-gray-600"
                          >
                            <motion.div
                              animate={{ rotate: expandedJobs.has(job.id) ? 180 : 0 }}
                              transition={{ duration: 0.2 }}
                            >
                              <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
                              </svg>
                            </motion.div>
                          </button>
                        )}
                      </div>
                    </div>
                    
                    {/* Progress Bar */}
                    <div className="progress-bar mb-2">
                      <motion.div
                        className={cn('progress-fill', getProgressBarColor(job.status))}
                        initial={{ width: 0 }}
                        animate={{ width: `${job.progress}%` }}
                        transition={{ duration: 0.3 }}
                      />
                    </div>
                    
                    <div className="flex items-center justify-between text-xs text-gray-500">
                      <span>{job.progress}% complete</span>
                      <span>{formatRelativeTime(job.createdAt)}</span>
                    </div>
                  </div>
                </div>

                {/* Action Buttons */}
                {showControls && (
                  <div className="flex items-center justify-between">
                    <div className="flex items-center space-x-2">
                      {job.status === 'failed' && onRetry && (
                        <button
                          onClick={() => onRetry(job.id)}
                          className="flex items-center space-x-1 px-3 py-1.5 text-sm bg-primary-100 text-primary-700 rounded-lg hover:bg-primary-200 transition-colors duration-200"
                        >
                          <RotateCcw className="w-4 h-4" />
                          <span>Retry</span>
                        </button>
                      )}
                      
                      {(job.status === 'pending' || job.status === 'processing') && onCancel && (
                        <button
                          onClick={() => onCancel(job.id)}
                          className="flex items-center space-x-1 px-3 py-1.5 text-sm bg-gray-100 text-gray-700 rounded-lg hover:bg-gray-200 transition-colors duration-200"
                        >
                          <Pause className="w-4 h-4" />
                          <span>Cancel</span>
                        </button>
                      )}
                      
                      {onView && (
                        <button
                          onClick={() => onView(job)}
                          className="flex items-center space-x-1 px-3 py-1.5 text-sm bg-gray-100 text-gray-700 rounded-lg hover:bg-gray-200 transition-colors duration-200"
                        >
                          <Eye className="w-4 h-4" />
                          <span>View</span>
                        </button>
                      )}
                    </div>
                    
                    {job.status === 'completed' && onDownload && (
                      <button
                        onClick={() => onDownload(job.id)}
                        className="flex items-center space-x-1 px-3 py-1.5 text-sm bg-green-100 text-green-700 rounded-lg hover:bg-green-200 transition-colors duration-200"
                      >
                        <Download className="w-4 h-4" />
                        <span>Download</span>
                      </button>
                    )}
                  </div>
                )}

                {/* Expanded Details */}
                <AnimatePresence>
                  {expandedJobs.has(job.id) && (
                    <motion.div
                      initial={{ opacity: 0, height: 0 }}
                      animate={{ opacity: 1, height: 'auto' }}
                      exit={{ opacity: 0, height: 0 }}
                      transition={{ duration: 0.2 }}
                      className="border-t border-gray-200 pt-4 space-y-3"
                    >
                      {/* Image Preview */}
                      {job.originalImage && (
                        <div className="flex space-x-4">
                          <div className="space-y-2">
                            <p className="text-xs font-medium text-gray-700">Original</p>
                            <img 
                              src={job.originalImage} 
                              alt="Original"
                              className="w-20 h-20 object-cover rounded-lg border"
                            />
                          </div>
                          
                          {job.processedImage && (
                            <div className="space-y-2">
                              <p className="text-xs font-medium text-gray-700">Processed</p>
                              <img 
                                src={job.processedImage} 
                                alt="Processed"
                                className="w-20 h-20 object-cover rounded-lg border"
                              />
                            </div>
                          )}
                        </div>
                      )}
                      
                      {/* Job Details */}
                      <div className="grid grid-cols-2 gap-4 text-sm">
                        <div>
                          <p className="text-gray-600">File Size</p>
                          <p className="font-medium">{(job.metadata.fileSize / 1024 / 1024).toFixed(2)} MB</p>
                        </div>
                        
                        <div>
                          <p className="text-gray-600">Dimensions</p>
                          <p className="font-medium">{job.metadata.dimensions.width} × {job.metadata.dimensions.height}</p>
                        </div>
                        
                        <div>
                          <p className="text-gray-600">Format</p>
                          <p className="font-medium">{job.metadata.format.toUpperCase()}</p>
                        </div>
                        
                        <div>
                          <p className="text-gray-600">Complexity</p>
                          <p className="font-medium capitalize">{job.workflow.complexity}</p>
                        </div>
                      </div>
                      
                      {/* Error Message */}
                      {job.error && (
                        <div className="bg-red-50 border border-red-200 rounded-lg p-3">
                          <div className="flex items-start space-x-2">
                            <XCircle className="w-4 h-4 text-red-500 mt-0.5 flex-shrink-0" />
                            <div>
                              <p className="text-sm font-medium text-red-800">Error</p>
                              <p className="text-sm text-red-600">{job.error}</p>
                            </div>
                          </div>
                        </div>
                      )}
                      
                      {/* Workflow Parameters */}
                      {Object.keys(job.workflow.parameters).length > 0 && (
                        <div>
                          <p className="text-sm font-medium text-gray-700 mb-2">Workflow Parameters</p>
                          <div className="space-y-1">
                            {Object.entries(job.workflow.parameters).map(([key, value]) => (
                              <div key={key} className="flex justify-between text-xs">
                                <span className="text-gray-600">{key}</span>
                                <span className="font-medium">{String(value)}</span>
                              </div>
                            ))}
                          </div>
                        </div>
                      )}
                    </motion.div>
                  )}
                </AnimatePresence>
              </div>
            </motion.div>
          ))}
        </AnimatePresence>
      </div>
    </div>
  );
}