import { createClient } from '@/lib/supabase/server'
import Link from 'next/link'
import { getLocale } from 'next-intl/server'
import { redirect } from 'next/navigation'
import { GraduationCap, BookOpen, Clock, Star, Search, Filter } from 'lucide-react'
import type { CourseRow } from '@/types/database'
import { Progress, ProgressTrack, ProgressIndicator, ProgressValue } from '@/components/ui/progress'

export default async function MyLearningPage({ params }: { params: Promise<{ locale: string }> }) {
  const { locale } = await params
  const supabase = await createClient()

  const { data: { user } } = await supabase.auth.getUser()

  if (!user) {
    redirect(`/${locale}/login`)
  }

  // Fetch courses that the user has some progress in
  // We need:
  // 1. All sections for each of these courses (to calculate total)
  // 2. User progress for each of these sections (to calculate completed)
  
  // First, find all course IDs the user is "enrolled" in
  const { data: userProgressData } = await (supabase as any)
    .from('user_progress')
    .select(`
      section_id,
      is_completed,
      course_sections (
        course_id
      )
    `)
    .eq('user_id', user.id)

  const progressEntries = userProgressData || []
  const enrolledCourseIds = Array.from(new Set(progressEntries.map((p: any) => p.course_sections?.course_id).filter(Boolean)))

  if (enrolledCourseIds.length === 0) {
    return (
      <div className="min-h-screen bg-background">
        <div className="bg-slate-900 text-white py-16 px-4">
          <div className="container mx-auto max-w-6xl">
            <h1 className="text-3xl md:text-5xl font-extrabold leading-tight tracking-tight">
              My <span className="text-primary-400">Learning</span>
            </h1>
            <p className="text-slate-300 text-lg md:text-xl leading-relaxed">
              Continue your learning journey and master new skills.
            </p>
          </div>
        </div>

        <div className="container mx-auto max-w-6xl px-4 py-24">
          <div className="text-center py-24 bg-muted/20 rounded-xl border-2 border-dashed">
            <GraduationCap className="w-12 h-12 text-muted-foreground mx-auto mb-4 opacity-30" />
            <h3 className="text-xl font-bold">You haven't started any courses yet</h3>
            <p className="text-muted-foreground mt-2 mb-8">Browse our courses and start learning today!</p>
            <Link
              href={`/${locale}/courses`}
              className="inline-flex items-center justify-center bg-primary text-primary-foreground px-6 py-3 font-bold hover:bg-primary/90 transition-all"
            >
              Browse Courses
            </Link>
          </div>
        </div>
      </div>
    )
  }

  // Fetch course details and all sections for these courses
  const [coursesRes, sectionsRes] = await Promise.all([
    supabase
      .from('courses')
      .select('*')
      .in('id', enrolledCourseIds),
    supabase
      .from('course_sections')
      .select('id, course_id')
      .in('course_id', enrolledCourseIds)
  ])

  const courses = coursesRes.data as CourseRow[] | null
  const allSections = sectionsRes.data || []

  // Calculate progress for each course
  const courseProgress = courses?.map(course => {
    const courseSections = allSections.filter((s: any) => s.course_id === course.id)
    const courseSectionIds = courseSections.map((s: any) => s.id)
    const completedSections = progressEntries.filter((p: any) => 
      p.is_completed && courseSectionIds.includes(p.section_id)
    )
    
    const total = courseSections.length
    const completed = completedSections.length
    const percentage = total > 0 ? Math.round((completed / total) * 100) : 0

    return {
      ...course,
      totalSections: total,
      completedSections: completed,
      percentage
    }
  }).sort((a, b) => (b.percentage === 100 ? -1 : 1) - (a.percentage === 100 ? -1 : 1)) // Sort in-progress first?

  return (
    <div className="min-h-screen bg-background">
      {/* ── Hero Section ────────────────────────────────────────────────── */}
      <div className="bg-slate-900 text-white py-16 px-4">
        <div className="container mx-auto max-w-6xl">
          <div className="max-w-2xl space-y-4">
            <h1 className="text-3xl md:text-5xl font-extrabold leading-tight tracking-tight">
              My <span className="text-primary-400">Learning</span>
            </h1>
            <p className="text-slate-300 text-lg md:text-xl leading-relaxed">
              Continue your learning journey and master new skills.
            </p>
          </div>
        </div>
      </div>

      {/* ── Filters & Search Bar ────────────────────────────────────────── */}
      <div className="border-b bg-card/50 backdrop-blur-sm sticky top-0 z-10">
        <div className="container mx-auto max-w-6xl px-4 py-4 flex flex-col md:flex-row gap-4 items-center justify-between">
          <div className="flex items-center gap-4 w-full md:w-auto">
            <div className="relative w-full md:w-80">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
              <input
                type="text"
                placeholder="Search your courses..."
                className="w-full bg-background border rounded-none pl-10 pr-4 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-primary transition-all"
              />
            </div>
            <button className="flex items-center gap-2 px-4 py-2 border font-bold text-sm hover:bg-muted transition-colors">
              <Filter className="w-4 h-4" />
              Filters
            </button>
          </div>
          <p className="text-sm text-muted-foreground font-medium">
            Showing <span className="text-foreground font-bold">{courseProgress?.length ?? 0}</span> courses
          </p>
        </div>
      </div>

      {/* ── Course Grid ──────────────────────────────────────────────────── */}
      <div className="container mx-auto max-w-6xl px-4 py-12">
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-8">
          {courseProgress?.map((course) => (
            <Link
              key={course.id}
              href={`/${locale}/courses/${course.id}`}
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
                
                {/* Progress Overlay if completed */}
                {course.percentage === 100 && (
                  <div className="absolute inset-0 bg-primary/20 backdrop-blur-[2px] flex items-center justify-center">
                    <div className="bg-primary text-white text-[10px] font-bold uppercase tracking-widest px-3 py-1 rounded-full shadow-lg">
                      Completed
                    </div>
                  </div>
                )}
              </div>

              {/* Content */}
              <div className="p-4 flex flex-col flex-1">
                <h3 className="font-bold text-base mb-2 line-clamp-2 group-hover:text-primary transition-colors leading-snug">
                  {course.title}
                </h3>
                
                <div className="mt-auto space-y-3">
                  <div className="space-y-1.5">
                    <div className="flex items-center justify-between text-[10px] font-bold uppercase tracking-tighter">
                      <span className="text-muted-foreground">Progress</span>
                      <span className="text-primary">{course.percentage}%</span>
                    </div>
                    <Progress value={course.percentage} className="h-1.5" />
                  </div>

                  <div className="flex items-center justify-between pt-2 border-t">
                    <div className="flex items-center gap-1">
                      <Star className="w-3 h-3 fill-yellow-400 text-yellow-400" />
                      <span className="text-xs font-bold">4.8</span>
                    </div>
                    <span className="text-[10px] font-bold uppercase tracking-tighter text-muted-foreground flex items-center gap-1.5">
                      <Clock className="w-3 h-3" /> {course.totalSections} micro-lessons
                    </span>
                  </div>
                </div>
              </div>
            </Link>
          ))}
        </div>
      </div>
    </div>
  )
}
