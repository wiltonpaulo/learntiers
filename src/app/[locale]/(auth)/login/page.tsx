import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Button } from '@/components/ui/button'
import Link from 'next/link'
import { getLocale } from 'next-intl/server'
import { loginAction } from '@/lib/actions/auth'
import { GraduationCap } from 'lucide-react'

interface LoginPageProps {
  searchParams: Promise<{ error?: string; message?: string }>
}

export default async function LoginPage({ searchParams }: LoginPageProps) {
  const locale = await getLocale()
  const { error, message } = await searchParams

  return (
    <div className="min-h-screen grid lg:grid-cols-2">
      {/* ── Left panel — branding ──────────────────────────────────────────── */}
      <div
        className="hidden lg:flex flex-col justify-between p-12"
        style={{ backgroundColor: 'var(--nav-bg)' }}
      >
        <div className="flex items-center gap-2">
          <div className="w-8 h-8 rounded-lg bg-primary flex items-center justify-center">
            <GraduationCap className="w-5 h-5 text-white" />
          </div>
          <span className="font-bold text-white text-lg">LearnTiers</span>
        </div>

        <div>
          <blockquote className="text-white/80 text-lg font-medium leading-relaxed">
            &ldquo;The capacity to learn is a gift; the ability to learn is a skill; the willingness to learn is a choice.&rdquo;
          </blockquote>
          <p className="text-white/40 text-sm mt-3">— Brian Herbert</p>
        </div>

        <div className="space-y-3">
          {['Bite-sized micro-lessons', 'Quiz after every lesson', 'Global leaderboard'].map((feat) => (
            <div key={feat} className="flex items-center gap-2.5 text-sm text-white/70">
              <div className="w-1.5 h-1.5 rounded-full bg-primary" />
              {feat}
            </div>
          ))}
        </div>
      </div>

      {/* ── Right panel — form ────────────────────────────────────────────── */}
      <div className="flex items-center justify-center p-8">
        <div className="w-full max-w-sm space-y-6">
          {/* Mobile logo */}
          <div className="flex items-center gap-2 lg:hidden">
            <div className="w-8 h-8 rounded-lg bg-primary flex items-center justify-center">
              <GraduationCap className="w-5 h-5 text-white" />
            </div>
            <span className="font-bold text-lg">LearnTiers</span>
          </div>

          <div>
            <h1 className="text-2xl font-bold">Welcome back</h1>
            <p className="text-muted-foreground text-sm mt-1">Sign in to continue learning.</p>
          </div>

          {error && (
            <div className="rounded-lg bg-destructive/10 border border-destructive/20 px-4 py-3 text-sm text-destructive">
              {decodeURIComponent(error)}
            </div>
          )}
          {message && (
            <div className="rounded-lg bg-green-50 border border-green-200 px-4 py-3 text-sm text-green-700">
              {decodeURIComponent(message)}
            </div>
          )}

          <form action={loginAction} className="space-y-4">
            <input type="hidden" name="locale" value={locale} />

            <div className="space-y-1.5">
              <Label htmlFor="email">Email</Label>
              <Input id="email" name="email" type="email" placeholder="you@example.com" required autoComplete="email" />
            </div>

            <div className="space-y-1.5">
              <Label htmlFor="password">Password</Label>
              <Input id="password" name="password" type="password" placeholder="••••••••" required autoComplete="current-password" />
            </div>

            <Button type="submit" className="w-full">
              Sign in
            </Button>
          </form>

          <p className="text-sm text-center text-muted-foreground">
            Don&apos;t have an account?{' '}
            <Link href={`/${locale}/register`} className="font-semibold text-primary hover:underline">
              Create one
            </Link>
          </p>
        </div>
      </div>
    </div>
  )
}
