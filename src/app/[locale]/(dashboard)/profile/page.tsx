import { createClient } from '@/lib/supabase/server'
import { Separator } from '@/components/ui/separator'
import { Badge } from '@/components/ui/badge'
import { Trophy, BookOpen, Globe, Mail, User } from 'lucide-react'
import type { UserRow } from '@/types/database'

export default async function ProfilePage() {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()

  if (!user) return <p className="p-8 text-muted-foreground text-sm">Not authenticated.</p>

  const [profileRes, progressRes] = await Promise.all([
    supabase
      .from('users')
      .select('name, email, total_score, country')
      .eq('id', user.id)
      .single(),
    supabase
      .from('user_progress')
      .select('is_completed, quiz_score')
      .eq('user_id', user.id),
  ])

  const profile = profileRes.data as Pick<UserRow, 'name' | 'email' | 'total_score' | 'country'> | null
  const progress = progressRes.data ?? []

  const completed = progress.filter((p: { is_completed: boolean }) => p.is_completed).length
  const avgScore = progress.length > 0
    ? Math.round(progress.reduce((acc: number, p: { quiz_score: number | null }) => acc + (p.quiz_score ?? 0), 0) / progress.length)
    : 0
  const initials = profile?.name
    ? profile.name.split(' ').map((n: string) => n[0]).slice(0, 2).join('').toUpperCase()
    : '?'

  return (
    <div>
      {/* Hero */}
      <div className="py-10 px-4" style={{ backgroundColor: 'var(--nav-bg)' }}>
        <div className="container mx-auto max-w-3xl flex items-center gap-5">
          <div className="w-16 h-16 rounded-2xl bg-primary flex items-center justify-center text-white text-2xl font-bold shrink-0">
            {initials}
          </div>
          <div>
            <h1 className="text-2xl font-bold text-white">{profile?.name ?? 'Learner'}</h1>
            <p className="text-white/60 text-sm mt-0.5">{profile?.email}</p>
          </div>
        </div>
      </div>

      <div className="container mx-auto max-w-3xl px-4 py-8 space-y-6">
        {/* Stats row */}
        <div className="grid grid-cols-3 gap-4">
          <StatCard
            icon={<Trophy className="w-5 h-5 text-yellow-500" />}
            label="Total Score"
            value={profile?.total_score?.toLocaleString() ?? '0'}
            color="bg-yellow-50 border-yellow-100"
          />
          <StatCard
            icon={<BookOpen className="w-5 h-5 text-primary" />}
            label="Lessons Done"
            value={String(completed)}
            color="bg-primary/5 border-primary/10"
          />
          <StatCard
            icon={<Trophy className="w-5 h-5 text-green-500" />}
            label="Avg Quiz Score"
            value={`${avgScore} pts`}
            color="bg-green-50 border-green-100"
          />
        </div>

        {/* Profile details */}
        <div className="rounded-xl border overflow-hidden">
          <div className="px-5 py-3 border-b bg-muted/30">
            <h2 className="text-sm font-semibold">Account details</h2>
          </div>
          <div className="divide-y">
            <ProfileRow icon={<User className="w-4 h-4" />} label="Full name" value={profile?.name ?? '—'} />
            <ProfileRow icon={<Mail className="w-4 h-4" />} label="Email" value={profile?.email ?? '—'} />
            <ProfileRow
              icon={<Globe className="w-4 h-4" />}
              label="Country"
              value={profile?.country ? (
                <Badge variant="outline">{profile.country}</Badge>
              ) : (
                <span className="text-muted-foreground text-sm">Not set</span>
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
    <div className={`rounded-xl border p-4 space-y-2 ${color}`}>
      {icon}
      <p className="text-2xl font-bold tabular-nums">{value}</p>
      <p className="text-xs text-muted-foreground">{label}</p>
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
    <div className="flex items-center justify-between px-5 py-3.5">
      <div className="flex items-center gap-2.5 text-sm text-muted-foreground">
        {icon}
        {label}
      </div>
      <div className="text-sm font-medium">{value}</div>
    </div>
  )
}
