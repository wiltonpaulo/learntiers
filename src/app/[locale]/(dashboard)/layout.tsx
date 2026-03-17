import Link from 'next/link'
import { getLocale } from 'next-intl/server'
import { headers } from 'next/headers'
import { createClient } from '@/lib/supabase/server'
import { logoutAction } from '@/lib/actions/auth'
import { BookOpen, Trophy, User, LogOut, GraduationCap, LogIn } from 'lucide-react'
import type { UserRow } from '@/types/database'

export default async function DashboardLayout({ children }: { children: React.ReactNode }) {
  const locale = await getLocale()
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()

  let profile: Pick<UserRow, 'name' | 'total_score'> | null = null
  let initials = '?'

  if (user) {
    const { data } = await supabase
      .from('users')
      .select('name, total_score')
      .eq('id', user.id)
      .single()
    profile = data as Pick<UserRow, 'name' | 'total_score'> | null
    initials = profile?.name
      ? profile.name.split(' ').map((n: string) => n[0]).slice(0, 2).join('').toUpperCase()
      : user.email?.[0].toUpperCase() ?? '?'
  }

  // Detect if we are in a course section page to hide footer and manage height
  const headersList = await headers()
  const fullPath = headersList.get('x-url') || ''
  const isSectionPage = fullPath.includes('/sections/')

  return (
    <div className="min-h-screen flex flex-col bg-background">
      {/* ── Dark top navigation (Udemy-style) ─────────────────────────────── */}
      <header
        className="sticky top-0 z-50 h-14 flex items-center shrink-0"
        style={{ backgroundColor: 'var(--nav-bg)', color: 'var(--nav-fg)' }}
      >
        <div className="container mx-auto flex items-center justify-between gap-4 px-4">
          {/* Logo */}
          <Link href={`/${locale}`} className="flex items-center gap-2 shrink-0">
            <div className="w-7 h-7 rounded-md bg-primary flex items-center justify-center">
              <GraduationCap className="w-4 h-4 text-white" />
            </div>
            <span className="font-bold text-base text-white tracking-tight">LearnTiers</span>
          </Link>

          {/* Nav links */}
          <nav className="hidden md:flex items-center gap-1">
            <NavLink href={`/${locale}/courses`} icon={<BookOpen className="w-4 h-4" />}>
              Courses
            </NavLink>
            {user && (
              <NavLink href={`/${locale}/my-learning`} icon={<GraduationCap className="w-4 h-4" />}>
                My Learning
              </NavLink>
            )}
            <NavLink href={`/${locale}/leaderboard`} icon={<Trophy className="w-4 h-4" />}>
              Leaderboard
            </NavLink>
            <NavLink href={`/${locale}/profile`} icon={<User className="w-4 h-4" />}>
              Profile
            </NavLink>
          </nav>

          {/* User area */}
          <div className="flex items-center gap-3">
            {user ? (
              <>
                {/* Score chip */}
                <div className="hidden sm:flex items-center gap-1.5 bg-white/10 rounded-full px-3 py-1">
                  <Trophy className="w-3.5 h-3.5 text-yellow-400" />
                  <span className="text-xs font-semibold text-white tabular-nums">
                    {profile?.total_score?.toLocaleString() ?? 0}
                  </span>
                </div>

                {/* Avatar */}
                <div className="w-8 h-8 rounded-full bg-primary flex items-center justify-center text-white text-xs font-bold shrink-0">
                  {initials}
                </div>

                {/* Logout */}
                <form action={logoutAction}>
                  <input type="hidden" name="locale" value={locale} />
                  <button
                    type="submit"
                    className="text-white/60 hover:text-white transition-colors"
                    title="Log out"
                  >
                    <LogOut className="w-4 h-4" />
                  </button>
                </form>
              </>
            ) : (
              <div className="flex items-center gap-2">
                <Link
                  href={`/${locale}/login`}
                  className="text-sm font-bold text-white/80 hover:text-white transition-colors px-3 py-1.5 rounded-md hover:bg-white/10 flex items-center gap-1.5"
                >
                  <LogIn className="w-4 h-4" />
                  Log in
                </Link>
                <Link
                  href={`/${locale}/register`}
                  className="text-sm font-bold bg-white text-slate-900 px-4 py-1.5 rounded-md hover:bg-white/90 transition-colors"
                >
                  Sign up
                </Link>
              </div>
            )}
          </div>
        </div>
      </header>

      {/* Page content */}
      <main className="flex-1 min-h-0">{children}</main>

      {/* Footer (hidden on section pages to allow independent internal scrolls) */}
      {!isSectionPage && (
        <footer className="border-t py-6 mt-auto shrink-0">
          <div className="container mx-auto px-4 text-center text-xs text-muted-foreground">
            © {new Date().getFullYear()} LearnTiers · Learn smarter, one micro-lesson at a time.
          </div>
        </footer>
      )}
    </div>
  )
}

function NavLink({
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
      className="flex items-center gap-1.5 text-sm text-white/70 hover:text-white hover:bg-white/10 rounded-md px-3 py-1.5 transition-colors"
    >
      {icon}
      {children}
    </Link>
  )
}
