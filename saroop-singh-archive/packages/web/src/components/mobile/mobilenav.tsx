'use client'

import React, { useState, useEffect } from 'react'
import Link from 'next/link'
import { usePathname } from 'next/navigation'
import { Menu, X, Home, FileText, Clock, Sparkles, Image, User, ChevronRight } from 'lucide-react'
import { cn } from '@/lib/utils'

interface MobileNavProps {
  className?: string
}

const navigationItems = [
  { href: '/', label: 'Home', icon: Home },
  { href: '/articles', label: 'Articles', icon: FileText },
  { href: '/timeline', label: 'Timeline', icon: Clock },
  { href: '/restore', label: 'Restore Photos', icon: Sparkles },
  { href: '/gallery', label: 'Gallery', icon: Image },
  { href: '/about', label: 'About', icon: User },
]

export function MobileNav({ className }: MobileNavProps) {
  const [isOpen, setIsOpen] = useState(false)
  const pathname = usePathname()

  // Close menu when route changes
  useEffect(() => {
    setIsOpen(false)
  }, [pathname])

  // Prevent scroll when menu is open
  useEffect(() => {
    if (isOpen) {
      document.body.style.overflow = 'hidden'
    } else {
      document.body.style.overflow = 'unset'
    }
    
    return () => {
      document.body.style.overflow = 'unset'
    }
  }, [isOpen])

  return (
    <>
      {/* Mobile Menu Button - Sophisticated Design */}
      <button
        onClick={() => setIsOpen(!isOpen)}
        className={cn(
          'sm:hidden relative p-3 rounded-2xl transition-all duration-300',
          'bg-white/90 backdrop-blur-md shadow-md border border-neutral-200/40',
          'hover:shadow-lg active:scale-95',
          isOpen && 'bg-gradient-to-br from-primary-500 to-primary-600 shadow-lg shadow-primary-500/20',
          className
        )}
        aria-label="Toggle navigation menu"
      >
        <div className="relative w-6 h-6">
          {isOpen ? (
            <X className="w-6 h-6 text-white animate-scale-in" />
          ) : (
            <Menu className="w-6 h-6 text-neutral-700" />
          )}
        </div>
      </button>

      {/* Overlay with Enhanced Animation */}
      {isOpen && (
        <div
          className="fixed inset-0 bg-neutral-900/60 backdrop-blur-md z-40 sm:hidden animate-fade-in"
          onClick={() => setIsOpen(false)}
        />
      )}

      {/* Mobile Menu - Premium Design */}
      <div
        className={cn(
          'fixed top-0 right-0 h-full w-80 max-w-[85vw] z-40 sm:hidden',
          'bg-white shadow-2xl',
          'transform transition-all duration-500 ease-[cubic-bezier(0.16,1,0.3,1)]',
          isOpen ? 'translate-x-0' : 'translate-x-full pointer-events-none'
        )}
      >
        {/* Gradient Background Effect */}
        <div className="absolute inset-0 bg-gradient-to-b from-primary-50/30 via-transparent to-accent-50/20" />
        
        {/* Menu Header */}
        <div className="relative p-6 border-b border-neutral-200/40">
          <div className="flex items-center justify-between">
            <div>
              <h2 className="text-2xl font-bold bg-gradient-to-br from-neutral-900 to-neutral-700 bg-clip-text text-transparent">
                Navigation
              </h2>
              <p className="text-sm text-neutral-500 mt-1">Saroop Singh Archive</p>
            </div>
            <button
              onClick={() => setIsOpen(false)}
              className="p-2 rounded-xl bg-neutral-100/80 hover:bg-neutral-200/80 transition-colors"
            >
              <X className="w-5 h-5 text-neutral-600" />
            </button>
          </div>
        </div>

        {/* Menu Items with Enhanced Styling */}
        <nav className="relative p-4 overflow-y-auto max-h-[calc(100vh-200px)]">
          <ul className="space-y-2">
            {navigationItems.map((item, index) => {
              const isActive = pathname === item.href
              const Icon = item.icon

              return (
                <li 
                  key={item.href}
                  style={{ animationDelay: `${index * 50}ms` }}
                  className={isOpen ? 'animate-fade-up' : ''}
                >
                  <Link
                    href={item.href}
                    className={cn(
                      'relative flex items-center justify-between p-4 rounded-2xl',
                      'transition-all duration-300 group',
                      isActive 
                        ? 'bg-gradient-to-r from-primary-100 to-primary-50 text-primary-700 font-medium shadow-sm' 
                        : 'hover:bg-neutral-50 active:bg-neutral-100'
                    )}
                    onClick={() => setIsOpen(false)}
                  >
                    {isActive && (
                      <div className="absolute left-0 top-1/2 -translate-y-1/2 w-1 h-8 bg-gradient-to-b from-primary-400 to-primary-500 rounded-r-full" />
                    )}
                    <div className="flex items-center gap-4 ml-2">
                      <div className={cn(
                        'p-2 rounded-xl transition-all duration-300',
                        isActive 
                          ? 'bg-primary-500 shadow-lg shadow-primary-500/20' 
                          : 'bg-neutral-100 group-hover:bg-neutral-200'
                      )}>
                        <Icon 
                          className={cn(
                            'w-5 h-5 transition-colors',
                            isActive ? 'text-white' : 'text-neutral-600'
                          )} 
                        />
                      </div>
                      <span className="text-[16px] font-medium">{item.label}</span>
                    </div>
                    <ChevronRight 
                      className={cn(
                        'w-5 h-5 transition-all duration-300',
                        'group-hover:translate-x-1',
                        isActive ? 'text-primary-600' : 'text-neutral-400'
                      )} 
                    />
                  </Link>
                </li>
              )
            })}
          </ul>
        </nav>

        {/* Menu Footer with Premium Touch */}
        <div className="absolute bottom-0 left-0 right-0 p-6 border-t border-neutral-200/40 bg-gradient-to-t from-neutral-50 to-transparent">
          <p className="text-xs text-neutral-500 text-center font-medium">
            Preserving Malaysian athletics history
          </p>
          <div className="mt-3 flex justify-center">
            <div className="flex gap-1">
              {[...Array(3)].map((_, i) => (
                <div 
                  key={i} 
                  className="w-1.5 h-1.5 rounded-full bg-gradient-to-r from-primary-400 to-primary-500 animate-pulse"
                  style={{ animationDelay: `${i * 200}ms` }}
                />
              ))}
            </div>
          </div>
        </div>
      </div>
    </>
  )
}