/**
 * Theme-specific class utilities
 */

// Color palette classes
export const colorClasses = {
  // Primary colors
  'text-primary': 'text-blue-600 dark:text-blue-400',
  'bg-primary': 'bg-blue-600 dark:bg-blue-500',
  'border-primary': 'border-blue-600 dark:border-blue-500',
  
  // Secondary colors
  'text-secondary': 'text-gray-600 dark:text-gray-300',
  'bg-secondary': 'bg-gray-100 dark:bg-gray-800',
  'border-secondary': 'border-gray-200 dark:border-gray-700',
  
  // Accent colors
  'text-accent': 'text-vintage-700 dark:text-vintage-300',
  'bg-accent': 'bg-vintage-50 dark:bg-vintage-900',
  'border-accent': 'border-vintage-200 dark:border-vintage-700',
  
  // Status colors
  'text-success': 'text-green-600 dark:text-green-400',
  'text-warning': 'text-yellow-600 dark:text-yellow-400',
  'text-error': 'text-red-600 dark:text-red-400',
  'text-info': 'text-blue-600 dark:text-blue-400',
  
  'bg-success': 'bg-green-50 dark:bg-green-900/20',
  'bg-warning': 'bg-yellow-50 dark:bg-yellow-900/20',
  'bg-error': 'bg-red-50 dark:bg-red-900/20',
  'bg-info': 'bg-blue-50 dark:bg-blue-900/20',
  
  // Muted colors
  'text-muted': 'text-gray-500 dark:text-gray-400',
  'bg-muted': 'bg-gray-50 dark:bg-gray-900',
  'border-muted': 'border-gray-100 dark:border-gray-800',
}

// Vintage theme classes
export const vintageClasses = {
  // Text colors
  'text-vintage-primary': 'text-vintage-900',
  'text-vintage-secondary': 'text-vintage-700',
  'text-vintage-muted': 'text-vintage-600',
  'text-vintage-accent': 'text-sepia-700',
  
  // Background colors
  'bg-vintage-primary': 'bg-vintage-50',
  'bg-vintage-secondary': 'bg-vintage-100',
  'bg-vintage-accent': 'bg-sepia-50',
  'bg-vintage-card': 'bg-vintage-25',
  
  // Border colors
  'border-vintage-primary': 'border-vintage-200',
  'border-vintage-secondary': 'border-vintage-300',
  'border-vintage-accent': 'border-sepia-200',
  
  // Gradients
  'gradient-vintage': 'bg-gradient-to-br from-vintage-50 to-sepia-100',
  'gradient-vintage-warm': 'bg-gradient-to-r from-vintage-100 via-sepia-50 to-vintage-50',
  'gradient-vintage-sunset': 'bg-gradient-to-br from-vintage-200 via-sepia-100 to-vintage-100',
  
  // Shadows
  'shadow-vintage': 'shadow-lg shadow-vintage-200/50',
  'shadow-vintage-soft': 'shadow-md shadow-vintage-100/50',
  'shadow-vintage-strong': 'shadow-xl shadow-vintage-300/50',
  
  // Text effects
  'text-vintage-heading': 'text-vintage-900 font-serif font-bold tracking-tight',
  'text-vintage-body': 'text-vintage-700 leading-relaxed',
  'text-vintage-caption': 'text-vintage-600 text-sm font-medium',
}

// Dark theme utilities
export const darkClasses = {
  // Dark mode specific
  'dark-bg-primary': 'dark:bg-gray-900',
  'dark-bg-secondary': 'dark:bg-gray-800',
  'dark-bg-accent': 'dark:bg-gray-700',
  
  'dark-text-primary': 'dark:text-gray-100',
  'dark-text-secondary': 'dark:text-gray-300',
  'dark-text-muted': 'dark:text-gray-400',
  
  'dark-border-primary': 'dark:border-gray-700',
  'dark-border-secondary': 'dark:border-gray-600',
  
  // Dark mode gradients
  'dark-gradient': 'dark:from-gray-900 dark:to-gray-800',
  'dark-gradient-subtle': 'dark:from-gray-800 dark:to-gray-900',
  
  // Dark mode shadows
  'dark-shadow': 'dark:shadow-xl dark:shadow-black/25',
  'dark-shadow-colored': 'dark:shadow-lg dark:shadow-blue-500/10',
}

