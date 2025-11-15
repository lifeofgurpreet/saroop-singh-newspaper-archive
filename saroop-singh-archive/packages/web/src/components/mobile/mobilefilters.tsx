'use client'

import React, { useState } from 'react'
import { Filter, X, Calendar, Building2, SortAsc, CheckCircle2 } from 'lucide-react'
import { cn } from '@/lib/utils'

interface FilterOption {
  id: string
  label: string
  count?: number
}

interface MobileFiltersProps {
  isOpen: boolean
  onClose: () => void
  onApplyFilters: (filters: ActiveFilters) => void
  className?: string
}

interface ActiveFilters {
  dateRanges: string[]
  publications: string[]
  categories: string[]
  sortBy: 'date' | 'relevance'
  sortOrder: 'asc' | 'desc'
}

const dateRangeOptions: FilterOption[] = [
  { id: '1930s', label: '1930s', count: 15 },
  { id: '1940s', label: '1940s', count: 18 },
  { id: '1950s', label: '1950s', count: 5 },
]

const publicationOptions: FilterOption[] = [
  { id: 'straits-times', label: 'Straits Times', count: 20 },
  { id: 'singapore-free-press', label: 'Singapore Free Press', count: 8 },
  { id: 'malaya-tribune', label: 'Malaya Tribune', count: 6 },
  { id: 'indian-daily-mail', label: 'Indian Daily Mail', count: 4 },
]

const categoryOptions: FilterOption[] = [
  { id: 'athletics', label: 'Athletics', count: 25 },
  { id: 'cross-country', label: 'Cross Country', count: 8 },
  { id: 'records', label: 'Records', count: 12 },
  { id: 'competitions', label: 'Competitions', count: 15 },
]

