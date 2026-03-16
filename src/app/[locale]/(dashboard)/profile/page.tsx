import { createClient } from '@/lib/supabase/server'
import { createAdminClient } from '@/lib/supabase/admin'
import { Separator } from '@/components/ui/separator'
import { Badge } from '@/components/ui/badge'
import { Trophy, BookOpen, Globe, Mail, User } from 'lucide-react'
import type { UserRow } from '@/types/database'
import { redirect } from 'next/navigation'
import Link from 'next/link'
import { getLocale } from 'next-intl/server'

export default async function ProfilePage() {
  const locale = await getLocale()
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()

  if (!user) redirect(`/${locale}/login`)

  const [profileRes, progressRes, certificatesRes, coursesRes] = await Promise.all([
    supabase
      .from('users')
      .select('name, email, total_score, country')
      .eq('id', user.id)
      .single(),
    supabase
      .from('user_progress')
      .select('section_id, is_completed, quiz_score')
      .eq('user_id', user.id),
    supabase
      .from('certificates')
      .select('course_id, verification_code, issued_at, courses(title)')
      .eq('user_id', user.id)
      .order('issued_at', { ascending: false }),
    supabase
      .from('courses')
      .select('id, title, course_sections(id)')
  ])

  const profile = profileRes.data as Pick<UserRow, 'name' | 'email' | 'total_score' | 'country'> | null
  const progress = (progressRes.data ?? []) as any[]
  let certificates = (certificatesRes.data ?? []) as any[]
  const allCourses = (coursesRes.data ?? []) as any[]

  // --- Auto-issue missing certificates ---
  const completedSectionIds = new Set(progress.filter(p => p.is_completed).map(p => p.section_id))
  const existingCertCourseIds = new Set(certificates.map(c => c.course_id))
  
  const newlyIssuedCerts: any[] = []

  for (const course of allCourses) {
    const sectionIds = (course.course_sections || []).map((s: any) => s.id)
    if (sectionIds.length === 0) continue

    const isFinished = sectionIds.every((id: string) => completedSectionIds.has(id))
    
    if (isFinished && !existingCertCourseIds.has(course.id)) {
      // Issue missing certificate using Admin client for reliability
      const adminDb = createAdminClient()
      const { data: newCert } = await (adminDb as any)
        .from('certificates')
        .upsert({ user_id: user.id, course_id: course.id }, { onConflict: 'user_id,course_id' })
        .select('course_id, verification_code, issued_at, courses(title)')
        .single()
      
      if (newCert) {
        newlyIssuedCerts.push(newCert)
      }
    }
  }

  if (newlyIssuedCerts.length > 0) {
    certificates = [...newlyIssuedCerts, ...certificates].sort((a, b) => 
      new Date(b.issued_at).getTime() - new Date(a.issued_at).getTime()
    )
  }
  // ----------------------------------------

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

        {/* Certificates Section */}
        <div className="rounded-xl border overflow-hidden">
          <div className="px-5 py-4 border-b bg-muted/30 flex items-center justify-between">
            <h2 className="text-sm font-semibold flex items-center gap-2">
              <Trophy className="w-4 h-4 text-amber-500" />
              My Certificates
            </h2>
            <Badge variant="secondary" className="text-[10px] font-bold uppercase">{certificates.length}</Badge>
          </div>
          <div className="divide-y">
            {certificates.length > 0 ? (
              certificates.map((cert) => (
                <div key={cert.verification_code} className="px-5 py-4 flex items-center justify-between hover:bg-muted/30 transition-colors group">
                  <div className="space-y-0.5">
                    <p className="text-sm font-bold text-foreground group-hover:text-primary transition-colors">
                      {cert.courses?.title || 'Unknown Course'}
                    </p>
                    <p className="text-[10px] text-muted-foreground uppercase tracking-wider font-medium">
                      Issued on {new Date(cert.issued_at).toLocaleDateString(locale, { dateStyle: 'long' })}
                    </p>
                  </div>
                  <Link 
                    href={`/${locale}/verify/${cert.verification_code}`}
                    className="text-xs font-bold text-primary hover:underline"
                  >
                    View Certificate
                  </Link>
                </div>
              ))
            ) : (
              <div className="px-5 py-10 text-center space-y-2">
                <p className="text-sm text-muted-foreground">No certificates earned yet.</p>
                <Link href={`/${locale}/courses`} className="text-xs text-primary font-bold hover:underline">
                  Browse courses to start learning
                </Link>
              </div>
            )}
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
