import { createClient } from '@/lib/supabase/server'
import { notFound } from 'next/navigation'
import Link from 'next/link'
import { getLocale } from 'next-intl/server'
import { SectionView } from '@/components/course/SectionView'
import { ScrollArea } from '@/components/ui/scroll-area'
import { CheckCircle2, Circle, ChevronLeft, PlayCircle } from 'lucide-react'
import type { CourseSectionRow, QuizRow, UserProgressRow, CourseRow } from '@/types/database'

interface SectionPageProps {
  params: Promise<{ courseId: string; sectionId: string }>
}

export default async function SectionPage({ params }: SectionPageProps) {
  const { sectionId, courseId } = await params
  const locale = await getLocale()
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()

  const [courseRes, sectionRes, allSectionsRes, quizRes, progressRes] = await Promise.all([
    supabase
      .from('courses')
      .select('id, title')
      .eq('id', courseId)
      .single(),
    supabase
      .from('course_sections')
      .select('id, title, yt_video_id, start_time_seconds, end_time_seconds, text_summary, order_index')
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
  ])

  const course = courseRes.data as Pick<CourseRow, 'id' | 'title'> | null
  const section = sectionRes.data as Pick<
    CourseSectionRow,
    'id' | 'title' | 'yt_video_id' | 'start_time_seconds' | 'end_time_seconds' | 'text_summary' | 'order_index'
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

  if (!section || !course) notFound()

  const completedSet = new Set(progress.filter((p) => p.is_completed).map((p) => p.section_id))
  const currentIndex = allSections.findIndex((s) => s.id === sectionId)
  const nextSection = allSections[currentIndex + 1] ?? null

  return (
    <div className="flex flex-col lg:flex-row min-h-[calc(100vh-3.5rem)]">

      {/* ── Main content ──────────────────────────────────────────────────── */}
      <div className="flex-1 min-w-0">
        {/* Breadcrumb */}
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

        {/* Player + content */}
        <div className="p-6 max-w-3xl space-y-6">
          <SectionView
            sectionId={section.id}
            ytVideoId={section.yt_video_id}
            startTimeSeconds={section.start_time_seconds}
            endTimeSeconds={section.end_time_seconds}
            textSummary={section.text_summary}
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
            initiallyCompleted={completedSet.has(section.id)}
          />

          {/* Next lesson CTA */}
          {nextSection && (
            <div className="rounded-xl border bg-muted/30 p-4 flex items-center justify-between gap-4">
              <div className="min-w-0">
                <p className="text-xs text-muted-foreground mb-0.5">Up next</p>
                <p className="text-sm font-semibold truncate">{nextSection.title}</p>
              </div>
              <Link
                href={`/${locale}/courses/${courseId}/sections/${nextSection.id}`}
                className="shrink-0 flex items-center gap-1.5 bg-primary text-white text-sm font-medium px-4 py-2 rounded-lg hover:bg-primary/90 transition-colors"
              >
                <PlayCircle className="w-4 h-4" />
                Next
              </Link>
            </div>
          )}
        </div>
      </div>

      {/* ── Course outline sidebar ─────────────────────────────────────────── */}
      <aside className="lg:w-80 shrink-0 border-l bg-background">
        <div
          className="px-4 py-3 border-b"
          style={{ backgroundColor: 'var(--nav-bg)' }}
        >
          <p className="text-xs font-semibold text-white/60 uppercase tracking-wider">Course content</p>
          <p className="text-sm font-bold text-white mt-0.5">
            {completedSet.size} / {allSections.length} completed
          </p>
        </div>

        <ScrollArea className="h-[calc(100vh-3.5rem-4.5rem)]">
          <div className="divide-y">
            {allSections.map((s, index) => {
              const done = completedSet.has(s.id)
              const isCurrent = s.id === sectionId
              const duration = s.end_time_seconds - s.start_time_seconds

              return (
                <Link
                  key={s.id}
                  href={`/${locale}/courses/${courseId}/sections/${s.id}`}
                  className={`flex items-start gap-3 px-4 py-3.5 transition-colors group
                    ${isCurrent ? 'bg-primary/5 border-l-2 border-primary' : 'hover:bg-muted/50'}`}
                >
                  {/* Icon */}
                  <div className="mt-0.5 shrink-0">
                    {done
                      ? <CheckCircle2 className="w-4 h-4 text-primary" />
                      : isCurrent
                        ? <PlayCircle className="w-4 h-4 text-primary" />
                        : <Circle className="w-4 h-4 text-muted-foreground/30" />
                    }
                  </div>

                  {/* Text */}
                  <div className="flex-1 min-w-0">
                    <p className={`text-xs mb-0.5 ${isCurrent ? 'text-primary font-semibold' : 'text-muted-foreground'}`}>
                      Lesson {index + 1}
                    </p>
                    <p className={`text-sm leading-snug line-clamp-2
                      ${isCurrent ? 'font-semibold text-foreground' : 'text-foreground/80 group-hover:text-foreground'}`}>
                      {s.title}
                    </p>
                    <p className="text-xs text-muted-foreground mt-1">
                      {formatMins(duration)}
                    </p>
                  </div>
                </Link>
              )
            })}
          </div>
        </ScrollArea>
      </aside>
    </div>
  )
}

function formatMins(seconds: number): string {
  const m = Math.floor(seconds / 60)
  const s = seconds % 60
  return `${m}:${String(s).padStart(2, '0')}`
}
