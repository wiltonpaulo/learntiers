'use client'

import { useCallback, useEffect, useImperativeHandle, useRef, useState, forwardRef } from 'react'
import ReactPlayer from 'react-player'
import { Button } from '@/components/ui/button'
import { CheckCircle, RotateCcw, ArrowRight } from 'lucide-react'

// ─── Types ────────────────────────────────────────────────────────────────────

export interface SlicedYouTubePlayerProps {
  ytVideoId: string
  startTimeSeconds: number
  endTimeSeconds: number
  onSectionEnd?: () => void
  onPause?: () => void
  onTimeUpdate?: (currentTime: number) => void
  isCompleted?: boolean
  onNextSection?: () => void 
}

export interface SlicedYouTubePlayerRef {
  seekTo: (seconds: number) => void
}

// ─── Constants ────────────────────────────────────────────────────────────────

const POLL_INTERVAL_MS = 100 

export const SlicedYouTubePlayer = forwardRef<SlicedYouTubePlayerRef, SlicedYouTubePlayerProps>(
  ({
    ytVideoId,
    startTimeSeconds,
    endTimeSeconds,
    onSectionEnd,
    onPause,
    onTimeUpdate,
    isCompleted = false,
    onNextSection,
  }, ref) => {
    const playerRef = useRef<InstanceType<typeof ReactPlayer>>(null)
    const pollerRef = useRef<ReturnType<typeof setInterval> | null>(null)

    const [playing, setPlaying] = useState(false)
    const [ready, setReady] = useState(false)
    const [sectionEnded, setSectionEnded] = useState(isCompleted)
    const [elapsedLocal, setElapsedLocal] = useState(0) // Seconds relative to start
    const [isDragging, setIsDragging] = useState(false)

    const sectionDuration = endTimeSeconds - startTimeSeconds
    const progress = (elapsedLocal / sectionDuration) * 100

    useImperativeHandle(ref, () => ({
      seekTo: (seconds: number) => {
        setSectionEnded(false)
        setTimeout(() => {
          playerRef.current?.seekTo(seconds, 'seconds')
          setPlaying(true)
        }, 50)
      }
    }))

    const handleRestart = useCallback(() => {
      setSectionEnded(false)
      setElapsedLocal(0)
      setReady(false)
    }, [])

    const handleReady = useCallback(() => {
      playerRef.current?.seekTo(startTimeSeconds, 'seconds')
      setReady(true)
      setPlaying(true)
    }, [startTimeSeconds])

    // ── Polling Position ──────────────────────────────────────────────────────
    useEffect(() => {
      if (!ready || sectionEnded || isDragging) return

      pollerRef.current = setInterval(() => {
        const player = playerRef.current
        if (!player) return

        const currentTime = player.getCurrentTime()
        onTimeUpdate?.(currentTime)

        if (currentTime < startTimeSeconds) {
          player.seekTo(startTimeSeconds, 'seconds')
          return
        }

        const elapsed = currentTime - startTimeSeconds
        setElapsedLocal(elapsed)

        if (currentTime >= endTimeSeconds) {
          setPlaying(false)
          setSectionEnded(true)
          onSectionEnd?.()
          
          if (pollerRef.current) {
            clearInterval(pollerRef.current)
            pollerRef.current = null
          }
        }
      }, POLL_INTERVAL_MS)

      return () => {
        if (pollerRef.current) clearInterval(pollerRef.current)
      }
    }, [ready, sectionEnded, startTimeSeconds, endTimeSeconds, sectionDuration, onSectionEnd, onTimeUpdate, isDragging])

    const handleSeek = useCallback(
      (seconds: number) => {
        if (seconds > endTimeSeconds) {
          playerRef.current?.seekTo(startTimeSeconds, 'seconds')
        }
      },
      [startTimeSeconds, endTimeSeconds],
    )

    // ── Interaction Handlers ──────────────────────────────────────────────────
    const handleSliderChange = (e: React.ChangeEvent<HTMLInputElement>) => {
      const pct = parseFloat(e.target.value)
      const newElapsed = (pct / 100) * sectionDuration
      setElapsedLocal(newElapsed)
    }

    const handleSliderChangeEnd = (e: React.MouseEvent | React.TouchEvent | React.ChangeEvent<HTMLInputElement>) => {
      setIsDragging(false)
      const pct = parseFloat((e.target as HTMLInputElement).value)
      const absoluteSeconds = startTimeSeconds + (pct / 100) * sectionDuration
      playerRef.current?.seekTo(absoluteSeconds, 'seconds')
    }

    const youtubeUrl = `https://www.youtube.com/watch?v=${ytVideoId}`

    return (
      <div className="flex flex-col gap-3 w-full">
        <div className="relative w-full aspect-video rounded-xl overflow-hidden bg-slate-900 shadow-2xl border border-white/5">
          
          {!sectionEnded ? (
            <ReactPlayer
              ref={playerRef}
              url={youtubeUrl}
              playing={playing}
              controls={true}
              width="100%"
              height="100%"
              onReady={handleReady}
              onPlay={() => setPlaying(true)}
              onPause={() => { setPlaying(false); onPause?.(); }}
              onSeek={handleSeek}
              config={{
                youtube: {
                  playerVars: {
                    start: startTimeSeconds,
                    end: endTimeSeconds,
                    rel: 0,
                    modestbranding: 1,
                    iv_load_policy: 3,
                  },
                },
              }}
            />
          ) : (
            <div className="absolute inset-0 flex flex-col items-center justify-center bg-slate-900 animate-in fade-in zoom-in duration-500 text-center px-6">
              <div className="w-20 h-20 bg-emerald-500/10 rounded-full flex items-center justify-center mb-4">
                <CheckCircle className="w-12 h-12 text-emerald-500" />
              </div>
              
              <h2 className="text-2xl md:text-3xl font-bold text-white mb-2">
                Section Completed!
              </h2>
              
              <p className="text-slate-400 text-sm md:text-base max-w-md mb-8">
                You have finished this topic. Test your knowledge in the quiz below or move to the next lesson.
              </p>

              <div className="flex flex-wrap items-center justify-center gap-3">
                <Button 
                  variant="outline" 
                  onClick={handleRestart}
                  className="bg-transparent border-slate-700 text-slate-300 hover:bg-slate-800 hover:text-white"
                >
                  <RotateCcw className="w-4 h-4 mr-2" />
                  Retake Lesson
                </Button>
                
                {onNextSection && (
                  <Button 
                    onClick={onNextSection}
                    className="bg-primary hover:bg-primary/90 text-white font-bold"
                  >
                    Next Topic
                    <ArrowRight className="w-4 h-4 ml-2" />
                  </Button>
                )}
              </div>
            </div>
          )}
        </div>

        {!sectionEnded && (
          <div className="flex items-center gap-3 px-1">
            {/* Timer - plain text */}
            <div className="text-[11px] font-bold font-mono text-muted-foreground tabular-nums shrink-0">
              {formatTime(elapsedLocal)} / {formatTime(sectionDuration)}
            </div>

            {/* Interactive Slider */}
            <div className="relative flex-1 h-1.5 flex items-center group">
              <input
                type="range"
                min="0"
                max="100"
                step="0.1"
                value={progress}
                onMouseDown={() => setIsDragging(true)}
                onTouchStart={() => setIsDragging(true)}
                onChange={handleSliderChange}
                onMouseUp={handleSliderChangeEnd}
                onTouchEnd={handleSliderChangeEnd}
                className="absolute inset-0 w-full h-1.5 bg-slate-200 dark:bg-slate-800 rounded-full appearance-none cursor-pointer accent-primary focus:outline-none z-10"
                style={{
                  background: `linear-gradient(to right, var(--color-primary) ${progress}%, var(--color-muted) ${progress}%)`
                }}
              />
            </div>

            {/* Percentage - plain text */}
            <span className="text-[11px] font-bold font-mono text-muted-foreground tabular-nums shrink-0">
              {progress.toFixed(0)}%
            </span>
          </div>
        )}
      </div>
    )
  }
)

SlicedYouTubePlayer.displayName = 'SlicedYouTubePlayer'

// ─── Helpers ──────────────────────────────────────────────────────────────────

function formatTime(totalSeconds: number): string {
  const s = Math.max(0, Math.floor(totalSeconds))
  const h = Math.floor(s / 3600)
  const m = Math.floor((s % 3600) / 60)
  const sec = s % 60
  
  const pad = (n: number) => String(n).padStart(2, '0')
  
  if (h > 0) {
    return `${pad(h)}:${pad(m)}:${pad(sec)}`
  }
  return `${pad(m)}:${pad(sec)}`
}
