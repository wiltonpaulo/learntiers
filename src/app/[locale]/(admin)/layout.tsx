import { redirect } from 'next/navigation'
import { getLocale } from 'next-intl/server'
import Link from 'next/link'
import { createClient } from '@/lib/supabase/server'
import { GraduationCap, LayoutDashboard, BookOpen, ShieldAlert, ExternalLink } from 'lucide-react'

export default async function AdminLayout({ children }: { children: React.ReactNode }) {
  const locale = await getLocale()
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()

  if (!user) redirect(`/${locale}/?auth=login&next=${encodeURIComponent(`/${locale}/admin`)}`)

  const adminEmails = (process.env.ADMIN_EMAILS ?? '')
    .split(',')
    .map((e) => e.trim().toLowerCase())

  if (!adminEmails.includes(user.email?.toLowerCase() ?? '')) {
    return (
      <div className="min-h-screen flex items-center justify-center p-8">
        <div className="text-center space-y-3 max-w-sm">
          <ShieldAlert className="w-10 h-10 text-destructive mx-auto" />
          <h1 className="text-xl font-bold">Access denied</h1>
          <p className="text-sm text-muted-foreground">
            Your account ({user.email}) is not in the admin list.
            Add your email to <code className="bg-muted px-1 rounded text-xs">ADMIN_EMAILS</code> in your environment variables.
          </p>
          <Link href={`/${locale}/courses`} className="text-sm text-primary hover:underline">
            Back to app
          </Link>
        </div>
      </div>
    )
  }

  return (
    <div className="min-h-screen flex flex-col">
      {/* Admin top bar */}
      <header className="h-12 border-b flex items-center px-4 gap-4 bg-muted/30 shrink-0">
        <div className="flex items-center gap-2">
          <div className="w-6 h-6 rounded bg-primary flex items-center justify-center">
            <GraduationCap className="w-3.5 h-3.5 text-white" />
          </div>
          <span className="font-bold text-sm">LearnTiers</span>
          <span className="text-xs bg-primary/10 text-primary font-semibold px-2 py-0.5 rounded-full">Admin</span>
        </div>

        <nav className="flex items-center gap-1 ml-4">
          <AdminNavLink href={`/${locale}/admin`} icon={<LayoutDashboard className="w-3.5 h-3.5" />}>
            Overview
          </AdminNavLink>
          <AdminNavLink href={`/${locale}/admin/courses`} icon={<BookOpen className="w-3.5 h-3.5" />}>
            Courses
          </AdminNavLink>
        </nav>

        <Link
          href={`/${locale}/courses`}
          className="ml-auto flex items-center gap-1.5 text-xs text-muted-foreground hover:text-foreground transition-colors"
        >
          <ExternalLink className="w-3.5 h-3.5" />
          View app
        </Link>
      </header>

      <div className="flex-1 bg-muted/20">
        {children}
      </div>
    </div>
  )
}

function AdminNavLink({
  href,
  icon,
  children,
}: {
  href: string
  icon: React.ReactNode
  children: React.ReactNode
}) {
  return (
    <Link
      href={href}
      className="flex items-center gap-1.5 text-xs font-medium text-muted-foreground hover:text-foreground hover:bg-muted rounded-md px-2.5 py-1.5 transition-colors"
    >
      {icon}
      {children}
    </Link>
  )
}
