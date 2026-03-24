import { createAdminClient } from '@/lib/supabase/admin'
import Link from 'next/link'
import { getLocale } from 'next-intl/server'
import { BookOpen, Users, PlayCircle, HelpCircle, ArrowRight } from 'lucide-react'

export default async function AdminOverviewPage() {
  const locale = await getLocale()
  const db = createAdminClient()

  const [
    { count: courseCount },
    { count: sectionCount },
    { count: userCount },
    { count: quizCount },
    { data: recentCourses },
  ] = await Promise.all([
    db.from('courses').select('*', { count: 'exact', head: true }),
    db.from('course_sections').select('*', { count: 'exact', head: true }),
    db.from('users').select('*', { count: 'exact', head: true }),
    db.from('quizzes').select('*', { count: 'exact', head: true }),
    db.from('courses').select('id, slug, title, created_at').order('created_at', { ascending: false }).limit(5),
  ])

  const stats = [
    { label: 'Courses', value: courseCount ?? 0, icon: <BookOpen className="w-5 h-5 text-primary" />, href: `/${locale}/admin/courses` },
    { label: 'Sections', value: sectionCount ?? 0, icon: <PlayCircle className="w-5 h-5 text-blue-500" />, href: `/${locale}/admin/courses` },
    { label: 'Quizzes', value: quizCount ?? 0, icon: <HelpCircle className="w-5 h-5 text-orange-500" />, href: `/${locale}/admin/courses` },
    { label: 'Users', value: userCount ?? 0, icon: <Users className="w-5 h-5 text-green-500" />, href: '#' },
  ]

  return (
    <div className="p-6 max-w-4xl mx-auto space-y-8">
      <div>
        <h1 className="text-xl font-bold">Overview</h1>
        <p className="text-sm text-muted-foreground mt-0.5">Manage your platform content.</p>
      </div>

      {/* Stats */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        {stats.map((s) => (
          <Link key={s.label} href={s.href} className="rounded-xl border bg-background p-4 hover:shadow-sm transition-shadow">
            <div className="flex items-center justify-between mb-3">
              <div className="w-9 h-9 rounded-lg bg-muted flex items-center justify-center">{s.icon}</div>
            </div>
            <p className="text-2xl font-bold tabular-nums">{s.value}</p>
            <p className="text-xs text-muted-foreground mt-0.5">{s.label}</p>
          </Link>
        ))}
      </div>

      {/* Quick actions */}
      <div>
        <h2 className="text-sm font-semibold mb-3">Quick actions</h2>
        <div className="flex flex-wrap gap-3">
          <Link
            href={`/${locale}/admin/courses/new`}
            className="inline-flex items-center gap-2 bg-primary text-white text-sm font-medium px-4 py-2 rounded-lg hover:bg-primary/90 transition-colors"
          >
            <BookOpen className="w-4 h-4" />
            New course
          </Link>
          <Link
            href={`/${locale}/admin/courses`}
            className="inline-flex items-center gap-2 border bg-background text-sm font-medium px-4 py-2 rounded-lg hover:bg-muted transition-colors"
          >
            <ArrowRight className="w-4 h-4" />
            Manage courses
          </Link>
        </div>
      </div>

      {/* Recent courses */}
      {recentCourses && recentCourses.length > 0 && (
        <div>
          <h2 className="text-sm font-semibold mb-3">Recent courses</h2>
          <div className="rounded-xl border overflow-hidden divide-y bg-background">
            {recentCourses.map((c: any) => (
              <Link
                key={c.id}
                href={`/${locale}/admin/courses/${c.slug}`}
                className="flex items-center justify-between px-4 py-3 hover:bg-muted/40 transition-colors group"
              >
                <span className="text-sm font-medium">{c.title}</span>
                <ArrowRight className="w-4 h-4 text-muted-foreground group-hover:text-foreground transition-colors" />
              </Link>
            ))}
          </div>
        </div>
      )}
    </div>
  )
}
