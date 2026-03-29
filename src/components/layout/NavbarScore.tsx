"use client"

import * as React from "react"
import { createClient } from "@/lib/supabase/client"
import { ScoreHoverCard } from "@/components/dashboard/ScoreHoverCard"
import type { UserRow, UserProgressRow } from "@/types/database"

export function NavbarScore({ userId }: { userId: string }) {
  const [data, setData] = React.useState<{
    totalScore: number
    completedLessons: number
    avgQuizScore: number
  } | null>(null)
  
  const supabase = createClient()

  React.useEffect(() => {
    const fetchScore = async () => {
      const [profileRes, progressRes] = await Promise.all([
        supabase.from('users').select('total_score').eq('id', userId).single(),
        supabase.from('user_progress').select('is_completed, quiz_score').eq('user_id', userId)
      ])
      
      const profile = profileRes.data as { total_score: number } | null
      const progress = (progressRes.data || []) as UserProgressRow[]
      
      const completedLessons = progress.filter(p => p.is_completed).length
      const quizScores = progress.map(p => p.quiz_score || 0).filter(s => s > 0)
      const avgQuizScore = quizScores.length > 0 
        ? Math.round(quizScores.reduce((a, b) => a + b, 0) / quizScores.length) 
        : 0
        
      setData({
        totalScore: profile?.total_score ?? 0,
        completedLessons,
        avgQuizScore
      })
    }

    fetchScore()
  }, [userId, supabase])

  if (!data) return <div className="w-16 h-8 animate-pulse bg-white/5 rounded-full" />

  return (
    <ScoreHoverCard 
      totalScore={data.totalScore}
      completedLessons={data.completedLessons}
      avgQuizScore={data.avgQuizScore}
    />
  )
}
