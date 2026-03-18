import { createClient } from '@/lib/supabase/server'
import { Trophy, BookOpen, User, Mail, Globe } from 'lucide-react'
import type { UserRow } from '@/types/database'
import { redirect } from 'next/navigation'
import { getLocale } from 'next-intl/server'
import { Badge } from '@/components/ui/badge'
import { cn } from '@/lib/utils'

export default async function ProfilePage() {
  const locale = await getLocale()
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()

  if (!user) redirect(`/${locale}/login`)

  const [profileRes, progressRes] = await Promise.all([
    supabase
      .from('users')
      .select('name, email, total_score, country')
      .eq('id', user.id)
      .single(),
    supabase
      .from('user_progress')
      .select('section_id, is_completed, quiz_score')
      .eq('user_id', user.id)
  ])

  const profile = profileRes.data as Pick<UserRow, 'name' | 'email' | 'total_score' | 'country'> | null
  const progress = (progressRes.data ?? []) as any[]

  const completed = progress.filter((p: { is_completed: boolean }) => p.is_completed).length
  const avgScore = progress.length > 0
    ? Math.round(progress.reduce((acc: number, p: { quiz_score: number | null }) => acc + (p.quiz_score ?? 0), 0) / progress.length)
    : 0

  const getInitials = (name?: string | null, email?: string | null) => {
    if (!name) return email?.[0].toUpperCase() || "U"
    const parts = name.trim().split(/\s+/)
    if (parts.length === 0) return "U"
    if (parts.length === 1) return parts[0][0].toUpperCase()
    return (parts[0][0] + parts[parts.length - 1][0]).toUpperCase()
  }

  const initials = getInitials(profile?.name, profile?.email)

  return (
    <div className="min-h-screen bg-background">
      {/* Hero Header */}
      <div className="py-12 border-b" style={{ backgroundColor: 'var(--nav-bg)' }}>
        <div className="container mx-auto max-w-3xl px-6 flex items-center gap-6">
          <div className="w-20 h-20 rounded-2xl bg-primary flex items-center justify-center text-white text-3xl font-bold shrink-0 shadow-lg shadow-primary/20">
            {initials}
          </div>
          <div>
            <h1 className="text-3xl font-bold text-white tracking-tight">{profile?.name ?? 'Learner'}</h1>
            <p className="text-white/60 text-base mt-1">{profile?.email}</p>
          </div>
        </div>
      </div>

      <div className="container mx-auto max-w-3xl px-6 py-12 space-y-10">
        {/* Stats Grid */}
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-6">
          <StatCard
            icon={<Trophy className="w-6 h-6 text-yellow-500" />}
            label="Total Score"
            value={profile?.total_score?.toLocaleString() ?? '0'}
            color="bg-yellow-500/5 border-yellow-500/10"
          />
          <StatCard
            icon={<BookOpen className="w-6 h-6 text-primary" />}
            label="Lessons Done"
            value={String(completed)}
            color="bg-primary/5 border-primary/10"
          />
          <StatCard
            icon={<Trophy className="w-6 h-6 text-emerald-500" />}
            label="Avg Quiz Score"
            value={`${avgScore} pts`}
            color="bg-emerald-500/5 border-emerald-500/10"
          />
        </div>

        {/* Account Details Card */}
        <div className="bg-card border rounded-2xl overflow-hidden shadow-sm">
          <div className="px-6 py-4 border-b bg-muted/30">
            <h2 className="text-sm font-bold uppercase tracking-wider text-muted-foreground">Account details</h2>
          </div>
          <div className="divide-y">
            <ProfileRow icon={<User className="w-4 h-4" />} label="Full name" value={profile?.name ?? '—'} />
            <ProfileRow icon={<Mail className="w-4 h-4" />} label="Email address" value={profile?.email ?? '—'} />
            <ProfileRow
              icon={<Globe className="w-4 h-4" />}
              label="Country"
              value={profile?.country ? (
                <Badge variant="outline" className="font-bold">{profile.country}</Badge>
              ) : (
                <span className="text-muted-foreground text-sm italic">Not set</span>
              )}
            />
          </div>
        </div>
      </div>
    </div>
  )
}

function StatCard({
  icon, label, value, color,
}: {
  icon: React.ReactNode
  label: string
  value: string
  color: string
}) {
  return (
    <div className={cn("rounded-2xl border p-6 space-y-3 transition-all hover:shadow-md", color)}>
      <div className="w-10 h-10 rounded-xl bg-white dark:bg-slate-900 flex items-center justify-center shadow-sm">
        {icon}
      </div>
      <div>
        <p className="text-2xl font-black tabular-nums">{value}</p>
        <p className="text-xs font-bold text-muted-foreground uppercase tracking-wider">{label}</p>
      </div>
    </div>
  )
}

function ProfileRow({
  icon, label, value,
}: {
  icon: React.ReactNode
  label: string
  value: React.ReactNode
}) {
  return (
    <div className="flex items-center justify-between px-6 py-4 hover:bg-muted/30 transition-colors">
      <div className="flex items-center gap-3 text-sm font-medium text-muted-foreground">
        <div className="w-8 h-8 rounded-lg bg-muted flex items-center justify-center">
          {icon}
        </div>
        {label}
      </div>
      <div className="text-sm font-bold text-foreground">{value}</div>
    </div>
  )
}
