'use client'

import React, { useState } from 'react'
import { Link } from '@/i18n/routing'
import { GraduationCap, Search, Clock, X, SlidersHorizontal } from 'lucide-react'
import { cn } from '@/lib/utils'
import { CourseFiltersDrawer } from './CourseFiltersDrawer'

interface FilterOptions {
  levels: string[]
  tracks: string[]
  skills: string[]
}

interface CourseCatalogClientProps {
  courses: any[]
  statsMap: Record<string, { count: number; duration: number }>
  filterOptions: FilterOptions
  activeFilters: {
    q?: string
    level?: string
    track?: string
    skill?: string
  }
}

export function CourseCatalogClient({ 
  courses, 
  statsMap, 
  filterOptions, 
  activeFilters 
}: CourseCatalogClientProps) {
  const [isDrawerOpen, setIsDrawerOpen] = useState(false)

  const hasActiveFilters = activeFilters.level || activeFilters.track || activeFilters.skill

  return (
    <>
      {/* ── Search & Filter Toolbar ────────────────────────────────────── */}
      <div className="border-b border-slate-200 bg-white/80 backdrop-blur-md sticky top-16 z-10">
        <div className="container mx-auto max-w-7xl px-4 py-4 flex flex-col md:flex-row gap-4 items-center justify-between">
          <div className="flex items-center gap-4 w-full md:w-auto">
            <form action="/courses" method="GET" className="relative w-full md:w-80">
              <Search className="absolute left-3.5 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
              <input
                type="text"
                name="q"
                defaultValue={activeFilters.q ?? ''}
                placeholder="Search courses..."
                className="w-full bg-slate-50 border border-slate-200 rounded-xl pl-10 pr-4 py-2.5 text-sm text-slate-900 focus:outline-none focus:ring-2 focus:ring-purple-600/20 transition-all"
              />
            </form>
            <button 
              onClick={() => setIsDrawerOpen(true)}
              className={cn(
                "flex items-center gap-2 px-5 py-2.5 rounded-xl font-bold text-sm transition-all border shadow-sm",
                hasActiveFilters 
                  ? "bg-purple-600 border-purple-600 text-white shadow-purple-200" 
                  : "bg-white border-slate-200 text-slate-600 hover:bg-slate-50"
              )}
            >
              <SlidersHorizontal className="w-4 h-4" />
              Filters
              {hasActiveFilters && (
                <span className="ml-1 w-5 h-5 rounded-full bg-white text-purple-600 text-[10px] flex items-center justify-center">
                  {[activeFilters.level, activeFilters.track, activeFilters.skill].filter(Boolean).length}
                </span>
              )}
            </button>
          </div>
          <div className="flex items-center gap-4">
            <p className="text-xs text-slate-400 font-bold uppercase tracking-widest hidden sm:block">
              <span className="text-slate-900">{courses?.length ?? 0}</span> results found
            </p>
          </div>
        </div>
      </div>

      {/* ── Main Content Grid ───────────────────────────────────────────── */}
      <div className="container mx-auto max-w-7xl px-4 py-12">
        <div className="space-y-8">
          
          {/* Active Filter Badges */}
          {hasActiveFilters && (
            <div className="flex flex-wrap items-center gap-2 animate-in fade-in slide-in-from-top-1 duration-300">
              <span className="text-xs font-black uppercase tracking-widest text-slate-400 mr-2">Active:</span>
              {activeFilters.level && <FilterBadge label={`Level: ${activeFilters.level}`} />}
              {activeFilters.track && <FilterBadge label={`Track: ${activeFilters.track}`} />}
              {activeFilters.skill && <FilterBadge label={`Skill: ${activeFilters.skill}`} />}
            </div>
          )}

          {/* Grid */}
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
            {courses?.map((course) => {
              const stats = statsMap[course.id] || { count: 0, duration: 0 }
              return (
                <Link
                  key={course.id}
                  href={`/courses/${course.slug}`}
                  className="group flex flex-col bg-white border border-slate-200 rounded-2xl overflow-hidden hover:border-purple-200 hover:shadow-xl transition-all duration-300"
                >
                  {/* Thumbnail */}
                  <div className="aspect-video bg-slate-100 relative overflow-hidden">
                    {course.cover_image_url ? (
                      <img
                        src={course.cover_image_url}
                        alt={course.title}
                        className="w-full h-full object-cover transition-transform duration-500 group-hover:scale-105"
                      />
                    ) : (
                      <div className="w-full h-full flex items-center justify-center">
                        <GraduationCap className="w-8 h-8 text-slate-300" />
                      </div>
                    )}
                    
                    {/* Level Overlay */}
                    {course.level && (
                      <div className={cn(
                        "absolute top-3 left-3 px-2 py-1 rounded-md text-[9px] font-black uppercase tracking-widest text-white shadow-lg",
                        course.level === 'Beginner' ? "bg-emerald-500" :
                        course.level === 'Intermediate' ? "bg-amber-500" :
                        "bg-rose-500"
                      )}>
                        {course.level}
                      </div>
                    )}
                  </div>

                  {/* Content */}
                  <div className="p-5 flex flex-col flex-1 space-y-3">
                    <div className="flex items-center justify-between gap-2">
                      <span className="text-[10px] font-black uppercase tracking-widest text-purple-600 truncate">
                        {course.suggested_track || 'General'}
                      </span>
                      <div className="flex items-center gap-1 text-slate-400 shrink-0 whitespace-nowrap">
                        <Clock className="w-3 h-3" />
                        <span className="text-[10px] font-bold">
                          {formatDuration(stats.duration)}
                        </span>
                      </div>
                    </div>
                    <h3 className="font-bold text-base text-slate-900 line-clamp-2 leading-tight group-hover:text-purple-600 transition-colors">
                      {course.title}
                    </h3>
                    
                    {/* Skills Preview */}
                    {Array.isArray(course.skills) && course.skills.length > 0 && (
                      <div className="flex flex-wrap gap-1 mt-auto pt-2">
                        {course.skills.slice(0, 2).map((s: string) => (
                          <span key={s} className="px-1.5 py-0.5 rounded bg-slate-50 border border-slate-100 text-[9px] font-bold text-slate-500">
                            {s}
                          </span>
                        ))}
                        {course.skills.length > 2 && (
                          <span className="text-[9px] font-bold text-slate-300">+{course.skills.length - 2} more</span>
                        )}
                      </div>
                    )}
                  </div>
                </Link>
              )
            })}
          </div>

          {(!courses || courses.length === 0) && (
            <div className="text-center py-24 bg-white rounded-2xl border border-dashed border-slate-200">
              <GraduationCap className="w-12 h-12 text-slate-200 mx-auto mb-4 opacity-50" />
              <h3 className="text-xl font-bold text-slate-900">No matching courses</h3>
              <p className="text-slate-500 mt-2">Try adjusting your filters to find what you're looking for.</p>
            </div>
          )}
        </div>
      </div>

      {/* Side Drawer Component */}
      <CourseFiltersDrawer 
        isOpen={isDrawerOpen}
        onClose={() => setIsDrawerOpen(false)}
        options={filterOptions}
        activeFilters={{ 
          level: activeFilters.level, 
          track: activeFilters.track, 
          skill: activeFilters.skill 
        }}
      />
    </>
  )
}

function FilterBadge({ label }: { label: string }) {
  return (
    <div className="inline-flex items-center gap-1.5 px-3 py-1 bg-purple-100 text-purple-700 rounded-full text-xs font-bold shadow-sm">
      {label}
    </div>
  )
}

function formatDuration(seconds: number): string {
  const h = Math.floor(seconds / 3600)
  const m = Math.floor((seconds % 3600) / 60)
  if (h > 0) return `${h}h ${m}m`
  return `${m}m`
}
