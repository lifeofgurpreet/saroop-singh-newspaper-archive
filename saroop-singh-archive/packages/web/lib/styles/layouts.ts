/**
 * Layout-specific class utilities
 */

// Flexbox utilities
export const flexClasses = {
  // Direction
  'flex-row': 'flex flex-row',
  'flex-col': 'flex flex-col',
  'flex-row-reverse': 'flex flex-row-reverse',
  'flex-col-reverse': 'flex flex-col-reverse',
  
  // Alignment
  'flex-center': 'flex items-center justify-center',
  'flex-between': 'flex items-center justify-between',
  'flex-around': 'flex items-center justify-around',
  'flex-evenly': 'flex items-center justify-evenly',
  'flex-start': 'flex items-center justify-start',
  'flex-end': 'flex items-center justify-end',
  
  // Vertical alignment
  'flex-top': 'flex items-start justify-center',
  'flex-bottom': 'flex items-end justify-center',
  'flex-baseline': 'flex items-baseline justify-center',
  
  // Wrap
  'flex-wrap': 'flex flex-wrap',
  'flex-nowrap': 'flex flex-nowrap',
  'flex-wrap-reverse': 'flex flex-wrap-reverse',
  
  // Common patterns
  'flex-header': 'flex items-center justify-between',
  'flex-sidebar': 'flex flex-col lg:flex-row',
  'flex-footer': 'flex flex-col md:flex-row items-center justify-between gap-4',
  'flex-card': 'flex flex-col h-full',
  'flex-form': 'flex flex-col space-y-4',
}

// Grid utilities
export const gridClasses = {
  // Basic grids
  'grid-1': 'grid grid-cols-1',
  'grid-2': 'grid grid-cols-1 md:grid-cols-2',
  'grid-3': 'grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3',
  'grid-4': 'grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4',
  'grid-6': 'grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 xl:grid-cols-6',
  
  // Auto-fit grids
  'grid-auto-sm': 'grid grid-cols-[repeat(auto-fit,minmax(200px,1fr))]',
  'grid-auto-md': 'grid grid-cols-[repeat(auto-fit,minmax(250px,1fr))]',
  'grid-auto-lg': 'grid grid-cols-[repeat(auto-fit,minmax(300px,1fr))]',
  'grid-auto-xl': 'grid grid-cols-[repeat(auto-fit,minmax(350px,1fr))]',
  
  // Auto-fill grids
  'grid-fill-sm': 'grid grid-cols-[repeat(auto-fill,minmax(200px,1fr))]',
  'grid-fill-md': 'grid grid-cols-[repeat(auto-fill,minmax(250px,1fr))]',
  'grid-fill-lg': 'grid grid-cols-[repeat(auto-fill,minmax(300px,1fr))]',
  
  // Gap sizes
  'grid-gap-sm': 'gap-2 md:gap-4',
  'grid-gap-md': 'gap-4 md:gap-6',
  'grid-gap-lg': 'gap-6 md:gap-8',
  'grid-gap-xl': 'gap-8 md:gap-12',
  
  // Specific layouts
  'grid-articles': 'grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6',
  'grid-features': 'grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-8',
  'grid-testimonials': 'grid grid-cols-1 md:grid-cols-2 gap-8',
  'grid-team': 'grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-6',
  'grid-gallery': 'grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4',
  'grid-dashboard': 'grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6',
}

// Position utilities
export const positionClasses = {
  // Absolute positioning
  'absolute-center': 'absolute top-1/2 left-1/2 transform -translate-x-1/2 -translate-y-1/2',
  'absolute-top-left': 'absolute top-0 left-0',
  'absolute-top-right': 'absolute top-0 right-0',
  'absolute-bottom-left': 'absolute bottom-0 left-0',
  'absolute-bottom-right': 'absolute bottom-0 right-0',
  'absolute-top-center': 'absolute top-0 left-1/2 transform -translate-x-1/2',
  'absolute-bottom-center': 'absolute bottom-0 left-1/2 transform -translate-x-1/2',
  
  // Fixed positioning
  'fixed-top': 'fixed top-0 left-0 right-0',
  'fixed-bottom': 'fixed bottom-0 left-0 right-0',
  'fixed-left': 'fixed top-0 left-0 bottom-0',
  'fixed-right': 'fixed top-0 right-0 bottom-0',
  'fixed-center': 'fixed top-1/2 left-1/2 transform -translate-x-1/2 -translate-y-1/2',
  
  // Sticky positioning
  'sticky-top': 'sticky top-0',
  'sticky-bottom': 'sticky bottom-0',
}

