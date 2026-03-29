import { createClient } from '@/lib/supabase/server'
import { getLocale } from 'next-intl/server'
import type { CourseRow } from '@/types/database'
import { getFilterOptionsAction } from '@/lib/actions/course-filters'
import { CourseCatalogClient } from '@/components/course/CourseCatalogClient'

export default async function CoursesPage({ 
  searchParams,
}: { 
  searchParams: Promise<{ q?: string; level?: string; track?: string; skill?: string }>;
}) {
  const { q, level, track, skill } = await searchParams
  const supabase = await createClient()

  // 1. Fetch filter options for the UI
  const filterOptions = await getFilterOptionsAction()

  // 2. Build the query
  let query = supabase
    .from('courses')
    .select('*')
    .order('created_at', { ascending: false })

  if (q) {
    query = query.ilike('title', `%${q}%`)
  }

  if (level) {
    query = query.eq('level', level)
  }

  if (track) {
    query = query.eq('suggested_track', track)
  }

  if (skill) {
    query = query.contains('skills', [skill])
  }

  const { data: courses } = await query as { data: CourseRow[] | null }

  // Fetch all sections to calculate counts and durations
  const { data: sectionsData } = await (supabase
    .from('course_sections')
    .select('course_id, start_time_seconds, end_time_seconds') as any) as { data: { course_id: string; start_time_seconds: number; end_time_seconds: number }[] | null }

  const statsMap: Record<string, { count: number; duration: number }> = {}
  sectionsData?.forEach((s) => {
    if (!statsMap[s.course_id]) {
      statsMap[s.course_id] = { count: 0, duration: 0 }
    }
    statsMap[s.course_id].count += 1
    statsMap[s.course_id].duration += (s.end_time_seconds - s.start_time_seconds)
  })

  return (
    <div className="pt-20 bg-slate-50 min-h-screen">
      {/* ── Hero Section ────────────────────────────────────────────────── */}
      <div className="bg-white border-b border-slate-200 py-12 px-4">
        <div className="container mx-auto max-w-7xl">
          <div className="max-w-2xl space-y-4">
            <h1 className="text-4xl md:text-5xl font-black text-slate-900 tracking-tight">
              Course <span className="text-purple-600">Catalog</span>
            </h1>
            <p className="text-slate-500 text-lg leading-relaxed">
              Refine your engineering journey with our multi-criteria search.
            </p>
          </div>
        </div>
      </div>

      <CourseCatalogClient 
        courses={courses || []}
        statsMap={statsMap}
        filterOptions={filterOptions}
        activeFilters={{ q, level, track, skill }}
      />
    </div>
  )
}
