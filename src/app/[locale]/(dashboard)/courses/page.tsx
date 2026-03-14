import { createClient } from '@/lib/supabase/server'
import Link from 'next/link'
import { getLocale } from 'next-intl/server'
import { Badge } from '@/components/ui/badge'
import { BookOpen, Clock, ArrowRight, GraduationCap } from 'lucide-react'
import type { CourseRow } from '@/types/database'

export default async function CoursesPage() {
  const supabase = await createClient()
  const locale = await getLocale()

  const [{ data: courses }, { data: { user } }] = await Promise.all([
    supabase
      .from('courses')
      .select('id, title, description, cover_image_url, created_at')
      .order('created_at', { ascending: false }),
    supabase.auth.getUser(),
  ])

  // Count sections per course for the cards
  const { data: sectionCounts } = await supabase
    .from('course_sections')
    .select('course_id')

  const countMap: Record<string, number> = {}
  sectionCounts?.forEach((s: { course_id: string }) => {
    countMap[s.course_id] = (countMap[s.course_id] ?? 0) + 1
  })

  return (
    <div>
      {/* ── Hero banner ─────────────────────────────────────────────────────── */}
      <section
        className="py-12 px-4"
        style={{ backgroundColor: 'var(--nav-bg)' }}
      >
        <div className="container mx-auto">
          <div className="max-w-xl">
            <p className="text-sm font-medium text-primary mb-2">Welcome back 👋</p>
            <h1 className="text-3xl font-bold text-white mb-3">
              What will you learn today?
            </h1>
            <p className="text-white/60 text-sm">
              Bite-sized micro-lessons from YouTube, curated for developers. Watch a slice, ace the quiz, climb the leaderboard.
            </p>
          </div>
        </div>
      </section>

      {/* ── Course grid ─────────────────────────────────────────────────────── */}
      <section className="container mx-auto px-4 py-10">
        <div className="flex items-center justify-between mb-6">
          <h2 className="text-xl font-bold">All Courses</h2>
          {courses && courses.length > 0 && (
            <span className="text-sm text-muted-foreground">{courses.length} course{courses.length !== 1 ? 's' : ''}</span>
          )}
        </div>

        {courses && courses.length > 0 ? (
          <div className="grid gap-6 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4">
            {courses.map((course: CourseRow) => (
              <CourseCard
                key={course.id}
                course={course}
                sectionCount={countMap[course.id] ?? 0}
                locale={locale}
              />
            ))}
          </div>
        ) : (
          <EmptyState />
        )}
      </section>
    </div>
  )
}

// ─── Course Card ──────────────────────────────────────────────────────────────

function CourseCard({
  course,
  sectionCount,
  locale,
}: {
  course: CourseRow
  sectionCount: number
  locale: string
}) {
  return (
    <Link href={`/${locale}/courses/${course.id}`} className="group block">
      <div className="rounded-xl border bg-card overflow-hidden hover:shadow-lg hover:-translate-y-0.5 transition-all duration-200">
        {/* Thumbnail */}
        <div className="aspect-video bg-gradient-to-br from-primary/20 to-primary/5 relative overflow-hidden">
          {course.cover_image_url ? (
            // eslint-disable-next-line @next/next/no-img-element
            <img
              src={course.cover_image_url}
              alt={course.title}
              className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-300"
            />
          ) : (
            <div className="w-full h-full flex items-center justify-center">
              <GraduationCap className="w-12 h-12 text-primary/40" />
            </div>
          )}
        </div>

        {/* Content */}
        <div className="p-4 space-y-3">
          <h3 className="font-bold text-sm leading-snug line-clamp-2 group-hover:text-primary transition-colors">
            {course.title}
          </h3>

          {course.description && (
            <p className="text-xs text-muted-foreground line-clamp-2 leading-relaxed">
              {course.description}
            </p>
          )}

          <div className="flex items-center justify-between pt-1">
            <div className="flex items-center gap-3 text-xs text-muted-foreground">
              <span className="flex items-center gap-1">
                <BookOpen className="w-3.5 h-3.5" />
                {sectionCount} lesson{sectionCount !== 1 ? 's' : ''}
              </span>
            </div>
            <Badge variant="secondary" className="text-xs">
              Free
            </Badge>
          </div>
        </div>
      </div>
    </Link>
  )
}

// ─── Empty state ──────────────────────────────────────────────────────────────

function EmptyState() {
  return (
    <div className="flex flex-col items-center justify-center py-24 text-center">
      <div className="w-16 h-16 rounded-2xl bg-primary/10 flex items-center justify-center mb-4">
        <GraduationCap className="w-8 h-8 text-primary" />
      </div>
      <h3 className="font-semibold text-lg mb-2">No courses yet</h3>
      <p className="text-sm text-muted-foreground max-w-xs">
        Courses will appear here once they&apos;re added. Check back soon!
      </p>
    </div>
  )
}
