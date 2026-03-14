import { getLocale } from 'next-intl/server'
import Link from 'next/link'
import { createCourseAction } from '@/lib/actions/admin'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Textarea } from '@/components/ui/textarea'
import { ChevronLeft } from 'lucide-react'

interface NewCoursePageProps {
  searchParams: Promise<{ error?: string }>
}

export default async function NewCoursePage({ searchParams }: NewCoursePageProps) {
  const locale = await getLocale()
  const { error } = await searchParams

  return (
    <div className="p-6 max-w-2xl mx-auto space-y-6">
      <div>
        <Link
          href={`/${locale}/admin/courses`}
          className="inline-flex items-center gap-1 text-sm text-muted-foreground hover:text-foreground mb-4 transition-colors"
        >
          <ChevronLeft className="w-4 h-4" /> Courses
        </Link>
        <h1 className="text-xl font-bold">New course</h1>
      </div>

      {error && (
        <div className="rounded-lg bg-destructive/10 border border-destructive/20 px-4 py-3 text-sm text-destructive">
          {decodeURIComponent(error)}
        </div>
      )}

      <form action={createCourseAction} className="rounded-xl border bg-background p-6 space-y-5">
        <input type="hidden" name="locale" value={locale} />

        <div className="space-y-1.5">
          <Label htmlFor="title">Title <span className="text-destructive">*</span></Label>
          <Input id="title" name="title" placeholder="e.g. React Fundamentals" required />
        </div>

        <div className="space-y-1.5">
          <Label htmlFor="description">Description</Label>
          <Textarea
            id="description"
            name="description"
            placeholder="Brief description of what students will learn..."
            rows={3}
          />
        </div>

        <div className="space-y-1.5">
          <Label htmlFor="cover_image_url">Cover image URL</Label>
          <Input
            id="cover_image_url"
            name="cover_image_url"
            type="url"
            placeholder="https://img.youtube.com/vi/VIDEO_ID/maxresdefault.jpg"
          />
          <p className="text-xs text-muted-foreground">
            Tip: use a YouTube thumbnail URL from any related video.
          </p>
        </div>

        <div className="flex items-center justify-end gap-3 pt-2 border-t">
          <Link
            href={`/${locale}/admin/courses`}
            className="text-sm text-muted-foreground hover:text-foreground transition-colors px-4 py-2"
          >
            Cancel
          </Link>
          <button
            type="submit"
            className="bg-primary text-white text-sm font-semibold px-5 py-2 rounded-lg hover:bg-primary/90 transition-colors"
          >
            Create course
          </button>
        </div>
      </form>
    </div>
  )
}
