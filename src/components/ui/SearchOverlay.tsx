'use client'

import React, { useState, useEffect, useRef } from 'react'
import { Search, X, TrendingUp, History, Clock, GraduationCap } from 'lucide-react'
import Link from 'next/link'
import { useParams } from 'next/navigation'

export default function SearchOverlay() {
  const [isOpen, setIsOpen] = useState(false)
  const [query, setQuery] = useState('')
  const [recentlyViewed, setRecentlyViewed] = useState<any[]>([])
  const dropdownRef = useRef<HTMLDivElement>(null)
  const inputRef = useRef<HTMLInputElement>(null)
  const { locale } = useParams()

  // Load recently viewed from localStorage
  useEffect(() => {
    if (isOpen) {
      const stored = localStorage.getItem('learntiers_recently_viewed')
      if (stored) {
        try {
          setRecentlyViewed(JSON.parse(stored))
        } catch (e) {
          console.error('Error parsing recently viewed:', e)
        }
      }
    }
  }, [isOpen])

  // Close on Escape key
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape') {
        setIsOpen(false)
        inputRef.current?.blur()
      }
    }
    window.addEventListener('keydown', handleKeyDown)
    return () => window.removeEventListener('keydown', handleKeyDown)
  }, [])

  // Close when clicking outside
  useEffect(() => {
    const handleClickOutside = (e: MouseEvent) => {
      if (
        isOpen && 
        dropdownRef.current && 
        !dropdownRef.current.contains(e.target as Node) &&
        inputRef.current &&
        !inputRef.current.contains(e.target as Node)
      ) {
        setIsOpen(false)
      }
    }
    document.addEventListener('mousedown', handleClickOutside)
    return () => document.removeEventListener('mousedown', handleClickOutside)
  }, [isOpen])

  // Trending searches mockup
  const trending = ['Python', 'Artificial Intelligence', 'Data Science', 'React', 'DevOps', 'Cloud Computing']

  return (
    <div className="relative flex-1 max-w-md px-4">
      {/* Backdrop - only visible when isOpen */}
      {isOpen && (
        <div 
          className="fixed inset-0 bg-black/60 backdrop-blur-sm z-40 transition-opacity duration-300"
          onClick={() => setIsOpen(false)}
        />
      )}

      {/* Search Input Container */}
      <div className={`relative z-50 transition-all duration-300 ${isOpen ? 'scale-105' : ''}`}>
        <form action={`/${locale}/courses`} method="GET" className="relative w-full">
          <Search className={`absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 transition-colors ${isOpen ? 'text-primary' : 'text-white/40'}`} />
          <input
            ref={inputRef}
            type="text"
            name="q"
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            onFocus={() => setIsOpen(true)}
            placeholder="Search for courses..."
            autoComplete="off"
            className={`w-full border border-white/10 rounded-full pl-10 pr-10 py-2 text-sm transition-all duration-300 focus:outline-none focus:ring-2 focus:ring-primary ${
              isOpen 
                ? 'bg-white text-slate-900 placeholder:text-slate-400 shadow-2xl' 
                : 'bg-white/10 text-white placeholder:text-white/40'
            }`}
          />
          {isOpen && query && (
            <button 
              type="button" 
              onClick={() => setQuery('')}
              className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-600"
            >
              <X className="w-4 h-4" />
            </button>
          )}
        </form>

        {/* Mega Dropdown */}
        {isOpen && (
          <div 
            ref={dropdownRef}
            className="absolute top-full left-0 right-0 mt-3 bg-white rounded-2xl shadow-2xl border overflow-hidden animate-in fade-in slide-in-from-top-4 duration-200"
          >
            <div className="p-6 space-y-8">
              {/* Trending Searches Section */}
              <div className="space-y-4">
                <div className="flex items-center gap-2 text-slate-900 font-bold text-sm">
                  <TrendingUp className="w-4 h-4 text-primary" />
                  Trending Searches
                </div>
                <div className="flex flex-wrap gap-2">
                  {trending.map((item) => (
                    <Link
                      key={item}
                      href={`/${locale}/courses?q=${encodeURIComponent(item)}`}
                      onClick={() => setIsOpen(false)}
                      className="px-4 py-2 bg-slate-100 hover:bg-primary/10 hover:text-primary rounded-full text-xs font-bold text-slate-600 transition-colors"
                    >
                      {item}
                    </Link>
                  ))}
                </div>
              </div>

              {/* Recently Viewed Section */}
              {recentlyViewed.length > 0 && (
                <div className="space-y-4">
                  <div className="flex items-center gap-2 text-slate-900 font-bold text-sm">
                    <History className="w-4 h-4 text-primary" />
                    Recently Viewed
                  </div>
                  <div className="grid grid-cols-1 gap-3">
                    {recentlyViewed.map((course) => (
                      <Link
                        key={course.id}
                        href={`/${locale}/courses/${course.id}`}
                        onClick={() => setIsOpen(false)}
                        className="flex items-center gap-4 p-2 rounded-xl hover:bg-slate-50 transition-colors group border border-transparent hover:border-slate-100"
                      >
                        <div className="w-16 h-10 rounded-md bg-slate-100 shrink-0 overflow-hidden relative">
                          {course.cover_image_url ? (
                            <img 
                              src={course.cover_image_url} 
                              alt="" 
                              className="w-full h-full object-cover group-hover:scale-110 transition-transform" 
                            />
                          ) : (
                            <div className="w-full h-full flex items-center justify-center">
                              <GraduationCap className="w-6 h-6 text-slate-300 group-hover:text-primary transition-colors" />
                            </div>
                          )}
                        </div>
                        <div className="flex-1 min-w-0">
                          <h4 className="text-sm font-bold text-slate-900 truncate group-hover:text-primary transition-colors">
                            {course.title}
                          </h4>
                          <div className="flex items-center gap-2 text-[10px] text-slate-500 font-medium">
                            <span className="flex items-center gap-1">
                              <Clock className="w-3 h-3" />
                              {course.duration}
                            </span>
                          </div>
                        </div>
                      </Link>
                    ))}
                  </div>
                </div>
              )}
            </div>
            
            {/* Dropdown Footer */}
            <div className="bg-slate-50 px-6 py-3 border-t">
              <Link 
                href={`/${locale}/courses`} 
                onClick={() => setIsOpen(false)}
                className="text-xs font-bold text-primary hover:underline flex items-center justify-center gap-1"
              >
                View all courses
              </Link>
            </div>
          </div>
        )}
      </div>
    </div>
  )
}
