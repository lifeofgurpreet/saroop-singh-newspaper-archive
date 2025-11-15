import React, { useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import { useRouter } from 'next/router';
import Head from 'next/head';
import { 
  Upload, 
  Image as ImageIcon, 
  Clock, 
  CheckCircle,
  Sparkles,
  Zap,
  Star,
  ArrowRight,
  RefreshCw,
  Palette
} from 'lucide-react';
import { WorkflowTemplate, apiClient } from '@/lib/api-client';

interface DashboardStats {
  totalJobs: number;
  completedJobs: number;
  processingJobs: number;
  failedJobs: number;
}

export default function Dashboard() {
  const router = useRouter();
  const [workflows, setWorkflows] = useState<WorkflowTemplate[]>([]);
  const [stats, setStats] = useState<DashboardStats>({
    totalJobs: 0,
    completedJobs: 0,
    processingJobs: 0,
    failedJobs: 0
  });
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    loadData();
  }, []);

  const loadData = async () => {
    try {
      setLoading(true);
      
      // Load workflows
      const workflowData = await apiClient.getWorkflowTemplates();
      setWorkflows(workflowData);
      
      // Load stats (mock for now)
      setStats({
        totalJobs: 45,
        completedJobs: 38,
        processingJobs: 2,
        failedJobs: 5
      });
    } catch (error) {
      console.error('Failed to load dashboard data:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleQuickStart = (workflowId: string) => {
    router.push(`/process?workflow=${workflowId}`);
  };

  const handleViewGallery = () => {
    router.push('/gallery');
  };

  const handleStartProcessing = () => {
    router.push('/process');
  };

  return (
    <>
      <Head>
        <title>Dashboard - Photo Restoration Studio</title>
      </Head>
      
      <div className="min-h-screen bg-gradient-to-br from-gray-50 to-gray-100">
        {/* Header */}
        <header className="bg-white shadow-sm border-b border-gray-200">
          <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-6">
            <div className="flex items-center justify-between">
              <div>
                <h1 className="text-3xl font-bold text-gray-900">Photo Restoration Studio</h1>
                <p className="text-gray-600 mt-1">AI-powered photo restoration and enhancement</p>
              </div>
              
              <div className="flex items-center space-x-4">
                <button
                  onClick={handleViewGallery}
                  className="btn-secondary"
                >
                  <ImageIcon className="w-4 h-4 mr-2" />
                  Gallery
                </button>
                
                <button
                  onClick={handleStartProcessing}
                  className="btn-primary"
                >
                  <Upload className="w-4 h-4 mr-2" />
                  Start Processing
                </button>
              </div>
            </div>
          </div>
        </header>

        <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
          {/* Stats Cards */}
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.1 }}
              className="card bg-gradient-primary text-white"
            >
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-orange-100">Total Jobs</p>
                  <p className="text-3xl font-bold">{stats.totalJobs}</p>
                </div>
                <div className="w-12 h-12 bg-white/20 rounded-lg flex items-center justify-center">
                  <Zap className="w-6 h-6" />
                </div>
              </div>
            </motion.div>

            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.2 }}
              className="card"
            >
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-gray-600">Completed</p>
                  <p className="text-3xl font-bold text-green-600">{stats.completedJobs}</p>
                </div>
                <div className="w-12 h-12 bg-green-100 rounded-lg flex items-center justify-center">
                  <CheckCircle className="w-6 h-6 text-green-600" />
                </div>
              </div>
            </motion.div>

            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.3 }}
              className="card"
            >
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-gray-600">Processing</p>
                  <p className="text-3xl font-bold text-blue-600">{stats.processingJobs}</p>
                </div>
                <div className="w-12 h-12 bg-blue-100 rounded-lg flex items-center justify-center">
                  <RefreshCw className="w-6 h-6 text-blue-600" />
                </div>
              </div>
            </motion.div>

            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.4 }}
              className="card"
            >
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-gray-600">Failed</p>
                  <p className="text-3xl font-bold text-red-600">{stats.failedJobs}</p>
                </div>
                <div className="w-12 h-12 bg-red-100 rounded-lg flex items-center justify-center">
                  <Clock className="w-6 h-6 text-red-600" />
                </div>
              </div>
            </motion.div>
          </div>

          <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
            {/* Quick Actions */}
            <div className="lg:col-span-2">
              <div className="card">
                <div className="flex items-center justify-between mb-6">
                  <h2 className="text-xl font-semibold text-gray-900">Quick Start</h2>
                  <button
                    onClick={handleStartProcessing}
                    className="text-primary-600 hover:text-primary-700 text-sm font-medium flex items-center"
                  >
                    View all workflows
                    <ArrowRight className="w-4 h-4 ml-1" />
                  </button>
                </div>

                {loading ? (
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    {[1, 2, 3, 4].map(i => (
                      <div key={i} className="p-4 border border-gray-200 rounded-lg animate-pulse">
                        <div className="h-4 bg-gray-200 rounded w-3/4 mb-2" />
                        <div className="h-3 bg-gray-200 rounded w-full mb-4" />
                        <div className="h-8 bg-gray-200 rounded" />
                      </div>
                    ))}
                  </div>
                ) : (
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    {workflows.slice(0, 4).map((workflow, index) => (
                      <motion.div
                        key={workflow.id}
                        initial={{ opacity: 0, scale: 0.9 }}
                        animate={{ opacity: 1, scale: 1 }}
                        transition={{ delay: 0.1 * index }}
                        className="p-4 border border-gray-200 rounded-lg hover:border-primary-200 hover:shadow-md transition-all duration-200 cursor-pointer group"
                        onClick={() => handleQuickStart(workflow.id)}
                      >
                        <div className="flex items-start justify-between mb-3">
                          <div className="flex items-center space-x-2">
                            <div className={`w-8 h-8 rounded-lg flex items-center justify-center ${
                              workflow.category === 'restoration' 
                                ? 'bg-primary-100 text-primary-600'
                                : workflow.category === 'enhancement'
                                ? 'bg-blue-100 text-blue-600'
                                : 'bg-purple-100 text-purple-600'
                            }`}>
                              {workflow.category === 'restoration' && <RefreshCw className="w-4 h-4" />}
                              {workflow.category === 'enhancement' && <Sparkles className="w-4 h-4" />}
                              {workflow.category === 'artistic' && <Palette className="w-4 h-4" />}
                            </div>
                            <div>
                              <h3 className="font-medium text-gray-900 group-hover:text-primary-600 transition-colors">
                                {workflow.name}
                              </h3>
                              <p className="text-xs text-gray-500 capitalize">
                                {workflow.category} • {workflow.complexity}
                              </p>
                            </div>
                          </div>
                          
                          <ArrowRight className="w-4 h-4 text-gray-400 group-hover:text-primary-600 group-hover:translate-x-1 transition-all duration-200" />
                        </div>
                        
                        <p className="text-sm text-gray-600 mb-3 line-clamp-2">
                          {workflow.description}
                        </p>
                        
                        <div className="flex items-center justify-between">
                          <div className="flex space-x-1">
                            {workflow.tags.slice(0, 2).map(tag => (
                              <span key={tag} className="px-2 py-1 bg-gray-100 text-gray-600 rounded-full text-xs">
                                {tag}
                              </span>
                            ))}
                          </div>
                          
                          <div className="flex items-center text-xs text-gray-500">
                            <Clock className="w-3 h-3 mr-1" />
                            ~{Math.round(workflow.estimatedTime / 60)}m
                          </div>
                        </div>
                      </motion.div>
                    ))}
                  </div>
                )}
              </div>
            </div>

            {/* Recent Activity */}
            <div className="card">
              <h2 className="text-xl font-semibold text-gray-900 mb-6">Recent Activity</h2>
              
              <div className="space-y-4">
                {/* Mock recent activity */}
                <div className="flex items-center space-x-3">
                  <div className="w-8 h-8 bg-green-100 rounded-full flex items-center justify-center">
                    <CheckCircle className="w-4 h-4 text-green-600" />
                  </div>
                  <div className="flex-1 min-w-0">
                    <p className="text-sm font-medium text-gray-900">Photo restoration completed</p>
                    <p className="text-xs text-gray-500">vintage-photo-1920s.jpg • 2 min ago</p>
                  </div>
                </div>
                
                <div className="flex items-center space-x-3">
                  <div className="w-8 h-8 bg-blue-100 rounded-full flex items-center justify-center">
                    <RefreshCw className="w-4 h-4 text-blue-600" />
                  </div>
                  <div className="flex-1 min-w-0">
                    <p className="text-sm font-medium text-gray-900">Colorization in progress</p>
                    <p className="text-xs text-gray-500">family-portrait-1950s.jpg • 5 min ago</p>
                  </div>
                </div>
                
                <div className="flex items-center space-x-3">
                  <div className="w-8 h-8 bg-green-100 rounded-full flex items-center justify-center">
                    <CheckCircle className="w-4 h-4 text-green-600" />
                  </div>
                  <div className="flex-1 min-w-0">
                    <p className="text-sm font-medium text-gray-900">Super resolution completed</p>
                    <p className="text-xs text-gray-500">old-document.jpg • 15 min ago</p>
                  </div>
                </div>
                
                <div className="flex items-center space-x-3">
                  <div className="w-8 h-8 bg-primary-100 rounded-full flex items-center justify-center">
                    <Upload className="w-4 h-4 text-primary-600" />
                  </div>
                  <div className="flex-1 min-w-0">
                    <p className="text-sm font-medium text-gray-900">New images uploaded</p>
                    <p className="text-xs text-gray-500">3 files • 1 hour ago</p>
                  </div>
                </div>
              </div>
              
              <div className="mt-6 pt-6 border-t border-gray-200">
                <button 
                  onClick={handleViewGallery}
                  className="w-full text-center text-sm text-primary-600 hover:text-primary-700 font-medium"
                >
                  View all activity
                </button>
              </div>
            </div>
          </div>

          {/* CTA Section */}
          <motion.div
            initial={{ opacity: 0, y: 30 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.6 }}
            className="mt-12 bg-gradient-primary rounded-2xl p-8 text-center text-white"
          >
            <Sparkles className="w-12 h-12 mx-auto mb-4 opacity-80" />
            <h2 className="text-2xl font-bold mb-2">Ready to restore your memories?</h2>
            <p className="text-orange-100 mb-6 max-w-md mx-auto">
              Upload your vintage photos and let our AI-powered restoration tools bring them back to life.
            </p>
            <button
              onClick={handleStartProcessing}
              className="bg-white text-primary-600 hover:bg-gray-100 font-semibold py-3 px-8 rounded-lg transition-colors duration-200 inline-flex items-center"
            >
              <Upload className="w-5 h-5 mr-2" />
              Start Processing Now
            </button>
          </motion.div>
        </main>
      </div>
    </>
  );
}