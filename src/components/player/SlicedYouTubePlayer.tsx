'use client'

import { useCallback, useEffect, useImperativeHandle, useRef, useState, forwardRef } from 'react'
import ReactPlayer from 'react-player'
import { Button } from '@/components/ui/button'
import { CheckCircle, RotateCcw, ArrowRight, Play, Pause, Volume2, VolumeX, Monitor, Square, Gauge, Sparkles, Maximize, Columns } from 'lucide-react'
import { cn } from '@/lib/utils'
import { useSectionLayout } from '@/components/course/SectionLayoutClient'

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
  isTheaterMode?: boolean
  toggleTheater?: () => void
}

export interface SlicedYouTubePlayerRef {
  seekTo: (seconds: number) => void
}

const POLL_INTERVAL_MS = 100 
const SPEEDS = [1, 1.25, 1.5, 2]

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
    isTheaterMode = false,
    toggleTheater,
  }, ref) => {
    const playerRef = useRef<InstanceType<typeof ReactPlayer>>(null)
    const pollerRef = useRef<ReturnType<typeof setInterval> | null>(null)
    const containerRef = useRef<HTMLDivElement>(null)
    
    const { isCinemaMode, setIsCinemaMode, isAISidebarOpen, setIsAISidebarOpen } = useSectionLayout()

    const [hasMounted, setHasMounted] = useState(false)
    const [playing, setPlaying] = useState(false)
    const [volume, setVolume] = useState(0.8)
    const [playbackRate, setPlaybackRate] = useState(1)
    const [muted, setMuted] = useState(false)
    const [ready, setReady] = useState(false)
    const [sectionEnded, setSectionEnded] = useState(isCompleted)
    const [elapsedLocal, setElapsedLocal] = useState(0)
    const [isDragging, setIsDragging] = useState(false)

    useEffect(() => {
      setHasMounted(true)
    }, [])

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
          if (pollerRef.current) clearInterval(pollerRef.current)
        }
      }, POLL_INTERVAL_MS)

      return () => {
        if (pollerRef.current) clearInterval(pollerRef.current)
      }
    }, [ready, sectionEnded, startTimeSeconds, endTimeSeconds, sectionDuration, onSectionEnd, onTimeUpdate, isDragging])

    const handleSliderChange = (e: React.ChangeEvent<HTMLInputElement>) => {
      const pct = parseFloat(e.target.value)
      const newElapsed = (pct / 100) * sectionDuration
      setElapsedLocal(newElapsed)
    }

    const handleSliderChangeEnd = (e: any) => {
      setIsDragging(false)
      const pct = parseFloat(e.target.value)
      const absoluteSeconds = startTimeSeconds + (pct / 100) * sectionDuration
      playerRef.current?.seekTo(absoluteSeconds, 'seconds')
    }

    const toggleSpeed = () => {
      const currentIndex = SPEEDS.indexOf(playbackRate)
      const nextIndex = (currentIndex + 1) % SPEEDS.length
      setPlaybackRate(SPEEDS[nextIndex])
    }

    const handleFullscreen = () => {
      if (!containerRef.current) return
      if (document.fullscreenElement) {
        document.exitFullscreen()
      } else {
        containerRef.current.requestFullscreen()
      }
    }

    const youtubeUrl = `https://www.youtube.com/watch?v=${ytVideoId}`

    return (
      <div ref={containerRef} className="flex flex-col gap-3 w-full bg-white dark:bg-slate-950 group/player">
        <div className={cn(
          "relative w-full aspect-video overflow-hidden bg-white dark:bg-slate-900 shadow-2xl transition-all duration-300",
          (!isTheaterMode && !isCinemaMode) ? "rounded-xl border border-slate-200 dark:border-white/5" : "rounded-none"
        )}>
          {!sectionEnded ? (
            hasMounted ? (
              <ReactPlayer
                ref={playerRef}
                url={youtubeUrl}
                playing={playing}
                volume={volume}
                muted={muted}
                playbackRate={playbackRate}
                controls={false}
                width="100%"
                height="100%"
                onReady={handleReady}
                config={{ youtube: { playerVars: { start: startTimeSeconds, end: endTimeSeconds, rel: 0, modestbranding: 1 } } }}
              />
            ) : (
              <div className="w-full h-full bg-slate-900 animate-pulse" />
            )
          ) : (
            <div className="absolute inset-0 flex flex-col items-center justify-center bg-white dark:bg-slate-900 text-center px-6 animate-in fade-in duration-500">
              <div className="w-16 h-16 bg-emerald-500/10 rounded-full flex items-center justify-center mb-4">
                <CheckCircle className="w-10 h-10 text-emerald-500" />
              </div>
              <h2 className="text-xl font-bold text-slate-900 dark:text-white mb-1">Section Completed!</h2>
              <p className="text-slate-500 dark:text-slate-400 text-xs max-w-xs mb-6">Test your knowledge below or move to the next lesson.</p>
              <div className="flex gap-3">
                <Button variant="outline" size="sm" onClick={handleRestart} className="bg-white dark:bg-transparent border-slate-200 dark:border-slate-700 text-slate-600 dark:text-slate-300">
                  <RotateCcw className="w-3.5 h-3.5 mr-2" /> Retake
                </Button>
                {onNextSection && (
                  <Button size="sm" onClick={onNextSection} className="bg-primary hover:bg-primary/90 text-white font-bold shadow-lg">
                    Next Topic <ArrowRight className="w-3.5 h-3.5 ml-2" />
                  </Button>
                )}
              </div>
            </div>
          )}
        </div>

        {/* Console de Controlos */}
        {!sectionEnded && (
          <div className="flex items-center gap-4 px-4 py-2 bg-white dark:bg-slate-950 border border-slate-200 dark:border-white/10 rounded-xl shadow-sm relative">
            {/* Play/Pause */}
            <Button 
              variant="ghost" 
              size="icon" 
              className="h-9 w-9 text-slate-600 hover:text-primary transition-colors shrink-0"
              onClick={() => setPlaying(!playing)}
            >
              {playing ? <Pause className="w-5 h-5 fill-current" /> : <Play className="w-5 h-5 fill-current" />}
            </Button>

            {/* Volume Control */}
            <div className="relative group shrink-0">
              <Button 
                variant="ghost" 
                size="icon" 
                className="h-9 w-9 text-slate-500 hover:text-primary transition-colors"
                onClick={() => setMuted(!muted)}
              >
                {muted || volume === 0 ? <VolumeX className="w-5 h-5 text-destructive" /> : <Volume2 className="w-5 h-5" />}
              </Button>
              
              <div className="absolute bottom-full left-1/2 -translate-x-1/2 pb-2 hidden group-hover:flex flex-col items-center z-50 animate-in fade-in slide-in-from-bottom-1 duration-200">
                <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-white/10 p-3 rounded-lg shadow-xl flex flex-col items-center">
                  <div className="h-24 w-6 relative flex items-center justify-center">
                    <input
                      type="range" min="0" max="1" step="0.01"
                      value={muted ? 0 : volume}
                      onChange={(e) => {
                        setVolume(parseFloat(e.target.value))
                        if (muted) setMuted(false)
                      }}
                      style={{
                        appearance: 'none',
                        width: '80px',
                        height: '4px',
                        background: `linear-gradient(to right, var(--color-primary) ${(muted ? 0 : volume) * 100}%, #f1f5f9 ${(muted ? 0 : volume) * 100}%)`,
                        transform: 'rotate(-90deg)',
                        cursor: 'pointer',
                        borderRadius: '10px'
                      }}
                      className="accent-primary"
                    />
                  </div>
                  <span className="text-[9px] font-bold text-slate-500 mt-1">{Math.round((muted ? 0 : volume) * 100)}%</span>
                </div>
              </div>
            </div>

            {/* Timer */}
            <div className="text-[11px] font-bold font-mono text-slate-500 tabular-nums shrink-0">
              {formatTime(elapsedLocal)} / {formatTime(sectionDuration)}
            </div>

            {/* Interactive Progress Slider */}
            <div className="relative flex-1 h-1 flex items-center group">
              <input
                type="range" min="0" max="100" step="0.1"
                value={progress}
                onMouseDown={() => setIsDragging(true)}
                onTouchStart={() => setIsDragging(true)}
                onChange={handleSliderChange}
                onMouseUp={handleSliderChangeEnd}
                onTouchEnd={handleSliderChangeEnd}
                className="absolute inset-0 w-full h-1 bg-slate-100 dark:bg-slate-800 rounded-full appearance-none cursor-pointer accent-primary z-10"
                style={{ background: `linear-gradient(to right, var(--color-primary) ${progress}%, #f1f5f9 ${progress}%)` }}
              />
            </div>

            {/* Speed Selector */}
            <Button 
              variant="ghost" 
              size="sm" 
              onClick={toggleSpeed}
              className="h-8 px-2 text-[10px] font-bold text-slate-500 hover:text-primary gap-1 shrink-0"
            >
              <Gauge className="w-3.5 h-3.5" />
              {playbackRate}x
            </Button>

            {/* Percentage */}
            <span className="text-[11px] font-bold font-mono text-slate-400 tabular-nums shrink-0">
              {progress.toFixed(0)}%
            </span>

            <div className="flex items-center gap-1 border-l pl-3 ml-1 border-slate-100 dark:border-white/10 shrink-0">
              {/* ✨ Ask AI Button */}
              {!isAISidebarOpen && !isCinemaMode && (
                <Button 
                  variant="ghost" 
                  size="icon" 
                  onClick={() => setIsAISidebarOpen(true)}
                  className="h-9 w-9 text-primary hover:bg-primary/5"
                  title="AI Tutor"
                >
                  <Sparkles className="w-4 h-4 fill-primary" />
                </Button>
              )}

              {/* Theater Mode Button (Stretches borders) */}
              <Button 
                variant="ghost" 
                size="icon" 
                className={cn("h-9 w-9", isTheaterMode && !isCinemaMode ? "text-primary bg-primary/5" : "text-slate-400")}
                onClick={() => {
                  if (isCinemaMode) setIsCinemaMode(false)
                  toggleTheater?.()
                }}
                title="Theater mode"
              >
                {isTheaterMode ? <Square className="w-4 h-4" /> : <Monitor className="w-4 h-4" />}
              </Button>

              {/* Cinema Mode Button (Transcript on the side) */}
              <Button 
                variant="ghost" 
                size="icon" 
                className={cn("h-9 w-9", isCinemaMode ? "text-primary bg-primary/5" : "text-slate-400")}
                onClick={() => {
                  if (isTheaterMode) toggleTheater?.()
                  setIsCinemaMode(!isCinemaMode)
                }}
                title="Cinema mode"
              >
                <Columns className="w-4 h-4" />
              </Button>

              {/* REAL Fullscreen Button (Whole screen) */}
              <Button 
                variant="ghost" 
                size="icon" 
                className="h-9 w-9 text-slate-400"
                onClick={handleFullscreen}
                title="Full screen"
              >
                <Maximize className="w-4 h-4" />
              </Button>
            </div>
          </div>
        )}
      </div>
    )
  }
)

SlicedYouTubePlayer.displayName = 'SlicedYouTubePlayer'

function formatTime(totalSeconds: number): string {
  const s = Math.max(0, Math.floor(totalSeconds))
  const h = Math.floor(s / 3600)
  const m = Math.floor((s % 3600) / 60)
  const sec = s % 60
  const pad = (n: number) => String(n).padStart(2, '0')
  return h > 0 ? `${pad(h)}:${pad(m)}:${pad(sec)}` : `${pad(m)}:${pad(sec)}`
}
