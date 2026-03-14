import { createClient } from '@/lib/supabase/server'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import Link from 'next/link'
import { getLocale } from 'next-intl/server'
import type { CourseRow } from '@/types/database'

/**
 * Courses listing page — Server Component.
 * Fetches all courses directly from Supabase on the server; no client-side fetching.
 */
export default async function CoursesPage() {
  const supabase = await createClient()
  const locale = await getLocale()

  const { data: courses, error } = await supabase
    .from('courses')
    .select('id, title, description, cover_image_url, created_at')
    .order('created_at', { ascending: false })

  if (error) {
    return (
      <p className="text-destructive text-sm">
        Failed to load courses: {error.message}
      </p>
    )
  }

  return (
    <section>
      <h1 className="text-3xl font-bold mb-6">Courses</h1>
      {courses && courses.length > 0 ? (
        <div className="grid gap-6 sm:grid-cols-2 lg:grid-cols-3">
          {courses.map((course: CourseRow) => (
            <Link key={course.id} href={`/${locale}/courses/${course.id}`}>
              <Card className="h-full hover:shadow-md transition-shadow cursor-pointer">
                {course.cover_image_url && (
                  // eslint-disable-next-line @next/next/no-img-element
                  <img
                    src={course.cover_image_url}
                    alt={course.title}
                    className="w-full aspect-video object-cover rounded-t-lg"
                  />
                )}
                <CardHeader>
                  <CardTitle className="line-clamp-2">{course.title}</CardTitle>
                  {course.description && (
                    <CardDescription className="line-clamp-3">
                      {course.description}
                    </CardDescription>
                  )}
                </CardHeader>
                <CardContent>
                  <Badge variant="secondary">Micro-lessons</Badge>
                </CardContent>
              </Card>
            </Link>
          ))}
        </div>
      ) : (
        <p className="text-muted-foreground">No courses available yet. Check back soon!</p>
      )}
    </section>
  )
}
