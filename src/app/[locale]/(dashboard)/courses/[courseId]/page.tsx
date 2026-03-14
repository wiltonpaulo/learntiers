import { createClient } from '@/lib/supabase/server'
import { notFound } from 'next/navigation'
import Link from 'next/link'
import { getLocale } from 'next-intl/server'
import { Badge } from '@/components/ui/badge'
import { Separator } from '@/components/ui/separator'
import { CheckCircle2, Circle, Clock, PlayCircle, BookOpen, ChevronLeft, GraduationCap } from 'lucide-react'
import type { CourseRow, CourseSectionRow, UserProgressRow } from '@/types/database'

interface CourseDetailPageProps {
  params: Promise<{ courseId: string }>
}

export default async function CourseDetailPage({ params }: CourseDetailPageProps) {
  const { courseId } = await params
  const locale = await getLocale()
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()

  const [courseRes, sectionsRes, progressRes] = await Promise.all([
    supabase
      .from('courses')
      .select('id, title, description, cover_image_url')
      .eq('id', courseId)
      .single(),
    supabase
      .from('course_sections')
      .select('id, title, yt_video_id, start_time_seconds, end_time_seconds, text_summary, order_index')
      .eq('course_id', courseId)
      .order('order_index', { ascending: true }),
    user
      ? supabase
          .from('user_progress')
          .select('section_id, is_completed')
          .eq('user_id', user.id)
      : Promise.resolve({ data: [] }),
  ])

  const course = courseRes.data as Pick<CourseRow, 'id' | 'title' | 'description' | 'cover_image_url'> | null
  const sections = (sectionsRes.data ?? []) as CourseSectionRow[]
  const progress = (progressRes.data ?? []) as Pick<UserProgressRow, 'section_id' | 'is_completed'>[]

  if (!course) notFound()

  const completedSet = new Set(progress.filter((p) => p.is_completed).map((p) => p.section_id))
  const completedCount = sections.filter((s) => completedSet.has(s.id)).length
  const totalDuration = sections.reduce((acc, s) => acc + (s.end_time_seconds - s.start_time_seconds), 0)
  const firstIncomplete = sections.find((s) => !completedSet.has(s.id))
  const ctaSection = firstIncomplete ?? sections[0]

  return (
    <div>
      {/* ── Hero ──────────────────────────────────────────────────────────── */}
      <div className="py-10 px-4" style={{ backgroundColor: 'var(--nav-bg)' }}>
        <div className="container mx-auto max-w-5xl">
          <Link
            href={`/${locale}/courses`}
            className="inline-flex items-center gap-1.5 text-sm text-white/60 hover:text-white mb-5 transition-colors"
          >
            <ChevronLeft className="w-4 h-4" />
            All Courses
          </Link>

          <div className="flex flex-col md:flex-row gap-8">
            {/* Text */}
            <div className="flex-1 space-y-3">
              <h1 className="text-2xl md:text-3xl font-bold text-white">{course.title}</h1>
              {course.description && (
                <p className="text-white/70 text-sm leading-relaxed">{course.description}</p>
              )}
              <div className="flex flex-wrap items-center gap-3 pt-1">
                <Stat icon={<BookOpen className="w-4 h-4" />} label={`${sections.length} lessons`} />
                <Stat icon={<Clock className="w-4 h-4" />} label={formatDuration(totalDuration)} />
                {completedCount > 0 && (
                  <Stat
                    icon={<CheckCircle2 className="w-4 h-4 text-green-400" />}
                    label={`${completedCount} / ${sections.length} completed`}
                    className="text-green-400"
                  />
                )}
              </div>
            </div>

            {/* Cover thumbnail */}
            <div className="hidden md:block w-56 h-36 rounded-xl overflow-hidden shrink-0 bg-white/10">
              {course.cover_image_url ? (
                // eslint-disable-next-line @next/next/no-img-element
                <img src={course.cover_image_url} alt="" className="w-full h-full object-cover" />
              ) : (
                <div className="w-full h-full flex items-center justify-center">
                  <GraduationCap className="w-10 h-10 text-white/30" />
                </div>
              )}
            </div>
          </div>
        </div>
      </div>

      {/* ── Main + Sidebar ────────────────────────────────────────────────── */}
      <div className="container mx-auto max-w-5xl px-4 py-8">
        <div className="flex flex-col lg:flex-row gap-8">

          {/* Sections list */}
          <div className="flex-1 min-w-0">
            <h2 className="text-base font-bold mb-4">Course Content</h2>
            <div className="rounded-xl border overflow-hidden divide-y">
              {sections.map((section, index) => {
                const done = completedSet.has(section.id)
                const duration = section.end_time_seconds - section.start_time_seconds
                return (
                  <Link
                    key={section.id}
                    href={`/${locale}/courses/${courseId}/sections/${section.id}`}
                    className="flex items-center gap-4 px-5 py-4 hover:bg-muted/50 transition-colors group"
                  >
                    {/* Status icon */}
                    <div className="shrink-0">
                      {done
                        ? <CheckCircle2 className="w-5 h-5 text-primary" />
                        : <Circle className="w-5 h-5 text-muted-foreground/40 group-hover:text-muted-foreground transition-colors" />
                      }
                    </div>

                    {/* Content */}
                    <div className="flex-1 min-w-0">
                      <div className="flex items-start justify-between gap-4">
                        <div>
                          <span className="text-xs text-muted-foreground font-medium">Lesson {index + 1}</span>
                          <p className="text-sm font-medium leading-snug group-hover:text-primary transition-colors truncate">
                            {section.title}
                          </p>
                        </div>
                        <div className="flex items-center gap-2 shrink-0">
                          <span className="text-xs text-muted-foreground tabular-nums">
                            {formatMins(duration)}
                          </span>
                          <PlayCircle className="w-4 h-4 text-muted-foreground/40 group-hover:text-primary transition-colors" />
                        </div>
                      </div>
                    </div>
                  </Link>
                )
              })}

              {sections.length === 0 && (
                <div className="px-5 py-10 text-center text-sm text-muted-foreground">
                  No lessons added yet.
                </div>
              )}
            </div>
          </div>

          {/* Sticky CTA sidebar */}
          {ctaSection && (
            <div className="lg:w-72 shrink-0">
              <div className="sticky top-20 rounded-xl border overflow-hidden shadow-sm">
                {/* Preview thumbnail */}
                <div className="aspect-video bg-gradient-to-br from-primary/20 to-primary/5 relative">
                  {course.cover_image_url
                    ? (
                      // eslint-disable-next-line @next/next/no-img-element
                      <img src={course.cover_image_url} alt="" className="w-full h-full object-cover" />
                    )
                    : (
                      <div className="w-full h-full flex items-center justify-center">
                        <PlayCircle className="w-12 h-12 text-primary/50" />
                      </div>
                    )
                  }
                  {/* Play overlay */}
                  <div className="absolute inset-0 flex items-center justify-center bg-black/30">
                    <div className="w-14 h-14 rounded-full bg-white/90 flex items-center justify-center shadow-lg">
                      <PlayCircle className="w-8 h-8 text-primary" />
                    </div>
                  </div>
                </div>

                <div className="p-5 space-y-4">
                  <div className="space-y-1">
                    <p className="text-xs text-muted-foreground">
                      {completedCount > 0 ? 'Continue where you left off' : 'Start learning'}
                    </p>
                    <p className="text-sm font-semibold line-clamp-2">{ctaSection.title}</p>
                  </div>

                  <Link
                    href={`/${locale}/courses/${courseId}/sections/${ctaSection.id}`}
                    className="flex w-full items-center justify-center gap-2 bg-primary text-white rounded-lg py-2.5 text-sm font-semibold hover:bg-primary/90 transition-colors"
                  >
                    <PlayCircle className="w-4 h-4" />
                    {completedCount > 0 ? 'Continue' : 'Start Learning'}
                  </Link>

                  <Separator />

                  <div className="space-y-2 text-sm">
                    <div className="flex justify-between">
                      <span className="text-muted-foreground">Lessons</span>
                      <span className="font-medium">{sections.length}</span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-muted-foreground">Total time</span>
                      <span className="font-medium">{formatDuration(totalDuration)}</span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-muted-foreground">Progress</span>
                      <span className="font-medium text-primary">
                        {sections.length > 0
                          ? `${Math.round((completedCount / sections.length) * 100)}%`
                          : '0%'}
                      </span>
                    </div>
                  </div>

                  <Badge variant="secondary" className="w-full justify-center">
                    Free Course
                  </Badge>
                </div>
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  )
}

// ─── Helpers ──────────────────────────────────────────────────────────────────

function Stat({
  icon,
  label,
  className = 'text-white/70',
}: {
  icon: React.ReactNode
  label: string
  className?: string
}) {
  return (
    <span className={`flex items-center gap-1.5 text-sm ${className}`}>
      {icon}
      {label}
    </span>
  )
}

function formatDuration(seconds: number): string {
  const h = Math.floor(seconds / 3600)
  const m = Math.floor((seconds % 3600) / 60)
  if (h > 0) return `${h}h ${m}m`
  return `${m} min`
}

function formatMins(seconds: number): string {
  const m = Math.floor(seconds / 60)
  const s = seconds % 60
  return `${m}:${String(s).padStart(2, '0')}`
}
