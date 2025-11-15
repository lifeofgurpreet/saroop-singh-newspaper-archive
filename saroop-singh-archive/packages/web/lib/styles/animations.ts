/**
 * Animation and transition class utilities
 */

// CSS Animation classes
export const animationClasses = {
  // Fade animations
  'fade-in': 'animate-fade-in',
  'fade-out': 'animate-fade-out',
  'fade-in-up': 'animate-fade-in-up',
  'fade-in-down': 'animate-fade-in-down',
  
  // Slide animations
  'slide-in-left': 'animate-slide-in-left',
  'slide-in-right': 'animate-slide-in-right',
  'slide-in-up': 'animate-slide-in-up',
  'slide-in-down': 'animate-slide-in-down',
  
  // Scale animations
  'scale-in': 'animate-scale-in',
  'scale-out': 'animate-scale-out',
  'zoom-in': 'animate-zoom-in',
  
  // Rotation animations
  'spin': 'animate-spin',
  'spin-slow': 'animate-spin-slow',
  'rotate-in': 'animate-rotate-in',
  
  // Bounce and elastic
  'bounce': 'animate-bounce',
  'bounce-in': 'animate-bounce-in',
  'elastic': 'animate-elastic',
  
  // Attention seekers
  'pulse': 'animate-pulse',
  'ping': 'animate-ping',
  'shake': 'animate-shake',
  'wobble': 'animate-wobble',
  'swing': 'animate-swing',
  
  // Loading states
  'skeleton': 'animate-pulse bg-gray-200 rounded',
  'shimmer': 'animate-shimmer bg-gradient-to-r from-gray-200 via-gray-100 to-gray-200 bg-[length:200%_100%]',
}

// Transition classes
export const transitionClasses = {
  // Duration
  'duration-fast': 'duration-150',
  'duration-normal': 'duration-300',
  'duration-slow': 'duration-500',
  'duration-slower': 'duration-700',
  
  // Easing
  'ease-in': 'ease-in',
  'ease-out': 'ease-out',
  'ease-in-out': 'ease-in-out',
  'ease-bounce': 'ease-[cubic-bezier(0.68,-0.55,0.265,1.55)]',
  'ease-smooth': 'ease-[cubic-bezier(0.25,0.1,0.25,1)]',
  
  // Properties
  'transition-all': 'transition-all',
  'transition-colors': 'transition-colors',
  'transition-transform': 'transition-transform',
  'transition-opacity': 'transition-opacity',
  'transition-shadow': 'transition-shadow',
  
  // Combined common transitions
  'transition-smooth': 'transition-all duration-300 ease-out',
  'transition-quick': 'transition-all duration-150 ease-out',
  'transition-slow': 'transition-all duration-500 ease-in-out',
  'transition-colors-smooth': 'transition-colors duration-200 ease-in-out',
  'transition-transform-smooth': 'transition-transform duration-300 ease-out',
}

// Hover effect classes
export const hoverEffects = {
  // Scale effects
  'hover-scale': 'hover:scale-105 transition-transform duration-200',
  'hover-scale-sm': 'hover:scale-102 transition-transform duration-200',
  'hover-scale-lg': 'hover:scale-110 transition-transform duration-200',
  
  // Shadow effects
  'hover-shadow': 'hover:shadow-md transition-shadow duration-200',
  'hover-shadow-lg': 'hover:shadow-lg transition-shadow duration-200',
  'hover-shadow-xl': 'hover:shadow-xl transition-shadow duration-200',
  
  // Color effects
  'hover-brighten': 'hover:brightness-110 transition-all duration-200',
  'hover-darken': 'hover:brightness-90 transition-all duration-200',
  'hover-opacity': 'hover:opacity-80 transition-opacity duration-200',
  
  // Transform effects
  'hover-lift': 'hover:-translate-y-1 hover:shadow-lg transition-all duration-200',
  'hover-tilt': 'hover:rotate-1 transition-transform duration-200',
  'hover-tilt-reverse': 'hover:-rotate-1 transition-transform duration-200',
  
  // Border effects
  'hover-border': 'hover:border-primary transition-colors duration-200',
  'hover-border-vintage': 'hover:border-vintage-400 transition-colors duration-200',
  
  // Background effects
  'hover-bg': 'hover:bg-accent/50 transition-colors duration-200',
  'hover-bg-vintage': 'hover:bg-vintage-50 transition-colors duration-200',
}

