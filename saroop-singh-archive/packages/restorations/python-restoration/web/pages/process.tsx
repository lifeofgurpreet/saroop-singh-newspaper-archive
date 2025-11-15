import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { useRouter } from 'next/router';
import Head from 'next/head';
import { 
  ArrowLeft, 
  Upload, 
  Settings,
  Play,
  CheckCircle,
  AlertCircle,
  Loader2
} from 'lucide-react';
import WorkflowSelector from '@/components/WorkflowSelector';
import ImageUploader from '@/components/ImageUploader';
import ProcessingStatus from '@/components/ProcessingStatus';
import { WorkflowTemplate, ProcessingJob, apiClient } from '@/lib/api-client';
import { generateJobId } from '@/lib/utils';

type ProcessStep = 'workflow' | 'upload' | 'configure' | 'processing';

interface ProcessingConfig {
  batchMode: boolean;
  parameters: Record<string, any>;
}

export default function ProcessPage() {
  const router = useRouter();
  const [currentStep, setCurrentStep] = useState<ProcessStep>('workflow');
  const [selectedWorkflow, setSelectedWorkflow] = useState<WorkflowTemplate | null>(null);
  const [selectedImages, setSelectedImages] = useState<File[]>([]);
  const [processingJobs, setProcessingJobs] = useState<ProcessingJob[]>([]);
  const [workflows, setWorkflows] = useState<WorkflowTemplate[]>([]);
  const [loading, setLoading] = useState(true);
  const [submitting, setSubmitting] = useState(false);
  const [config, setConfig] = useState<ProcessingConfig>({
    batchMode: false,
    parameters: {}
  });

  // Load workflows on mount
  useEffect(() => {
    loadWorkflows();
  }, []);

  // Handle pre-selected workflow from URL
  useEffect(() => {
    if (router.query.workflow && workflows.length > 0) {
      const workflowId = router.query.workflow as string;
      const workflow = workflows.find(w => w.id === workflowId);
      if (workflow) {
        setSelectedWorkflow(workflow);
        setCurrentStep('upload');
      }
    }
  }, [router.query.workflow, workflows]);

  const loadWorkflows = async () => {
    try {
      setLoading(true);
      const workflowData = await apiClient.getWorkflowTemplates();
      setWorkflows(workflowData);
    } catch (error) {
      console.error('Failed to load workflows:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleWorkflowSelect = (workflow: WorkflowTemplate) => {
    setSelectedWorkflow(workflow);
    setConfig(prev => ({
      ...prev,
      parameters: { ...workflow.parameters }
    }));
    setCurrentStep('upload');
  };

  const handleImagesChange = (files: File[]) => {
    setSelectedImages(files);
    setConfig(prev => ({
      ...prev,
      batchMode: files.length > 1
    }));
  };

  const handleNextStep = () => {
    switch (currentStep) {
      case 'workflow':
        if (selectedWorkflow) {
          setCurrentStep('upload');
        }
        break;
      case 'upload':
        if (selectedImages.length > 0) {
          // Skip configuration for simple workflows
          if (Object.keys(selectedWorkflow?.parameters || {}).length === 0) {
            handleStartProcessing();
          } else {
            setCurrentStep('configure');
          }
        }
        break;
      case 'configure':
        handleStartProcessing();
        break;
    }
  };

  const handlePreviousStep = () => {
    switch (currentStep) {
      case 'upload':
        setCurrentStep('workflow');
        break;
      case 'configure':
        setCurrentStep('upload');
        break;
      case 'processing':
        // Allow going back to configure or upload
        if (Object.keys(selectedWorkflow?.parameters || {}).length > 0) {
          setCurrentStep('configure');
        } else {
          setCurrentStep('upload');
        }
        break;
    }
  };

  const handleStartProcessing = async () => {
    if (!selectedWorkflow || selectedImages.length === 0) {
      return;
    }

    try {
      setSubmitting(true);
      setCurrentStep('processing');

      if (config.batchMode) {
        // Batch upload
        const responses = await apiClient.uploadBatch({
          images: selectedImages,
          workflowId: selectedWorkflow.id,
          parameters: config.parameters
        });

        // Create mock jobs for UI (in real implementation, these would come from API)
        const jobs = responses.map((response, index) => ({
          id: response.jobId,
          status: 'pending' as const,
          progress: 0,
          originalImage: URL.createObjectURL(selectedImages[index]),
          workflow: selectedWorkflow,
          createdAt: new Date().toISOString(),
          metadata: {
            fileSize: selectedImages[index].size,
            dimensions: { width: 1920, height: 1080 }, // Mock data
            format: selectedImages[index].type.split('/')[1]
          }
        }));

        setProcessingJobs(jobs);
      } else {
        // Single upload
        const response = await apiClient.uploadImage(
          selectedImages[0],
          selectedWorkflow.id,
          config.parameters
        );

        const job: ProcessingJob = {
          id: response.jobId,
          status: 'pending',
          progress: 0,
          originalImage: URL.createObjectURL(selectedImages[0]),
          workflow: selectedWorkflow,
          createdAt: new Date().toISOString(),
          metadata: {
            fileSize: selectedImages[0].size,
            dimensions: { width: 1920, height: 1080 }, // Mock data
            format: selectedImages[0].type.split('/')[1]
          }
        };

        setProcessingJobs([job]);
      }

      // Mock processing progress
      setTimeout(() => simulateProcessing(), 1000);

    } catch (error) {
      console.error('Failed to start processing:', error);
      // Handle error state
    } finally {
      setSubmitting(false);
    }
  };

  const simulateProcessing = () => {
    const updateProgress = () => {
      setProcessingJobs(jobs => 
        jobs.map(job => {
          if (job.status === 'completed') return job;
          
          const newProgress = Math.min(job.progress + Math.random() * 15, 100);
          const newStatus = newProgress >= 100 ? 'completed' : 'processing';
          
          return {
            ...job,
            status: newStatus,
            progress: Math.round(newProgress),
            ...(newStatus === 'completed' && {
              completedAt: new Date().toISOString(),
              processedImage: job.originalImage // Mock processed image
            })
          };
        })
      );
    };

    const interval = setInterval(() => {
      updateProgress();
      
      setProcessingJobs(jobs => {
        const allCompleted = jobs.every(job => job.status === 'completed');
        if (allCompleted) {
          clearInterval(interval);
        }
        return jobs;
      });
    }, 1500);
  };

  const handleRetryJob = async (jobId: string) => {
    try {
      await apiClient.retryJob(jobId);
      // Update job status
      setProcessingJobs(jobs =>
        jobs.map(job =>
          job.id === jobId
            ? { ...job, status: 'pending', progress: 0, error: undefined }
            : job
        )
      );
    } catch (error) {
      console.error('Failed to retry job:', error);
    }
  };

  const handleCancelJob = async (jobId: string) => {
    try {
      await apiClient.cancelJob(jobId);
      // Remove job from list
      setProcessingJobs(jobs => jobs.filter(job => job.id !== jobId));
    } catch (error) {
      console.error('Failed to cancel job:', error);
    }
  };

  const handleDownloadResult = async (jobId: string) => {
    try {
      const blob = await apiClient.downloadResult(jobId);
      const url = URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = `restored-${jobId}.jpg`;
      document.body.appendChild(a);
      a.click();
      document.body.removeChild(a);
      URL.revokeObjectURL(url);
    } catch (error) {
      console.error('Failed to download result:', error);
    }
  };

  const handleViewResult = (job: ProcessingJob) => {
    router.push(`/gallery?job=${job.id}`);
  };

  const handleStartOver = () => {
    setCurrentStep('workflow');
    setSelectedWorkflow(null);
    setSelectedImages([]);
    setProcessingJobs([]);
    setConfig({
      batchMode: false,
      parameters: {}
    });
  };

  const getStepTitle = () => {
    switch (currentStep) {
      case 'workflow':
        return 'Select Workflow';
      case 'upload':
        return 'Upload Images';
      case 'configure':
        return 'Configure Processing';
      case 'processing':
        return 'Processing Images';
      default:
        return '';
    }
  };

  const canProceed = () => {
    switch (currentStep) {
      case 'workflow':
        return selectedWorkflow !== null;
      case 'upload':
        return selectedImages.length > 0;
      case 'configure':
        return true;
      default:
        return false;
    }
  };

  return (
    <>
      <Head>
        <title>Process Images - Photo Restoration Studio</title>
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
                  <h1 className="text-2xl font-bold text-gray-900">{getStepTitle()}</h1>
                  <p className="text-gray-600 text-sm">
                    {currentStep === 'workflow' && 'Choose the type of processing you want to apply'}
                    {currentStep === 'upload' && 'Select the images you want to process'}
                    {currentStep === 'configure' && 'Adjust the processing parameters'}
                    {currentStep === 'processing' && 'Your images are being processed'}
                  </p>
                </div>
              </div>

              {/* Step Indicator */}
              <div className="flex items-center space-x-2">
                {(['workflow', 'upload', 'configure', 'processing'] as ProcessStep[]).map((step, index) => {
                  const stepNumber = index + 1;
                  const isActive = currentStep === step;
                  const isCompleted = ['workflow', 'upload', 'configure', 'processing'].indexOf(currentStep) > index;
                  
                  return (
                    <div key={step} className="flex items-center">
                      <div className={`
                        w-8 h-8 rounded-full flex items-center justify-center text-sm font-medium
                        ${isActive 
                          ? 'bg-primary-600 text-white' 
                          : isCompleted 
                          ? 'bg-green-600 text-white'
                          : 'bg-gray-200 text-gray-600'
                        }
                      `}>
                        {isCompleted ? <CheckCircle className="w-4 h-4" /> : stepNumber}
                      </div>
                      {index < 3 && (
                        <div className={`w-8 h-0.5 ${
                          ['workflow', 'upload', 'configure', 'processing'].indexOf(currentStep) > index
                            ? 'bg-green-600'
                            : 'bg-gray-200'
                        }`} />
                      )}
                    </div>
                  );
                })}
              </div>
            </div>
          </div>
        </header>

        <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
          <AnimatePresence mode="wait">
            {/* Step 1: Workflow Selection */}
            {currentStep === 'workflow' && (
              <motion.div
                key="workflow"
                initial={{ opacity: 0, x: 20 }}
                animate={{ opacity: 1, x: 0 }}
                exit={{ opacity: 0, x: -20 }}
                transition={{ duration: 0.3 }}
              >
                <WorkflowSelector
                  workflows={workflows}
                  selectedWorkflow={selectedWorkflow}
                  onSelect={handleWorkflowSelect}
                  loading={loading}
                />
              </motion.div>
            )}

            {/* Step 2: Image Upload */}
            {currentStep === 'upload' && (
              <motion.div
                key="upload"
                initial={{ opacity: 0, x: 20 }}
                animate={{ opacity: 1, x: 0 }}
                exit={{ opacity: 0, x: -20 }}
                transition={{ duration: 0.3 }}
                className="space-y-6"
              >
                {selectedWorkflow && (
                  <div className="bg-primary-50 border border-primary-200 rounded-lg p-4">
                    <div className="flex items-center space-x-3">
                      <div className="w-10 h-10 bg-primary-100 rounded-lg flex items-center justify-center">
                        <Settings className="w-5 h-5 text-primary-600" />
                      </div>
                      <div>
                        <h3 className="font-medium text-primary-900">{selectedWorkflow.name}</h3>
                        <p className="text-sm text-primary-700">{selectedWorkflow.description}</p>
                      </div>
                    </div>
                  </div>
                )}

                <ImageUploader
                  onImagesChange={handleImagesChange}
                  maxFiles={10}
                />
              </motion.div>
            )}

            {/* Step 3: Configuration */}
            {currentStep === 'configure' && selectedWorkflow && (
              <motion.div
                key="configure"
                initial={{ opacity: 0, x: 20 }}
                animate={{ opacity: 1, x: 0 }}
                exit={{ opacity: 0, x: -20 }}
                transition={{ duration: 0.3 }}
                className="space-y-6"
              >
                <div className="card">
                  <h3 className="text-lg font-semibold text-gray-900 mb-4">Processing Configuration</h3>
                  
                  <div className="space-y-6">
                    {/* Batch Mode Toggle */}
                    <div className="flex items-center justify-between">
                      <div>
                        <h4 className="font-medium text-gray-900">Batch Processing</h4>
                        <p className="text-sm text-gray-600">Process multiple images with the same settings</p>
                      </div>
                      <label className="relative inline-flex items-center cursor-pointer">
                        <input
                          type="checkbox"
                          checked={config.batchMode}
                          onChange={(e) => setConfig(prev => ({ ...prev, batchMode: e.target.checked }))}
                          className="sr-only peer"
                        />
                        <div className="w-11 h-6 bg-gray-200 peer-focus:outline-none peer-focus:ring-4 peer-focus:ring-primary-300 rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-primary-600"></div>
                      </label>
                    </div>

                    {/* Workflow Parameters */}
                    {Object.entries(selectedWorkflow.parameters).map(([key, defaultValue]) => (
                      <div key={key}>
                        <label className="block text-sm font-medium text-gray-700 mb-2 capitalize">
                          {key.replace(/([A-Z])/g, ' $1').trim()}
                        </label>
                        {typeof defaultValue === 'boolean' ? (
                          <label className="relative inline-flex items-center cursor-pointer">
                            <input
                              type="checkbox"
                              checked={config.parameters[key] ?? defaultValue}
                              onChange={(e) => setConfig(prev => ({
                                ...prev,
                                parameters: { ...prev.parameters, [key]: e.target.checked }
                              }))}
                              className="sr-only peer"
                            />
                            <div className="w-11 h-6 bg-gray-200 peer-focus:outline-none peer-focus:ring-4 peer-focus:ring-primary-300 rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-primary-600"></div>
                          </label>
                        ) : typeof defaultValue === 'number' ? (
                          <input
                            type="number"
                            value={config.parameters[key] ?? defaultValue}
                            onChange={(e) => setConfig(prev => ({
                              ...prev,
                              parameters: { ...prev.parameters, [key]: Number(e.target.value) }
                            }))}
                            className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-primary-500 focus:border-primary-500"
                          />
                        ) : (
                          <input
                            type="text"
                            value={config.parameters[key] ?? defaultValue}
                            onChange={(e) => setConfig(prev => ({
                              ...prev,
                              parameters: { ...prev.parameters, [key]: e.target.value }
                            }))}
                            className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-primary-500 focus:border-primary-500"
                          />
                        )}
                      </div>
                    ))}
                  </div>
                </div>

                {/* Summary */}
                <div className="card bg-gray-50">
                  <h4 className="font-medium text-gray-900 mb-3">Processing Summary</h4>
                  <div className="space-y-2 text-sm">
                    <div className="flex justify-between">
                      <span className="text-gray-600">Workflow:</span>
                      <span className="font-medium">{selectedWorkflow.name}</span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-gray-600">Images:</span>
                      <span className="font-medium">{selectedImages.length}</span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-gray-600">Estimated time:</span>
                      <span className="font-medium">
                        ~{Math.round((selectedWorkflow.estimatedTime * selectedImages.length) / 60)}m
                      </span>
                    </div>
                  </div>
                </div>
              </motion.div>
            )}

            {/* Step 4: Processing */}
            {currentStep === 'processing' && (
              <motion.div
                key="processing"
                initial={{ opacity: 0, x: 20 }}
                animate={{ opacity: 1, x: 0 }}
                exit={{ opacity: 0, x: -20 }}
                transition={{ duration: 0.3 }}
              >
                <ProcessingStatus
                  jobs={processingJobs}
                  onRetry={handleRetryJob}
                  onCancel={handleCancelJob}
                  onDownload={handleDownloadResult}
                  onView={handleViewResult}
                />

                {/* Completion Actions */}
                {processingJobs.length > 0 && processingJobs.every(job => job.status === 'completed') && (
                  <motion.div
                    initial={{ opacity: 0, y: 20 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ delay: 0.5 }}
                    className="mt-8 card text-center"
                  >
                    <CheckCircle className="w-12 h-12 text-green-600 mx-auto mb-4" />
                    <h3 className="text-lg font-semibold text-gray-900 mb-2">Processing Complete!</h3>
                    <p className="text-gray-600 mb-6">
                      All {processingJobs.length} image{processingJobs.length > 1 ? 's have' : ' has'} been processed successfully.
                    </p>
                    
                    <div className="flex justify-center space-x-4">
                      <button
                        onClick={() => router.push('/gallery')}
                        className="btn-primary"
                      >
                        View Gallery
                      </button>
                      
                      <button
                        onClick={handleStartOver}
                        className="btn-secondary"
                      >
                        Process More Images
                      </button>
                    </div>
                  </motion.div>
                )}
              </motion.div>
            )}
          </AnimatePresence>

          {/* Navigation */}
          {currentStep !== 'processing' && (
            <div className="flex justify-between items-center mt-8 pt-8 border-t border-gray-200">
              <button
                onClick={handlePreviousStep}
                disabled={currentStep === 'workflow'}
                className="btn-secondary disabled:opacity-50 disabled:cursor-not-allowed"
              >
                Previous
              </button>

              <button
                onClick={handleNextStep}
                disabled={!canProceed() || submitting}
                className="btn-primary disabled:opacity-50 disabled:cursor-not-allowed flex items-center"
              >
                {submitting && <Loader2 className="w-4 h-4 mr-2 animate-spin" />}
                {currentStep === 'configure' || (currentStep === 'upload' && Object.keys(selectedWorkflow?.parameters || {}).length === 0)
                  ? 'Start Processing'
                  : 'Next'
                }
                {!submitting && <Play className="w-4 h-4 ml-2" />}
              </button>
            </div>
          )}
        </main>
      </div>
    </>
  );
}