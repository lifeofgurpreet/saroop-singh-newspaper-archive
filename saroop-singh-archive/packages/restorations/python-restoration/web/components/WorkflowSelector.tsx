import React, { useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import { Clock, Tag, Zap, Star } from 'lucide-react';
import { WorkflowTemplate } from '@/lib/api-client';
import { formatEstimatedTime, getComplexityColor, cn } from '@/lib/utils';

interface WorkflowSelectorProps {
  onSelect: (workflow: WorkflowTemplate) => void;
  selectedWorkflow?: WorkflowTemplate | null;
  workflows?: WorkflowTemplate[];
  loading?: boolean;
}

export default function WorkflowSelector({
  onSelect,
  selectedWorkflow,
  workflows = [],
  loading = false
}: WorkflowSelectorProps) {
  const [selectedCategory, setSelectedCategory] = useState<string>('all');
  const [filteredWorkflows, setFilteredWorkflows] = useState<WorkflowTemplate[]>([]);

  // Get unique categories
  const categories = ['all', ...new Set(workflows.map(w => w.category))];

  useEffect(() => {
    if (selectedCategory === 'all') {
      setFilteredWorkflows(workflows);
    } else {
      setFilteredWorkflows(workflows.filter(w => w.category === selectedCategory));
    }
  }, [workflows, selectedCategory]);

  const handleWorkflowSelect = (workflow: WorkflowTemplate) => {
    onSelect(workflow);
  };

  if (loading) {
    return (
      <div className="space-y-6">
        <div className="flex space-x-2">
          {[1, 2, 3, 4].map(i => (
            <div key={i} className="h-8 bg-gray-200 rounded-lg w-20 animate-pulse" />
          ))}
        </div>
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {[1, 2, 3, 4, 5, 6].map(i => (
            <div key={i} className="card h-48 animate-pulse">
              <div className="h-4 bg-gray-200 rounded w-3/4 mb-2" />
              <div className="h-3 bg-gray-200 rounded w-full mb-4" />
              <div className="space-y-2">
                <div className="h-3 bg-gray-200 rounded w-1/2" />
                <div className="h-3 bg-gray-200 rounded w-2/3" />
                <div className="h-3 bg-gray-200 rounded w-1/3" />
              </div>
            </div>
          ))}
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div>
        <h2 className="text-2xl font-bold text-gray-900 mb-2">Select Restoration Workflow</h2>
        <p className="text-gray-600">Choose the type of restoration or enhancement you&apos;d like to apply to your images.</p>
      </div>

      {/* Category Filter */}
      <div className="flex flex-wrap gap-2">
        {categories.map((category) => (
          <button
            key={category}
            onClick={() => setSelectedCategory(category)}
            className={cn(
              'px-4 py-2 rounded-lg text-sm font-medium transition-colors duration-200',
              selectedCategory === category
                ? 'bg-primary-600 text-white'
                : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
            )}
          >
            {category.charAt(0).toUpperCase() + category.slice(1)}
          </button>
        ))}
      </div>

      {/* Workflow Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
        {filteredWorkflows.map((workflow, index) => (
          <motion.div
            key={workflow.id}
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: index * 0.1 }}
            className={cn(
              'workflow-card relative',
              selectedWorkflow?.id === workflow.id && 'selected'
            )}
            onClick={() => handleWorkflowSelect(workflow)}
          >
            {/* Selection indicator */}
            {selectedWorkflow?.id === workflow.id && (
              <div className="absolute top-4 right-4">
                <div className="w-6 h-6 bg-primary-600 rounded-full flex items-center justify-center">
                  <Star className="w-4 h-4 text-white" fill="currentColor" />
                </div>
              </div>
            )}

            {/* Content */}
            <div className="space-y-4">
              <div>
                <h3 className="font-semibold text-gray-900 text-lg mb-2">
                  {workflow.name}
                </h3>
                <p className="text-gray-600 text-sm leading-relaxed">
                  {workflow.description}
                </p>
              </div>

              {/* Metadata */}
              <div className="space-y-3">
                {/* Complexity & Time */}
                <div className="flex items-center justify-between">
                  <div className="flex items-center space-x-2">
                    <Zap className="w-4 h-4 text-gray-400" />
                    <span className={cn(
                      'px-2 py-1 rounded-full text-xs font-medium',
                      getComplexityColor(workflow.complexity)
                    )}>
                      {workflow.complexity}
                    </span>
                  </div>
                  
                  <div className="flex items-center space-x-1 text-gray-500">
                    <Clock className="w-4 h-4" />
                    <span className="text-xs">
                      {formatEstimatedTime(workflow.estimatedTime)}
                    </span>
                  </div>
                </div>

                {/* Tags */}
                <div className="flex flex-wrap gap-1">
                  {workflow.tags.slice(0, 3).map((tag) => (
                    <div key={tag} className="flex items-center space-x-1">
                      <Tag className="w-3 h-3 text-gray-400" />
                      <span className="text-xs text-gray-500">{tag}</span>
                    </div>
                  ))}
                  {workflow.tags.length > 3 && (
                    <span className="text-xs text-gray-400">
                      +{workflow.tags.length - 3} more
                    </span>
                  )}
                </div>

                {/* Category badge */}
                <div className="flex justify-end">
                  <span className="px-2 py-1 bg-gray-100 text-gray-600 rounded-full text-xs font-medium">
                    {workflow.category}
                  </span>
                </div>
              </div>
            </div>
          </motion.div>
        ))}
      </div>

      {filteredWorkflows.length === 0 && !loading && (
        <div className="text-center py-12">
          <div className="text-gray-400 mb-2">
            <Zap className="w-12 h-12 mx-auto" />
          </div>
          <h3 className="text-lg font-medium text-gray-900 mb-2">No workflows found</h3>
          <p className="text-gray-600">
            {selectedCategory === 'all'
              ? 'No restoration workflows are currently available.'
              : `No workflows found in the "${selectedCategory}" category.`
            }
          </p>
        </div>
      )}
    </div>
  );
}