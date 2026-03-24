import { createClient } from '@/lib/supabase/server'
import { notFound, redirect } from 'next/navigation'
import Link from 'next/link'
import { getLocale } from 'next-intl/server'
import { Trophy, CheckCircle2, ArrowRight, Share2, Award, BookOpen, Clock, Zap } from 'lucide-react'
import { CourseCompletionConfetti } from '@/components/course/CourseCompletionConfetti'
import { Button } from '@/components/ui/button'
import type { CourseRow, CourseSectionRow, UserProgressRow } from '@/types/database'

interface CourseCompletedPageProps {
  params: Promise<{ courseSlug: string }>
}

export default async function CourseCompletedPage({ params }: CourseCompletedPageProps) {
  const { courseSlug } = await params
  const locale = await getLocale()
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()

  if (!user) {
    redirect(`/?auth=login&next=${encodeURIComponent(`/courses/${courseSlug}/completed`)}`)
  }

  // Fetch course and sections
  const { data: course } = await (supabase
    .from('courses')
    .select('id, title, description, cover_image_url')
    .eq('slug', courseSlug)
    .single() as any) as { data: CourseRow | null }

  if (!course) notFound()

  const [sectionsRes, progressRes, certificateRes] = await Promise.all([
    supabase
      .from('course_sections')
      .select('id, start_time_seconds, end_time_seconds')
      .eq('course_id', course.id),
    supabase
      .from('user_progress')
      .select('section_id, is_completed')
      .eq('user_id', user.id),
    supabase
      .from('certificates')
      .select('verification_code')
      .eq('user_id', user.id)
      .eq('course_id', course.id)
      .single()
  ])

  const sections = (sectionsRes.data || []) as Pick<CourseSectionRow, 'id' | 'start_time_seconds' | 'end_time_seconds'>[]
  const progress = (progressRes.data || []) as Pick<UserProgressRow, 'section_id' | 'is_completed'>[]
  const certificate = certificateRes.data

  // Calculate stats
  const totalSections = sections.length
  const courseSectionIds = new Set(sections.map(s => s.id))
  const completedSections = progress.filter(p => p.is_completed && courseSectionIds.has(p.section_id)).length
  const totalDurationSeconds = sections.reduce((acc, s) => acc + (s.end_time_seconds - s.start_time_seconds), 0)
  const totalHours = Math.round((totalDurationSeconds / 3600) * 10) / 10

  // If not actually completed, redirect back to course (safety check)
  if (completedSections < totalSections && totalSections > 0) {
    // allow some leeway if it's almost done
    if (completedSections / totalSections < 0.9) {
        redirect(`/${locale}/courses/${courseSlug}`)
    }
  }

  return (
    <div className="min-h-screen bg-slate-50 flex flex-col items-center justify-center py-20 px-4 relative overflow-hidden">
      <CourseCompletionConfetti />
      
      {/* Background Decorative Elements */}
      <div className="absolute top-0 left-1/2 -translate-x-1/2 w-full h-full -z-10">
        <div className="absolute top-[-10%] left-[-10%] w-[40%] h-[40%] bg-purple-100/50 rounded-full blur-[120px] animate-pulse" />
        <div className="absolute bottom-[-10%] right-[-10%] w-[40%] h-[40%] bg-blue-50/50 rounded-full blur-[120px] animate-pulse" />
      </div>

      <div className="max-w-3xl w-full space-y-8 relative z-10">
        {/* Main Card */}
        <div className="bg-white rounded-[2.5rem] border border-slate-200 shadow-2xl shadow-purple-100/50 overflow-hidden">
          <div className="p-8 md:p-12 text-center space-y-8">
            {/* Celebration Icon */}
            <div className="relative inline-block">
              <div className="w-24 h-24 rounded-3xl bg-purple-600 flex items-center justify-center shadow-2xl shadow-purple-200 animate-bounce duration-[2000ms]">
                <Trophy className="w-12 h-12 text-white" />
              </div>
              <div className="absolute -top-2 -right-2 w-8 h-8 rounded-full bg-amber-400 border-4 border-white flex items-center justify-center shadow-lg">
                <CheckCircle2 className="w-4 h-4 text-white" />
              </div>
            </div>

            <div className="space-y-4">
              <h1 className="text-4xl md:text-6xl font-black text-slate-900 tracking-tight leading-tight">
                Congratulations, <br />
                <span className="text-purple-600">{user.user_metadata?.name?.split(' ')[0] || 'Engineer'}!</span>
              </h1>
              <p className="text-slate-500 text-lg md:text-xl font-medium max-w-xl mx-auto">
                You have successfully completed <span className="text-slate-900 font-bold">&ldquo;{course.title}&rdquo;</span>. 
                Your dedication to mastering these technical skills is inspiring.
              </p>
            </div>

            {/* Stats Grid */}
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
              <StatCard icon={<BookOpen className="w-4 h-4 text-blue-500" />} label="Lessons" value={totalSections} />
              <StatCard icon={<Clock className="w-4 h-4 text-emerald-500" />} label="Hours Content" value={`${totalHours}h`} />
              <StatCard icon={<Zap className="w-4 h-4 text-amber-500" />} label="Skill Level" value="Advanced" />
            </div>

            {/* Action Area */}
            <div className="pt-8 flex flex-col sm:flex-row items-center justify-center gap-4 border-t border-slate-100">
              {certificate ? (
                <Button size="lg" asChild className="h-14 px-8 text-base font-black bg-purple-600 hover:bg-purple-700 text-white rounded-2xl shadow-xl shadow-purple-200 group w-full sm:w-auto">
                  <Link href={`/${locale}/certificates`}>
                    <Award className="w-5 h-5 mr-2" />
                    View Certificate
                    <ArrowRight className="w-5 h-5 ml-2 group-hover:translate-x-1 transition-transform" />
                  </Link>
                </Button>
              ) : (
                <Button size="lg" asChild className="h-14 px-8 text-base font-black bg-slate-900 hover:bg-slate-800 text-white rounded-2xl shadow-xl group w-full sm:w-auto">
                   <Link href={`/${locale}/courses/${courseSlug}`}>
                    Complete all lessons to earn certificate
                  </Link>
                </Button>
              )}
              
              <Button variant="outline" size="lg" className="h-14 px-8 text-base font-bold text-slate-600 border-slate-200 bg-white hover:bg-slate-50 rounded-2xl w-full sm:w-auto">
                <Share2 className="w-5 h-5 mr-2" />
                Share Achievement
              </Button>
            </div>
          </div>
        </div>

        {/* Secondary Navigation */}
        <div className="flex flex-col sm:flex-row items-center justify-between gap-6 px-4">
          <Link 
            href="/my-learning" 
            className="text-slate-500 hover:text-purple-600 font-bold text-sm flex items-center gap-2 transition-colors"
          >
            <ArrowRight className="w-4 h-4 rotate-180" />
            Back to My Learning
          </Link>
          
          <Link 
            href="/courses" 
            className="text-purple-600 hover:text-purple-700 font-black text-sm uppercase tracking-widest flex items-center gap-2 transition-colors"
          >
            Explore Next Course
            <ArrowRight className="w-4 h-4" />
          </Link>
        </div>
      </div>
    </div>
  )
}

function StatCard({ icon, label, value }: { icon: React.ReactNode, label: string, value: string | number }) {
  return (
    <div className="bg-slate-50 rounded-2xl p-4 border border-slate-100 flex flex-col items-center gap-1 shadow-sm">
      <div className="flex items-center gap-2 text-slate-400 mb-1">
        {icon}
        <span className="text-[10px] font-black uppercase tracking-widest">{label}</span>
      </div>
      <span className="text-xl font-black text-slate-900 tabular-nums">{value}</span>
    </div>
  )
}
