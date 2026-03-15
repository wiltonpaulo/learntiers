import { createAdminClient } from '@/lib/supabase/admin'
import { notFound } from 'next/navigation'
import Link from 'next/link'
import { getLocale } from 'next-intl/server'
import { updateCourseAction, deleteSectionAction } from '@/lib/actions/admin'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Textarea } from '@/components/ui/textarea'
import { Separator } from '@/components/ui/separator'
import { ChevronLeft, Plus, Pencil, Trash2, GripVertical, Clock, ExternalLink } from 'lucide-react'
import type { CourseSectionRow, CourseRow } from '@/types/database'

interface CourseEditPageProps {
  params: Promise<{ courseId: string }>
  searchParams: Promise<{ error?: string; success?: string }>
}

export default async function CourseEditPage({ params, searchParams }: CourseEditPageProps) {
  const { courseId } = await params
  const { error, success } = await searchParams
  const locale = await getLocale()
  const db = createAdminClient()

  const [courseRes, sectionsRes] = await Promise.all([
    db.from('courses').select('id, title, description, cover_image_url').eq('id', courseId).single(),
    db.from('course_sections')
      .select('id, title, yt_video_id, start_time_seconds, end_time_seconds, order_index')
      .eq('course_id', courseId)
      .order('order_index', { ascending: true }),
  ])

  const course = courseRes.data as Pick<CourseRow, 'id' | 'title' | 'description' | 'cover_image_url'> | null
  const sections = (sectionsRes.data ?? []) as Pick<
    CourseSectionRow,
    'id' | 'title' | 'yt_video_id' | 'start_time_seconds' | 'end_time_seconds' | 'order_index'
  >[]

  if (!course) notFound()

  return (
    <div className="p-6 max-w-3xl mx-auto space-y-8">
      {/* Breadcrumb */}
      <div>
        <Link
          href={`/${locale}/admin/courses`}
          className="inline-flex items-center gap-1 text-sm text-muted-foreground hover:text-foreground mb-4 transition-colors"
        >
          <ChevronLeft className="w-4 h-4" /> Courses
        </Link>
        <div className="flex items-center justify-between">
          <h1 className="text-xl font-bold">Edit course</h1>
          <Link
            href={`/${locale}/courses/${courseId}`}
            target="_blank"
            className="inline-flex items-center gap-1.5 text-xs text-muted-foreground hover:text-primary transition-colors"
          >
            <ExternalLink className="w-3.5 h-3.5" />
            Preview
          </Link>
        </div>
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

      {/* ── Course details form ──────────────────────────────────────────── */}
      <section className="rounded-xl border bg-background p-6 space-y-5">
        <h2 className="text-sm font-semibold">Course details</h2>
        <Separator />

        <form action={updateCourseAction} className="space-y-5" encType="multipart/form-data">
          <input type="hidden" name="locale" value={locale} />
          <input type="hidden" name="courseId" value={courseId} />

          <div className="space-y-1.5">
            <Label htmlFor="title">Title <span className="text-destructive">*</span></Label>
            <Input id="title" name="title" defaultValue={course.title} required />
          </div>

          <div className="space-y-1.5">
            <Label htmlFor="description">Description</Label>
            <Textarea id="description" name="description" defaultValue={course.description ?? ''} rows={3} />
          </div>

          <div className="space-y-1.5">
            <Label htmlFor="cover_image_url">Cover image URL</Label>
            <Input
              id="cover_image_url"
              name="cover_image_url"
              type="url"
              defaultValue={course.cover_image_url ?? ''}
              placeholder="https://img.youtube.com/vi/VIDEO_ID/maxresdefault.jpg"
            />
          </div>

          <div className="space-y-1.5 pt-2">
            <Label htmlFor="transcript_file" className="flex items-center gap-2">
              <span className="w-2 h-2 rounded-full bg-blue-500" />
              Full Course Transcript <span className="text-muted-foreground text-xs font-normal">(optional, .srt or .vtt)</span>
            </Label>
            <Input 
              id="transcript_file" 
              name="transcript_file" 
              type="file" 
              accept=".srt,.vtt"
              className="cursor-pointer bg-background" 
            />
            <p className="text-[11px] text-muted-foreground">
              Uploading a new file will overwrite the existing synchronized transcript for this course.
            </p>
          </div>

          <div className="flex justify-end pt-2 border-t">
            <button
              type="submit"
              className="bg-primary text-white text-sm font-semibold px-5 py-2 rounded-lg hover:bg-primary/90 transition-colors"
            >
              Save changes
            </button>
          </div>
        </form>
      </section>

      {/* ── Sections ────────────────────────────────────────────────────── */}
      <section className="space-y-4">
        <div className="flex items-center justify-between">
          <div>
            <h2 className="text-sm font-semibold">Lessons</h2>
            <p className="text-xs text-muted-foreground mt-0.5">{sections.length} lesson{sections.length !== 1 ? 's' : ''}</p>
          </div>
          <Link
            href={`/${locale}/admin/courses/${courseId}/sections/new`}
            className="inline-flex items-center gap-1.5 bg-primary text-white text-xs font-semibold px-3 py-1.5 rounded-lg hover:bg-primary/90 transition-colors"
          >
            <Plus className="w-3.5 h-3.5" />
            Add lesson
          </Link>
        </div>

        {sections.length > 0 ? (
          <div className="rounded-xl border bg-background overflow-hidden divide-y">
            {sections.map((section, index) => {
              const duration = section.end_time_seconds - section.start_time_seconds
              return (
                <div key={section.id} className="flex items-center gap-3 px-4 py-3.5 group hover:bg-muted/20 transition-colors">
                  <GripVertical className="w-4 h-4 text-muted-foreground/30 shrink-0" />
                  <div className="flex-1 min-w-0">
                    <p className="text-sm font-medium truncate">{section.title}</p>
                    <div className="flex items-center gap-3 mt-0.5">
                      <span className="text-xs text-muted-foreground">
                        Lesson {index + 1}
                      </span>
                      <span className="text-xs text-muted-foreground flex items-center gap-1">
                        <Clock className="w-3 h-3" />
                        {formatMins(duration)}
                      </span>
                      <span className="text-xs text-muted-foreground font-mono">
                        {section.yt_video_id}
                      </span>
                    </div>
                  </div>
                  <div className="flex items-center gap-2 opacity-0 group-hover:opacity-100 transition-opacity shrink-0">
                    <Link
                      href={`/${locale}/admin/courses/${courseId}/sections/${section.id}/edit`}
                      className="inline-flex items-center gap-1 text-xs text-primary hover:underline"
                    >
                      <Pencil className="w-3.5 h-3.5" />
                      Edit
                    </Link>
                    <form action={deleteSectionAction}>
                      <input type="hidden" name="locale" value={locale} />
                      <input type="hidden" name="courseId" value={courseId} />
                      <input type="hidden" name="sectionId" value={section.id} />
                      <button type="submit" className="inline-flex items-center gap-1 text-xs text-destructive hover:underline">
                        <Trash2 className="w-3.5 h-3.5" />
                        Delete
                      </button>
                    </form>
                  </div>
                </div>
              )
            })}
          </div>
        ) : (
          <div className="rounded-xl border bg-background flex flex-col items-center justify-center py-12 text-center">
            <p className="text-sm text-muted-foreground mb-3">No lessons yet. Add the first one.</p>
            <Link
              href={`/${locale}/admin/courses/${courseId}/sections/new`}
              className="inline-flex items-center gap-1.5 bg-primary text-white text-xs font-semibold px-3 py-1.5 rounded-lg hover:bg-primary/90 transition-colors"
            >
              <Plus className="w-3.5 h-3.5" />
              Add lesson
            </Link>
          </div>
        )}
      </section>
    </div>
  )
}

function formatMins(seconds: number): string {
  const m = Math.floor(seconds / 60)
  const s = seconds % 60
  return `${m}:${String(s).padStart(2, '0')}`
}
