"use client"

import * as React from "react"
import { Trophy, BookOpen, Zap } from "lucide-react"
import {
  HoverCard,
  HoverCardContent,
  HoverCardTrigger,
} from "@/components/ui/hover-card"
import { cn } from "@/lib/utils"

interface ScoreHoverCardProps {
  totalScore: number
  completedLessons: number
  avgQuizScore: number
}

export function ScoreHoverCard({ 
  totalScore, 
  completedLessons, 
  avgQuizScore 
}: ScoreHoverCardProps) {
  const [isOpen, setIsOpen] = React.useState(false)

  return (
    <HoverCard openDelay={0} closeDelay={150} open={isOpen} onOpenChange={setIsOpen}>
      <HoverCardTrigger asChild>
        <button className={cn(
          "outline-none rounded-full transition-all duration-300 flex items-center gap-1.5 px-3 py-1 shrink-0",
          isOpen ? "bg-white text-slate-900 shadow-lg" : "bg-white/10 text-white hover:bg-white/20"
        )}>
          <Trophy className={cn("w-3.5 h-3.5 transition-colors", isOpen ? "text-yellow-600" : "text-yellow-400")} />
          <span className="text-xs font-bold tabular-nums">
            {totalScore.toLocaleString()}
          </span>
        </button>
      </HoverCardTrigger>
      
      <HoverCardContent 
        className="w-64 bg-white border-slate-200 shadow-2xl p-0 rounded-2xl overflow-hidden animate-in fade-in zoom-in-95 duration-200 before:absolute before:inset-x-0 before:-top-4 before:h-4 before:content-['']" 
        align="center" 
        sideOffset={12}
      >
        <div className="p-4 space-y-4">
          <div className="flex items-center gap-2 pb-2 border-b border-slate-100">
            <Trophy className="w-4 h-4 text-yellow-500" />
            <span className="text-sm font-bold text-slate-900">Your Performance</span>
          </div>

          <div className="space-y-3">
            <StatRow 
              icon={<Zap className="w-4 h-4 text-primary" />} 
              label="Total Score" 
              value={`${totalScore.toLocaleString()} pts`}
              subValue="Global rank points"
            />
            <StatRow 
              icon={<BookOpen className="w-4 h-4 text-blue-500" />} 
              label="Lessons Done" 
              value={String(completedLessons)}
              subValue="Videos completed"
            />
            <StatRow 
              icon={<Trophy className="w-4 h-4 text-emerald-500" />} 
              label="Avg Quiz Score" 
              value={`${avgQuizScore}%`}
              subValue="Correct answers"
            />
          </div>
        </div>
        
        <div className="bg-slate-50 px-4 py-2.5 border-t border-slate-100 text-center">
          <p className="text-[10px] font-bold text-slate-400 uppercase tracking-widest">Keep learning to rank up!</p>
        </div>
      </HoverCardContent>
    </HoverCard>
  )
}

function StatRow({ 
  icon, 
  label, 
  value, 
  subValue 
}: { 
  icon: React.ReactNode, 
  label: string, 
  value: string, 
  subValue: string 
}) {
  return (
    <div className="flex items-start gap-3">
      <div className="mt-0.5 p-1.5 rounded-lg bg-slate-50 border border-slate-100">
        {icon}
      </div>
      <div className="flex-1">
        <div className="flex items-baseline justify-between">
          <span className="text-xs font-bold text-slate-600">{label}</span>
          <span className="text-sm font-black text-slate-900 tabular-nums">{value}</span>
        </div>
        <p className="text-[10px] text-slate-400 font-medium">{subValue}</p>
      </div>
    </div>
  )
}
