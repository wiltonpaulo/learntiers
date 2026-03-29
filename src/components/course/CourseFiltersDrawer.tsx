'use client'

import React, { useEffect } from 'react'
import { useRouter, useSearchParams, usePathname } from 'next/navigation'
import { Filter, ChevronRight, X, Sparkles, SlidersHorizontal } from 'lucide-react'
import { cn } from '@/lib/utils'
import { Button } from '@/components/ui/button'

interface FilterOptions {
  levels: string[]
  tracks: string[]
  skills: string[]
}

interface CourseFiltersDrawerProps {
  isOpen: boolean
  onClose: () => void
  options: FilterOptions
  activeFilters: {
    level?: string
    track?: string
    skill?: string
  }
}

export function CourseFiltersDrawer({ isOpen, onClose, options, activeFilters }: CourseFiltersDrawerProps) {
  const router = useRouter()
  const searchParams = useSearchParams()
  const pathname = usePathname()

  // Prevent scroll when open
  useEffect(() => {
    if (isOpen) {
      document.body.style.overflow = 'hidden'
    } else {
      document.body.style.overflow = 'unset'
    }
    return () => { document.body.style.overflow = 'unset' }
  }, [isOpen])

  const updateFilter = (key: string, value: string | null) => {
    const params = new URLSearchParams(searchParams.toString())
    if (value) {
      params.set(key, value)
    } else {
      params.delete(key)
    }
    router.push(`${pathname}?${params.toString()}`, { scroll: false })
  }

  const clearAll = () => {
    const params = new URLSearchParams(searchParams.toString())
    params.delete('level')
    params.delete('track')
    params.delete('skill')
    router.push(`${pathname}?${params.toString()}`, { scroll: false })
  }

  if (!isOpen) return null

  return (
    <div className="fixed inset-0 z-[100] flex justify-start">
      {/* Backdrop with Blur */}
      <div 
        className="absolute inset-0 bg-slate-950/40 backdrop-blur-md animate-in fade-in duration-500"
        onClick={onClose}
      />

      {/* Drawer Panel */}
      <div className="relative w-full max-w-md bg-white h-full shadow-2xl flex flex-col animate-in slide-in-from-left duration-500">
        
        {/* Header */}
        <div className="flex items-center justify-between p-6 border-b">
          <div className="flex items-center gap-2">
            <div className="p-2 rounded-lg bg-purple-50">
              <SlidersHorizontal className="w-5 h-5 text-purple-600" />
            </div>
            <h2 className="text-xl font-black text-slate-900 tracking-tight">Filters</h2>
          </div>
          <button 
            onClick={onClose}
            className="p-2 rounded-full hover:bg-slate-100 text-slate-400 hover:text-slate-900 transition-all"
          >
            <X className="w-6 h-6" />
          </button>
        </div>

        {/* Content - Scrollable */}
        <div className="flex-1 overflow-y-auto p-6 space-y-10">
          
          {/* Level Section */}
          <FilterSection 
            title="Difficulty Level" 
            items={options.levels} 
            activeItem={activeFilters.level}
            onSelect={(val) => updateFilter('level', val === activeFilters.level ? null : val)}
          />

          {/* Learning Tracks Section */}
          <FilterSection 
            title="Learning Tracks" 
            items={options.tracks} 
            activeItem={activeFilters.track}
            onSelect={(val) => updateFilter('track', val === activeFilters.track ? null : val)}
          />

          {/* Skills Section */}
          <div className="space-y-4">
            <h4 className="text-[10px] font-black uppercase tracking-[0.2em] text-slate-400">Popular Skills</h4>
            <div className="flex flex-wrap gap-2">
              {options.skills.map((skill) => (
                <button
                  key={skill}
                  onClick={() => updateFilter('skill', skill === activeFilters.skill ? null : skill)}
                  className={cn(
                    "px-4 py-2 rounded-xl text-xs font-bold transition-all border",
                    skill === activeFilters.skill 
                      ? "bg-purple-600 border-purple-600 text-white shadow-xl shadow-purple-200 scale-105" 
                      : "bg-white border-slate-200 text-slate-600 hover:border-purple-200 hover:text-purple-600"
                  )}
                >
                  {skill}
                </button>
              ))}
            </div>
          </div>
        </div>

        {/* Footer Actions */}
        <div className="p-6 border-t bg-slate-50/50 flex flex-col gap-3">
          <Button 
            className="w-full h-12 rounded-2xl bg-slate-900 text-white font-bold hover:bg-slate-800 shadow-lg shadow-slate-200"
            onClick={onClose}
          >
            Show {activeFilters.level || activeFilters.track || activeFilters.skill ? 'Filtered' : 'All'} Results
          </Button>
          {(activeFilters.level || activeFilters.track || activeFilters.skill) && (
            <button 
              onClick={clearAll}
              className="text-sm font-bold text-slate-400 hover:text-purple-600 transition-colors py-2"
            >
              Reset all filters
            </button>
          )}
        </div>
      </div>
    </div>
  )
}

function FilterSection({ 
  title, 
  items, 
  activeItem, 
  onSelect 
}: { 
  title: string
  items: string[]
  activeItem?: string
  onSelect: (val: string) => void 
}) {
  if (items.length === 0) return null

  return (
    <div className="space-y-4">
      <h4 className="text-[10px] font-black uppercase tracking-[0.2em] text-slate-400">{title}</h4>
      <div className="grid grid-cols-1 gap-2">
        {items.map((item) => (
          <button
            key={item}
            onClick={() => onSelect(item)}
            className={cn(
              "w-full flex items-center justify-between px-4 py-3 rounded-2xl text-sm font-bold transition-all border group",
              item === activeItem 
                ? "bg-purple-50 border-purple-100 text-purple-700 ring-4 ring-purple-50/50" 
                : "bg-white border-slate-100 text-slate-600 hover:border-purple-100 hover:bg-slate-50"
            )}
          >
            <span>{item}</span>
            {item === activeItem ? (
              <div className="w-5 h-5 rounded-full bg-purple-600 flex items-center justify-center">
                <X className="w-3 h-3 text-white" />
              </div>
            ) : (
              <ChevronRight className="w-4 h-4 text-slate-300 group-hover:text-purple-400 transition-colors" />
            )}
          </button>
        ))}
      </div>
    </div>
  )
}
