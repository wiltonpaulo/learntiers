import { createClient } from '@/lib/supabase/server'
import { Trophy, Medal } from 'lucide-react'
import type { UserRow } from '@/types/database'
import { redirect } from 'next/navigation'
import { getLocale } from 'next-intl/server'

export default async function LeaderboardPage() {
  const locale = await getLocale()
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()

  if (!user) redirect(`/${locale}/login`)

  const { data: users, error } = await supabase
    .from('users')
    .select('id, name, country, total_score')
    .order('total_score', { ascending: false })
    .limit(50)

  if (error) {
    return <p className="text-destructive text-sm p-8">Failed to load leaderboard: {error.message}</p>
  }

  const top3 = (users ?? []).slice(0, 3) as Pick<UserRow, 'id' | 'name' | 'country' | 'total_score'>[]
  const rest = (users ?? []).slice(3) as Pick<UserRow, 'id' | 'name' | 'country' | 'total_score'>[]

  return (
    <div>
      {/* Hero */}
      <div className="py-10 px-4" style={{ backgroundColor: 'var(--nav-bg)' }}>
        <div className="container mx-auto text-center max-w-xl">
          <div className="inline-flex items-center justify-center w-12 h-12 rounded-xl bg-yellow-400/20 mb-4">
            <Trophy className="w-6 h-6 text-yellow-400" />
          </div>
          <h1 className="text-2xl font-bold text-white mb-2">Leaderboard</h1>
          <p className="text-white/60 text-sm">Top learners ranked by total score. Keep learning to climb the ranks.</p>
        </div>
      </div>

      <div className="container mx-auto max-w-2xl px-4 py-8 space-y-8">

        {/* Top 3 podium */}
        {top3.length > 0 && (
          <div className="grid grid-cols-3 gap-4">
            {[top3[1], top3[0], top3[2]].filter(Boolean).map((u, podiumIndex) => {
              const realRank = podiumIndex === 0 ? 2 : podiumIndex === 1 ? 1 : 3
              const isCurrentUser = u?.id === user?.id
              const heights = ['h-24', 'h-32', 'h-20']
              const colors = [
                'from-slate-200 to-slate-100',
                'from-yellow-100 to-amber-50 ring-2 ring-yellow-300',
                'from-orange-100 to-orange-50',
              ]
              const medals = ['🥈', '🥇', '🥉']

              return u ? (
                <div key={u.id} className="flex flex-col items-center gap-2">
                  <div className="text-2xl">{medals[podiumIndex]}</div>
                  <div className="text-sm font-semibold text-center line-clamp-1">{u.name}</div>
                  <div className="text-xs text-muted-foreground font-bold tabular-nums">
                    {u.total_score.toLocaleString()} pts
                  </div>
                  <div
                    className={`w-full ${heights[podiumIndex]} rounded-t-xl bg-gradient-to-b ${colors[podiumIndex]} flex items-start justify-center pt-2`}
                  >
                    <span className="text-xs font-bold text-muted-foreground">#{realRank}</span>
                  </div>
                </div>
              ) : <div key={podiumIndex} />
            })}
          </div>
        )}

        {/* Full table */}
        {(users ?? []).length > 0 ? (
          <div className="rounded-xl border overflow-hidden">
            <table className="w-full text-sm">
              <thead>
                <tr className="bg-muted/50 border-b">
                  <th className="text-left px-4 py-3 text-xs font-semibold text-muted-foreground uppercase tracking-wider w-14">
                    Rank
                  </th>
                  <th className="text-left px-4 py-3 text-xs font-semibold text-muted-foreground uppercase tracking-wider">
                    Player
                  </th>
                  <th className="text-left px-4 py-3 text-xs font-semibold text-muted-foreground uppercase tracking-wider hidden sm:table-cell">
                    Country
                  </th>
                  <th className="text-right px-4 py-3 text-xs font-semibold text-muted-foreground uppercase tracking-wider">
                    Score
                  </th>
                </tr>
              </thead>
              <tbody className="divide-y">
                {(users ?? []).map((u: Pick<UserRow, 'id' | 'name' | 'country' | 'total_score'>, index: number) => {
                  const isCurrentUser = u.id === user?.id
                  return (
                    <tr
                      key={u.id}
                      className={`transition-colors ${
                        isCurrentUser
                          ? 'bg-primary/5 font-semibold'
                          : 'hover:bg-muted/30'
                      }`}
                    >
                      <td className="px-4 py-3.5">
                        {index === 0 ? '🥇' : index === 1 ? '🥈' : index === 2 ? '🥉' : (
                          <span className="text-muted-foreground tabular-nums text-xs font-mono">
                            #{index + 1}
                          </span>
                        )}
                      </td>
                      <td className="px-4 py-3.5">
                        <div className="flex items-center gap-2.5">
                          <div className={`w-7 h-7 rounded-full flex items-center justify-center text-xs font-bold text-white shrink-0
                            ${isCurrentUser ? 'bg-primary' : 'bg-muted-foreground/30'}`}>
                            {u.name?.[0]?.toUpperCase() ?? '?'}
                          </div>
                          <span className="truncate">
                            {u.name}
                            {isCurrentUser && (
                              <span className="ml-2 text-xs text-primary font-medium">(you)</span>
                            )}
                          </span>
                        </div>
                      </td>
                      <td className="px-4 py-3.5 hidden sm:table-cell text-muted-foreground text-xs">
                        {u.country ?? '—'}
                      </td>
                      <td className="px-4 py-3.5 text-right">
                        <span className={`font-bold tabular-nums ${isCurrentUser ? 'text-primary' : ''}`}>
                          {u.total_score.toLocaleString()}
                        </span>
                      </td>
                    </tr>
                  )
                })}
              </tbody>
            </table>
          </div>
        ) : (
          <div className="text-center py-16 text-muted-foreground text-sm">
            No scores yet. Be the first to complete a lesson!
          </div>
        )}
      </div>
    </div>
  )
}
