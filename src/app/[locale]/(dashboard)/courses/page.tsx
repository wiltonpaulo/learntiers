import { createClient } from '@/lib/supabase/server'
import { Link } from '@/i18n/routing'
import { getLocale } from 'next-intl/server'
import { Badge } from '@/components/ui/badge'
import { BookOpen, Clock, ArrowRight, GraduationCap, ShieldCheck, Search, Filter } from 'lucide-react'
import type { CourseRow } from '@/types/database'
import { Star } from 'lucide-react'

export default async function CoursesPage({ 
  params,
  searchParams,
}: { 
  params: Promise<{ locale: string }>;
  searchParams: Promise<{ q?: string }>;
}) {
  const { locale } = await params
  const { q } = await searchParams
  const supabase = await createClient()

  let query = supabase
    .from('courses')
    .select('*')
    .order('created_at', { ascending: false })

  if (q) {
    query = query.ilike('title', `%${q}%`)
  }

  const [coursesRes, userRes] = await Promise.all([
    query,
    supabase.auth.getUser(),
  ])

  const courses = coursesRes.data as CourseRow[] | null
  const user = userRes.data.user
  const isAdmin = user?.app_metadata?.role === 'admin'

  // Count sections per course for the cards
  const { data: sectionCounts } = await supabase
    .from('course_sections')
    .select('course_id')

  const countMap: Record<string, number> = {}
  sectionCounts?.forEach((s: { course_id: string }) => {
    countMap[s.course_id] = (countMap[s.course_id] ?? 0) + 1
  })

  return (
    <div className="min-h-screen bg-background">
      {/* ── Hero Section ────────────────────────────────────────────────── */}
      <div className="bg-slate-900 text-white py-16 px-4">
        <div className="container mx-auto max-w-6xl">
          {isAdmin && (
            <div className="flex justify-end mb-4">
              <Link
                href="/admin"
                className="flex items-center gap-2 px-3 py-1.5 rounded-full bg-amber-500/10 border border-amber-500/20 text-amber-500 text-xs font-bold hover:bg-amber-500/20 transition-colors"
              >
                <ShieldCheck className="w-3.5 h-3.5" />
                Admin Panel
              </Link>
            </div>
          )}
          <div className="max-w-2xl space-y-4">
            <h1 className="text-3xl md:text-5xl font-extrabold leading-tight tracking-tight">
              Explore Our <span className="text-primary-400">Courses</span>
            </h1>
            <p className="text-slate-300 text-lg md:text-xl leading-relaxed">
              Everything you need to master new skills through high-quality video micro-lessons and interactive content.
            </p>
          </div>
        </div>
      </div>

      {/* ── Filters & Search Bar ────────────────────────────────────────── */}
      <div className="border-b bg-card/50 backdrop-blur-sm sticky top-0 z-10">
        <div className="container mx-auto max-w-6xl px-4 py-4 flex flex-col md:flex-row gap-4 items-center justify-between">
          <div className="flex items-center gap-4 w-full md:w-auto">
            <form action="/courses" method="GET" className="relative w-full md:w-80">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
              <input
                type="text"
                name="q"
                defaultValue={q ?? ''}
                placeholder="Search for anything..."
                className="w-full bg-background border rounded-none pl-10 pr-4 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-primary transition-all"
              />
            </form>
            <button className="flex items-center gap-2 px-4 py-2 border font-bold text-sm hover:bg-muted transition-colors">
              <Filter className="w-4 h-4" />
              Filters
            </button>
          </div>
          <p className="text-sm text-muted-foreground font-medium">
            Showing <span className="text-foreground font-bold">{courses?.length ?? 0}</span> results
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
              className="group flex flex-col bg-card border hover:shadow-2xl hover:-translate-y-1 transition-all duration-300"
            >
              {/* Thumbnail */}
              <div className="aspect-video bg-muted relative overflow-hidden">
                {course.cover_image_url ? (
                  <img
                    src={course.cover_image_url}
                    alt={course.title}
                    className="w-full h-full object-cover transition-transform duration-700 group-hover:scale-110"
                  />
                ) : (
                  <div className="w-full h-full flex items-center justify-center bg-slate-100 dark:bg-slate-800">
                    <GraduationCap className="w-10 h-10 text-slate-300" />
                  </div>
                )}
                <div className="absolute inset-0 bg-black/10 group-hover:bg-transparent transition-colors" />
              </div>

              {/* Content */}
              <div className="p-4 flex flex-col flex-1">
                <h3 className="font-bold text-base mb-2 line-clamp-2 group-hover:text-primary transition-colors leading-snug">
                  {course.title}
                </h3>
                <p className="text-xs text-muted-foreground line-clamp-2 mb-4 flex-1">
                  {course.description}
                </p>

                <div className="flex flex-col gap-3 pt-4 border-t mt-auto">
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-1">
                      <Star className="w-3 h-3 fill-yellow-400 text-yellow-400" />
                      <span className="text-xs font-bold">4.8</span>
                    </div>
                    <span className="text-[10px] font-bold uppercase tracking-tighter text-muted-foreground flex items-center gap-1.5">
                      <Clock className="w-3 h-3" /> {countMap[course.id] ?? 0} micro-lessons
                    </span>
                  </div>
                  <div className="text-sm font-extrabold text-foreground">Free</div>
                </div>
              </div>
            </Link>
          ))}
        </div>

        {(!courses || courses.length === 0) && (
          <div className="text-center py-24 bg-muted/20 rounded-xl border-2 border-dashed">
            <GraduationCap className="w-12 h-12 text-muted-foreground mx-auto mb-4 opacity-30" />
            <h3 className="text-xl font-bold">No courses found</h3>
            <p className="text-muted-foreground mt-2">Try adjusting your search or check back later.</p>
          </div>
        )}
      </div>
    </div>
  )
}
