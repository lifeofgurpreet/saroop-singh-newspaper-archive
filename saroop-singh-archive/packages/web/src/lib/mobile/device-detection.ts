'use client'

import * as React from 'react'

// Extend navigator interfaces to include experimental APIs
interface NavigatorTouch extends Navigator {
  msMaxTouchPoints?: number
}

interface NetworkConnection extends Navigator {
  connection?: {
    effectiveType?: string
    type?: string
  }
  mozConnection?: {
    effectiveType?: string
    type?: string
  }
  webkitConnection?: {
    effectiveType?: string
    type?: string
  }
}

export interface DeviceInfo {
  type: 'mobile' | 'tablet' | 'desktop'
  os: 'ios' | 'android' | 'windows' | 'macos' | 'linux' | 'unknown'
  browser: 'chrome' | 'firefox' | 'safari' | 'edge' | 'opera' | 'unknown'
  isTouchDevice: boolean
  isRetina: boolean
  hasHover: boolean
  supportsWebP: boolean
  supportsPWA: boolean
  connectionType?: string
  screenSize: {
    width: number
    height: number
    availWidth: number
    availHeight: number
  }
}

export class DeviceDetector {
  private userAgent: string
  private deviceInfo: DeviceInfo | null = null

  constructor() {
    this.userAgent = typeof navigator !== 'undefined' ? navigator.userAgent : ''
  }

  private detectDeviceType(): 'mobile' | 'tablet' | 'desktop' {
    if (typeof window === 'undefined') return 'desktop'

    const width = window.innerWidth
    
    // Use CSS media query if available
    if (window.matchMedia) {
      if (window.matchMedia('(pointer: coarse)').matches) {
        if (width < 768) return 'mobile'
        if (width < 1024) return 'tablet'
      }
    }

    // Fallback to user agent detection
    const mobileRegex = /Android|webOS|iPhone|iPad|iPod|BlackBerry|IEMobile|Opera Mini/i
    if (mobileRegex.test(this.userAgent)) {
      // Distinguish between tablet and phone
      const tabletRegex = /iPad|Android(?!.*Mobile)/i
      return tabletRegex.test(this.userAgent) ? 'tablet' : 'mobile'
    }

    return 'desktop'
  }

  private detectOS(): DeviceInfo['os'] {
    if (/iPad|iPhone|iPod/.test(this.userAgent)) return 'ios'
    if (/Android/.test(this.userAgent)) return 'android'
    if (/Windows/.test(this.userAgent)) return 'windows'
    if (/Mac OS X/.test(this.userAgent)) return 'macos'
    if (/Linux/.test(this.userAgent)) return 'linux'
    return 'unknown'
  }