// Layout patterns
export const layoutPatterns = {
  // Page layouts
  'layout-full': 'min-h-screen flex flex-col',
  'layout-centered': 'min-h-screen flex items-center justify-center',
  'layout-sidebar': 'flex flex-col lg:flex-row min-h-screen',
  'layout-dashboard': 'grid grid-cols-1 lg:grid-cols-[250px_1fr] min-h-screen',
  
  // Content layouts
  'content-wrapper': 'flex-1 flex flex-col',
  'content-main': 'flex-1 max-w-4xl mx-auto w-full px-4 py-8',
  'content-wide': 'flex-1 max-w-7xl mx-auto w-full px-4 py-8',
  'content-narrow': 'flex-1 max-w-2xl mx-auto w-full px-4 py-8',
  
  // Header layouts
  'header-default': 'bg-white shadow-sm border-b sticky top-0 z-50',
  'header-transparent': 'absolute top-0 left-0 right-0 z-50 bg-transparent',
  'header-floating': 'fixed top-4 left-4 right-4 z-50 bg-white/80 backdrop-blur-md rounded-lg shadow-lg',
  
  // Navigation layouts
  'nav-horizontal': 'flex items-center space-x-8',
  'nav-vertical': 'flex flex-col space-y-2',
  'nav-mobile': 'fixed inset-0 z-50 bg-white p-6',
  'nav-drawer': 'fixed left-0 top-0 bottom-0 w-64 bg-white shadow-lg transform transition-transform',
  
  // Card layouts
  'card-stack': 'space-y-6',
  'card-grid': 'grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6',
  'card-masonry': 'columns-1 md:columns-2 lg:columns-3 gap-6 space-y-6',
  'card-list': 'divide-y divide-gray-200',
  
  // Form layouts
  'form-stack': 'space-y-6',
  'form-grid': 'grid grid-cols-1 md:grid-cols-2 gap-6',
  'form-inline': 'flex flex-wrap items-end gap-4',
  'form-steps': 'flex items-center justify-between',
  
  // Modal layouts
  'modal-overlay': 'fixed inset-0 z-50 bg-black/50 flex items-center justify-center p-4',
  'modal-content': 'bg-white rounded-lg shadow-xl max-w-md w-full max-h-[90vh] overflow-hidden',
  'modal-drawer': 'fixed right-0 top-0 bottom-0 w-full max-w-md bg-white shadow-xl',
  
  // Section layouts
  'section-default': 'py-12 md:py-16 lg:py-20',
  'section-hero': 'py-20 md:py-24 lg:py-32',
  'section-compact': 'py-8 md:py-12',
  'section-full': 'min-h-screen flex items-center',
}

// Spacing utilities
export const spacingClasses = {
  // Consistent spacing scales
  'space-xs': 'space-y-1',
  'space-sm': 'space-y-2',
  'space-md': 'space-y-4',
  'space-lg': 'space-y-6',
  'space-xl': 'space-y-8',
  'space-2xl': 'space-y-12',
  'space-3xl': 'space-y-16',
  
  // Horizontal spacing
  'space-x-xs': 'space-x-1',
  'space-x-sm': 'space-x-2',
  'space-x-md': 'space-x-4',
  'space-x-lg': 'space-x-6',
  'space-x-xl': 'space-x-8',
  
  // Responsive spacing
  'space-responsive': 'space-y-4 md:space-y-6 lg:space-y-8',
  'space-x-responsive': 'space-x-4 md:space-x-6 lg:space-x-8',
  
  // Content spacing
  'content-spacing': 'space-y-6 md:space-y-8',
  'section-spacing': 'py-12 md:py-16 lg:py-20',
  'element-spacing': 'mb-4 last:mb-0',
}

// Responsive utilities
export const responsiveClasses = {
  // Display
  'mobile-only': 'block md:hidden',
  'tablet-up': 'hidden md:block',
  'desktop-up': 'hidden lg:block',
  'mobile-tablet': 'block lg:hidden',
  'tablet-desktop': 'hidden md:block lg:block',
  
  // Layout direction
  'mobile-col': 'flex-col md:flex-row',
  'mobile-row': 'flex-row md:flex-col',
  
  // Grid responsive
  'grid-mobile-1': 'grid-cols-1',
  'grid-tablet-2': 'md:grid-cols-2',
  'grid-desktop-3': 'lg:grid-cols-3',
  'grid-wide-4': 'xl:grid-cols-4',
  
  // Text responsive
  'text-responsive-sm': 'text-sm md:text-base',
  'text-responsive-base': 'text-base md:text-lg',
  'text-responsive-lg': 'text-lg md:text-xl lg:text-2xl',
  'text-responsive-xl': 'text-xl md:text-2xl lg:text-3xl xl:text-4xl',
  
  // Padding responsive
  'px-responsive': 'px-4 md:px-6 lg:px-8',
  'py-responsive': 'py-8 md:py-12 lg:py-16',
  'p-responsive': 'p-4 md:p-6 lg:p-8',
  
  // Margin responsive
  'mx-responsive': 'mx-4 md:mx-6 lg:mx-8',
  'my-responsive': 'my-8 md:my-12 lg:my-16',
  'm-responsive': 'm-4 md:m-6 lg:m-8',
}

// Z-index utilities
export const zIndexClasses = {
  'z-dropdown': 'z-10',
  'z-sticky': 'z-20',
  'z-fixed': 'z-30',
  'z-modal-backdrop': 'z-40',
  'z-modal': 'z-50',
  'z-popover': 'z-60',
  'z-tooltip': 'z-70',
  'z-toast': 'z-80',
  'z-loading': 'z-90',
  'z-debug': 'z-[9999]',
}

// Scrollable containers
export const scrollClasses = {
  'scroll-container': 'overflow-auto scrollbar-thin scrollbar-thumb-gray-300 scrollbar-track-gray-100',
  'scroll-smooth': 'scroll-smooth',
  'scroll-x': 'overflow-x-auto scrollbar-thin scrollbar-thumb-gray-300',
  'scroll-y': 'overflow-y-auto scrollbar-thin scrollbar-thumb-gray-300',
  'scroll-hidden': 'overflow-hidden',
  'scroll-snap-x': 'snap-x snap-mandatory overflow-x-auto',
  'scroll-snap-y': 'snap-y snap-mandatory overflow-y-auto',
  'scroll-snap-item': 'snap-start',
}