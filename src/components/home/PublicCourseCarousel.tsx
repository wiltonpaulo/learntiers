"use client"

import React, { useEffect, useState } from "react"
import Link from "next/link"
import { ChevronRight, GraduationCap, Star, Clock, BookOpen } from "lucide-react"
import { cn } from "@/lib/utils"
import { createClient } from "@/lib/supabase/client"
import { Badge } from "@/components/ui/badge"

export function PublicCourseCarousel() {
  const [courses, setCourses] = useState<any[]>([])
  const [loading, setLoading] = useState(true)
  const supabase = createClient()

  useEffect(() => {
    async function fetchCourses() {
      const { data } = await supabase
        .from('courses')
        .select('id, slug, title, description, cover_image_url, created_at')
        .order('created_at', { ascending: false })
        .limit(6)
      
      setCourses(data || [])
      setLoading(false)
    }
    fetchCourses()
  }, [])

  if (loading) {
    return (
      <section className="py-24 bg-white">
        <div className="container mx-auto px-4">
          <div className="h-8 w-48 bg-slate-100 rounded animate-pulse mb-12" />
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
            {[1, 2, 3].map(i => (
              <div key={i} className="aspect-video bg-slate-50 rounded-2xl animate-pulse border border-slate-100" />
            ))}
          </div>
        </div>
      </section>
    )
  }

  return (
    <section className="py-24 bg-white overflow-hidden">
      <div className="container mx-auto px-4">
        <div className="flex flex-col md:flex-row md:items-end justify-between gap-6 mb-12">
          <div className="space-y-4 text-center md:text-left">
            <h2 className="text-3xl md:text-5xl font-black text-slate-900 tracking-tight leading-tight">
              Featured <span className="text-purple-600">Courses</span>
            </h2>
            <p className="text-slate-500 text-lg max-w-xl">
              Choose your path and start learning today. Immediate access to all micro-lessons.
            </p>
          </div>
          <Link 
            href="/courses" 
            className="group flex items-center justify-center gap-2 text-purple-600 font-bold hover:text-purple-700 transition-colors"
          >
            Browse all courses
            <ChevronRight className="w-5 h-5 group-hover:translate-x-1 transition-transform" />
          </Link>
        </div>

        <div className="flex gap-8 overflow-x-auto pb-8 snap-x scrollbar-hide">
          {courses.map((course) => (
            <Link 
              key={course.id}
              href={`/courses/${course.slug}`}
              className="min-w-[300px] md:min-w-[380px] group bg-white border border-slate-200 rounded-3xl overflow-hidden hover:border-purple-300 hover:shadow-2xl hover:shadow-purple-100/50 transition-all duration-500 snap-start"
            >
              {/* Thumbnail */}
              <div className="aspect-video relative overflow-hidden bg-slate-100">
                {course.cover_image_url ? (
                  <img 
                    src={course.cover_image_url} 
                    alt={course.title} 
                    className="w-full h-full object-cover transition-transform duration-700 group-hover:scale-110"
                  />
                ) : (
                  <div className="w-full h-full flex items-center justify-center">
                    <GraduationCap className="w-12 h-12 text-slate-300" />
                  </div>
                )}
                <div className="absolute inset-0 bg-gradient-to-t from-slate-900/20 to-transparent opacity-60" />
                
                <div className="absolute top-4 left-4">
                  <Badge className="bg-purple-600 text-white border-none font-bold text-[10px] uppercase px-3 py-1">
                    New
                  </Badge>
                </div>
              </div>

              {/* Content */}
              <div className="p-6 space-y-4">
                <div className="flex items-center gap-4 text-[10px] font-black uppercase tracking-widest text-slate-400">
                  <span className="flex items-center gap-1.5"><Star className="w-3.5 h-3.5 fill-amber-400 text-amber-400" /> 4.9</span>
                  <span className="flex items-center gap-1.5"><Clock className="w-3.5 h-3.5" /> High-quality</span>
                </div>
                
                <h3 className="text-xl font-bold text-slate-900 group-hover:text-purple-600 transition-colors line-clamp-1">
                  {course.title}
                </h3>
                
                <p className="text-sm text-slate-500 line-clamp-2 leading-relaxed h-10">
                  {course.description}
                </p>

                <div className="pt-4 border-t border-slate-100 flex items-center justify-between">
                  <div className="flex items-center gap-2 text-xs font-bold text-slate-600">
                    <BookOpen className="w-4 h-4 text-purple-600" />
                    Interactive
                  </div>
                  <span className="text-purple-600 font-black text-sm uppercase tracking-tighter group-hover:underline">
                    View details
                  </span>
                </div>
              </div>
            </Link>
          ))}
        </div>
      </div>

      <style jsx>{`
        .scrollbar-hide::-webkit-scrollbar { display: none; }
        .scrollbar-hide { -ms-overflow-style: none; scrollbar-width: none; }
      `}</style>
    </section>
  )
}
