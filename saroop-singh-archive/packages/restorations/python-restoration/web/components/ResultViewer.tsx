import React, { useState, useRef } from 'react';
import { motion } from 'framer-motion';
import { 
  ReactCompareSlider, 
  ReactCompareSliderImage,
  ReactCompareSliderHandle 
} from 'react-compare-slider';
import { 
  Download, 
  ZoomIn, 
  ZoomOut, 
  RotateCw, 
  Maximize2,
  Eye,
  EyeOff,
  Copy,
  Share2,
  Info
} from 'lucide-react';
import { ProcessingJob } from '@/lib/api-client';
import { formatFileSize, copyToClipboard } from '@/lib/utils';

interface ResultViewerProps {
  job: ProcessingJob;
  onDownload?: (jobId: string, format: 'original' | 'processed') => void;
  onClose?: () => void;
  fullscreen?: boolean;
}

export default function ResultViewer({
  job,
  onDownload,
  onClose,
  fullscreen = false
}: ResultViewerProps) {
  const [showComparison, setShowComparison] = useState(true);
  const [zoom, setZoom] = useState(1);
  const [rotation, setRotation] = useState(0);
  const [showInfo, setShowInfo] = useState(false);
  const [copiedJobId, setCopiedJobId] = useState(false);
  const containerRef = useRef<HTMLDivElement>(null);

  if (!job.originalImage || !job.processedImage) {
    return (
      <div className="text-center py-12">
        <div className="text-gray-400 mb-2">
          <Eye className="w-12 h-12 mx-auto" />
        </div>
        <h3 className="text-lg font-medium text-gray-900 mb-2">No results available</h3>
        <p className="text-gray-600">
          {job.status === 'completed' 
            ? 'Processing completed but no results are available for viewing.'
            : `Job is currently ${job.status}.`
          }
        </p>
      </div>
    );
  }

  const handleZoomIn = () => {
    setZoom(prev => Math.min(prev + 0.25, 3));
  };

  const handleZoomOut = () => {
    setZoom(prev => Math.max(prev - 0.25, 0.25));
  };

  const handleRotate = () => {
    setRotation(prev => (prev + 90) % 360);
  };

  const handleCopyJobId = async () => {
    try {
      await copyToClipboard(job.id);
      setCopiedJobId(true);
      setTimeout(() => setCopiedJobId(false), 2000);
    } catch (error) {
      console.error('Failed to copy job ID:', error);
    }
  };

  return (
    <div className={`
      ${fullscreen ? 'fixed inset-0 bg-black z-50' : 'relative bg-white rounded-xl'}
      flex flex-col
    `}>
      {/* Header */}
      <div className={`
        ${fullscreen ? 'bg-black/90 text-white' : 'bg-white border-b border-gray-200'}
        p-4 flex items-center justify-between
      `}>
        <div className="flex items-center space-x-4">
          <div>
            <h2 className={`text-lg font-semibold ${fullscreen ? 'text-white' : 'text-gray-900'}`}>
              {job.workflow.name} Results
            </h2>
            <p className={`text-sm ${fullscreen ? 'text-gray-300' : 'text-gray-600'}`}>
              Job ID: {job.id}
            </p>
          </div>
          
          <button
            onClick={handleCopyJobId}
            className={`
              p-1.5 rounded-lg transition-colors duration-200
              ${fullscreen 
                ? 'hover:bg-white/10 text-gray-300 hover:text-white' 
                : 'hover:bg-gray-100 text-gray-500 hover:text-gray-700'
              }
            `}
            title="Copy Job ID"
          >
            <Copy className="w-4 h-4" />
          </button>
          
          {copiedJobId && (
            <motion.span
              initial={{ opacity: 0, scale: 0.8 }}
              animate={{ opacity: 1, scale: 1 }}
              exit={{ opacity: 0, scale: 0.8 }}
              className="text-sm text-green-500"
            >
              Copied!
            </motion.span>
          )}
        </div>
        
        <div className="flex items-center space-x-2">
          {/* View Controls */}
          <div className="flex items-center space-x-1 border border-gray-300 rounded-lg p-1">
            <button
              onClick={() => setShowComparison(!showComparison)}
              className={`
                p-1.5 rounded transition-colors duration-200
                ${showComparison 
                  ? 'bg-primary-100 text-primary-700' 
                  : fullscreen ? 'hover:bg-white/10 text-gray-300' : 'hover:bg-gray-100 text-gray-500'
                }
              `}
              title={showComparison ? 'Hide comparison' : 'Show comparison'}
            >
              {showComparison ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
            </button>
          </div>
          
          {/* Zoom Controls */}
          <div className="flex items-center space-x-1 border border-gray-300 rounded-lg p-1">
            <button
              onClick={handleZoomOut}
              disabled={zoom <= 0.25}
              className={`
                p-1.5 rounded transition-colors duration-200 disabled:opacity-50
                ${fullscreen ? 'hover:bg-white/10 text-gray-300' : 'hover:bg-gray-100 text-gray-500'}
              `}
            >
              <ZoomOut className="w-4 h-4" />
            </button>
            
            <span className={`px-2 text-sm ${fullscreen ? 'text-gray-300' : 'text-gray-600'}`}>
              {Math.round(zoom * 100)}%
            </span>
            
            <button
              onClick={handleZoomIn}
              disabled={zoom >= 3}
              className={`
                p-1.5 rounded transition-colors duration-200 disabled:opacity-50
                ${fullscreen ? 'hover:bg-white/10 text-gray-300' : 'hover:bg-gray-100 text-gray-500'}
              `}
            >
              <ZoomIn className="w-4 h-4" />
            </button>
          </div>
          
          {/* Additional Controls */}
          <button
            onClick={handleRotate}
            className={`
              p-2 rounded-lg transition-colors duration-200
              ${fullscreen ? 'hover:bg-white/10 text-gray-300' : 'hover:bg-gray-100 text-gray-500'}
            `}
            title="Rotate image"
          >
            <RotateCw className="w-4 h-4" />
          </button>
          
          <button
            onClick={() => setShowInfo(!showInfo)}
            className={`
              p-2 rounded-lg transition-colors duration-200
              ${showInfo 
                ? 'bg-primary-100 text-primary-700' 
                : fullscreen ? 'hover:bg-white/10 text-gray-300' : 'hover:bg-gray-100 text-gray-500'
              }
            `}
            title="Show image info"
          >
            <Info className="w-4 h-4" />
          </button>
          
          {/* Download Buttons */}
          {onDownload && (
            <div className="flex items-center space-x-1">
              <button
                onClick={() => onDownload(job.id, 'original')}
                className={`
                  px-3 py-2 text-sm font-medium rounded-lg transition-colors duration-200
                  ${fullscreen 
                    ? 'bg-white/10 text-white hover:bg-white/20' 
                    : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
                  }
                `}
              >
                <Download className="w-4 h-4 mr-1 inline" />
                Original
              </button>
              
              <button
                onClick={() => onDownload(job.id, 'processed')}
                className={`
                  px-3 py-2 text-sm font-medium rounded-lg transition-colors duration-200
                  ${fullscreen 
                    ? 'bg-primary-600 text-white hover:bg-primary-700' 
                    : 'bg-primary-600 text-white hover:bg-primary-700'
                  }
                `}
              >
                <Download className="w-4 h-4 mr-1 inline" />
                Processed
              </button>
            </div>
          )}
          
          {/* Close Button */}
          {onClose && (
            <button
              onClick={onClose}
              className={`
                p-2 rounded-lg transition-colors duration-200
                ${fullscreen ? 'hover:bg-white/10 text-gray-300' : 'hover:bg-gray-100 text-gray-500'}
              `}
            >
              <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
              </svg>
            </button>
          )}
        </div>
      </div>
      
      {/* Content */}
      <div className={`flex-1 overflow-hidden ${fullscreen ? 'bg-black' : 'bg-gray-50'}`}>
        <div className="relative h-full flex">
          {/* Image Container */}
          <div className="flex-1 relative overflow-auto">
            <div 
              ref={containerRef}
              className="h-full min-h-0 flex items-center justify-center p-4"
            >
              <div 
                className="relative max-w-full max-h-full"
                style={{
                  transform: `scale(${zoom}) rotate(${rotation}deg)`,
                  transformOrigin: 'center',
                  transition: 'transform 0.2s ease-out'
                }}
              >
                {showComparison ? (
                  <ReactCompareSlider
                    itemOne={
                      <ReactCompareSliderImage
                        src={job.originalImage}
                        alt="Original image"
                        style={{ maxHeight: '80vh', width: 'auto' }}
                      />
                    }
                    itemTwo={
                      <ReactCompareSliderImage
                        src={job.processedImage}
                        alt="Processed image"
                        style={{ maxHeight: '80vh', width: 'auto' }}
                      />
                    }
                    handle={
                      <ReactCompareSliderHandle 
                        buttonStyle={{
                          backgroundColor: 'white',
                          border: '2px solid #ed7a1e',
                          color: '#ed7a1e',
                        }}
                        linesStyle={{
                          backgroundColor: '#ed7a1e',
                        }}
                      />
                    }
                  />
                ) : (
                  <img
                    src={job.processedImage}
                    alt="Processed result"
                    className="max-w-full max-h-[80vh] object-contain rounded-lg"
                  />
                )}
              </div>
            </div>
          </div>
          
          {/* Info Panel */}
          {showInfo && (
            <motion.div
              initial={{ width: 0, opacity: 0 }}
              animate={{ width: 320, opacity: 1 }}
              exit={{ width: 0, opacity: 0 }}
              transition={{ duration: 0.2 }}
              className={`
                border-l border-gray-200 p-4 overflow-y-auto
                ${fullscreen ? 'bg-black/90 text-white' : 'bg-white'}
              `}
            >
              <h3 className={`font-semibold mb-4 ${fullscreen ? 'text-white' : 'text-gray-900'}`}>
                Image Details
              </h3>
              
              <div className="space-y-4">
                {/* Job Information */}
                <div>
                  <h4 className={`text-sm font-medium mb-2 ${fullscreen ? 'text-gray-300' : 'text-gray-700'}`}>
                    Processing Job
                  </h4>
                  <div className="space-y-2 text-sm">
                    <div className="flex justify-between">
                      <span className={fullscreen ? 'text-gray-400' : 'text-gray-600'}>Status:</span>
                      <span className="capitalize font-medium">{job.status}</span>
                    </div>
                    <div className="flex justify-between">
                      <span className={fullscreen ? 'text-gray-400' : 'text-gray-600'}>Progress:</span>
                      <span className="font-medium">{job.progress}%</span>
                    </div>
                    <div className="flex justify-between">
                      <span className={fullscreen ? 'text-gray-400' : 'text-gray-600'}>Created:</span>
                      <span className="font-medium">{new Date(job.createdAt).toLocaleString()}</span>
                    </div>
                    {job.completedAt && (
                      <div className="flex justify-between">
                        <span className={fullscreen ? 'text-gray-400' : 'text-gray-600'}>Completed:</span>
                        <span className="font-medium">{new Date(job.completedAt).toLocaleString()}</span>
                      </div>
                    )}
                  </div>
                </div>
                
                {/* Image Metadata */}
                <div>
                  <h4 className={`text-sm font-medium mb-2 ${fullscreen ? 'text-gray-300' : 'text-gray-700'}`}>
                    Image Properties
                  </h4>
                  <div className="space-y-2 text-sm">
                    <div className="flex justify-between">
                      <span className={fullscreen ? 'text-gray-400' : 'text-gray-600'}>Dimensions:</span>
                      <span className="font-medium">
                        {job.metadata.dimensions.width} × {job.metadata.dimensions.height}
                      </span>
                    </div>
                    <div className="flex justify-between">
                      <span className={fullscreen ? 'text-gray-400' : 'text-gray-600'}>File Size:</span>
                      <span className="font-medium">{formatFileSize(job.metadata.fileSize)}</span>
                    </div>
                    <div className="flex justify-between">
                      <span className={fullscreen ? 'text-gray-400' : 'text-gray-600'}>Format:</span>
                      <span className="font-medium">{job.metadata.format.toUpperCase()}</span>
                    </div>
                  </div>
                </div>
                
                {/* Workflow Information */}
                <div>
                  <h4 className={`text-sm font-medium mb-2 ${fullscreen ? 'text-gray-300' : 'text-gray-700'}`}>
                    Workflow
                  </h4>
                  <div className="space-y-2 text-sm">
                    <div>
                      <span className={fullscreen ? 'text-gray-400' : 'text-gray-600'}>Name:</span>
                      <p className="font-medium">{job.workflow.name}</p>
                    </div>
                    <div>
                      <span className={fullscreen ? 'text-gray-400' : 'text-gray-600'}>Description:</span>
                      <p className={`text-sm ${fullscreen ? 'text-gray-300' : 'text-gray-600'}`}>
                        {job.workflow.description}
                      </p>
                    </div>
                    <div className="flex justify-between">
                      <span className={fullscreen ? 'text-gray-400' : 'text-gray-600'}>Complexity:</span>
                      <span className="font-medium capitalize">{job.workflow.complexity}</span>
                    </div>
                  </div>
                </div>
                
                {/* Workflow Parameters */}
                {Object.keys(job.workflow.parameters).length > 0 && (
                  <div>
                    <h4 className={`text-sm font-medium mb-2 ${fullscreen ? 'text-gray-300' : 'text-gray-700'}`}>
                      Parameters
                    </h4>
                    <div className="space-y-1">
                      {Object.entries(job.workflow.parameters).map(([key, value]) => (
                        <div key={key} className="flex justify-between text-xs">
                          <span className={fullscreen ? 'text-gray-400' : 'text-gray-600'}>{key}:</span>
                          <span className="font-medium">{String(value)}</span>
                        </div>
                      ))}
                    </div>
                  </div>
                )}
              </div>
            </motion.div>
          )}
        </div>
      </div>
    </div>
  );
}