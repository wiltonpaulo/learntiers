'use client'

import { useCallback, useEffect, useImperativeHandle, useRef, useState, forwardRef } from 'react'
import ReactPlayer from 'react-player'
import { Badge } from '@/components/ui/badge'
import { Progress } from '@/components/ui/progress'
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
  onNextSection?: () => void // Callback para o botão de próximo tópico
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
    const [progress, setProgress] = useState(isCompleted ? 100 : 0)

    const sectionDuration = endTimeSeconds - startTimeSeconds

    useImperativeHandle(ref, () => ({
      seekTo: (seconds: number) => {
        setSectionEnded(false)
        // Pequeno delay para garantir que o player foi re-renderizado antes do seek
        setTimeout(() => {
          playerRef.current?.seekTo(seconds, 'seconds')
          setPlaying(true)
        }, 50)
      }
    }))

    const handleRestart = useCallback(() => {
      setSectionEnded(false)
      setProgress(0)
      setReady(false) // Força o re-trigger do onReady
    }, [])

    const handleReady = useCallback(() => {
      playerRef.current?.seekTo(startTimeSeconds, 'seconds')
      setReady(true)
      setPlaying(true)
    }, [startTimeSeconds])

    // ── Polling de posição ────────────────────────────────────────────────────
    useEffect(() => {
      if (!ready || sectionEnded) return

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
        const pct = Math.min((elapsed / sectionDuration) * 100, 100)
        setProgress(pct)

        // ★ Gatilho de Conclusão
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
    }, [ready, sectionEnded, startTimeSeconds, endTimeSeconds, sectionDuration, onSectionEnd, onTimeUpdate])

    const handleSeek = useCallback(
      (seconds: number) => {
        if (seconds > endTimeSeconds) {
          playerRef.current?.seekTo(startTimeSeconds, 'seconds')
        }
      },
      [startTimeSeconds, endTimeSeconds],
    )

    const youtubeUrl = `https://www.youtube.com/watch?v=${ytVideoId}`

    return (
      <div className="flex flex-col gap-4 w-full">
        {/* Proporção 16:9 Fixa */}
        <div className="relative w-full aspect-video rounded-xl overflow-hidden bg-slate-900 shadow-2xl border border-white/5">
          
          {!sectionEnded ? (
            /* PLAYER ATIVO */
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
                    iv_load_policy: 3, // Oculta anotações
                  },
                },
              }}
            />
          ) : (
            /* INTERFACE DE CONCLUSÃO (Player Desmontado) */
            <div className="absolute inset-0 flex flex-col items-center justify-center bg-slate-900 animate-in fade-in zoom-in duration-500 text-center px-6">
              <div className="w-20 h-20 bg-emerald-500/10 rounded-full flex items-center justify-center mb-4">
                <CheckCircle className="w-12 h-12 text-emerald-500" />
              </div>
              
              <h2 className="text-2xl md:text-3xl font-bold text-white mb-2">
                Seção Concluída!
              </h2>
              
              <p className="text-slate-400 text-sm md:text-base max-w-md mb-8">
                Você finalizou este tópico. Teste seus conhecimentos no quiz abaixo ou avance para a próxima aula.
              </p>

              <div className="flex flex-wrap items-center justify-center gap-3">
                <Button 
                  variant="outline" 
                  onClick={handleRestart}
                  className="bg-transparent border-slate-700 text-slate-300 hover:bg-slate-800 hover:text-white"
                >
                  <RotateCcw className="w-4 h-4 mr-2" />
                  Refazer Aula
                </Button>
                
                {onNextSection && (
                  <Button 
                    onClick={onNextSection}
                    className="bg-primary hover:bg-primary/90 text-white font-bold"
                  >
                    Próximo Tópico
                    <ArrowRight className="w-4 h-4 ml-2" />
                  </Button>
                )}
              </div>
            </div>
          )}
        </div>

        {/* Barra de Progresso customizada */}
        {!sectionEnded && (
          <div className="flex items-center gap-3 px-1">
            <Progress value={progress} className="flex-1 h-1.5 bg-slate-800" />
            <span className="text-[10px] font-mono text-slate-500 tabular-nums uppercase tracking-widest">
              {progress.toFixed(0)}% completo
            </span>
          </div>
        )}
      </div>
    )
  }
)

SlicedYouTubePlayer.displayName = 'SlicedYouTubePlayer'
