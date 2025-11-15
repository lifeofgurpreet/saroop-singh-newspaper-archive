'use client';

import React, { useState } from 'react';
import { Upload, Sparkles, Clock, CheckCircle, AlertCircle } from 'lucide-react';
import { ResponsiveContainer } from '@/components/layout/responsivecontainer';
import { VStack } from '@/components/layout/flexlayout';
import { FileUpload } from '@/components/ui/fileupload';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Progress } from '@/components/ui/progress';
// cn utility not used in this component
import { RestorationGrid } from '@/components/restoration/restorationgrid';
// Metadata is handled by layout.tsx

interface RestorationResult {
  id: string;
  name: string;
  style: string;
  description: string;
  imageUrl: string;
  downloadUrl: string;
}

type ProcessingStatus = 'idle' | 'uploading' | 'processing' | 'completed' | 'error';

const restorationStyles = [
  {
    name: 'Basic Enhancement',
    description: 'Improves brightness, contrast, and sharpness',
    icon: '✨',
  },
  {
    name: 'Color Restoration',
    description: 'Restores faded colors and corrects color balance',
    icon: '🎨',
  },
  {
    name: 'Damage Repair',
    description: 'Removes scratches, tears, and physical damage',
    icon: '🔧',
  },
  {
    name: 'Full Restoration',
    description: 'Comprehensive restoration with all enhancements',
    icon: '🌟',
  },
  {
    name: 'Artistic Enhancement',
    description: 'Adds artistic improvements while preserving authenticity',
    icon: '🎭',
  },
  {
    name: 'Historical Preservation',
    description: 'Optimized for archival quality and long-term preservation',
    icon: '📚',
  },
];

