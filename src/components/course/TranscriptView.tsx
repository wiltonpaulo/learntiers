'use client'

import { useRef, useEffect } from 'react'
import { cn } from '@/lib/utils'

interface TranscriptSegment {
  start: number
  end: number
  text: string
}

interface TranscriptViewProps {
  transcript: TranscriptSegment[]
  currentTime: number
  activeLineIndex: number
  onSeek: (seconds: number) => void
  isCinemaMode: boolean
}

export function TranscriptView({ 
  transcript, 
  currentTime, 
  activeLineIndex, 
  onSeek,
  isCinemaMode
}: TranscriptViewProps) {
  const scrollContainerRef = useRef<HTMLDivElement>(null)
  const transcriptRefs = useRef<(HTMLSpanElement | null)[]>([])

  // ── Trigger scroll only when activeLineIndex changes ────────────────────
  useEffect(() => {
    if (activeLineIndex !== -1 && scrollContainerRef.current) {
      const element = transcriptRefs.current[activeLineIndex]
      const container = scrollContainerRef.current
      
      if (element && container) {
        const elementOffset = element.offsetTop
        const elementHeight = element.offsetHeight
        const containerHeight = container.offsetHeight
        
        let targetScrollTop;
        if (isCinemaMode) {
          targetScrollTop = elementOffset - (containerHeight / 2) + (elementHeight / 2)
        } else {
          targetScrollTop = elementOffset - 50
        }
        
        container.scrollTo({ top: targetScrollTop, behavior: 'smooth' })
      }
    }
  }, [activeLineIndex, isCinemaMode])

  return (
    <div ref={scrollContainerRef} className={cn("overflow-y-auto p-6 custom-scrollbar relative h-full")}>
      <div className="block text-lg leading-relaxed text-justify px-4 py-4">
        {transcript.map((segment, i) => (
          <span
            key={i}
            ref={(el) => { transcriptRefs.current[i] = el }}
            onClick={() => onSeek(segment.start)}
            className={cn(
              "cursor-pointer transition-all duration-300 inline mr-1.5 px-1 py-0.5 rounded",
              i === activeLineIndex 
                ? "bg-primary text-primary-foreground font-bold shadow-sm scale-105 inline-block z-10" 
                : "text-muted-foreground hover:text-foreground hover:bg-muted/50"
            )}
          >
            {segment.text}
          </span>
        ))}
      </div>
    </div>
  )
}