export function MobileFilters({ 
  isOpen, 
  onClose, 
  onApplyFilters,
  className 
}: MobileFiltersProps) {
  const [activeFilters, setActiveFilters] = useState<ActiveFilters>({
    dateRanges: [],
    publications: [],
    categories: [],
    sortBy: 'date',
    sortOrder: 'desc'
  })

  const [activeSection, setActiveSection] = useState<string>('dateRanges')

  const toggleFilter = (filterType: keyof Pick<ActiveFilters, 'dateRanges' | 'publications' | 'categories'>, value: string) => {
    setActiveFilters(prev => ({
      ...prev,
      [filterType]: prev[filterType].includes(value)
        ? prev[filterType].filter(item => item !== value)
        : [...prev[filterType], value]
    }))
  }

  const clearAllFilters = () => {
    setActiveFilters({
      dateRanges: [],
      publications: [],
      categories: [],
      sortBy: 'date',
      sortOrder: 'desc'
    })
  }

  const getActiveFilterCount = () => {
    return activeFilters.dateRanges.length + 
           activeFilters.publications.length + 
           activeFilters.categories.length
  }

  const handleApplyFilters = () => {
    onApplyFilters(activeFilters)
    onClose()
  }

  if (!isOpen) return null

  return (
    <>
      {/* Backdrop */}
      <div 
        className="fixed inset-0 bg-black/50 backdrop-blur-sm z-40"
        onClick={onClose}
      />

      {/* Filter Panel */}
      <div className={cn(
        'fixed inset-x-0 bottom-0 bg-white rounded-t-3xl z-50 max-h-[85vh] flex flex-col',
        'shadow-2xl border-t border-gray-200/50',
        className
      )}>
        {/* Handle */}
        <div className="flex justify-center pt-3 pb-2">
          <div className="w-12 h-1.5 bg-gray-300 rounded-full" />
        </div>

        {/* Header */}
        <div className="flex items-center justify-between px-6 py-4 border-b border-gray-200/50">
          <div className="flex items-center space-x-3">
            <Filter className="w-5 h-5 text-gray-600" />
            <h2 className="text-lg font-semibold text-gray-900">Filters</h2>
            {getActiveFilterCount() > 0 && (
              <span className="bg-blue-100 text-blue-700 text-xs font-medium px-2 py-1 rounded-full">
                {getActiveFilterCount()}
              </span>
            )}
          </div>
          <div className="flex items-center space-x-2">
            <button
              onClick={clearAllFilters}
              className="text-sm text-gray-500 hover:text-gray-700 font-medium"
            >
              Clear All
            </button>
            <button
              onClick={onClose}
              className="p-2 hover:bg-gray-100 rounded-full transition-colors"
            >
              <X className="w-5 h-5 text-gray-600" />
            </button>
          </div>
        </div>

        {/* Filter Sections Tabs */}
        <div className="flex border-b border-gray-200/50 bg-gray-50/50">
          {[
            { id: 'dateRanges', label: 'Date', icon: Calendar },
            { id: 'publications', label: 'Source', icon: Building2 },
            { id: 'categories', label: 'Category', icon: Filter },
            { id: 'sort', label: 'Sort', icon: SortAsc }
          ].map((section) => {
            const Icon = section.icon
            const isActive = activeSection === section.id
            const hasActiveFilters = section.id !== 'sort' && 
              activeFilters[section.id as keyof Pick<ActiveFilters, 'dateRanges' | 'publications' | 'categories'>]?.length > 0

            return (
              <button
                key={section.id}
                onClick={() => setActiveSection(section.id)}
                className={cn(
                  'flex-1 flex items-center justify-center space-x-2 py-3 text-sm font-medium transition-all duration-200',
                  'border-b-2 border-transparent relative',
                  isActive ? 'text-blue-600 border-blue-600 bg-blue-50/50' : 'text-gray-600 hover:text-gray-800'
                )}
              >
                <Icon className="w-4 h-4" />
                <span>{section.label}</span>
                {hasActiveFilters && (
                  <div className="absolute -top-1 -right-1 w-2 h-2 bg-blue-500 rounded-full" />
                )}
              </button>
            )
          })}
        </div>

        {/* Filter Content */}
        <div className="flex-1 overflow-y-auto p-6">
          {/* Date Range Filters */}
          {activeSection === 'dateRanges' && (
            <div className="space-y-3">
              <h3 className="text-sm font-medium text-gray-700 mb-4">Select Date Ranges</h3>
              {dateRangeOptions.map((option) => (
                <FilterOptionItem
                  key={option.id}
                  option={option}
                  isSelected={activeFilters.dateRanges.includes(option.id)}
                  onToggle={() => toggleFilter('dateRanges', option.id)}
                />
              ))}
            </div>
          )}

          {/* Publication Filters */}
          {activeSection === 'publications' && (
            <div className="space-y-3">
              <h3 className="text-sm font-medium text-gray-700 mb-4">Select Publications</h3>
              {publicationOptions.map((option) => (
                <FilterOptionItem
                  key={option.id}
                  option={option}
                  isSelected={activeFilters.publications.includes(option.id)}
                  onToggle={() => toggleFilter('publications', option.id)}
                />
              ))}
            </div>
          )}

          {/* Category Filters */}
          {activeSection === 'categories' && (
            <div className="space-y-3">
              <h3 className="text-sm font-medium text-gray-700 mb-4">Select Categories</h3>
              {categoryOptions.map((option) => (
                <FilterOptionItem
                  key={option.id}
                  option={option}
                  isSelected={activeFilters.categories.includes(option.id)}
                  onToggle={() => toggleFilter('categories', option.id)}
                />
              ))}
            </div>
          )}

          {/* Sort Options */}
          {activeSection === 'sort' && (
            <div className="space-y-4">
              <h3 className="text-sm font-medium text-gray-700 mb-4">Sort Options</h3>
              
              <div>
                <h4 className="text-sm font-medium text-gray-600 mb-2">Sort By</h4>
                <div className="space-y-2">
                  <label className="flex items-center space-x-3 p-3 rounded-xl hover:bg-gray-50 cursor-pointer">
                    <input
                      type="radio"
                      name="sortBy"
                      value="date"
                      checked={activeFilters.sortBy === 'date'}
                      onChange={(e) => setActiveFilters(prev => ({ ...prev, sortBy: e.target.value as 'date' }))}
                      className="text-blue-600 focus:ring-blue-500"
                    />
                    <span className="text-sm text-gray-700">Date</span>
                  </label>
                  <label className="flex items-center space-x-3 p-3 rounded-xl hover:bg-gray-50 cursor-pointer">
                    <input
                      type="radio"
                      name="sortBy"
                      value="relevance"
                      checked={activeFilters.sortBy === 'relevance'}
                      onChange={(e) => setActiveFilters(prev => ({ ...prev, sortBy: e.target.value as 'relevance' }))}
                      className="text-blue-600 focus:ring-blue-500"
                    />
                    <span className="text-sm text-gray-700">Relevance</span>
                  </label>
                </div>
              </div>

              <div>
                <h4 className="text-sm font-medium text-gray-600 mb-2">Order</h4>
                <div className="space-y-2">
                  <label className="flex items-center space-x-3 p-3 rounded-xl hover:bg-gray-50 cursor-pointer">
                    <input
                      type="radio"
                      name="sortOrder"
                      value="desc"
                      checked={activeFilters.sortOrder === 'desc'}
                      onChange={(e) => setActiveFilters(prev => ({ ...prev, sortOrder: e.target.value as 'desc' }))}
                      className="text-blue-600 focus:ring-blue-500"
                    />
                    <span className="text-sm text-gray-700">
                      {activeFilters.sortBy === 'date' ? 'Newest first' : 'Most relevant'}
                    </span>
                  </label>
                  <label className="flex items-center space-x-3 p-3 rounded-xl hover:bg-gray-50 cursor-pointer">
                    <input
                      type="radio"
                      name="sortOrder"
                      value="asc"
                      checked={activeFilters.sortOrder === 'asc'}
                      onChange={(e) => setActiveFilters(prev => ({ ...prev, sortOrder: e.target.value as 'asc' }))}
                      className="text-blue-600 focus:ring-blue-500"
                    />
                    <span className="text-sm text-gray-700">
                      {activeFilters.sortBy === 'date' ? 'Oldest first' : 'Least relevant'}
                    </span>
                  </label>
                </div>
              </div>
            </div>
          )}
        </div>

        {/* Apply Button */}
        <div className="p-6 border-t border-gray-200/50 bg-white">
          <button
            onClick={handleApplyFilters}
            className="w-full bg-blue-600 text-white py-4 rounded-xl font-semibold hover:bg-blue-700 transition-colors active:scale-98"
          >
            Apply Filters
            {getActiveFilterCount() > 0 && ` (${getActiveFilterCount()})`}
          </button>
        </div>
      </div>
    </>
  )
}

function FilterOptionItem({ 
  option, 
  isSelected, 
  onToggle 
}: { 
  option: FilterOption
  isSelected: boolean
  onToggle: () => void
}) {
  return (
    <button
      onClick={onToggle}
      className={cn(
        'w-full flex items-center justify-between p-4 rounded-xl border transition-all duration-200',
        'hover:bg-gray-50 active:scale-98',
        isSelected 
          ? 'bg-blue-50 border-blue-200 text-blue-700' 
          : 'bg-white border-gray-200 text-gray-700'
      )}
    >
      <div className="flex items-center space-x-3">
        {isSelected && <CheckCircle2 className="w-5 h-5 text-blue-600" />}
        <span className="font-medium">{option.label}</span>
      </div>
      {option.count && (
        <span className={cn(
          'text-sm px-2 py-1 rounded-full',
          isSelected 
            ? 'bg-blue-100 text-blue-600' 
            : 'bg-gray-100 text-gray-500'
        )}>
          {option.count}
        </span>
      )}
    </button>
  )
}