  private detectBrowser(): DeviceInfo['browser'] {
    if (/Edg\//.test(this.userAgent)) return 'edge'
    if (/Chrome\//.test(this.userAgent) && !/Edge\//.test(this.userAgent)) return 'chrome'
    if (/Firefox\//.test(this.userAgent)) return 'firefox'
    if (/Safari\//.test(this.userAgent) && !/Chrome\//.test(this.userAgent)) return 'safari'
    if (/OPR\//.test(this.userAgent)) return 'opera'
    return 'unknown'
  }

  private detectTouchSupport(): boolean {
    if (typeof window === 'undefined') return false
    
    return (
      'ontouchstart' in window ||
      navigator.maxTouchPoints > 0 ||
      (navigator as NavigatorTouch).msMaxTouchPoints > 0
    )
  }

  private detectRetinaDisplay(): boolean {
    if (typeof window === 'undefined') return false
    
    return (
      window.devicePixelRatio > 1 ||
      (window.matchMedia && window.matchMedia('(min-resolution: 192dpi)').matches)
    )
  }

  private detectHoverSupport(): boolean {
    if (typeof window === 'undefined') return false
    
    return window.matchMedia('(hover: hover)').matches
  }

  private async detectWebPSupport(): Promise<boolean> {
    if (typeof window === 'undefined') return false
    
    return new Promise((resolve) => {
      const webP = new Image()
      webP.onload = () => {
        resolve(webP.height === 2)
      }
      webP.onerror = () => {
        resolve(false)
      }
      webP.src = 'data:image/webp;base64,UklGRjoAAABXRUJQVlA4IC4AAACyAgCdASoCAAIALmk0mk0iIiIiIgBoSygABc6WWgAA/veff/0PP8bA//LwYAAA'
    })
  }

  private detectPWASupport(): boolean {
    if (typeof window === 'undefined') return false
    
    return (
      'serviceWorker' in navigator &&
      'PushManager' in window &&
      'Notification' in window
    )
  }

  private getConnectionType(): string | undefined {
    if (typeof navigator === 'undefined') return undefined
    
    const connection = (navigator as NetworkConnection).connection || (navigator as NetworkConnection).mozConnection || (navigator as NetworkConnection).webkitConnection
    return connection?.effectiveType || connection?.type
  }

  private getScreenInfo() {
    if (typeof screen === 'undefined') {
      return {
        width: 0,
        height: 0,
        availWidth: 0,
        availHeight: 0
      }
    }

    return {
      width: screen.width,
      height: screen.height,
      availWidth: screen.availWidth,
      availHeight: screen.availHeight
    }
  }

  public async getDeviceInfo(): Promise<DeviceInfo> {
    if (this.deviceInfo) {
      return this.deviceInfo
    }

    const [supportsWebP] = await Promise.all([
      this.detectWebPSupport()
    ])

    this.deviceInfo = {
      type: this.detectDeviceType(),
      os: this.detectOS(),
      browser: this.detectBrowser(),
      isTouchDevice: this.detectTouchSupport(),
      isRetina: this.detectRetinaDisplay(),
      hasHover: this.detectHoverSupport(),
      supportsWebP,
      supportsPWA: this.detectPWASupport(),
      connectionType: this.getConnectionType(),
      screenSize: this.getScreenInfo()
    }

    return this.deviceInfo
  }

  // Synchronous version (without WebP detection)
  public getDeviceInfoSync(): Omit<DeviceInfo, 'supportsWebP'> & { supportsWebP: undefined } {
    return {
      type: this.detectDeviceType(),
      os: this.detectOS(),
      browser: this.detectBrowser(),
      isTouchDevice: this.detectTouchSupport(),
      isRetina: this.detectRetinaDisplay(),
      hasHover: this.detectHoverSupport(),
      supportsWebP: undefined,
      supportsPWA: this.detectPWASupport(),
      connectionType: this.getConnectionType(),
      screenSize: this.getScreenInfo()
    }
  }
}

// Singleton instance
let deviceDetector: DeviceDetector | null = null

export function getDeviceDetector(): DeviceDetector {
  if (!deviceDetector) {
    deviceDetector = new DeviceDetector()
  }
  return deviceDetector
}

// React hook for device information
export function useDeviceInfo() {
  const [deviceInfo, setDeviceInfo] = React.useState<DeviceInfo | null>(null)
  const [loading, setLoading] = React.useState(true)

  React.useEffect(() => {
    const detector = getDeviceDetector()
    
    detector.getDeviceInfo().then((info) => {
      setDeviceInfo(info)
      setLoading(false)
    })
  }, [])

  return { deviceInfo, loading }
}

// Utility functions for quick device checks
export function isMobile(): boolean {
  return getDeviceDetector().getDeviceInfoSync().type === 'mobile'
}

export function isTablet(): boolean {
  return getDeviceDetector().getDeviceInfoSync().type === 'tablet'
}

export function isDesktop(): boolean {
  return getDeviceDetector().getDeviceInfoSync().type === 'desktop'
}

export function isIOS(): boolean {
  return getDeviceDetector().getDeviceInfoSync().os === 'ios'
}

export function isAndroid(): boolean {
  return getDeviceDetector().getDeviceInfoSync().os === 'android'
}

export function isTouchDevice(): boolean {
  return getDeviceDetector().getDeviceInfoSync().isTouchDevice
}

export function isRetina(): boolean {
  return getDeviceDetector().getDeviceInfoSync().isRetina
}

export function hasHoverSupport(): boolean {
  return getDeviceDetector().getDeviceInfoSync().hasHover
}

export function supportsPWA(): boolean {
  return getDeviceDetector().getDeviceInfoSync().supportsPWA
}

// CSS class helpers
export function getDeviceClasses(): string {
  const info = getDeviceDetector().getDeviceInfoSync()
  const classes = []

  classes.push(`device-${info.type}`)
  classes.push(`os-${info.os}`)
  classes.push(`browser-${info.browser}`)
  
  if (info.isTouchDevice) classes.push('touch-device')
  if (info.isRetina) classes.push('retina-display')
  if (info.hasHover) classes.push('has-hover')
  if (info.supportsPWA) classes.push('supports-pwa')

  return classes.join(' ')
}