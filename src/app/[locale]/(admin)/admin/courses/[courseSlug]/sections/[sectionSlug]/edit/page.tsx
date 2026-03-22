import { createAdminClient } from '@/lib/supabase/admin'
import { notFound } from 'next/navigation'
import { getLocale } from 'next-intl/server'
import Link from 'next/link'
import { updateSectionAction, upsertQuizAction, deleteQuizAction } from '@/lib/actions/admin'
import { SectionForm } from '@/components/admin/SectionForm'
import { Separator } from '@/components/ui/separator'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { ChevronLeft, HelpCircle, Trash2 } from 'lucide-react'
import type { CourseSectionRow, QuizRow, CourseRow } from '@/types/database'

interface EditSectionPageProps {
  params: Promise<{ courseSlug: string; sectionSlug: string }>
  searchParams: Promise<{ error?: string; success?: string }>
}

export default async function EditSectionPage({ params, searchParams }: EditSectionPageProps) {
  const { courseSlug, sectionSlug } = await params
  const { error, success } = await searchParams
  const locale = await getLocale()
  const db = createAdminClient()

  // First fetch the course by slug
  const { data: course } = await (db.from('courses').select('id, title').eq('slug', courseSlug).single() as any) as { data: Pick<CourseRow, 'id' | 'title'> | null }

  if (!course) notFound()

  const courseId = course.id

  // Then fetch the section by slug and course_id
  const { data: section } = await (db.from('course_sections')
      .select('id, title, yt_video_id, start_time_seconds, end_time_seconds, text_summary, order_index')
      .eq('slug', sectionSlug)
      .eq('course_id', courseId)
      .single() as any) as { data: (Pick<CourseSectionRow, 'id' | 'title' | 'yt_video_id' | 'start_time_seconds' | 'end_time_seconds' | 'text_summary' | 'order_index'>) | null }

  if (!section) notFound()

  const sectionId = section.id

  const { data: quiz } = await (db.from('quizzes')
      .select('id, question_text, options_json, correct_answer_index')
      .eq('section_id', sectionId)
      .maybeSingle() as any) as { data: Pick<QuizRow, 'id' | 'question_text' | 'options_json' | 'correct_answer_index'> | null }

  const options = (quiz?.options_json ?? ['', '', '', '']) as string[]

  return (
    <div className="p-6 max-w-2xl mx-auto space-y-6">
      <div>
        <Link
          href={`/${locale}/admin/courses/${courseSlug}`}
          className="inline-flex items-center gap-1 text-sm text-muted-foreground hover:text-foreground mb-4 transition-colors"
        >
          <ChevronLeft className="w-4 h-4" /> {course.title}
        </Link>
        <h1 className="text-xl font-bold">Edit lesson</h1>
      </div>

      {error && (
        <div className="rounded-lg bg-destructive/10 border border-destructive/20 px-4 py-3 text-sm text-destructive">
          {decodeURIComponent(error)}
        </div>
      )}
      {success && (
        <div className="rounded-lg bg-green-50 border border-green-200 px-4 py-3 text-sm text-green-700">
          {decodeURIComponent(success)}
        </div>
      )}

      {/* Section form */}
      <SectionForm
        locale={locale}
        courseId={courseId}
        sectionId={sectionId}
        defaults={{
          title: section.title,
          yt_video_id: section.yt_video_id,
          start_time_seconds: section.start_time_seconds,
          end_time_seconds: section.end_time_seconds,
          text_summary: section.text_summary ?? '',
          order_index: section.order_index,
        }}
        action={updateSectionAction}
        submitLabel="Save changes"
        cancelHref={`/${locale}/admin/courses/${courseSlug}`}
      />

      {/* ── Quiz ────────────────────────────────────────────────────────── */}
      <section className="rounded-xl border bg-background p-6 space-y-5">
        <div className="flex items-center justify-between">
          <h2 className="text-sm font-semibold flex items-center gap-2">
            <HelpCircle className="w-4 h-4 text-orange-500" />
            Quiz question
            {quiz && <span className="text-xs bg-green-100 text-green-700 font-medium px-2 py-0.5 rounded-full">Saved</span>}
          </h2>
          {quiz && (
            <form action={deleteQuizAction}>
              <input type="hidden" name="locale" value={locale} />
              <input type="hidden" name="courseId" value={courseId} />
              <input type="hidden" name="sectionId" value={sectionId} />
              <button type="submit" className="inline-flex items-center gap-1 text-xs text-destructive hover:underline">
                <Trash2 className="w-3.5 h-3.5" /> Remove quiz
              </button>
            </form>
          )}
        </div>
        <Separator />

        <form action={upsertQuizAction} className="space-y-5">
          <input type="hidden" name="locale" value={locale} />
          <input type="hidden" name="courseId" value={courseId} />
          <input type="hidden" name="sectionId" value={sectionId} />

          <div className="space-y-1.5">
            <Label htmlFor="question_text">Question <span className="text-destructive">*</span></Label>
            <Input
              id="question_text"
              name="question_text"
              defaultValue={quiz?.question_text ?? ''}
              placeholder="What does this concept do?"
              required
            />
          </div>

          <div className="space-y-3">
            <Label>Answer options</Label>
            {[0, 1, 2, 3].map((i) => (
              <div key={i} className="flex items-center gap-3">
                <input
                  type="radio"
                  name="correct_answer_index"
                  value={String(i)}
                  id={`correct_${i}`}
                  defaultChecked={quiz?.correct_answer_index === i}
                  className="w-4 h-4 accent-primary"
                  required={i === 0}
                />
                <Input
                  name={`option_${i}`}
                  defaultValue={options[i] ?? ''}
                  placeholder={`Option ${i + 1}`}
                  className="flex-1"
                  required
                />
                <label htmlFor={`correct_${i}`} className="text-xs text-muted-foreground w-16 shrink-0">
                  {quiz?.correct_answer_index === i ? '✓ correct' : ''}
                </label>
              </div>
            ))}
            <p className="text-xs text-muted-foreground">
              Select the radio button next to the correct answer.
            </p>
          </div>

          <div className="flex justify-end pt-2 border-t">
            <button
              type="submit"
              className="bg-primary text-white text-sm font-semibold px-5 py-2 rounded-lg hover:bg-primary/90 transition-colors"
            >
              {quiz ? 'Update quiz' : 'Save quiz'}
            </button>
          </div>
        </form>
      </section>
    </div>
  )
}
