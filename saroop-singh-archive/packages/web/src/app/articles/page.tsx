'use client'

import * as React from 'react'
import { getAllArticles } from '@/lib/articles-client'
import { FilterableGrid } from '@/components/composite/filterablegrid'
import { searchArticles, getDefaultSearchOptions, getDefaultSortOptions } from '@/lib/articleUtils'
import { useDebounce } from '@/hooks/useDebounce'
import type { Article, SearchOptions, SortOptions } from '@/types'

export default function ArticlesPage() {
  // State for articles and filtering
  const [allArticles, setAllArticles] = React.useState<Article[]>([])
  const [loading, setLoading] = React.useState(true)
  const [searchOptions, setSearchOptions] = React.useState<SearchOptions>(getDefaultSearchOptions())
  const [sortOptions, setSortOptions] = React.useState<SortOptions>(getDefaultSortOptions())
  
  // Debounce search query for better performance
  const debouncedSearchOptions = useDebounce(searchOptions, 300)
  
  // Load articles on mount
  React.useEffect(() => {
    async function loadArticles() {
      try {
        setLoading(true)
        // Fetch articles from API
        const articles = await getAllArticles()
        setAllArticles(articles)
      } catch (error) {
        console.error('Failed to load articles:', error)
      } finally {
        setLoading(false)
      }
    }
    
    loadArticles()
  }, [])
  
  // Search and filter articles
  const searchResult = React.useMemo(() => {
    if (loading) return { articles: [], total: 0, filters: { sources: {}, people: {}, locations: {}, tags: {}, categories: {} } }
    return searchArticles(allArticles, debouncedSearchOptions, sortOptions)
  }, [allArticles, debouncedSearchOptions, sortOptions, loading])
  
  // Handle filter changes
  const handleSearchChange = React.useCallback((options: SearchOptions) => {
    setSearchOptions(options)
  }, [])
  
  const handleSortChange = React.useCallback((options: SortOptions) => {
    setSortOptions(options)
  }, [])
  
  const handleClearFilters = React.useCallback(() => {
    setSearchOptions(getDefaultSearchOptions())
  }, [])
  
  return (
    <div className="min-h-screen bg-gray-50">
      {/* Hero Section */}
      <div className="bg-gradient-to-br from-vintage-50 to-sepia-50 border-b">
        <div className="container mx-auto px-4 py-12">
          <h1 className="text-4xl font-bold text-vintage-900 mb-4">
            Historical Articles
          </h1>
          <p className="text-lg text-vintage-700 max-w-2xl">
            Explore {allArticles.length} historical newspaper articles documenting the athletic achievements and contributions of Saroop Singh, a Malaysian athletics pioneer.
          </p>
        </div>
      </div>
      
      {/* Main Content */}
      <div className="container mx-auto px-4 py-8">
        <FilterableGrid
          allArticles={allArticles}
          filteredArticles={searchResult.articles}
          searchOptions={searchOptions}
          sortOptions={sortOptions}
          filterCounts={searchResult.filters}
          filterLoading={loading}
          onSearchChange={handleSearchChange}
          onSortChange={handleSortChange}
          onClearFilters={handleClearFilters}
          loading={loading}
          loadingCount={12}
          cols={3}
          gap="lg"
          articleVariant="vintage"
          articleHover="lift"
          showContent
          filterPosition="left"
          filterVariant="glass"
          stickyFilters
          emptyState={
            <div className="col-span-full text-center py-16">
              <div className="mx-auto w-32 h-32 rounded-full bg-vintage-100 flex items-center justify-center mb-6">
                <svg
                  className="w-12 h-12 text-vintage-400"
                  fill="none"
                  stroke="currentColor"
                  viewBox="0 0 24 24"
                >
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    strokeWidth={1.5}
                    d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z"
                  />
                </svg>
              </div>
              <h3 className="text-xl font-semibold text-vintage-800 mb-2">
                No articles found
              </h3>
              <p className="text-vintage-600 mb-6 max-w-md mx-auto">
                We couldn&apos;t find any articles matching your search criteria. Try adjusting your filters or search terms.
              </p>
            </div>
          }
        />
      </div>
    </div>
  )
}