// Theme-aware component classes
export const themeComponents = {
  // Cards
  'card-light': 'bg-white border border-gray-200 shadow-sm',
  'card-dark': 'dark:bg-gray-800 dark:border-gray-700 dark:shadow-lg',
  'card-vintage': 'bg-vintage-25 border border-vintage-200 shadow-vintage-soft',
  'card-theme': 'bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-700 shadow-sm dark:shadow-lg',
  
  // Inputs
  'input-light': 'bg-white border-gray-300 focus:border-blue-500 focus:ring-blue-500',
  'input-dark': 'dark:bg-gray-700 dark:border-gray-600 dark:focus:border-blue-400 dark:focus:ring-blue-400',
  'input-vintage': 'bg-vintage-25 border-vintage-300 focus:border-vintage-500 focus:ring-vintage-500',
  'input-theme': 'bg-white dark:bg-gray-700 border-gray-300 dark:border-gray-600 focus:border-blue-500 dark:focus:border-blue-400',
  
  // Buttons
  'button-light': 'bg-white text-gray-900 border-gray-300 hover:bg-gray-50',
  'button-dark': 'dark:bg-gray-700 dark:text-gray-100 dark:border-gray-600 dark:hover:bg-gray-600',
  'button-vintage': 'bg-vintage-600 text-white border-vintage-700 hover:bg-vintage-700',
  'button-theme': 'bg-white dark:bg-gray-700 text-gray-900 dark:text-gray-100 border-gray-300 dark:border-gray-600 hover:bg-gray-50 dark:hover:bg-gray-600',
}

// Semantic theme classes
export const semanticClasses = {
  // Page backgrounds
  'page-bg': 'bg-white dark:bg-gray-900 text-gray-900 dark:text-gray-100',
  'section-bg': 'bg-gray-50 dark:bg-gray-800',
  'card-bg': 'bg-white dark:bg-gray-800',
  'header-bg': 'bg-white/80 dark:bg-gray-900/80 backdrop-blur-sm',
  'footer-bg': 'bg-gray-50 dark:bg-gray-800',
  
  // Interactive elements
  'interactive': 'hover:bg-gray-50 dark:hover:bg-gray-800 transition-colors cursor-pointer',
  'interactive-vintage': 'hover:bg-vintage-50 transition-colors cursor-pointer',
  'clickable': 'cursor-pointer select-none hover:opacity-80 active:opacity-60 transition-opacity',
  
  // Text hierarchy
  'text-headline': 'text-2xl md:text-3xl font-bold text-gray-900 dark:text-gray-100',
  'text-title': 'text-xl font-semibold text-gray-800 dark:text-gray-200',
  'text-subtitle': 'text-lg font-medium text-gray-700 dark:text-gray-300',
  'text-body': 'text-base text-gray-600 dark:text-gray-400',
  'text-caption': 'text-sm text-gray-500 dark:text-gray-500',
  'text-tiny': 'text-xs text-gray-400 dark:text-gray-600',
  
  // Status indicators
  'status-online': 'bg-green-500 text-white',
  'status-offline': 'bg-gray-500 text-white',
  'status-busy': 'bg-red-500 text-white',
  'status-away': 'bg-yellow-500 text-white',
  
  // Data states
  'data-loading': 'opacity-50 pointer-events-none animate-pulse',
  'data-error': 'text-red-600 dark:text-red-400 bg-red-50 dark:bg-red-900/20',
  'data-success': 'text-green-600 dark:text-green-400 bg-green-50 dark:bg-green-900/20',
  'data-empty': 'text-gray-400 dark:text-gray-600 italic',
}

// Typography theme classes
export const typographyClasses = {
  // Font families
  'font-heading': 'font-serif', // or 'headline-font' from your config
  'font-body': 'font-sans',
  'font-mono': 'font-mono',
  'font-vintage': 'font-serif',
  
  // Text treatments
  'text-balance': 'text-wrap balance',
  'text-pretty': 'text-wrap pretty',
  'text-gradient': 'bg-gradient-to-r from-blue-600 to-purple-600 bg-clip-text text-transparent',
  'text-gradient-vintage': 'bg-gradient-to-r from-vintage-600 to-sepia-600 bg-clip-text text-transparent',
  
  // Reading experience
  'prose-light': 'prose prose-gray max-w-none',
  'prose-dark': 'dark:prose-invert',
  'prose-vintage': 'prose prose-stone max-w-none prose-headings:text-vintage-900 prose-p:text-vintage-700',
  'prose-theme': 'prose prose-gray dark:prose-invert max-w-none',
  
  // Line heights for different content
  'leading-tight-headings': 'leading-tight tracking-tight',
  'leading-relaxed-body': 'leading-relaxed',
  'leading-loose-captions': 'leading-loose',
}

// Layout theme classes
export const layoutClasses = {
  // Containers
  'container-fluid': 'w-full max-w-full px-4 sm:px-6 lg:px-8',
  'container-narrow': 'max-w-2xl mx-auto px-4 sm:px-6',
  'container-wide': 'max-w-7xl mx-auto px-4 sm:px-6 lg:px-8',
  'container-vintage': 'max-w-6xl mx-auto px-4 sm:px-6 lg:px-8 bg-vintage-25/50',
  
  // Grid layouts
  'grid-articles': 'grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6',
  'grid-features': 'grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-8',
  'grid-masonry': 'columns-1 md:columns-2 lg:columns-3 gap-6',
  
  // Spacing
  'section-spacing': 'py-12 md:py-16 lg:py-20',
  'content-spacing': 'space-y-6 md:space-y-8',
  'tight-spacing': 'space-y-4',
  'loose-spacing': 'space-y-8 md:space-y-12',
}