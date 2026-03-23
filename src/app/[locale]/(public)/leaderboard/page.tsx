import { createClient } from '@/lib/supabase/server'
import { Trophy, Medal } from 'lucide-react'
import type { UserRow } from '@/types/database'
import { Link } from '@/i18n/routing'
import { getLocale } from 'next-intl/server'

function getInitials(name: string) {
  return name
    .split(' ')
    .map((n) => n[0])
    .join('')
    .toUpperCase()
    .substring(0, 2)
}

export default async function LeaderboardPage() {
  const locale = await getLocale()
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()

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
    <div className="pt-20">
      {/* Hero */}
      <div className="py-16 px-4 bg-[#1c1d1f]">
        <div className="container mx-auto text-center max-w-xl">
          <div className="inline-flex items-center justify-center w-16 h-16 rounded-2xl bg-yellow-400/10 mb-6 border border-yellow-400/20">
            <Trophy className="w-8 h-8 text-yellow-400" />
          </div>
          <h1 className="text-4xl font-black text-white mb-4 tracking-tight">Global Ranking</h1>
          <p className="text-slate-400 text-lg">Top engineering talents competing in real-time.</p>
        </div>
      </div>

      <div className="container mx-auto max-w-3xl px-4 py-16 space-y-12">

        {/* Top 3 podium */}
        {top3.length > 0 && (
          <div className="grid grid-cols-3 gap-4 md:gap-8 items-end">
            {[top3[1], top3[0], top3[2]].filter(Boolean).map((u, podiumIndex) => {
              const realRank = podiumIndex === 0 ? 2 : podiumIndex === 1 ? 1 : 3
              const heights = ['h-32', 'h-48', 'h-24']
              const colors = [
                'from-slate-100 to-slate-200 border-slate-200',
                'from-amber-100 to-amber-200 border-amber-200 ring-4 ring-amber-50',
                'from-orange-100 to-orange-200 border-orange-200',
              ]
              const medals = ['🥈', '🥇', '🥉']

              return u ? (
                <div key={u.id} className="flex flex-col items-center gap-4">
                  <div className="flex flex-col items-center">
                    <div className="text-4xl mb-2">{medals[podiumIndex]}</div>
                    <div className="w-12 h-12 rounded-full bg-slate-800 flex items-center justify-center font-bold text-white border-2 border-white mb-2 overflow-hidden shadow-sm">
                       <span className="text-sm font-black">{getInitials(u.name)}</span>
                    </div>
                    <div className="text-sm font-bold text-center text-slate-900 line-clamp-1">{u.name}</div>
                    <div className="text-[10px] uppercase font-black tracking-widest text-primary mt-1">
                      {u.total_score.toLocaleString()} pts
                    </div>
                  </div>
                  <div
                    className={`w-full ${heights[podiumIndex]} rounded-t-2xl bg-gradient-to-b border-t border-x ${colors[podiumIndex]} flex items-start justify-center pt-4 shadow-sm`}
                  >
                    <span className="text-lg font-black text-slate-400/50">#{realRank}</span>
                  </div>
                </div>
              ) : <div key={podiumIndex} />
            })}
          </div>
        )}

        {/* Full table */}
        {(users ?? []).length > 0 ? (
          <div className="rounded-3xl border border-slate-200 bg-white overflow-hidden shadow-xl shadow-slate-200/50">
            <table className="w-full text-sm text-left">
              <thead>
                <tr className="bg-slate-50 border-b border-slate-200">
                  <th className="px-6 py-4 text-[10px] font-black uppercase tracking-widest text-slate-500 w-20">Rank</th>
                  <th className="px-6 py-4 text-[10px] font-black uppercase tracking-widest text-slate-500">Engineer</th>
                  <th className="px-6 py-4 text-[10px] font-black uppercase tracking-widest text-slate-500 hidden sm:table-cell">Country</th>
                  <th className="px-6 py-4 text-right text-[10px] font-black uppercase tracking-widest text-slate-500">Score</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100">
                {(users ?? []).map((u: Pick<UserRow, 'id' | 'name' | 'country' | 'total_score'>, index: number) => {
                  const isCurrentUser = u.id === user?.id
                  return (
                    <tr
                      key={u.id}
                      className={`transition-colors group ${
                        isCurrentUser
                          ? 'bg-primary/5'
                          : 'hover:bg-slate-50'
                      }`}
                    >
                      <td className="px-6 py-4">
                        {index === 0 ? '🥇' : index === 1 ? '🥈' : index === 2 ? '🥉' : (
                          <span className="text-slate-400 tabular-nums font-mono text-xs">
                            #{index + 1}
                          </span>
                        )}
                      </td>
                      <td className="px-6 py-4">
                        <div className="flex items-center gap-3">
                          <div className={`w-8 h-8 rounded-lg flex items-center justify-center text-[10px] font-black text-white shrink-0 overflow-hidden
                            ${isCurrentUser ? 'bg-primary' : 'bg-slate-800'}`}>
                            {getInitials(u.name)}
                          </div>
                          <div className="flex flex-col">
                            <span className="font-bold text-slate-900">
                              {u.name}
                              {isCurrentUser && (
                                <span className="ml-2 text-[10px] bg-primary/10 text-primary px-1.5 py-0.5 rounded uppercase font-black">You</span>
                              )}
                            </span>
                          </div>
                        </div>
                      </td>
                      <td className="px-6 py-4 hidden sm:table-cell text-slate-500 text-xs font-medium">
                        {u.country || 'Global'}
                      </td>
                      <td className="px-6 py-4 text-right">
                        <span className={`font-black tabular-nums tracking-tighter ${isCurrentUser ? 'text-primary' : 'text-slate-900'}`}>
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
          <div className="text-center py-24 bg-white rounded-3xl border border-dashed border-slate-200 shadow-sm">
            <Trophy className="w-12 h-12 text-slate-200 mx-auto mb-4" />
            <p className="text-slate-400 font-medium">No scores recorded yet. Be the first!</p>
          </div>
        )}

        {!user && (
          <div className="rounded-[2.5rem] bg-slate-900 p-12 text-center space-y-6 relative overflow-hidden shadow-2xl">
            <div className="absolute top-0 right-0 w-64 h-64 bg-primary/10 rounded-full blur-[100px] -mr-32 -mt-32" />
            <div className="relative z-10 space-y-4">
              <h3 className="text-3xl font-black text-white tracking-tight">Want to join the ranking?</h3>
              <p className="text-slate-400 text-lg max-w-md mx-auto leading-relaxed">
                Create your free account now and start earning points by completing lessons and passing quizzes.
              </p>
              <div className="pt-4">
                <Link 
                  href="/?auth=register"
                  className="inline-flex h-14 items-center justify-center rounded-2xl bg-primary px-10 text-lg font-bold text-white shadow-2xl shadow-primary/30 hover:bg-primary/90 transition-all hover:scale-105 active:scale-95"
                >
                  Create my account now
                </Link>
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  )
}
