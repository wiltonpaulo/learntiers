import { createAdminClient } from '@/lib/supabase/admin'
import { notFound } from 'next/navigation'
import { getLocale } from 'next-intl/server'
import Link from 'next/link'
import { createSectionAction } from '@/lib/actions/admin'
import { SectionForm } from '@/components/admin/SectionForm'
import { ChevronLeft } from 'lucide-react'
import type { CourseRow } from '@/types/database'

interface NewSectionPageProps {
  params: Promise<{ courseId: string }>
  searchParams: Promise<{ error?: string }>
}

export default async function NewSectionPage({ params, searchParams }: NewSectionPageProps) {
  const { courseId } = await params
  const { error } = await searchParams
  const locale = await getLocale()
  const db = createAdminClient()

  const { data } = await db.from('courses').select('id, title').eq('id', courseId).single()
  const course = data as Pick<CourseRow, 'id' | 'title'> | null

  if (!course) notFound()

  return (
    <div className="p-6 max-w-2xl mx-auto space-y-6">
      <div>
        <Link
          href={`/${locale}/admin/courses/${courseId}`}
          className="inline-flex items-center gap-1 text-sm text-muted-foreground hover:text-foreground mb-4 transition-colors"
        >
          <ChevronLeft className="w-4 h-4" /> {course.title}
        </Link>
        <h1 className="text-xl font-bold">Add lesson</h1>
        <p className="text-sm text-muted-foreground mt-0.5">
          Paste a YouTube video ID and define the exact slice (start → end seconds).
        </p>
      </div>

      {error && (
        <div className="rounded-lg bg-destructive/10 border border-destructive/20 px-4 py-3 text-sm text-destructive">
          {decodeURIComponent(error)}
        </div>
      )}

      <SectionForm
        locale={locale}
        courseId={courseId}
        action={createSectionAction}
        submitLabel="Add lesson"
        cancelHref={`/${locale}/admin/courses/${courseId}`}
      />
    </div>
  )
}
