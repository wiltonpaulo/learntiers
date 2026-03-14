import { createClient } from '@/lib/supabase/server'
import { notFound } from 'next/navigation'
import Link from 'next/link'
import { getLocale } from 'next-intl/server'
import { Badge } from '@/components/ui/badge'
import { Separator } from '@/components/ui/separator'
import { CheckCircle2, Circle, Clock, PlayCircle, BookOpen, ChevronLeft, GraduationCap, ShieldCheck, MonitorPlay, Infinity, Smartphone, Trophy } from 'lucide-react'
import type { CourseRow, CourseSectionRow, UserProgressRow } from '@/types/database'

interface CourseDetailPageProps {
  params: Promise<{ courseId: string }>
}

export default async function CourseDetailPage({ params }: CourseDetailPageProps) {
  const { courseId } = await params
  const locale = await getLocale()
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()

  const isAdmin = user?.app_metadata?.role === 'admin'
  const loginMessage = encodeURIComponent('Log in to start learning.')

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
    <div className="min-h-screen bg-background pb-12">
      {/* ── Hero ──────────────────────────────────────────────────────────── */}
      <div className="bg-slate-900 text-white py-12 px-4">
        <div className="container mx-auto max-w-5xl flex flex-col lg:flex-row gap-8 relative">
          <div className="flex-1 lg:w-2/3 space-y-5 lg:pr-8">
            <div className="flex items-center justify-between">
              <Link
                href={`/${locale}/courses`}
                className="inline-flex items-center gap-1.5 text-sm text-primary-400 hover:text-primary-300 font-bold transition-colors"
              >
                <ChevronLeft className="w-4 h-4" />
                Back to Courses
              </Link>
              {isAdmin && (
                <Link
                  href={`/${locale}/admin/courses/${courseId}`}
                  className="flex items-center gap-2 px-3 py-1.5 rounded-full bg-amber-500/10 border border-amber-500/20 text-amber-500 text-xs font-bold hover:bg-amber-500/20 transition-colors"
                >
                  <ShieldCheck className="w-3.5 h-3.5" />
                  Edit Course
                </Link>
              )}
            </div>

            <h1 className="text-3xl md:text-4xl font-extrabold leading-tight">{course.title}</h1>
            {course.description && (
              <p className="text-slate-300 text-base md:text-lg leading-relaxed">{course.description}</p>
            )}

            <div className="flex flex-wrap items-center gap-5 pt-2 text-sm text-slate-300">
              <Stat icon={<BookOpen className="w-4 h-4" />} label={`${sections.length} lessons`} />
              <Stat icon={<Clock className="w-4 h-4" />} label={formatDuration(totalDuration)} />
              {completedCount > 0 && (
                <Stat
                  icon={<CheckCircle2 className="w-4 h-4 text-green-400" />}
                  label={`${completedCount} / ${sections.length} completed`}
                  className="text-green-400 font-medium"
                />
              )}
            </div>
          </div>
          <div className="hidden lg:block lg:w-1/3" />
        </div>
      </div>

      {/* ── Main + Sidebar ────────────────────────────────────────────────── */}
      <div className="container mx-auto max-w-5xl px-4 py-10">
        <div className="flex flex-col lg:flex-row gap-10">
          <div className="flex-1 lg:w-2/3 min-w-0">
            <h2 className="text-2xl font-bold mb-6">Course Content</h2>
            <div className="rounded-xl border bg-card overflow-hidden divide-y">
              {sections.map((section, index) => {
                const done = completedSet.has(section.id)
                const duration = section.end_time_seconds - section.start_time_seconds
                const targetUrl = user 
                  ? `/${locale}/courses/${courseId}/sections/${section.id}`
                  : `/${locale}/login?message=${loginMessage}`

                return (
                  <Link
                    key={section.id}
                    href={targetUrl}
                    className="flex items-center gap-4 px-5 py-5 hover:bg-muted/50 transition-colors group"
                  >
                    <div className="shrink-0">
                      {done
                        ? <CheckCircle2 className="w-5 h-5 text-green-500" />
                        : <PlayCircle className="w-5 h-5 text-muted-foreground/40 group-hover:text-primary transition-colors" />
                      }
                    </div>
                    <div className="flex-1 min-w-0">
                      <p className="text-sm font-medium leading-snug group-hover:text-primary transition-colors truncate">
                        {index + 1}. {section.title}
                      </p>
                      <span className="text-xs text-muted-foreground tabular-nums">
                        {formatMins(duration)}
                      </span>
                    </div>
                  </Link>
                )
              })}
            </div>
          </div>

          {/* Floating CTA Sidebar */}
          {ctaSection && (
            <div className="lg:w-1/3 shrink-0 relative">
              <div className="sticky top-8 lg:-mt-72 rounded-xl border bg-background shadow-2xl overflow-hidden z-10">
                <div className="aspect-video bg-muted relative group overflow-hidden cursor-pointer">
                  {course.cover_image_url ? (
                    <img src={course.cover_image_url} alt="" className="w-full h-full object-cover transition-transform duration-500 group-hover:scale-105" />
                  ) : (
                    <div className="w-full h-full flex items-center justify-center bg-slate-100 dark:bg-slate-800">
                      <GraduationCap className="w-12 h-12 text-slate-300" />
                    </div>
                  )}
                  <div className="absolute inset-0 flex items-center justify-center bg-black/30 group-hover:bg-black/40 transition-colors">
                    <div className="w-16 h-16 rounded-full bg-white/95 flex items-center justify-center shadow-lg transform group-hover:scale-110 transition-transform">
                      <PlayCircle className="w-8 h-8 text-primary" />
                    </div>
                  </div>
                </div>
                <div className="p-6 space-y-6">
                  <div className="text-3xl font-extrabold">Free</div>
                  <Link
                    href={user ? `/${locale}/courses/${courseId}/sections/${ctaSection.id}` : `/${locale}/login?message=${loginMessage}`}
                    className="flex w-full items-center justify-center gap-2 bg-primary text-primary-foreground rounded-none py-4 text-base font-bold hover:bg-primary/90 transition-colors shadow-sm"
                  >
                    {completedCount > 0 ? 'Continue Learning' : 'Start Course'}
                  </Link>
                  <div className="space-y-4 text-sm text-muted-foreground">
                    <p className="font-semibold text-foreground">This course includes:</p>
                    <ul className="space-y-3">
                      <li className="flex items-center gap-3"><MonitorPlay className="w-4 h-4" /> {formatDuration(totalDuration)} video</li>
                      <li className="flex items-center gap-3"><Infinity className="w-4 h-4" /> Full lifetime access</li>
                      <li className="flex items-center gap-3"><Smartphone className="w-4 h-4" /> Access on mobile</li>
                      <li className="flex items-center gap-3"><Trophy className="w-4 h-4" /> Certificate of completion</li>
                    </ul>
                  </div>
                  <Separator />
                  <div className="flex justify-between items-center text-sm">
                    <span className="text-muted-foreground">Your Progress</span>
                    <span className="font-bold text-primary">{sections.length > 0 ? `${Math.round((completedCount / sections.length) * 100)}%` : '0%'}</span>
                  </div>
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
