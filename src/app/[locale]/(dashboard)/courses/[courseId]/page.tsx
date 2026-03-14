import { createClient } from '@/lib/supabase/server'
import { notFound } from 'next/navigation'
import { Badge } from '@/components/ui/badge'
import Link from 'next/link'
import { getLocale } from 'next-intl/server'
import type { CourseRow, CourseSectionRow } from '@/types/database'

interface CourseDetailPageProps {
  params: Promise<{ courseId: string; locale: string }>
}

/**
 * Course detail page — Server Component.
 * Lists all sections (micro-lessons) for a course.
 */
export default async function CourseDetailPage({ params }: CourseDetailPageProps) {
  const { courseId } = await params
  const locale = await getLocale()
  const supabase = await createClient()

  const [courseRes, sectionsRes] = await Promise.all([
    supabase
      .from('courses')
      .select('id, title, description, cover_image_url')
      .eq('id', courseId)
      .single(),
    supabase
      .from('course_sections')
      .select('id, title, yt_video_id, start_time_seconds, end_time_seconds, text_summary, order_index')
      .eq('course_id', courseId)
      .order('order_index', { ascending: true }),
  ])

  const course = courseRes.data as Pick<CourseRow, 'id' | 'title' | 'description' | 'cover_image_url'> | null
  const sections = sectionsRes.data as CourseSectionRow[] | null

  if (!course) notFound()

  return (
    <div className="max-w-3xl mx-auto space-y-8">
      <div>
        <h1 className="text-3xl font-bold">{course.title}</h1>
        {course.description && (
          <p className="mt-2 text-muted-foreground">{course.description}</p>
        )}
      </div>

      <section>
        <h2 className="text-xl font-semibold mb-4">Sections</h2>
        {sections && sections.length > 0 ? (
          <ol className="space-y-3">
            {sections.map((section, index) => (
              <li key={section.id}>
                <Link
                  href={`/${locale}/courses/${courseId}/sections/${section.id}`}
                  className="flex items-start gap-4 rounded-xl border p-4 hover:bg-muted/50 transition-colors"
                >
                  <span className="flex-shrink-0 w-8 h-8 rounded-full bg-primary/10 text-primary text-sm font-bold flex items-center justify-center">
                    {index + 1}
                  </span>
                  <div className="flex-1 min-w-0">
                    <p className="font-medium truncate">{section.title}</p>
                    <p className="text-xs text-muted-foreground mt-1">
                      {formatDuration(section.end_time_seconds - section.start_time_seconds)}
                    </p>
                    {section.text_summary && (
                      <p className="text-sm text-muted-foreground mt-1 line-clamp-2">
                        {section.text_summary}
                      </p>
                    )}
                  </div>
                  <Badge variant="outline" className="flex-shrink-0">
                    Watch
                  </Badge>
                </Link>
              </li>
            ))}
          </ol>
        ) : (
          <p className="text-muted-foreground">No sections yet.</p>
        )}
      </section>
    </div>
  )
}

function formatDuration(seconds: number): string {
  const m = Math.floor(seconds / 60)
  const s = seconds % 60
  return `${m}m ${s}s`
}
