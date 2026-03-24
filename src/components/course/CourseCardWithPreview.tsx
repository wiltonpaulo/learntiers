'use client'

import React, { useState, useRef } from 'react'
import { createPortal } from 'react-dom'
import { 
  Play, 
  X, 
  Bookmark, 
  Clock, 
  ChevronRight,
  BookOpen
} from 'lucide-react'
import { Button } from '@/components/ui/button'
import { cn } from '@/lib/utils'
import { Link } from '@/i18n/routing'
import { useParams } from 'next/navigation'

interface CoursePreviewProps {
  course: {
    id: string
    slug: string
    entrySectionSlug?: string | null
    title: string
    author: string
    duration: string
    description?: string | null
    thumbnailColor: string
    cover_image_url?: string | null
    percentage?: number
    created_at?: string
    totalSections?: number
  }
  children: React.ReactNode
  buttonLabel?: string
}

export function CourseCardWithPreview({ course, children, buttonLabel = 'resume' }: CoursePreviewProps) {
  const [isOpen, setIsOpen] = useState(false)
  const [coords, setCoords] = useState<{ top: number; left: number; width: number } | null>(null)
  const triggerRef = useRef<HTMLDivElement>(null)
  const openTimerRef = useRef<NodeJS.Timeout | null>(null)
  const closeTimerRef = useRef<NodeJS.Timeout | null>(null)
  const { locale } = useParams()

  const formattedDate = course.created_at 
    ? new Date(course.created_at).toLocaleDateString(locale as string, { month: 'short', year: 'numeric' })
    : ''

  const handleMouseEnter = () => {
    if (closeTimerRef.current) clearTimeout(closeTimerRef.current)
    
    openTimerRef.current = setTimeout(() => {
      if (triggerRef.current) {
        const rect = triggerRef.current.getBoundingClientRect()
        setCoords({
          top: rect.top + window.scrollY,
          left: rect.left + window.scrollX,
          width: rect.width
        })
        setIsOpen(true)
      }
    }, 400)
  }

  const handleMouseLeave = () => {
    if (openTimerRef.current) clearTimeout(openTimerRef.current)
    closeTimerRef.current = setTimeout(() => setIsOpen(false), 300)
  }

  return (
    <div 
      ref={triggerRef}
      onMouseEnter={handleMouseEnter}
      onMouseLeave={handleMouseLeave}
      className="w-full h-full"
    >
      {children}

      {isOpen && coords && createPortal(
        <div className="fixed inset-0 z-[1000] pointer-events-none" style={{ position: 'absolute', top: 0, left: 0, width: '100%' }}>
          <div 
            onMouseEnter={() => { if (closeTimerRef.current) clearTimeout(closeTimerRef.current) }}
            onMouseLeave={handleMouseLeave}
            className="pointer-events-auto absolute bg-white shadow-[0_30px_60px_rgba(0,0,0,0.3)] rounded-xl border border-slate-200 overflow-hidden animate-in fade-in duration-200"
            style={{
              top: coords.top - 10,
              left: coords.left - 10,
              width: 320,
              transformOrigin: 'center center',
            }}
          >
            {/* Video Thumbnail Area */}
            <Link 
              href={course.entrySectionSlug 
                ? `/courses/${course.slug}/sections/${course.entrySectionSlug}` 
                : `/courses/${course.slug}`}
              className="relative aspect-video w-full bg-slate-900 overflow-hidden block group/thumb"
            >
              {course.cover_image_url ? (
                <img src={course.cover_image_url} alt="" className="w-full h-full object-cover transition-transform duration-500 group-hover/thumb:scale-110" />
              ) : (
                <div className={cn("absolute inset-0 opacity-40", course.thumbnailColor)} />
              )}
              
              <div className="absolute inset-0 flex items-center justify-center bg-black/20 group-hover/thumb:bg-black/0 transition-colors">
                 <div className="w-10 h-10 rounded-full bg-primary flex items-center justify-center shadow-2xl transition-transform group-hover/thumb:scale-110">
                    <Play className="w-5 h-5 text-white fill-current ml-0.5" />
                 </div>
              </div>

              <button 
                onClick={(e) => {
                  e.preventDefault();
                  e.stopPropagation();
                  setIsOpen(false);
                }} 
                className="absolute top-2 right-2 z-20 w-6 h-6 rounded-full bg-black/40 backdrop-blur-md flex items-center justify-center text-white/70 hover:text-white transition-colors"
              >
                <X className="w-3.5 h-3.5" />
              </button>
            </Link>

            {/* Real Metadata */}
            <div className="p-4 space-y-3">
              <div className="space-y-1">
                <h3 className="text-sm font-bold text-slate-900 leading-snug line-clamp-2 capitalize">
                  {course.title}
                </h3>
                <div className="flex items-center gap-2 text-[10px] text-slate-500 font-bold tracking-tight">
                  <span className="text-primary italic">By: {course.author}</span>
                  {formattedDate && <span className="text-slate-300">• {formattedDate}</span>}
                </div>
              </div>

              {course.description && (
                <p className="text-[11px] text-slate-600 leading-relaxed line-clamp-2">
                  {course.description}
                </p>
              )}

              <div className="flex items-center gap-3 pt-2 border-t border-slate-100 mt-2">
                <div className="flex items-center gap-1 text-[9px] font-black uppercase text-blue-600 tracking-widest">
                  <Clock className="w-3 h-3" />
                  <span>{course.duration}</span>
                </div>
                <div className="flex items-center gap-1 text-[9px] font-black uppercase text-slate-500 tracking-widest">
                  <BookOpen className="w-3 h-3" />
                  <span>{course.totalSections} lessons</span>
                </div>
              </div>
            </div>

            {/* Footer */}
            <div className="px-4 py-3 bg-slate-50 border-t border-slate-100 flex items-center justify-between">
              <Button variant="ghost" size="icon" className="h-7 w-7 text-slate-400 hover:text-primary transition-colors">
                <Bookmark className="w-3.5 h-3.5" />
              </Button>
              <Link href={course.entrySectionSlug 
                ? `/courses/${course.slug}/sections/${course.entrySectionSlug}` 
                : `/courses/${course.slug}`}>
                <Button size="sm" className="h-7 px-3 text-[9px] font-black uppercase tracking-widest gap-1.5 rounded-md shadow-sm">
                  {buttonLabel} <ChevronRight className="w-3.5 h-3.5" />
                </Button>
              </Link>
            </div>
          </div>
        </div>,
        document.body
      )}
    </div>
  )
}
