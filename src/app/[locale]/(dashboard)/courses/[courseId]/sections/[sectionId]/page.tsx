import { createClient } from '@/lib/supabase/server'
import { notFound } from 'next/navigation'
import { SectionView } from '@/components/course/SectionView'
import type { CourseSectionRow, QuizRow, UserProgressRow } from '@/types/database'

interface SectionPageProps {
  params: Promise<{ courseId: string; sectionId: string }>
}

/**
 * Section page — Server Component.
 *
 * Responsibilities:
 *  1. Fetch section data, quiz and existing user progress in parallel.
 *  2. Pass everything to <SectionView> (Client Component) which owns
 *     the watch → quiz → complete state machine.
 */
export default async function SectionPage({ params }: SectionPageProps) {
  const { sectionId, courseId } = await params
  const supabase = await createClient()

  const { data: { user } } = await supabase.auth.getUser()

  const [sectionRes, quizRes, progressRes] = await Promise.all([
    supabase
      .from('course_sections')
      .select('id, title, yt_video_id, start_time_seconds, end_time_seconds, text_summary')
      .eq('id', sectionId)
      .eq('course_id', courseId)
      .single(),

    supabase
      .from('quizzes')
      .select('id, question_text, options_json, correct_answer_index')
      .eq('section_id', sectionId)
      .maybeSingle(),

    user
      ? supabase
          .from('user_progress')
          .select('is_completed, quiz_score')
          .eq('user_id', user.id)
          .eq('section_id', sectionId)
          .maybeSingle()
      : Promise.resolve({ data: null }),
  ])

  const section = sectionRes.data as Pick<
    CourseSectionRow,
    'id' | 'title' | 'yt_video_id' | 'start_time_seconds' | 'end_time_seconds' | 'text_summary'
  > | null

  const quiz = quizRes.data as Pick<
    QuizRow,
    'id' | 'question_text' | 'options_json' | 'correct_answer_index'
  > | null

  const progress = progressRes.data as Pick<UserProgressRow, 'is_completed' | 'quiz_score'> | null

  if (!section) notFound()

  return (
    <div className="max-w-3xl mx-auto space-y-6">
      <h1 className="text-2xl font-bold">{section.title}</h1>

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
        initiallyCompleted={progress?.is_completed ?? false}
      />
    </div>
  )
}
