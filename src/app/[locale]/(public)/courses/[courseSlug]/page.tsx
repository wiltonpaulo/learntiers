import { createClient } from '@/lib/supabase/server'
import { createAdminClient } from '@/lib/supabase/admin'
import { notFound } from 'next/navigation'
import Link from 'next/link'
import { getLocale } from 'next-intl/server'
import { 
  BookOpen, 
  Clock, 
  PlayCircle, 
  ChevronLeft, 
  ShieldCheck, 
  CheckCircle2, 
  Trophy,
  GraduationCap
} from 'lucide-react'
import type { CourseRow, CourseSectionRow, UserProgressRow } from '@/types/database'
import RecentlyViewedTracker from '@/components/course/RecentlyViewedTracker'

interface CourseDetailPageProps {
  params: Promise<{
    courseSlug: string
  }>
}

export default async function CourseDetailPage({ params }: CourseDetailPageProps) {
  const { courseSlug } = await params
  const locale = await getLocale()
  const supabase = await createClient()

  const {
    data: { user },
  } = await supabase.auth.getUser()

  const loginMessage = encodeURIComponent('Log in or create a free account to start learning.')

  // First fetch the course by slug to get its ID
  const { data: course } = await (supabase
    .from('courses')
    .select('*')
    .eq('slug', courseSlug)
    .single() as any) as { data: CourseRow | null }

  if (!course) {
    notFound()
  }

  const courseId = course.id

  const [sectionsRes, progressRes, certificateRes, settingsRes] = await Promise.all([
    supabase
      .from('course_sections')
      .select('id, slug, title, start_time_seconds, end_time_seconds')
      .eq('course_id', courseId)
      .order('order_index'),
    user ? supabase.from('user_progress').select('section_id, is_completed').eq('user_id', user.id) : null,
    user ? supabase.from('certificates').select('*').eq('user_id', user.id).eq('course_id', courseId).single() : null,
    user ? supabase.from('user_course_settings').select('*').eq('user_id', user.id).eq('course_id', courseId).maybeSingle() : null,
  ])

  const sections = (sectionsRes.data ?? []) as (Pick<CourseSectionRow, 'id' | 'title' | 'start_time_seconds' | 'end_time_seconds'> & { slug: string })[]
  const userProgress = (progressRes?.data ?? []) as Pick<UserProgressRow, 'section_id' | 'is_completed'>[]
  let certificate = certificateRes?.data as any | null
  const settings = settingsRes?.data as any | null

  const completedSet = new Set(userProgress.filter((p) => p.is_completed).map((p) => p.section_id))
  const completedCount = completedSet.size
  const totalDuration = sections.reduce((acc, s) => acc + (s.end_time_seconds - s.start_time_seconds), 0)

  const isAdmin = user?.app_metadata?.role === 'admin'
  const isLoggedIn = !!user

  // CTA Logic: If logged in and has progress, "Continue Learning". Otherwise "Start Course".
  const ctaSection = (settings?.last_section_id && sections.find(s => s.id === settings.last_section_id)) || sections[0]

  return (
    <div className="min-h-screen bg-slate-50 pb-12">
      <RecentlyViewedTracker 
        course={{
          id: courseId,
          slug: courseSlug,
          title: course.title,
          cover_image_url: course.cover_image_url,
          duration: totalDuration ? formatDuration(totalDuration) : 'Free'
        }} 
      />

      {/* ── Hero Area ─────────────────────────────────────────────────── */}
      <div className="bg-[#1c1d1f] text-white py-12 md:py-20 relative overflow-hidden pt-32">
        <div className="absolute top-0 left-0 w-full h-full opacity-10 pointer-events-none">
           <div className="absolute top-[-10%] left-[-10%] w-[40%] h-[40%] bg-purple-500 rounded-full blur-[120px]" />
        </div>

        <div className="container mx-auto max-w-5xl px-4 relative z-10">
          <div className="lg:w-2/3 space-y-6">
            <div className="flex items-center gap-3">
              <Link
                href="/courses"
                className="inline-flex items-center gap-1.5 text-sm font-bold text-slate-400 hover:text-white transition-colors"
              >
                <ChevronLeft className="w-4 h-4" />
                Catalog
              </Link>
              {isAdmin && (
                <Link
                  href={`/${locale}/admin/courses/${courseSlug}`}
                  className="flex items-center gap-2 px-3 py-1.5 rounded-full bg-amber-500/10 border border-amber-500/20 text-amber-500 text-xs font-bold hover:bg-amber-500/20 transition-colors"
                >
                  <ShieldCheck className="w-3.5 h-3.5" />
                  Edit Course
                </Link>
              )}
            </div>

            <h1 className="text-3xl md:text-5xl font-black leading-[1.1] tracking-tight">{course.title}</h1>

            {course.description && (
              <p className="text-slate-400 text-lg md:text-xl leading-relaxed max-w-2xl">{course.description}</p>
            )}

            <div className="flex flex-wrap items-center gap-6 pt-2 text-sm text-slate-300 font-medium">
              <span className="flex items-center gap-2">
                <BookOpen className="w-4 h-4 text-purple-400" />
                {sections.length} lessons
              </span>
              <span className="flex items-center gap-2">
                <Clock className="w-4 h-4 text-purple-400" />
                {totalDuration ? formatDuration(totalDuration) : '0s'}
              </span>
              {completedCount > 0 && (
                <span className="flex items-center gap-2 text-emerald-400 font-bold">
                  <CheckCircle2 className="w-4 h-4" />
                  {completedCount} / {sections.length} completed
                </span>
              )}
            </div>
          </div>
        </div>
      </div>

      <div className="container mx-auto max-w-5xl px-4">
        <div className="flex flex-col lg:flex-row gap-12 relative">
          
          {/* LEFT COLUMN: Course Content */}
          <div className="flex-1 lg:w-2/3 min-w-0 py-12">
            <div className="flex items-center justify-between mb-8">
               <h2 className="text-2xl font-black text-slate-900 tracking-tight">Course Content</h2>
               <div className="text-sm font-bold text-slate-600">
                  {sections.length} sections • {totalDuration ? formatMins(totalDuration) : '0s'}
               </div>
            </div>

            <div className="space-y-1.5">
              {sections.map((section, index) => {
                const done = completedSet.has(section.id)
                const duration = section.end_time_seconds - section.start_time_seconds
                
                const sectionPath = `/${locale}/courses/${courseSlug}/sections/${section.slug}`
                const targetSectionUrl = isLoggedIn
                  ? sectionPath
                  : `/?auth=login&next=${encodeURIComponent(sectionPath)}`

                return (
                  <Link
                    key={section.id}
                    href={targetSectionUrl}
                    className="flex items-center gap-4 px-5 py-3.5 bg-white border border-slate-200 rounded-xl hover:bg-slate-50 hover:border-purple-300 hover:shadow-xl hover:shadow-purple-100/50 transition-all group"
                  >
                    <div className="w-7 h-7 rounded-full bg-slate-100 flex items-center justify-center shrink-0 border border-slate-200 group-hover:bg-purple-600 group-hover:border-purple-600 transition-all duration-300">
                      {done ? (
                        <CheckCircle2 className="w-4 h-4 text-emerald-600 group-hover:text-white" />
                      ) : (
                        <span className="text-[10px] font-black text-slate-900 group-hover:text-white transition-colors">{index + 1}</span>
                      )}
                    </div>
                    <div className="flex-1 min-w-0">
                      <p className="font-bold text-slate-900 group-hover:text-purple-700 transition-colors truncate text-sm">
                        {section.title}
                      </p>
                    </div>
                    <div className="flex items-center gap-1.5 text-xs font-black text-slate-900 tabular-nums">
                      <Clock className="w-3.5 h-3.5 text-slate-600 group-hover:text-purple-600 transition-colors" />
                      {Math.round(duration / 60)} min
                    </div>
                  </Link>
                )
              })}
            </div>
          </div>

          {/* RIGHT COLUMN: Floating CTA Card */}
          <div className="w-full lg:w-80 shrink-0 lg:-mt-48 relative z-20">
            <div className="sticky top-24 space-y-8">
              <div className="bg-white rounded-3xl border border-slate-200 shadow-2xl overflow-hidden text-slate-900">
                <div className="aspect-video relative bg-slate-100">
                  {course.cover_image_url ? (
                    <img src={course.cover_image_url} alt={course.title} className="w-full h-full object-cover" />
                  ) : (
                    <div className="w-full h-full flex items-center justify-center">
                      < GraduationCap className="w-16 h-16 text-slate-300" />
                    </div>
                  )}
                  <div className="absolute inset-0 bg-black/20 flex items-center justify-center group cursor-pointer">
                    <div className="w-16 h-16 rounded-full bg-purple-600 text-white flex items-center justify-center shadow-xl group-hover:scale-110 transition-transform">
                        <PlayCircle className="w-8 h-8 fill-current" />
                    </div>
                  </div>
                </div>
                <div className="p-6 space-y-6">
                  <div className="text-3xl font-black tracking-tight">Free</div>
                  
                  {(() => {
                    const ctaPath = `/${locale}/courses/${courseSlug}/sections/${ctaSection?.slug || ''}`
                    const ctaUrl = isLoggedIn ? ctaPath : `/?auth=login&next=${encodeURIComponent(ctaPath)}`
                    
                    return (
                      <Link
                        href={ctaUrl}
                        className="flex items-center justify-center gap-2 w-full bg-purple-600 text-white font-black py-4 rounded-xl hover:bg-purple-700 transition-all shadow-xl shadow-purple-100 active:scale-[0.98]"
                      >
                        <span className="uppercase tracking-tighter">{isLoggedIn ? (completedCount > 0 ? 'Continue Learning' : 'Start Course') : 'Log in to Start'}</span>
                        <PlayCircle className="w-5 h-5" />
                      </Link>
                    )
                  })()}

                  <div className="space-y-3">
                    <p className="text-[10px] font-black uppercase tracking-widest text-slate-500">Includes:</p>
                    <ul className="space-y-2 text-xs font-bold text-slate-600">
                      <li className="flex items-center gap-2"><CheckCircle2 className="w-3.5 h-3.5 text-emerald-500" /> AI-powered transcripts</li>
                      <li className="flex items-center gap-2"><CheckCircle2 className="w-3.5 h-3.5 text-emerald-500" /> Interactive code snippets</li>
                      <li className="flex items-center gap-2"><CheckCircle2 className="w-3.5 h-3.5 text-emerald-500" /> Verified Certificate</li>
                    </ul>
                  </div>
                </div>
              </div>

              {certificate && (
                <div className="p-8 rounded-3xl bg-gradient-to-br from-purple-600 to-indigo-700 text-white shadow-2xl shadow-purple-200 relative overflow-hidden">
                  <div className="absolute top-0 right-0 p-4 opacity-10">
                      <Trophy className="w-24 h-24 rotate-12" />
                  </div>
                  <div className="relative z-10 space-y-4">
                    <h3 className="text-xl font-black">Course Certified!</h3>
                    <p className="text-white/90 text-sm leading-relaxed font-medium">You have mastered this course. Share your achievement with the world.</p>
                    <Link 
                      href={`/${locale}/certificates`}
                      className="inline-flex items-center justify-center w-full h-12 rounded-xl bg-white text-purple-600 font-black uppercase tracking-tighter shadow-xl hover:bg-slate-50 transition-all active:scale-95"
                    >
                      View Certificate
                    </Link>
                  </div>
                </div>
              )}
            </div>
          </div>

        </div>
      </div>
    </div>
  )
}

function formatDuration(seconds: number): string {
  const h = Math.floor(seconds / 3600)
  const m = Math.floor((seconds % 3600) / 60)
  const s = Math.floor(seconds % 60)

  if (h > 0) return `${h}h ${m}m`
  if (m > 0) return `${m}m ${s}s`
  return `${s}s`
}

function formatMins(seconds: number): string {
  const m = Math.floor(seconds / 60)
  const s = Math.floor(seconds % 60)
  return `${m}m ${s}s`
}
