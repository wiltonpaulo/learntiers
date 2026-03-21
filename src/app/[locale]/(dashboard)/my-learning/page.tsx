import { createClient } from '@/lib/supabase/server'
import Link from 'next/link'
import { getLocale } from 'next-intl/server'
import { redirect } from 'next/navigation'
import { 
  Award,
  BookOpen,
  Sparkles,
  Target,
  Clock,
  TrendingUp,
  Zap,
  GraduationCap,
  PlayCircle
} from 'lucide-react'
import type { CourseRow, CourseSectionRow, UserRow } from '@/types/database'
import { CourseDeck } from '@/components/course/CourseDeck'
import { Card, CardContent } from '@/components/ui/card'
import { Progress } from '@/components/ui/progress'

export default async function MyLearningPage({ params }: { params: Promise<{ locale: string }> }) {
  const { locale } = await params
  const supabase = await createClient()

  const { data: { user } } = await supabase.auth.getUser()

  if (!user) {
    redirect(`/${locale}/login`)
  }

  // 1. Fetch user data and progress
  const [userRes, progressRes, allCoursesRes] = await Promise.all([
    supabase.from('users').select('*').eq('id', user.id).single(),
    supabase.from('user_progress').select(`
      section_id,
      is_completed,
      course_sections (
        course_id
      )
    `).eq('user_id', user.id),
    supabase.from('courses').select('*').order('created_at', { ascending: false })
  ])

  const userData = userRes.data as UserRow
  const progressEntries = (progressRes.data || []) as any[]
  const allCourses = (allCoursesRes.data || []) as CourseRow[]
  
  const enrolledCourseIds = Array.from(new Set(progressEntries.map((p) => p.course_sections?.course_id).filter(Boolean)))

  // 2. Fetch ALL sections
  const { data: allSectionsData } = await supabase
    .from('course_sections')
    .select('id, course_id, start_time_seconds, end_time_seconds, created_at')
    .in('course_id', allCourses.map(c => c.id))

  const allSections = (allSectionsData || []) as Pick<CourseSectionRow, 'id' | 'course_id' | 'start_time_seconds' | 'end_time_seconds' | 'created_at'>[]

  // 3. Process courses and calculate stats
  let totalStudySeconds = 0
  const completedSectionIds = new Set(progressEntries.filter(p => p.is_completed).map(p => p.section_id))

  const processedCourses = allCourses.map(course => {
    const courseSections = allSections.filter((s) => s.course_id === course.id)
    const courseSectionIds = courseSections.map((s) => s.id)
    
    courseSections.forEach(s => {
      if (completedSectionIds.has(s.id)) {
        totalStudySeconds += (s.end_time_seconds - s.start_time_seconds)
      }
    })

    const completedInCourse = progressEntries.filter((p) => 
      p.is_completed && courseSectionIds.includes(p.section_id)
    )
    
    const total = courseSections.length
    const completed = completedInCourse.length
    const percentage = total > 0 ? Math.round((completed / total) * 100) : 0
    const totalSeconds = courseSections.reduce((acc, s) => acc + (s.end_time_seconds - s.start_time_seconds), 0)

    return {
      id: course.id,
      title: course.title,
      author: course.youtube_channel_name || 'Expert',
      duration: formatDuration(totalSeconds),
      description: course.description,
      badge: (new Date(course.created_at).getTime() > Date.now() - 7 * 24 * 60 * 60 * 1000) ? 'New' : undefined,
      thumbnailColor: getThumbnailColor(course.id),
      percentage,
      cover_image_url: course.cover_image_url,
      totalSections: total,
      created_at: course.created_at
    }
  })

  const continueWatching = processedCourses.filter(c => c.percentage > 0 && c.percentage < 100)
  const completedCourses = processedCourses.filter(c => c.percentage === 100)
  const newReleases = processedCourses.filter(c => c.percentage === 0).slice(0, 12)

  return (
    <div className="min-h-screen bg-background">
      
      {/* ── Hero Section (Unified with Courses Page) ────────────────────────── */}
      <div className="bg-slate-900 text-white py-16 px-4">
        <div className="container mx-auto max-w-6xl">
          <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-10">
            <div className="max-w-2xl space-y-4">
              <h1 className="text-3xl md:text-5xl font-extrabold leading-tight tracking-tight">
                Welcome Back, <span className="text-primary-400">{userData?.name?.split(' ')[0] || 'Learner'}</span>
              </h1>
              <p className="text-slate-300 text-lg md:text-xl leading-relaxed">
                You have mastered <span className="text-white font-bold">{completedCourses.length} topics</span> so far. Keep up the momentum!
              </p>
            </div>

            {/* Quick Metrics (Cards style within the Hero) */}
            <div className="grid grid-cols-2 sm:grid-cols-2 gap-4 lg:w-1/3">
              <HeroMetric icon={<Clock className="w-4 h-4 text-blue-400" />} label="Study Time" value={formatStudyTime(totalStudySeconds)} />
              <HeroMetric icon={<Zap className="w-4 h-4 text-amber-400" />} label="Total XP" value={userData?.total_score || 0} />
            </div>
          </div>
        </div>
      </div>

      <div className="container mx-auto max-w-6xl px-4 py-12 space-y-20">
        
        {/* ── Continue Watching (Deck Style) ────────────────────────────────── */}
        {continueWatching.length > 0 && (
          <CourseDeck 
            title="Continue Watching" 
            subtitle="Pick up exactly where you left off"
            courses={continueWatching} 
          />
        )}

        {/* ── New Releases (Deck Style) ─────────────────────────────────────── */}
        <CourseDeck 
          title="New Releases for You" 
          subtitle="Latest professional micro-lessons added recently"
          courses={newReleases} 
          buttonLabel="start learning"
        />

        {/* ── Completed Courses (Deck Style) ────────────────────────────────── */}
        {completedCourses.length > 0 && (
          <CourseDeck 
            title="Completed Courses" 
            subtitle="Review lessons and master your skills"
            courses={completedCourses} 
          />
        )}

        {enrolledCourseIds.length === 0 && (
          <div className="text-center py-24 bg-muted/20 rounded-xl border-2 border-dashed">
            <GraduationCap className="w-12 h-12 text-muted-foreground mx-auto mb-4 opacity-30" />
            <h3 className="text-xl font-bold">You haven't started any courses yet</h3>
            <p className="text-muted-foreground mt-2 mb-8">Browse our courses and start learning today!</p>
            <Link
              href={`/${locale}/courses`}
              className="inline-flex items-center justify-center bg-primary text-primary-foreground px-6 py-3 font-bold hover:bg-primary/90 transition-all shadow-lg shadow-primary/20"
            >
              Browse Courses
            </Link>
          </div>
        )}
      </div>
    </div>
  )
}

