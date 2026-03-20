import { createClient } from '@/lib/supabase/server'
import { notFound, redirect } from 'next/navigation'
import Link from 'next/link'
import { getLocale } from 'next-intl/server'
import { SectionView, TranscriptSegment } from '@/components/course/SectionView'
import { SectionLayoutClient } from '@/components/course/SectionLayoutClient'
import { TakeawaysSidebar } from '@/components/course/TakeawaysSidebar'
import { CheckCircle2, Circle, ChevronLeft, PlayCircle, Clock } from 'lucide-react'
import type { CourseSectionRow, QuizRow, UserProgressRow, CourseRow } from '@/types/database'
import { resolveTranscript } from '@/lib/transcript'

interface SectionPageProps {
  params: Promise<{ courseId: string; sectionId: string }>
}

export default async function SectionPage({ params }: SectionPageProps) {
  const { sectionId, courseId } = await params
  const locale = await getLocale()
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()

  if (!user) {
    const currentPath = `/${locale}/courses/${courseId}/sections/${sectionId}`
    const loginMessage = encodeURIComponent('Please log in or create an account to view this lesson.')
    redirect(`/${locale}/login?message=${loginMessage}&next=${encodeURIComponent(currentPath)}`)
  }

  const [courseRes, sectionRes, allSectionsRes, quizRes, progressRes, settingsRes] = await Promise.all([
    supabase
      .from('courses')
      .select('id, title, transcript, youtube_channel_name, youtube_channel_url')
      .eq('id', courseId)
      .single(),
    supabase
      .from('course_sections')
      .select('id, title, yt_video_id, start_time_seconds, end_time_seconds, text_summary, order_index, key_takeaways, playground_code')
      .eq('id', sectionId)
      .eq('course_id', courseId)
      .single(),
    supabase
      .from('course_sections')
      .select('id, title, order_index, end_time_seconds, start_time_seconds')
      .eq('course_id', courseId)
      .order('order_index', { ascending: true }),
    supabase
      .from('quizzes')
      .select('id, question_text, options_json, correct_answer_index')
      .eq('section_id', sectionId)
      .maybeSingle(),
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

  const course = courseRes.data as Pick<CourseRow, 'id' | 'title' | 'transcript' | 'youtube_channel_name' | 'youtube_channel_url'> | null
  const section = sectionRes.data as Pick<
    CourseSectionRow,
    'id' | 'title' | 'yt_video_id' | 'start_time_seconds' | 'end_time_seconds' | 'text_summary' | 'order_index' | 'key_takeaways' | 'playground_code'
  > | null
  const allSections = (allSectionsRes.data ?? []) as Pick<
    CourseSectionRow,
    'id' | 'title' | 'order_index' | 'end_time_seconds' | 'start_time_seconds'
  >[]
  const quiz = quizRes.data as Pick<
    QuizRow,
    'id' | 'question_text' | 'options_json' | 'correct_answer_index'
  > | null
  const progress = (progressRes.data ?? []) as Pick<UserProgressRow, 'section_id' | 'is_completed'>[]
  const settings = settingsRes.data as { last_section_id: string; last_time_seconds: number } | null

  if (!section || !course) notFound()

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
      className="px-6 py-3 border-b text-sm flex items-center gap-2"
      style={{ backgroundColor: 'var(--nav-bg)' }}
    >
      <Link
        href={`/${locale}/courses/${courseId}`}
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
    <div className="divide-y">
      {allSections.map((s) => {
        const done = completedSet.has(s.id)
        const isCurrent = s.id === sectionId
        const duration = s.end_time_seconds - s.start_time_seconds

        return (
          <Link
            key={s.id}
            href={`/${locale}/courses/${courseId}/sections/${s.id}`}
            className={`flex items-start gap-3 px-4 py-3.5 transition-colors group ${
              isCurrent ? 'bg-primary/10' : 'hover:bg-muted/50'
            }`}
          >
            {/* Icon */}
            <div className="mt-0.5 shrink-0">
              {done ? (
                <CheckCircle2 className="w-4 h-4 text-primary" />
              ) : isCurrent ? (
                <PlayCircle className="w-4 h-4 text-primary" />
              ) : (
                <Circle className="w-4 h-4 text-muted-foreground/40 group-hover:text-foreground" />
              )}
            </div>

            {/* Title + Duration */}
            <div className="flex-1 min-w-0">
              <p
                className={`text-sm truncate ${
                  isCurrent ? 'font-semibold text-primary' : 'group-hover:text-foreground'
                }`}
              >
                {s.title}
              </p>
              <div className="flex items-center gap-1.5 text-xs text-muted-foreground mt-1">
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
      redirect(`/${locale}/courses/${courseId}/sections/${nextSection.id}`)
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
      nextSection={nextSection ? { id: nextSection.id, title: nextSection.title } : null}
    >
      <SectionView
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
        <div className="rounded-xl border border-amber-500/30 bg-amber-500/5 p-6 flex flex-col items-center text-center gap-4 mt-8">
          <div className="space-y-1">
            <p className="text-amber-600 dark:text-amber-500 font-bold flex items-center justify-center gap-2">
              <CheckCircle2 className="w-5 h-5" />
              You've reached the end!
            </p>
            <p className="text-sm text-muted-foreground">Complete this final lesson to claim your certificate.</p>
          </div>
          <Link
            href={`/${locale}/courses/${courseId}`}
            className="flex items-center gap-1.5 bg-amber-500 text-white text-sm font-bold px-6 py-3 rounded-lg hover:bg-amber-600 transition-all shadow-lg shadow-amber-500/20"
          >
            Finish Course
          </Link>
        </div>
      )}
    </SectionLayoutClient>
  )
}