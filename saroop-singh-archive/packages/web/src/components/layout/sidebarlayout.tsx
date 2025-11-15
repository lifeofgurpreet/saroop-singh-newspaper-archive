'use client'

import React, { useState, useEffect } from 'react'
import { Menu, X } from 'lucide-react'
import { cn } from '@/lib/utils'
import { useMediaQuery } from '@/hooks/useMediaQuery'

interface SidebarLayoutProps {
  children: React.ReactNode
  sidebar: React.ReactNode
  sidebarWidth?: string
  collapsible?: boolean
  defaultOpen?: boolean
  position?: 'left' | 'right'
  overlay?: boolean
  className?: string
  sidebarClassName?: string
  contentClassName?: string
}

export function SidebarLayout({
  children,
  sidebar,
  sidebarWidth = 'w-64',
  collapsible = true,
  defaultOpen = false,
  position = 'left',
  overlay = true,
  className,
  sidebarClassName,
  contentClassName
}: SidebarLayoutProps) {
  const [isOpen, setIsOpen] = useState(defaultOpen)
  const isMobile = useMediaQuery('(max-width: 768px)')

  // Auto-close sidebar on mobile when content is clicked
  useEffect(() => {
    if (isMobile && isOpen) {
      const handleClickOutside = () => setIsOpen(false)
      document.addEventListener('click', handleClickOutside)
      return () => document.removeEventListener('click', handleClickOutside)
    }
  }, [isMobile, isOpen])

  // Prevent body scroll when mobile sidebar is open
  useEffect(() => {
    if (isMobile && isOpen) {
      document.body.style.overflow = 'hidden'
    } else {
      document.body.style.overflow = 'unset'
    }
    
    return () => {
      document.body.style.overflow = 'unset'
    }
  }, [isMobile, isOpen])

  const toggleSidebar = () => setIsOpen(!isOpen)

  return (
    <div className={cn('relative flex min-h-screen', className)}>
      {/* Mobile Toggle Button */}
      {collapsible && isMobile && (
        <button
          onClick={toggleSidebar}
          className="fixed top-4 left-4 z-50 p-2 bg-white/90 backdrop-blur-sm rounded-lg shadow-lg border border-gray-200/50 hover:bg-white transition-colors"
          aria-label={isOpen ? 'Close sidebar' : 'Open sidebar'}
        >
          {isOpen ? (
            <X className="w-5 h-5 text-gray-600" />
          ) : (
            <Menu className="w-5 h-5 text-gray-600" />
          )}
        </button>
      )}

      {/* Overlay for mobile */}
      {isMobile && isOpen && overlay && (
        <div
          className="fixed inset-0 bg-black/50 backdrop-blur-sm z-40"
          onClick={() => setIsOpen(false)}
        />
      )}

      {/* Sidebar */}
      <aside
        className={cn(
          'flex-shrink-0 bg-white border-r border-gray-200/50 transition-all duration-300',
          sidebarWidth,
          // Position
          position === 'left' ? 'order-first' : 'order-last',
          // Mobile behavior
          isMobile ? [
            'fixed top-0 bottom-0 z-50',
            position === 'left' ? 'left-0' : 'right-0',
            isOpen ? 'translate-x-0' : (position === 'left' ? '-translate-x-full' : 'translate-x-full')
          ] : [
            // Desktop behavior when collapsed
            !isOpen && collapsible && (position === 'left' ? '-ml-64' : '-mr-64')
          ],
          sidebarClassName
        )}
        onClick={(e) => e.stopPropagation()} // Prevent click propagation on mobile
      >
        {/* Sidebar Header with Close Button */}
        <div className="flex items-center justify-between p-4 border-b border-gray-200/50 md:hidden">
          <h2 className="text-lg font-semibold text-gray-900">Menu</h2>
          <button
            onClick={() => setIsOpen(false)}
            className="p-2 hover:bg-gray-100 rounded-lg transition-colors"
          >
            <X className="w-5 h-5 text-gray-600" />
          </button>
        </div>

        {/* Sidebar Content */}
        <div className="flex-1 overflow-y-auto">
          {sidebar}
        </div>
      </aside>

      {/* Main Content */}
      <main 
        className={cn(
          'flex-1 min-w-0 transition-all duration-300',
          // Add padding when sidebar is always visible on desktop
          !isMobile && isOpen && collapsible && 'md:pl-0',
          contentClassName
        )}
      >
        {children}
      </main>
    </div>
  )
}

// Responsive sidebar that hides/shows based on screen size
export function ResponsiveSidebarLayout({
  children,
  sidebar,
  sidebarWidth = 'w-64',
  breakpoint = 'lg',
  className,
  ...props
}: SidebarLayoutProps & { breakpoint?: 'sm' | 'md' | 'lg' | 'xl' }) {
  const breakpointQuery = {
    sm: '(min-width: 640px)',
    md: '(min-width: 768px)', 
    lg: '(min-width: 1024px)',
    xl: '(min-width: 1280px)'
  }
  
  const isDesktop = useMediaQuery(breakpointQuery[breakpoint])

  return (
    <SidebarLayout
      sidebar={sidebar}
      sidebarWidth={sidebarWidth}
      defaultOpen={isDesktop}
      collapsible
      className={className}
      {...props}
    >
      {children}
    </SidebarLayout>
  )
}