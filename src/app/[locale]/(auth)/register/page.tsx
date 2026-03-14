import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Button } from '@/components/ui/button'
import Link from 'next/link'
import { getLocale } from 'next-intl/server'
import { registerAction } from '@/lib/actions/auth'
import { GraduationCap, BookOpen, Trophy, Zap } from 'lucide-react'

interface RegisterPageProps {
  searchParams: Promise<{ error?: string }>
}

export default async function RegisterPage({ searchParams }: RegisterPageProps) {
  const locale = await getLocale()
  const { error } = await searchParams

  return (
    <div className="min-h-screen grid lg:grid-cols-2">
      {/* ── Left panel ────────────────────────────────────────────────────── */}
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

        <div className="space-y-6">
          <h2 className="text-2xl font-bold text-white">Learn smarter,<br />one slice at a time.</h2>
          <div className="space-y-4">
            {[
              { icon: <BookOpen className="w-4 h-4" />, title: 'Curated micro-lessons', desc: 'The best parts of YouTube, curated for you' },
              { icon: <Zap className="w-4 h-4" />, title: 'Quiz after every lesson', desc: 'Reinforce learning with instant feedback' },
              { icon: <Trophy className="w-4 h-4" />, title: 'Global leaderboard', desc: 'Compete with learners worldwide' },
            ].map((f) => (
              <div key={f.title} className="flex items-start gap-3">
                <div className="w-8 h-8 rounded-lg bg-primary/20 flex items-center justify-center text-primary shrink-0">
                  {f.icon}
                </div>
                <div>
                  <p className="text-sm font-semibold text-white">{f.title}</p>
                  <p className="text-xs text-white/50 mt-0.5">{f.desc}</p>
                </div>
              </div>
            ))}
          </div>
        </div>

        <p className="text-white/30 text-xs">Free forever. No credit card required.</p>
      </div>

      {/* ── Right panel — form ────────────────────────────────────────────── */}
      <div className="flex items-center justify-center p-8">
        <div className="w-full max-w-sm space-y-6">
          <div className="flex items-center gap-2 lg:hidden">
            <div className="w-8 h-8 rounded-lg bg-primary flex items-center justify-center">
              <GraduationCap className="w-5 h-5 text-white" />
            </div>
            <span className="font-bold text-lg">LearnTiers</span>
          </div>

          <div>
            <h1 className="text-2xl font-bold">Create your account</h1>
            <p className="text-muted-foreground text-sm mt-1">Free forever. Start learning today.</p>
          </div>

          {error && (
            <div className="rounded-lg bg-destructive/10 border border-destructive/20 px-4 py-3 text-sm text-destructive">
              {decodeURIComponent(error)}
            </div>
          )}

          <form action={registerAction} className="space-y-4">
            <input type="hidden" name="locale" value={locale} />

            <div className="space-y-1.5">
              <Label htmlFor="name">Full name</Label>
              <Input id="name" name="name" type="text" placeholder="Ada Lovelace" required autoComplete="name" />
            </div>

            <div className="space-y-1.5">
              <Label htmlFor="email">Email</Label>
              <Input id="email" name="email" type="email" placeholder="you@example.com" required autoComplete="email" />
            </div>

            <div className="space-y-1.5">
              <Label htmlFor="password">Password</Label>
              <Input id="password" name="password" type="password" placeholder="At least 6 characters" required autoComplete="new-password" minLength={6} />
            </div>

            <Button type="submit" className="w-full">
              Create account — it&apos;s free
            </Button>
          </form>

          <p className="text-sm text-center text-muted-foreground">
            Already have an account?{' '}
            <Link href={`/${locale}/login`} className="font-semibold text-primary hover:underline">
              Sign in
            </Link>
          </p>
        </div>
      </div>
    </div>
  )
}
