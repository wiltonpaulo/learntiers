import { createClient } from '@/lib/supabase/server'
import { Link } from '@/i18n/routing'
import { getLocale } from 'next-intl/server'
import { GraduationCap, Search, Filter, Star, BookOpen, Clock } from 'lucide-react'
import type { CourseRow } from '@/types/database'

export default async function CoursesPage({ 
  searchParams,
}: { 
  searchParams: Promise<{ q?: string }>;
}) {
  const { q } = await searchParams
  const supabase = await createClient()

  let query = supabase
    .from('courses')
    .select('*')
    .order('created_at', { ascending: false })

  if (q) {
    query = query.ilike('title', `%${q}%`)
  }

  const { data: courses } = await query as { data: CourseRow[] | null }

  // Count sections per course for the cards
  const { data: sectionCounts } = await supabase
    .from('course_sections')
    .select('course_id')

  const countMap: Record<string, number> = {}
  sectionCounts?.forEach((s: { course_id: string }) => {
    countMap[s.course_id] = (countMap[s.course_id] ?? 0) + 1
  })

  return (
    <div className="pt-20 bg-slate-50 min-h-screen">
      {/* ── Hero Section ────────────────────────────────────────────────── */}
      <div className="bg-white border-b border-slate-200 py-16 px-4">
        <div className="container mx-auto max-w-6xl text-center">
          <div className="max-w-2xl mx-auto space-y-4">
            <h1 className="text-4xl md:text-6xl font-black text-slate-900 tracking-tight">
              Course <span className="text-purple-600">Catalog</span>
            </h1>
            <p className="text-slate-500 text-lg leading-relaxed">
              Explore our structured library of community-curated engineering courses.
            </p>
          </div>
        </div>
      </div>

      {/* ── Search & Filter ────────────────────────────────────────────── */}
      <div className="border-b border-slate-200 bg-white/80 backdrop-blur-md sticky top-16 z-10">
        <div className="container mx-auto max-w-6xl px-4 py-4 flex flex-col md:flex-row gap-4 items-center justify-between">
          <div className="flex items-center gap-4 w-full md:w-auto">
            <form action="/courses" method="GET" className="relative w-full md:w-80">
              <Search className="absolute left-3.5 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
              <input
                type="text"
                name="q"
                defaultValue={q ?? ''}
                placeholder="What do you want to learn?"
                className="w-full bg-slate-50 border border-slate-200 rounded-xl pl-10 pr-4 py-2.5 text-sm text-slate-900 focus:outline-none focus:ring-2 focus:ring-purple-600/20 transition-all"
              />
            </form>
            <button className="flex items-center gap-2 px-4 py-2.5 bg-white border border-slate-200 rounded-xl text-slate-600 font-bold text-sm hover:bg-slate-50 transition-colors">
              <Filter className="w-4 h-4" />
              Filters
            </button>
          </div>
          <p className="text-sm text-slate-400 font-medium">
            Showing <span className="text-slate-900 font-bold">{courses?.length ?? 0}</span> results
          </p>
        </div>
      </div>

      {/* ── Course Grid ──────────────────────────────────────────────────── */}
      <div className="container mx-auto max-w-6xl px-4 py-12">
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-8">
          {courses?.map((course) => (
            <Link
              key={course.id}
              href={`/courses/${course.slug}`}
              className="group flex flex-col bg-white border border-slate-200 rounded-3xl overflow-hidden hover:border-purple-200 hover:shadow-2xl hover:shadow-purple-100/50 transition-all duration-500"
            >
              {/* Thumbnail */}
              <div className="aspect-video bg-slate-100 relative overflow-hidden">
                {course.cover_image_url ? (
                  <img
                    src={course.cover_image_url}
                    alt={course.title}
                    className="w-full h-full object-cover transition-transform duration-700 group-hover:scale-110"
                  />
                ) : (
                  <div className="w-full h-full flex items-center justify-center">
                    <GraduationCap className="w-10 h-10 text-slate-300" />
                  </div>
                )}
                <div className="absolute inset-0 bg-gradient-to-t from-slate-900/40 to-transparent opacity-60" />
              </div>

              {/* Content */}
              <div className="p-5 flex flex-col flex-1 space-y-3">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-1">
                    < Star className="w-3 h-3 fill-amber-400 text-amber-400" />
                    <span className="text-xs font-bold text-slate-400">4.9</span>
                  </div>
                  <span className="text-[10px] font-black uppercase tracking-widest text-slate-400">
                    {countMap[course.id] ?? 0} lessons
                  </span>
                </div>

                <h3 className="font-bold text-lg text-slate-900 line-clamp-2 group-hover:text-purple-600 transition-colors leading-tight">
                  {course.title}
                </h3>
                
                <p className="text-sm text-slate-500 line-clamp-2 flex-1 leading-relaxed">
                  {course.description}
                </p>

                <div className="pt-4 border-t border-slate-100 flex items-center justify-between mt-auto">
                  <div className="text-lg font-black text-slate-900">Free</div>
                  <div className="text-purple-600 font-bold text-xs uppercase tracking-tighter flex items-center gap-1 group-hover:underline">
                    View Course
                  </div>
                </div>
              </div>
            </Link>
          ))}
        </div>

        {(!courses || courses.length === 0) && (
          <div className="text-center py-24 bg-white rounded-3xl border border-dashed border-slate-200">
            <GraduationCap className="w-12 h-12 text-slate-200 mx-auto mb-4 opacity-50" />
            <h3 className="text-xl font-bold text-slate-900">No courses found</h3>
            <p className="text-slate-500 mt-2">Try adjusting your search or check back later.</p>
          </div>
        )}
      </div>
    </div>
  )
}
