import Link from 'next/link'
import { getLocale } from 'next-intl/server'
import { headers } from 'next/headers'
import { createClient } from '@/lib/supabase/server'
import { BookOpen, Trophy, GraduationCap, LogIn } from 'lucide-react'
import type { UserRow } from '@/types/database'
import SearchOverlay from '@/components/ui/SearchOverlay'
import { UserMenu } from '@/components/auth/UserMenu'
import { ScoreHoverCard } from '@/components/dashboard/ScoreHoverCard'

export default async function DashboardLayout({ children }: { children: React.ReactNode }) {
  const locale = await getLocale()
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()

  let profile: Pick<UserRow, 'name' | 'total_score'> | null = null
  let progress: any[] = []

  if (user) {
    const [pRes, progRes] = await Promise.all([
      supabase
        .from('users')
        .select('name, total_score')
        .eq('id', user.id)
        .single(),
      supabase
        .from('user_progress')
        .select('is_completed, quiz_score')
        .eq('user_id', user.id)
    ])
    profile = pRes.data as Pick<UserRow, 'name' | 'total_score'> | null
    progress = progRes.data ?? []
  }

  const completedLessons = progress.filter(p => p.is_completed).length
  const avgQuizScore = progress.length > 0
    ? Math.round(progress.reduce((acc, p) => acc + (p.quiz_score ?? 0), 0) / progress.length)
    : 0

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
          <nav className="hidden lg:flex items-center gap-1">
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
          </nav>

          {/* Search bar */}
          <SearchOverlay />

          {/* User area */}
          <div className="flex items-center gap-3">
            {user ? (
              <>
                <ScoreHoverCard 
                  totalScore={profile?.total_score ?? 0}
                  completedLessons={completedLessons}
                  avgQuizScore={avgQuizScore}
                />

                <UserMenu 
                  user={{
                    name: profile?.name || user.email?.split('@')[0],
                    email: user.email,
                    image: null // Add image field if available in your UserRow
                  }} 
                  locale={locale} 
                />
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