function HeroMetric({ icon, label, value }: { icon: React.ReactNode, label: string, value: string | number }) {
  return (
    <div className="bg-white/5 border border-white/10 backdrop-blur-md rounded-xl p-4 flex flex-col gap-1">
      <div className="flex items-center gap-2 text-white/40 mb-1">
        {icon}
        <span className="text-[10px] font-black uppercase tracking-widest">{label}</span>
      </div>
      <span className="text-2xl font-black text-white tabular-nums leading-none">{value}</span>
    </div>
  )
}

function getThumbnailColor(id: string) {
  const colors = [
    'bg-gradient-to-br from-blue-600 to-indigo-900',
    'bg-gradient-to-br from-slate-700 to-slate-900',
    'bg-gradient-to-br from-emerald-600 to-teal-900',
    'bg-gradient-to-br from-orange-600 to-red-900',
    'bg-gradient-to-br from-cyan-500 to-blue-800'
  ]
  const index = id.charCodeAt(0) % colors.length
  return colors[index]
}

function formatDuration(seconds: number): string {
  const h = Math.floor(seconds / 3600)
  const m = Math.floor((seconds % 3600) / 60)
  if (h > 0) return `${h}h ${m}m`
  return `${m}m`
}

function formatStudyTime(seconds: number): string {
  const h = Math.floor(seconds / 3600)
  const m = Math.floor((seconds % 3600) / 60)
  if (h > 0) return `${h}h ${m}m`
  return `${m}m`
}
