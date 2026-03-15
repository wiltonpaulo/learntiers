'use client'

import { useCallback, useEffect, useImperativeHandle, useRef, useState, forwardRef } from 'react'
import ReactPlayer from 'react-player'
import { Badge } from '@/components/ui/badge'
import { Progress } from '@/components/ui/progress'

// ─── Types ────────────────────────────────────────────────────────────────────

export interface SlicedYouTubePlayerProps {
  /** YouTube video ID, e.g. "dQw4w9WgXcQ" */
  ytVideoId: string
  /** Second at which playback begins */
  startTimeSeconds: number
  /** Second at which playback must stop — fires onSectionEnd */
  endTimeSeconds: number
  /** Called when the player reaches endTimeSeconds */
  onSectionEnd?: () => void
  /** Called when the user manually pauses (optional) */
  onPause?: () => void
  /** Called periodically with current playback time in seconds */
  onTimeUpdate?: (currentTime: number) => void
  /** Whether the section has already been completed by this user */
  isCompleted?: boolean
}

export interface SlicedYouTubePlayerRef {
  seekTo: (seconds: number) => void
}

// ─── Constants ────────────────────────────────────────────────────────────────

const POLL_INTERVAL_MS = 100 // increased frequency for better sync

// ─── Component ────────────────────────────────────────────────────────────────

/**
 * SlicedYouTubePlayer
 *
 * Core business rule: plays only the window [startTimeSeconds, endTimeSeconds]
 * of a YouTube video. When the player reaches endTimeSeconds it pauses
 * automatically and fires `onSectionEnd` — preventing the student from
 * watching beyond the curated micro-lesson.
 */
export const SlicedYouTubePlayer = forwardRef<SlicedYouTubePlayerRef, SlicedYouTubePlayerProps>(
  ({
    ytVideoId,
    startTimeSeconds,
    endTimeSeconds,
    onSectionEnd,
    onPause,
    onTimeUpdate,
    isCompleted = false,
  }, ref) => {
    const playerRef = useRef<InstanceType<typeof ReactPlayer>>(null)
    const pollerRef = useRef<ReturnType<typeof setInterval> | null>(null)

    const [playing, setPlaying] = useState(false)
    const [ready, setReady] = useState(false)
    const [sectionEnded, setSectionEnded] = useState(isCompleted)
    const [progress, setProgress] = useState(0) // 0–100

    const sectionDuration = endTimeSeconds - startTimeSeconds

    useImperativeHandle(ref, () => ({
      seekTo: (seconds: number) => {
        playerRef.current?.seekTo(seconds, 'seconds')
        setPlaying(true)
        setSectionEnded(false)
      }
    }))

    // ── Seek to start once player is ready ────────────────────────────────────
    const handleReady = useCallback(() => {
      playerRef.current?.seekTo(startTimeSeconds, 'seconds')
      setReady(true)
      setPlaying(true)
    }, [startTimeSeconds])

    // ── Poll playback position ────────────────────────────────────────────────
    useEffect(() => {
      if (!ready) return

      pollerRef.current = setInterval(() => {
        const player = playerRef.current
        if (!player) return

        const currentTime = player.getCurrentTime()
        onTimeUpdate?.(currentTime)

        // Guard: if the user somehow seeked before the start window, snap back.
        if (currentTime < startTimeSeconds) {
          player.seekTo(startTimeSeconds, 'seconds')
          return
        }

        const elapsed = currentTime - startTimeSeconds
        const pct = Math.min((elapsed / sectionDuration) * 100, 100)
        setProgress(pct)

        // ★ Core rule: stop at end_time_seconds
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
    }, [ready, startTimeSeconds, endTimeSeconds, sectionDuration, onSectionEnd, onTimeUpdate])

    // ── Prevent seeking past the end window ───────────────────────────────────
    const handleSeek = useCallback(
      (seconds: number) => {
        if (seconds > endTimeSeconds) {
          playerRef.current?.seekTo(startTimeSeconds, 'seconds')
        }
      },
      [startTimeSeconds, endTimeSeconds],
    )

    const handlePause = useCallback(() => {
      setPlaying(false)
      onPause?.()
    }, [onPause])

    const handlePlay = useCallback(() => {
      // Don't allow re-play after section has ended unless the caller resets
      if (!sectionEnded) setPlaying(true)
    }, [sectionEnded])

    const youtubeUrl = `https://www.youtube.com/watch?v=${ytVideoId}`

    return (
      <div className="flex flex-col gap-3 w-full">
        {/* Player wrapper */}
        <div className="relative w-full aspect-video rounded-xl overflow-hidden bg-black shadow-lg">
          <ReactPlayer
            ref={playerRef}
            url={youtubeUrl}
            playing={playing}
            controls={true}
            width="100%"
            height="100%"
            onReady={handleReady}
            onPlay={handlePlay}
            onPause={handlePause}
            onSeek={handleSeek}
            config={{
              youtube: {
                playerVars: {
                  // Start at section start — our poller is the authoritative gate for end
                  start: startTimeSeconds,
                  end: endTimeSeconds,
                  rel: 0,             // no related videos at the end
                  modestbranding: 1,
                },
              },
            }}
          />

          {/* Overlay shown when section ends */}
          {sectionEnded && (
            <div className="absolute inset-0 flex flex-col items-center justify-center bg-black/70 gap-3">
              <Badge variant="secondary" className="text-base px-4 py-2">
                ✅ Section complete — answer the quiz to continue!
              </Badge>
            </div>
          )}
        </div>

        {/* Progress bar */}
        <div className="flex items-center gap-3">
          <Progress value={progress} className="flex-1 h-2" />
          <span className="text-xs text-muted-foreground tabular-nums whitespace-nowrap">
            {formatTime(startTimeSeconds + (sectionDuration * progress) / 100)} /{' '}
            {formatTime(endTimeSeconds)}
          </span>
        </div>
      </div>
    )
  }
)

SlicedYouTubePlayer.displayName = 'SlicedYouTubePlayer'

// ─── Helpers ──────────────────────────────────────────────────────────────────

function formatTime(totalSeconds: number): string {
  const s = Math.floor(totalSeconds)
  const h = Math.floor(s / 3600)
  const m = Math.floor((s % 3600) / 60)
  const sec = s % 60
  const pad = (n: number) => String(n).padStart(2, '0')
  return h > 0 ? `${pad(h)}:${pad(m)}:${pad(sec)}` : `${pad(m)}:${pad(sec)}`
}
