import { createClient } from '@/lib/supabase/server'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import type { UserRow } from '@/types/database'

/**
 * Profile page — Server Component.
 * Shows the authenticated user's stats.
 */
export default async function ProfilePage() {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()

  if (!user) {
    return <p className="text-muted-foreground">Not authenticated.</p>
  }

  const { data } = await supabase
    .from('users')
    .select('name, email, total_score, country')
    .eq('id', user.id)
    .single()

  const profile = data as Pick<UserRow, 'name' | 'email' | 'total_score' | 'country'> | null

  return (
    <section className="max-w-xl mx-auto space-y-6">
      <h1 className="text-3xl font-bold">Profile</h1>
      <Card>
        <CardHeader>
          <CardTitle>{profile?.name ?? 'Anonymous'}</CardTitle>
        </CardHeader>
        <CardContent className="space-y-3">
          <div className="flex justify-between text-sm">
            <span className="text-muted-foreground">Email</span>
            <span>{profile?.email}</span>
          </div>
          <div className="flex justify-between text-sm">
            <span className="text-muted-foreground">Country</span>
            <span>
              {profile?.country
                ? <Badge variant="outline">{profile.country}</Badge>
                : '—'
              }
            </span>
          </div>
          <div className="flex justify-between text-sm">
            <span className="text-muted-foreground">Total Score</span>
            <span className="font-bold">{profile?.total_score?.toLocaleString() ?? 0}</span>
          </div>
        </CardContent>
      </Card>
    </section>
  )
}
