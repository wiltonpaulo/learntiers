'use client'

import React, { useRef } from 'react'
import { ChevronLeft, ChevronRight, Play } from 'lucide-react'
import { cn } from '@/lib/utils'
import Link from 'next/link'
import { useParams } from 'next/navigation'
import { CourseCardWithPreview } from './CourseCardWithPreview'

interface Course {
  id: string
  slug: string
  title: string
  author: string
  duration: string
  badge?: string
  thumbnailColor: string
  cover_image_url?: string | null
  percentage?: number
  description?: string | null
  created_at?: string
  totalSections?: number
}

interface CourseDeckProps {
  title: string
  subtitle?: string
  courses: Course[]
  buttonLabel?: string
}

export function CourseDeck({ title, subtitle, courses, buttonLabel = 'resume' }: CourseDeckProps) {
  const scrollRef = useRef<HTMLDivElement>(null)
  const { locale } = useParams()

  const scroll = (direction: 'left' | 'right') => {
    if (scrollRef.current) {
      const scrollAmount = 320
      scrollRef.current.scrollBy({
        left: direction === 'left' ? -scrollAmount : scrollAmount,
        behavior: 'smooth',
      })
    }
  }

  if (courses.length === 0) return null

  return (
    <section className="space-y-5">
      {/* ── Section Header ────────────────────────────────────────────────── */}
      <div className="flex items-end justify-between px-1 border-b border-slate-200 pb-4">
        <div className="space-y-1">
          <h2 className="text-2xl font-bold text-slate-900 tracking-tight">{title}</h2>
          {subtitle && <p className="text-sm text-slate-500 font-medium">{subtitle}</p>}
        </div>
        
        <div className="flex items-center gap-2">
          <button 
            onClick={() => scroll('left')}
            className="w-9 h-9 rounded-full border border-slate-200 flex items-center justify-center text-slate-600 hover:bg-white hover:border-primary hover:text-primary transition-all shadow-sm bg-slate-50"
            aria-label="Scroll left"
          >
            <ChevronLeft className="w-5 h-5" />
          </button>
          <button 
            onClick={() => scroll('right')}
            className="w-9 h-9 rounded-full border border-slate-200 flex items-center justify-center text-slate-600 hover:bg-white hover:border-primary hover:text-primary transition-all shadow-sm bg-slate-50"
            aria-label="Scroll right"
          >
            <ChevronRight className="w-5 h-5" />
          </button>
        </div>
      </div>

      {/* ── Carousel Container ────────────────────────────────────────────── */}
      <div 
        ref={scrollRef}
        className={cn(
          "flex gap-6 overflow-x-auto snap-x snap-mandatory pb-4 px-1",
          "scrollbar-none"
        )}
        style={{ scrollbarWidth: 'none', msOverflowStyle: 'none' }}
      >
        {courses.map((course) => (
          <CourseCardWithPreview key={course.id} course={course} buttonLabel={buttonLabel}>
            <Link 
              href={`/${locale}/courses/${course.slug}`}
              className="min-w-[280px] max-w-[280px] snap-start group cursor-pointer block"
            >
              {/* Image Container */}
              <div className="relative aspect-video rounded-lg overflow-hidden border border-slate-200 shadow-sm bg-slate-200 transition-colors group-hover:border-primary/50">
                {course.cover_image_url ? (
                  <img 
                    src={course.cover_image_url} 
                    alt={course.title}
                    className="w-full h-full object-cover"
                  />
                ) : (
                  <div className={cn("absolute inset-0 opacity-90", course.thumbnailColor)} />
                )}
                
                {/* Badge */}
                {course.badge && (
                  <div className="absolute top-2 left-2 px-2 py-0.5 bg-primary text-white shadow-md rounded-sm">
                    <span className="text-[9px] font-black uppercase tracking-wider">
                      {course.badge}
                    </span>
                  </div>
                )}

                {/* Progress Bar */}
                {course.percentage !== undefined && course.percentage > 0 && (
                  <div className="absolute bottom-0 left-0 right-0 h-1.5 bg-black/40">
                    <div 
                      className="h-full bg-primary" 
                      style={{ width: `${course.percentage}%` }}
                    />
                  </div>
                )}

                {/* Hover Overlay */}
                <div className="absolute inset-0 bg-primary/0 group-hover:bg-primary/10 transition-colors flex items-center justify-center">
                  <div className="w-10 h-10 rounded-full bg-primary text-white flex items-center justify-center opacity-0 group-hover:opacity-100 transition-all transform translate-y-2 group-hover:translate-y-0">
                    <Play className="w-5 h-5 fill-current ml-0.5" />
                  </div>
                </div>

                {/* Duration Badge */}
                {course.percentage === undefined && (
                  <div className="absolute bottom-2 right-2 px-1.5 py-0.5 bg-black/70 text-white text-[10px] font-bold rounded-sm">
                    {course.duration}
                  </div>
                )}
              </div>

              {/* Typography */}
              <div className="mt-3 space-y-1.5">
                <div className="flex items-center justify-between">
                  <span className="text-[10px] font-black text-slate-400 uppercase tracking-widest">
                    Course
                  </span>
                  {course.percentage !== undefined && (
                    <span className="text-[10px] font-bold text-primary">
                      {course.percentage}% Complete
                    </span>
                  )}
                </div>
                <h3 className="text-[15px] font-bold text-slate-900 leading-snug line-clamp-2 group-hover:text-primary transition-colors capitalize">
                  {course.title}
                </h3>
                <p className="text-[12px] text-slate-500 font-medium italic">
                  By: {course.author}
                </p>
              </div>
            </Link>
          </CourseCardWithPreview>
        ))}
      </div>

      <style jsx>{`
        div::-webkit-scrollbar { display: none; }
      `}</style>
    </section>
  )
}
