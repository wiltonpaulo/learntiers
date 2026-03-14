import Link from 'next/link'
import { redirect } from 'next/navigation'
import { getLocale } from 'next-intl/server'
import { createClient } from '@/lib/supabase/server'
import { logoutAction } from '@/lib/actions/auth'
import { Button } from '@/components/ui/button'

/**
 * Dashboard shell layout — wraps all authenticated routes.
 * Auth guard: unauthenticated users are redirected to /login.
 */
export default async function DashboardLayout({ children }: { children: React.ReactNode }) {
  const locale = await getLocale()
  const supabase = await createClient()

  const { data: { user } } = await supabase.auth.getUser()

  if (!user) {
    redirect(`/${locale}/login`)
  }

  return (
    <div className="min-h-screen flex flex-col">
      <header className="sticky top-0 z-50 border-b bg-background/95 backdrop-blur supports-[backdrop-filter]:bg-background/60">
        <nav className="container mx-auto flex h-14 items-center justify-between px-4">
          <Link href={`/${locale}/courses`} className="font-bold text-lg tracking-tight">
            LearnTiers
          </Link>
          <div className="flex items-center gap-1">
            <Link
              href={`/${locale}/courses`}
              className="rounded-md px-3 py-1.5 text-sm font-medium hover:bg-muted transition-colors"
            >
              Courses
            </Link>
            <Link
              href={`/${locale}/leaderboard`}
              className="rounded-md px-3 py-1.5 text-sm font-medium hover:bg-muted transition-colors"
            >
              Leaderboard
            </Link>
            <Link
              href={`/${locale}/profile`}
              className="rounded-md px-3 py-1.5 text-sm font-medium hover:bg-muted transition-colors"
            >
              Profile
            </Link>
            <form action={logoutAction}>
              <input type="hidden" name="locale" value={locale} />
              <Button variant="ghost" size="sm" type="submit">
                Log out
              </Button>
            </form>
          </div>
        </nav>
      </header>

      <main className="flex-1 container mx-auto px-4 py-8">
        {children}
      </main>
    </div>
  )
}
