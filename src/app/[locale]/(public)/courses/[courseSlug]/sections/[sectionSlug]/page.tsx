import { createClient } from '@/lib/supabase/server'
import { notFound, redirect } from 'next/navigation'
import Link from 'next/link'
import { getLocale } from 'next-intl/server'
import { SectionView, TranscriptSegment } from '@/components/course/SectionView'
import { SectionLayoutClient } from '@/components/course/SectionLayoutClient'
import type { CourseRow, CourseSectionRow, QuizRow, UserProgressRow } from '@/types/database'
import { resolveTranscript } from '@/lib/transcript'
import { 
  ChevronLeft, 
  PlayCircle, 
  CheckCircle2, 
  Circle, 
  Clock 
} from 'lucide-react'

interface SectionPageProps {
  params: Promise<{ courseSlug: string; sectionSlug: string }>
}

export default async function SectionPage({ params }: SectionPageProps) {
  const { sectionSlug, courseSlug } = await params
  const locale = await getLocale()
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()

  if (!user) {
    const currentPath = `/${locale}/courses/${courseSlug}/sections/${sectionSlug}`
    const loginMessage = encodeURIComponent('Please log in or create an account to view this lesson.')
    redirect(`/?auth=login&message=${loginMessage}&next=${encodeURIComponent(currentPath)}`)
  }

  // First fetch the course by slug to get its ID
  const { data: courseData } = await (supabase
    .from('courses')
    .select('id, title, transcript, youtube_channel_name, youtube_channel_url')
    .eq('slug', courseSlug)
    .single() as any) as { data: Pick<CourseRow, 'id' | 'title' | 'transcript' | 'youtube_channel_name' | 'youtube_channel_url'> | null }

  if (!courseData) notFound()

  const courseId = courseData.id

  const [sectionRes, allSectionsRes, progressRes, settingsRes] = await Promise.all([
    supabase
      .from('course_sections')
      .select('id, slug, title, yt_video_id, start_time_seconds, end_time_seconds, text_summary, order_index, key_takeaways, playground_code')
      .eq('slug', sectionSlug)
      .eq('course_id', courseId)
      .single(),
    supabase
      .from('course_sections')
      .select('id, slug, title, order_index, end_time_seconds, start_time_seconds')
      .eq('course_id', courseId)
      .order('order_index', { ascending: true }),
    user
      ? supabase
          .from('user_progress')
          .select('section_id, is_completed')
          .eq('user_id', user.id)
      : Promise.resolve({ data: [] }),
    user
      ? supabase
          .from('user_course_settings')
          .select('last_section_id, last_time_seconds')
          .eq('user_id', user.id)
          .eq('course_id', courseId)
          .maybeSingle()
      : Promise.resolve({ data: null }),
  ])

  const section = sectionRes.data as (Pick<
    CourseSectionRow,
    'id' | 'title' | 'yt_video_id' | 'start_time_seconds' | 'end_time_seconds' | 'text_summary' | 'order_index' | 'key_takeaways' | 'playground_code'
  > & { slug: string }) | null

  if (!section) notFound()

  const sectionId = section.id

  // Fetch quiz for this section specifically now that we have sectionId
  const { data: quiz } = await (supabase
      .from('quizzes')
      .select('id, question_text, options_json, correct_answer_index')
      .eq('section_id', sectionId)
      .maybeSingle() as any) as { data: Pick<QuizRow, 'id' | 'question_text' | 'options_json' | 'correct_answer_index'> | null }

  const course = courseData
  const allSections = (allSectionsRes.data ?? []) as (Pick<
    CourseSectionRow,
    'id' | 'title' | 'order_index' | 'end_time_seconds' | 'start_time_seconds'
  > & { slug: string })[]
  const progress = (progressRes.data ?? []) as Pick<UserProgressRow, 'section_id' | 'is_completed'>[]
  const settings = settingsRes.data as { last_section_id: string; last_time_seconds: number } | null

  // Use the saved time only if it's the SAME section
  const initialSavedTime = (settings?.last_section_id === sectionId) ? settings.last_time_seconds : null

  // Resolve transcript (could be URL or pre-parsed JSON)
  const transcript = await resolveTranscript(course.transcript)

  // Filter progress to only include sections that belong to THIS course
  const sectionIds = new Set(allSections.map((s) => s.id))
  const completedSet = new Set(
    progress
      .filter((p) => p.is_completed && sectionIds.has(p.section_id))
      .map((p) => p.section_id)
  )

  const currentIndex = allSections.findIndex((s) => s.id === sectionId)
  const nextSection = allSections[currentIndex + 1] ?? null

  const header = (
    <div
      className="px-6 py-3 border-b text-sm flex items-center gap-2 bg-[#1c1d1f]"
    >
      <Link
        href={`/${locale}/courses/${courseSlug}`}
        className="text-white/60 hover:text-white transition-colors flex items-center gap-1"
      >
        <ChevronLeft className="w-3.5 h-3.5" />
        {course.title}
      </Link>
      <span className="text-white/30">/</span>
      <span className="text-white/90 font-medium truncate">{section.title}</span>
    </div>
  )

  const sidebar = (
    <div className="divide-y divide-slate-100">
      {allSections.map((s) => {
        const done = completedSet.has(s.id)
        const isCurrent = s.id === sectionId
        const duration = s.end_time_seconds - s.start_time_seconds

        return (
          <Link
            key={s.id}
            href={`/${locale}/courses/${courseSlug}/sections/${s.slug}`}
            data-current={isCurrent ? "true" : undefined}
            className={`flex items-start gap-3 px-4 py-3.5 transition-colors group ${
              isCurrent ? 'bg-purple-50' : 'bg-white hover:bg-slate-50'
            }`}
          >
            {/* Icon */}
            <div className="mt-0.5 shrink-0">
              {done ? (
                <CheckCircle2 className="w-4 h-4 text-emerald-600" />
              ) : isCurrent ? (
                <PlayCircle className="w-4 h-4 text-purple-600" />
              ) : (
                <Circle className="w-4 h-4 text-slate-300 group-hover:text-slate-400" />
              )}
            </div>

            {/* Title + Duration */}
            <div className="flex-1 min-w-0">
              <p
                className={`text-sm truncate ${
                  isCurrent ? 'font-bold text-purple-600' : 'text-slate-700 group-hover:text-slate-900 font-medium'
                }`}
              >
                {s.title}
              </p>
              <div className={`flex items-center gap-1.5 text-[10px] font-bold mt-1 tracking-wider ${isCurrent ? 'text-purple-600/70' : 'text-slate-500'}`}>
                <Clock className="w-3 h-3" />
                <span>{Math.round(duration / 60)} min</span>
              </div>
            </div>
          </Link>
        )
      })}
    </div>
  )

  // Use a redirect logic for the Next button inside SectionView
  const nextSectionAction = async () => {
    'use server'
    if (nextSection) {
      redirect(`/${locale}/courses/${courseSlug}/sections/${nextSection.slug}`)
    }
  }

  return (
    <SectionLayoutClient
      sectionId={section.id}
      header={header}
      sidebar={sidebar}
      completedCount={completedSet.size}
      totalCount={allSections.length}
      transcript={transcript as any[]}
      playgroundCode={section.playground_code}
      courseTitle={course.title}
      sectionTitle={section.title}
      ytVideoId={section.yt_video_id}
      startTimeSeconds={section.start_time_seconds}
      youtubeChannelName={course.youtube_channel_name}
      youtubeChannelUrl={course.youtube_channel_url}
      nextSection={nextSection ? { id: nextSection.id, title: nextSection.title, slug: nextSection.slug } : null}
    >
      <SectionView
        courseId={courseId}
        courseSlug={courseSlug}
        sectionId={section.id}
        ytVideoId={section.yt_video_id}
        startTimeSeconds={section.start_time_seconds}
        endTimeSeconds={section.end_time_seconds}
        textSummary={section.text_summary}
        transcript={transcript}
        playgroundCode={section.playground_code}
        quiz={
          quiz
            ? {
                id: quiz.id,
                questionText: quiz.question_text,
                options: quiz.options_json as string[],
                correctAnswerIndex: quiz.correct_answer_index,
              }
            : null
        }
        initialTakeaways={section.key_takeaways as string[]}
        initiallyCompleted={completedSet.has(section.id)}
        initialSavedTime={initialSavedTime}
        onNextSection={nextSection ? nextSectionAction : undefined}
      />

      {/* Simple end of section indicator */}
      {!nextSection && (
        <div className="rounded-2xl border border-purple-200 bg-purple-50 p-8 flex flex-col items-center text-center gap-4 mt-8 shadow-xl shadow-purple-100/50">
          <div className="space-y-1">
            <p className="text-purple-600 font-black text-lg flex items-center justify-center gap-2">
              <CheckCircle2 className="w-6 h-6" />
              You've reached the end!
            </p>
            <p className="text-sm text-slate-500 font-medium max-w-xs">Complete this final lesson to claim your verified certificate.</p>
          </div>
          <Link
            href={`/${locale}/courses/${courseSlug}/completed`}
            className="flex items-center gap-2 bg-purple-600 text-white text-sm font-black px-8 py-3.5 rounded-xl hover:bg-purple-700 transition-all shadow-xl shadow-purple-200 active:scale-95"
          >
            FINISH COURSE
          </Link>
        </div>
      )}
    </SectionLayoutClient>
  )
}
