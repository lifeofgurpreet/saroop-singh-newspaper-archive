'use client'

import * as React from 'react'

export interface ViewportInfo {
  width: number
  height: number
  aspectRatio: number
  orientation: 'portrait' | 'landscape'
  pixelRatio: number
  safeArea: {
    top: number
    right: number
    bottom: number
    left: number
  }
}

export class ViewportManager {
  private listeners: Array<(info: ViewportInfo) => void> = []
  private resizeObserver?: ResizeObserver
  private orientationMediaQuery?: MediaQueryList

  constructor() {
    this.setupListeners()
  }

  private setupListeners() {
    if (typeof window === 'undefined') return

    // Listen to resize events
    window.addEventListener('resize', this.handleResize.bind(this))

    // Listen to orientation changes
    this.orientationMediaQuery = window.matchMedia('(orientation: portrait)')
    this.orientationMediaQuery.addListener(this.handleOrientationChange.bind(this))

    // Listen to device pixel ratio changes (for zoom)
    const pixelRatioQuery = window.matchMedia(`(resolution: ${window.devicePixelRatio}dppx)`)
    pixelRatioQuery.addListener(this.handlePixelRatioChange.bind(this))
  }

  private handleResize() {
    this.notifyListeners()
  }

  private handleOrientationChange() {
    // Add a small delay to allow the viewport to settle after orientation change
    setTimeout(() => {
      this.notifyListeners()
    }, 100)
  }

  private handlePixelRatioChange() {
    this.notifyListeners()
  }

  private getSafeArea(): ViewportInfo['safeArea'] {
    if (typeof window === 'undefined' || !window.CSS?.supports) {
      return { top: 0, right: 0, bottom: 0, left: 0 }
    }

    // Use CSS environment variables for safe area insets (iOS Safari)
    const getEnvValue = (name: string, fallback: number = 0) => {
      if (CSS.supports('padding-top', `env(${name})`)) {
        const div = document.createElement('div')
        div.style.paddingTop = `env(${name})`
        document.body.appendChild(div)
        const value = parseInt(getComputedStyle(div).paddingTop, 10) || fallback
        document.body.removeChild(div)
        return value
      }
      return fallback
    }

    return {
      top: getEnvValue('safe-area-inset-top'),
      right: getEnvValue('safe-area-inset-right'),
      bottom: getEnvValue('safe-area-inset-bottom'),
      left: getEnvValue('safe-area-inset-left')
    }
  }

  public getCurrentViewportInfo(): ViewportInfo {
    if (typeof window === 'undefined') {
      return {
        width: 0,
        height: 0,
        aspectRatio: 1,
        orientation: 'portrait',
        pixelRatio: 1,
        safeArea: { top: 0, right: 0, bottom: 0, left: 0 }
      }
    }

    const width = window.innerWidth
    const height = window.innerHeight

    return {
      width,
      height,
      aspectRatio: width / height,
      orientation: width > height ? 'landscape' : 'portrait',
      pixelRatio: window.devicePixelRatio || 1,
      safeArea: this.getSafeArea()
    }
  }

  public subscribe(listener: (info: ViewportInfo) => void) {
    this.listeners.push(listener)
    
    // Immediately call with current info
    listener(this.getCurrentViewportInfo())

    // Return unsubscribe function
    return () => {
      const index = this.listeners.indexOf(listener)
      if (index > -1) {
        this.listeners.splice(index, 1)
      }
    }
  }

  private notifyListeners() {
    const info = this.getCurrentViewportInfo()
    this.listeners.forEach(listener => listener(info))
  }

  public destroy() {
    if (typeof window === 'undefined') return

    window.removeEventListener('resize', this.handleResize.bind(this))
    this.orientationMediaQuery?.removeListener(this.handleOrientationChange.bind(this))
    this.listeners = []
  }
}

// Singleton instance
let viewportManager: ViewportManager | null = null

export function getViewportManager(): ViewportManager {
  if (!viewportManager) {
    viewportManager = new ViewportManager()
  }
  return viewportManager
}

// React hook for viewport information
export function useViewport(): ViewportInfo {
  const [viewportInfo, setViewportInfo] = React.useState<ViewportInfo>(() => 
    getViewportManager().getCurrentViewportInfo()
  )

  React.useEffect(() => {
    const manager = getViewportManager()
    return manager.subscribe(setViewportInfo)
  }, [])

  return viewportInfo
}

// Utility functions
export function getViewportWidth(): number {
  return typeof window !== 'undefined' ? window.innerWidth : 0
}

export function getViewportHeight(): number {
  return typeof window !== 'undefined' ? window.innerHeight : 0
}

export function isPortrait(): boolean {
  if (typeof window === 'undefined') return true
  return window.innerHeight > window.innerWidth
}

export function isLandscape(): boolean {
  return !isPortrait()
}

export function getDevicePixelRatio(): number {
  return typeof window !== 'undefined' ? window.devicePixelRatio || 1 : 1
}

// Viewport unit calculations (considering safe areas)
export function getViewportUnit(value: number, unit: 'vw' | 'vh' | 'vmin' | 'vmax'): number {
  if (typeof window === 'undefined') return value

  const width = window.innerWidth
  const height = window.innerHeight

  switch (unit) {
    case 'vw':
      return (value * width) / 100
    case 'vh':
      return (value * height) / 100
    case 'vmin':
      return (value * Math.min(width, height)) / 100
    case 'vmax':
      return (value * Math.max(width, height)) / 100
    default:
      return value
  }
}

// Check if device is in standalone mode (PWA)
export function isStandalone(): boolean {
  if (typeof window === 'undefined') return false
  
  return (
    window.matchMedia('(display-mode: standalone)').matches ||
    ('standalone' in window.navigator && window.navigator.standalone === true) ||
    document.referrer.includes('android-app://')
  )
}

// Get scrollbar width
export function getScrollbarWidth(): number {
  if (typeof window === 'undefined') return 0

  const outer = document.createElement('div')
  outer.style.visibility = 'hidden'
  outer.style.overflow = 'scroll'
  ;(outer.style as CSSStyleDeclaration & { msOverflowStyle?: string }).msOverflowStyle = 'scrollbar'
  document.body.appendChild(outer)

  const inner = document.createElement('div')
  outer.appendChild(inner)

  const scrollbarWidth = outer.offsetWidth - inner.offsetWidth
  outer.parentNode?.removeChild(outer)

  return scrollbarWidth
}