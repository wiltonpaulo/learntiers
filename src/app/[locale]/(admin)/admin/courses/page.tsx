import { createAdminClient } from '@/lib/supabase/admin'
import Link from 'next/link'
import { getLocale } from 'next-intl/server'
import { deleteCourseAction } from '@/lib/actions/admin'
import { Plus, Pencil, Trash2, BookOpen, PlayCircle } from 'lucide-react'

export default async function AdminCoursesPage() {
  const locale = await getLocale()
  const db = createAdminClient()

  const { data: courses } = await db
    .from('courses')
    .select('id, title, description, created_at')
    .order('created_at', { ascending: false })

  const { data: sectionCounts } = await db
    .from('course_sections')
    .select('course_id')

  const countMap: Record<string, number> = {}
  sectionCounts?.forEach((s: { course_id: string }) => {
    countMap[s.course_id] = (countMap[s.course_id] ?? 0) + 1
  })

  return (
    <div className="p-6 max-w-4xl mx-auto space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-xl font-bold">Courses</h1>
          <p className="text-sm text-muted-foreground mt-0.5">{courses?.length ?? 0} course{courses?.length !== 1 ? 's' : ''}</p>
        </div>
        <Link
          href={`/${locale}/admin/courses/new`}
          className="inline-flex items-center gap-2 bg-primary text-white text-sm font-semibold px-4 py-2 rounded-lg hover:bg-primary/90 transition-colors"
        >
          <Plus className="w-4 h-4" />
          New course
        </Link>
      </div>

      {courses && courses.length > 0 ? (
        <div className="rounded-xl border overflow-hidden bg-background">
          <table className="w-full text-sm">
            <thead>
              <tr className="border-b bg-muted/40">
                <th className="text-left px-4 py-3 text-xs font-semibold text-muted-foreground uppercase tracking-wider">
                  Course
                </th>
                <th className="text-left px-4 py-3 text-xs font-semibold text-muted-foreground uppercase tracking-wider w-24 hidden sm:table-cell">
                  Lessons
                </th>
                <th className="px-4 py-3 w-24" />
              </tr>
            </thead>
            <tbody className="divide-y">
              {courses.map((course: { id: string; title: string; description: string | null; created_at: string }) => (
                <tr key={course.id} className="hover:bg-muted/20 transition-colors">
                  <td className="px-4 py-3.5">
                    <p className="font-medium leading-snug">{course.title}</p>
                    {course.description && (
                      <p className="text-xs text-muted-foreground mt-0.5 line-clamp-1">{course.description}</p>
                    )}
                  </td>
                  <td className="px-4 py-3.5 hidden sm:table-cell">
                    <span className="inline-flex items-center gap-1 text-xs text-muted-foreground">
                      <PlayCircle className="w-3.5 h-3.5" />
                      {countMap[course.id] ?? 0}
                    </span>
                  </td>
                  <td className="px-4 py-3.5">
                    <div className="flex items-center justify-end gap-2">
                      <Link
                        href={`/${locale}/admin/courses/${course.id}`}
                        className="inline-flex items-center gap-1 text-xs font-medium text-primary hover:underline"
                      >
                        <Pencil className="w-3.5 h-3.5" />
                        Edit
                      </Link>
                      <form action={deleteCourseAction}>
                        <input type="hidden" name="locale" value={locale} />
                        <input type="hidden" name="courseId" value={course.id} />
                        <button
                          type="submit"
                          className="inline-flex items-center gap-1 text-xs font-medium text-destructive hover:underline"
                        >
                          <Trash2 className="w-3.5 h-3.5" />
                          Delete
                        </button>
                      </form>
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      ) : (
        <div className="rounded-xl border bg-background flex flex-col items-center justify-center py-20 text-center">
          <BookOpen className="w-10 h-10 text-muted-foreground/30 mb-3" />
          <p className="font-semibold text-sm">No courses yet</p>
          <p className="text-xs text-muted-foreground mt-1 mb-4">Create your first course to get started.</p>
          <Link
            href={`/${locale}/admin/courses/new`}
            className="inline-flex items-center gap-2 bg-primary text-white text-sm font-semibold px-4 py-2 rounded-lg hover:bg-primary/90 transition-colors"
          >
            <Plus className="w-4 h-4" />
            New course
          </Link>
        </div>
      )}
    </div>
  )
}
