import { createClient } from '@/lib/supabase/server'
import { Badge } from '@/components/ui/badge'
import type { UserRow } from '@/types/database'

/**
 * Leaderboard page — Server Component.
 * Reads from public.users ordered by total_score DESC.
 */
export default async function LeaderboardPage() {
  const supabase = await createClient()

  const { data: users, error } = await supabase
    .from('users')
    .select('id, name, country, total_score')
    .order('total_score', { ascending: false })
    .limit(50)

  if (error) {
    return <p className="text-destructive text-sm">Failed to load leaderboard: {error.message}</p>
  }

  return (
    <section className="max-w-2xl mx-auto">
      <h1 className="text-3xl font-bold mb-6">Leaderboard</h1>
      <div className="rounded-xl border overflow-hidden">
        <table className="w-full text-sm">
          <thead className="bg-muted/50">
            <tr>
              <th className="text-left px-4 py-3 font-semibold">Rank</th>
              <th className="text-left px-4 py-3 font-semibold">Player</th>
              <th className="text-left px-4 py-3 font-semibold">Country</th>
              <th className="text-right px-4 py-3 font-semibold">Score</th>
            </tr>
          </thead>
          <tbody>
            {users?.map((user: Pick<UserRow, 'id' | 'name' | 'country' | 'total_score'>, index: number) => (
              <tr key={user.id} className="border-t hover:bg-muted/30 transition-colors">
                <td className="px-4 py-3 font-mono">
                  {index === 0 ? '🥇' : index === 1 ? '🥈' : index === 2 ? '🥉' : `#${index + 1}`}
                </td>
                <td className="px-4 py-3 font-medium">{user.name}</td>
                <td className="px-4 py-3">
                  {user.country ? (
                    <Badge variant="outline">{user.country}</Badge>
                  ) : (
                    <span className="text-muted-foreground">—</span>
                  )}
                </td>
                <td className="px-4 py-3 text-right font-bold tabular-nums">
                  {user.total_score.toLocaleString()}
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </section>
  )
}
