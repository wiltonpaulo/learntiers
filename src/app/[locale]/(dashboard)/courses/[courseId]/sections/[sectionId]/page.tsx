import { createClient } from '@/lib/supabase/server'
import { notFound } from 'next/navigation'
import { SlicedYouTubePlayer } from '@/components/player/SlicedYouTubePlayer'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import type { CourseSectionRow, QuizRow } from '@/types/database'

interface SectionPageProps {
  params: Promise<{ courseId: string; sectionId: string }>
}

/**
 * Section page — the core learning screen.
 *
 * Architecture note:
 *  - Data fetching happens in this Server Component (no useEffect, no loading states).
 *  - SlicedYouTubePlayer is a Client Component — imported and rendered here.
 *  - When the player fires onSectionEnd, the quiz UI will be revealed (next iteration).
 */
export default async function SectionPage({ params }: SectionPageProps) {
  const { sectionId, courseId } = await params
  const supabase = await createClient()

  const [sectionRes, quizRes] = await Promise.all([
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
  ])

  const section = sectionRes.data as Pick<
    CourseSectionRow,
    'id' | 'title' | 'yt_video_id' | 'start_time_seconds' | 'end_time_seconds' | 'text_summary'
  > | null

  const quiz = quizRes.data as Pick<
    QuizRow,
    'id' | 'question_text' | 'options_json' | 'correct_answer_index'
  > | null

  if (!section) notFound()

  return (
    <div className="max-w-3xl mx-auto space-y-6">
      <h1 className="text-2xl font-bold">{section.title}</h1>

      {/* ★ The sliced player — core business rule enforced here */}
      <SlicedYouTubePlayer
        ytVideoId={section.yt_video_id}
        startTimeSeconds={section.start_time_seconds}
        endTimeSeconds={section.end_time_seconds}
        onSectionEnd={() => {
          'use client'
          // TODO: flip quiz visibility state (extract to a client wrapper component)
        }}
      />

      {/* Text summary */}
      {section.text_summary && (
        <Card>
          <CardHeader>
            <CardTitle className="text-base">Summary</CardTitle>
          </CardHeader>
          <CardContent>
            <p className="text-sm text-muted-foreground leading-relaxed">
              {section.text_summary}
            </p>
          </CardContent>
        </Card>
      )}

      {/* Quiz placeholder — will become a <QuizCard> component */}
      {quiz && (
        <Card className="border-dashed">
          <CardHeader>
            <CardTitle className="text-base">Quick Quiz</CardTitle>
          </CardHeader>
          <CardContent>
            <p className="text-sm text-muted-foreground">
              Finish watching the section to unlock the quiz.
            </p>
          </CardContent>
        </Card>
      )}
    </div>
  )
}
