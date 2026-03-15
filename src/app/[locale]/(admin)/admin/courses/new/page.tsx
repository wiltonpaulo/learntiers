import { getLocale } from 'next-intl/server'
import Link from 'next/link'
import { createCourseAction } from '@/lib/actions/admin'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Textarea } from '@/components/ui/textarea'
import { ChevronLeft, FileJson } from 'lucide-react'

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

      <form action={createCourseAction} className="space-y-6" encType="multipart/form-data">
        <input type="hidden" name="locale" value={locale} />

        <div className="rounded-xl border bg-background p-6 space-y-5">
          <h2 className="text-sm font-semibold">Course Details</h2>
          <div className="space-y-1.5">
            <Label htmlFor="title">Title <span className="text-destructive">*</span></Label>
            <Input id="title" name="title" placeholder="e.g. React Fundamentals" />
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
              Used to provide synchronized subtitles for all video sections in this course.
            </p>
          </div>
        </div>

        {/* Bulk Import */}
        <div className="rounded-xl border border-dashed border-primary/30 bg-primary/5 p-6 space-y-5">
          <h2 className="text-sm font-semibold flex items-center gap-2">
            <FileJson className="w-4 h-4 text-primary" />
            Bulk Import (Optional)
          </h2>
          <div className="space-y-1.5">
            <Label htmlFor="import_file">JSON file</Label>
            <Input
              id="import_file"
              name="import_file"
              type="file"
              accept=".json"
              className="bg-background"
            />
            <p className="text-xs text-muted-foreground">
              Upload a JSON file containing the course structure and sections.
              If provided, it will override the details above.
            </p>
          </div>

          <details className="text-xs">
            <summary className="cursor-pointer text-primary hover:underline font-medium">
              View JSON format example
            </summary>
            <pre className="mt-2 p-3 bg-muted rounded-lg overflow-x-auto text-[10px] leading-relaxed">
{JSON.stringify({
  title: "My Course",
  description: "Description here",
  sections: [
    {
      title: "Lesson 1",
      yt_video_id: "dQw4w9WgXcQ",
      start_time_seconds: 0,
      end_time_seconds: 60,
      text_summary: "Optional summary",
      quiz: {
        question_text: "What is...?",
        options: ["A", "B", "C", "D"],
        correct_answer_index: 0
      }
    }
  ]
}, null, 2)}
            </pre>
          </details>
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