export default function RestorePage() {
  const [selectedFile, setSelectedFile] = useState<File | null>(null);
  const [processingStatus, setProcessingStatus] = useState<ProcessingStatus>('idle');
  const [progress, setProgress] = useState(0);
  const [restorations, setRestorations] = useState<RestorationResult[]>([]);
  const [error, setError] = useState<string | null>(null);

  const handleFileSelect = (file: File) => {
    setSelectedFile(file);
    setError(null);
    setRestorations([]);
    setProgress(0);
  };

  const handleFileRemove = () => {
    setSelectedFile(null);
    setRestorations([]);
    setProgress(0);
    setProcessingStatus('idle');
    setError(null);
  };

  const handleGenerateRestorations = async () => {
    if (!selectedFile) return;

    setProcessingStatus('uploading');
    setProgress(0);
    setError(null);

    try {
      // Create FormData for upload
      const formData = new FormData();
      formData.append('image', selectedFile);

      // Upload and process
      setProcessingStatus('processing');
      
      // Simulate progress
      const progressInterval = setInterval(() => {
        setProgress(prev => {
          if (prev >= 90) {
            clearInterval(progressInterval);
            return 90;
          }
          return prev + Math.random() * 10;
        });
      }, 500);

      const response = await fetch('/api/restore', {
        method: 'POST',
        body: formData,
      });

      clearInterval(progressInterval);

      if (!response.ok) {
        throw new Error('Restoration failed');
      }

      const results = await response.json();
      setRestorations(results.restorations);
      setProgress(100);
      setProcessingStatus('completed');
      
    } catch (err) {
      setProcessingStatus('error');
      setError(err instanceof Error ? err.message : 'An error occurred during restoration');
    }
  };

  const handleDownloadAll = async () => {
    try {
      const response = await fetch('/api/restore/download-all', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          restorationIds: restorations.map(r => r.id)
        }),
      });

      if (!response.ok) throw new Error('Download failed');

      const blob = await response.blob();
      const url = window.URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = `restored-photos-${Date.now()}.zip`;
      document.body.appendChild(a);
      a.click();
      window.URL.revokeObjectURL(url);
      document.body.removeChild(a);
    } catch (err) {
      setError('Failed to download all restorations');
    }
  };

  const handleDownloadSingle = async (restoration: RestorationResult) => {
    try {
      const response = await fetch(restoration.downloadUrl);
      const blob = await response.blob();
      const url = window.URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = `${restoration.name.toLowerCase().replace(/\s+/g, '-')}.png`;
      document.body.appendChild(a);
      a.click();
      window.URL.revokeObjectURL(url);
      document.body.removeChild(a);
    } catch (err) {
      setError(`Failed to download ${restoration.name}`);
    }
  };

  const handleSubmitToGallery = async (selectedRestorations: RestorationResult[]) => {
    try {
      // Extract session ID from first restoration ID
      const sessionId = restorations[0]?.id.split('-')[0];
      
      const response = await fetch('/api/gallery/submit', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          sessionId,
          selectedRestorations: selectedRestorations.map(r => ({
            id: r.id,
            name: r.name,
            imageUrl: r.imageUrl,
            selected: true,
          })),
          metadata: {
            title: `Restored Photo - ${new Date().toLocaleDateString()}`,
            description: `AI-restored historical photograph with ${selectedRestorations.length} restoration styles`,
            date: new Date().toISOString().split('T')[0],
            tags: selectedRestorations.map(r => r.style),
            isPublic: true,
          },
        }),
      });

      if (!response.ok) throw new Error('Failed to submit to gallery');

      const result = await response.json();
      alert(`Successfully submitted ${selectedRestorations.length} restorations to gallery!`);
    } catch (err) {
      setError('Failed to submit to gallery');
    }
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 via-white to-purple-50">
      <ResponsiveContainer className="py-8 sm:py-12">
        <VStack gap="xl" align="center">
          {/* Header */}
          <div className="text-center space-y-4 max-w-4xl">
            <div className="flex items-center justify-center space-x-2 mb-4">
              <Sparkles className="w-8 h-8 text-purple-600" />
              <h1 className="text-3xl sm:text-4xl lg:text-5xl font-bold text-gray-900">
                Photo Restoration
              </h1>
            </div>
            <p className="text-lg sm:text-xl text-gray-600 leading-relaxed">
              Bring your historical photographs back to life using advanced AI restoration technology.
              Upload your photo and get 6 different restoration styles to choose from.
            </p>
          </div>

          {/* Main Content */}
          <div className="w-full max-w-6xl space-y-8">
            {/* Upload Section */}
            <Card className="bg-white/80 backdrop-blur-sm border border-white/20 shadow-xl">
              <CardHeader className="text-center">
                <CardTitle className="flex items-center justify-center space-x-2">
                  <Upload className="w-5 h-5" />
                  <span>Upload Your Photo</span>
                </CardTitle>
                <CardDescription>
                  Select a historical photograph to restore. We support JPG, PNG, and WEBP formats up to 10MB.
                </CardDescription>
              </CardHeader>
              <CardContent className="space-y-6">
                <FileUpload
                  onFileSelect={handleFileSelect}
                  onFileRemove={handleFileRemove}
                  file={selectedFile}
                  disabled={processingStatus === 'processing'}
                  className="w-full"
                />

                {selectedFile && processingStatus === 'idle' && (
                  <div className="text-center space-y-4">
                    <Button
                      onClick={handleGenerateRestorations}
                      size="lg"
                      className="bg-gradient-to-r from-purple-600 to-blue-600 hover:from-purple-700 hover:to-blue-700 text-white px-8 py-3 rounded-full shadow-lg hover:shadow-xl transition-all duration-200"
                    >
                      <Sparkles className="w-5 h-5 mr-2" />
                      Generate Restorations
                    </Button>
                    <p className="text-sm text-gray-500">
                      This will create 6 different restoration styles for your photo
                    </p>
                  </div>
                )}

                {/* Processing Status */}
                {processingStatus !== 'idle' && (
                  <div className="space-y-4">
                    <div className="flex items-center justify-center space-x-2">
                      {processingStatus === 'uploading' && (
                        <>
                          <Clock className="w-5 h-5 text-blue-600 animate-spin" />
                          <span className="text-blue-600 font-medium">Uploading photo...</span>
                        </>
                      )}
                      {processingStatus === 'processing' && (
                        <>
                          <Sparkles className="w-5 h-5 text-purple-600 animate-pulse" />
                          <span className="text-purple-600 font-medium">Processing restorations...</span>
                        </>
                      )}
                      {processingStatus === 'completed' && (
                        <>
                          <CheckCircle className="w-5 h-5 text-green-600" />
                          <span className="text-green-600 font-medium">Restoration complete!</span>
                        </>
                      )}
                      {processingStatus === 'error' && (
                        <>
                          <AlertCircle className="w-5 h-5 text-red-600" />
                          <span className="text-red-600 font-medium">Restoration failed</span>
                        </>
                      )}
                    </div>

                    {(processingStatus === 'uploading' || processingStatus === 'processing') && (
                      <div className="space-y-2">
                        <Progress value={progress} className="w-full" />
                        <p className="text-center text-sm text-gray-500">
                          {Math.round(progress)}% complete
                        </p>
                      </div>
                    )}

                    {error && (
                      <div className="bg-red-50 border border-red-200 rounded-lg p-4">
                        <p className="text-red-700 text-center">{error}</p>
                      </div>
                    )}
                  </div>
                )}
              </CardContent>
            </Card>

            {/* Restoration Styles Preview */}
            {selectedFile && processingStatus === 'idle' && (
              <Card className="bg-white/80 backdrop-blur-sm border border-white/20 shadow-xl">
                <CardHeader className="text-center">
                  <CardTitle>Available Restoration Styles</CardTitle>
                  <CardDescription>
                    We&apos;ll generate all of these restoration styles for your photo
                  </CardDescription>
                </CardHeader>
                <CardContent>
                  <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
                    {restorationStyles.map((style) => (
                      <div
                        key={style.name}
                        className="p-4 rounded-lg bg-gradient-to-br from-gray-50 to-gray-100 border border-gray-200"
                      >
                        <div className="text-center space-y-2">
                          <div className="text-2xl">{style.icon}</div>
                          <h3 className="font-semibold text-gray-900">{style.name}</h3>
                          <p className="text-sm text-gray-600">{style.description}</p>
                        </div>
                      </div>
                    ))}
                  </div>
                </CardContent>
              </Card>
            )}

            {/* Results Section */}
            {restorations.length > 0 && (
              <RestorationGrid
                restorations={restorations}
                originalImage={selectedFile ? URL.createObjectURL(selectedFile) : ''}
                onDownloadSingle={handleDownloadSingle}
                onDownloadAll={handleDownloadAll}
                onSubmitToGallery={handleSubmitToGallery}
              />
            )}
          </div>
        </VStack>
      </ResponsiveContainer>
    </div>
  );
}