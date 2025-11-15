'use client'

import { useEffect, useState } from 'react'

export function useMediaQuery(query: string): boolean {
  const [matches, setMatches] = useState(false)

  useEffect(() => {
    // Check if we're on the client side
    if (typeof window === 'undefined') {
      return
    }

    const media = window.matchMedia(query)
    
    // Set initial value
    setMatches(media.matches)

    // Create event listener
    const listener = (event: MediaQueryListEvent) => {
      setMatches(event.matches)
    }

    // Add listener
    if (media.addListener) {
      media.addListener(listener) // Safari < 14 support
    } else {
      media.addEventListener('change', listener)
    }

    // Cleanup
    return () => {
      if (media.removeListener) {
        media.removeListener(listener) // Safari < 14 support
      } else {
        media.removeEventListener('change', listener)
      }
    }
  }, [query])

  return matches
}

// Predefined breakpoint hooks for convenience
export function useIsMobile() {
  return useMediaQuery('(max-width: 768px)')
}

export function useIsTablet() {
  return useMediaQuery('(min-width: 769px) and (max-width: 1024px)')
}

export function useIsDesktop() {
  return useMediaQuery('(min-width: 1025px)')
}

export function useIsSmallScreen() {
  return useMediaQuery('(max-width: 640px)')
}

export function useIsLargeScreen() {
  return useMediaQuery('(min-width: 1280px)')
}

// Orientation hooks
export function useIsPortrait() {
  return useMediaQuery('(orientation: portrait)')
}

export function useIsLandscape() {
  return useMediaQuery('(orientation: landscape)')
}

// Motion preferences
export function usePrefersReducedMotion() {
  return useMediaQuery('(prefers-reduced-motion: reduce)')
}

// Color scheme preference
export function usePrefersDarkMode() {
  return useMediaQuery('(prefers-color-scheme: dark)')
}