// Focus effect classes
export const focusEffects = {
  // Ring effects
  'focus-ring': 'focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2',
  'focus-ring-inset': 'focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-inset focus-visible:ring-ring',
  'focus-ring-vintage': 'focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-vintage-500 focus-visible:ring-offset-2',
  
  // Border effects
  'focus-border': 'focus:border-primary focus:outline-none',
  'focus-border-vintage': 'focus:border-vintage-500 focus:outline-none',
}

// Active/pressed effects
export const activeEffects = {
  'active-scale': 'active:scale-95 transition-transform duration-100',
  'active-brightness': 'active:brightness-90 transition-all duration-100',
  'active-translate': 'active:translate-y-0.5 transition-transform duration-100',
}

// Loading and state animations
export const stateAnimations = {
  // Loading states
  'loading-pulse': 'animate-pulse opacity-70',
  'loading-spin': 'animate-spin',
  'loading-bounce': 'animate-bounce',
  
  // Success states
  'success-bounce': 'animate-bounce-in',
  'success-scale': 'animate-scale-in',
  
  // Error states
  'error-shake': 'animate-shake',
  'error-pulse': 'animate-pulse text-red-500',
  
  // Warning states
  'warning-pulse': 'animate-pulse text-yellow-500',
  'warning-glow': 'animate-pulse shadow-yellow-200',
}

// Scroll-triggered animations (use with Intersection Observer)
export const scrollAnimations = {
  // Fade in from directions
  'scroll-fade-up': 'translate-y-8 opacity-0 transition-all duration-700 ease-out',
  'scroll-fade-down': '-translate-y-8 opacity-0 transition-all duration-700 ease-out',
  'scroll-fade-left': 'translate-x-8 opacity-0 transition-all duration-700 ease-out',
  'scroll-fade-right': '-translate-x-8 opacity-0 transition-all duration-700 ease-out',
  
  // Scale in
  'scroll-scale': 'scale-95 opacity-0 transition-all duration-700 ease-out',
  
  // Active states (add when element is visible)
  'scroll-active': 'translate-y-0 translate-x-0 scale-100 opacity-100',
}

// Motion preference utilities
export const motionClasses = {
  // Respect user preferences
  'motion-safe-animation': 'motion-safe:animate-bounce',
  'motion-reduce-transition': 'motion-reduce:transition-none',
  
  // Conditional animations
  'animate-if-motion': 'motion-safe:animate-pulse motion-reduce:animate-none',
}

// Stagger animation utilities (for lists/grids)
export const staggerClasses = {
  'stagger-1': 'animation-delay-100',
  'stagger-2': 'animation-delay-200',
  'stagger-3': 'animation-delay-300',
  'stagger-4': 'animation-delay-400',
  'stagger-5': 'animation-delay-500',
}

// Combined animation presets
export const animationPresets = {
  // Card animations
  'card-hover': 'hover:scale-105 hover:shadow-lg hover:-translate-y-1 transition-all duration-200',
  'card-press': 'active:scale-98 transition-transform duration-100',
  
  // Button animations
  'button-hover': 'hover:scale-105 active:scale-95 transition-transform duration-150',
  'button-bounce': 'hover:animate-bounce-in active:scale-95',
  
  // Input animations
  'input-focus': 'focus:ring-2 focus:ring-primary focus:border-primary transition-all duration-200',
  'input-error': 'focus:ring-2 focus:ring-red-500 focus:border-red-500 animate-shake',
  
  // Modal animations
  'modal-enter': 'animate-fade-in animate-scale-in',
  'modal-exit': 'animate-fade-out animate-scale-out',
  
  // Page transitions
  'page-enter': 'animate-fade-in-up',
  'page-exit': 'animate-fade-out-down',
  
  // Loading overlays
  'loading-overlay': 'animate-fade-in bg-white/80 backdrop-blur-sm',
  'loading-spinner': 'animate-spin text-primary',
}