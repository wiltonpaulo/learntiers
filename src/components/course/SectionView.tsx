'use client'

import { useState, useCallback, useRef, useEffect } from 'react'
import { SlicedYouTubePlayer, SlicedYouTubePlayerRef } from '@/components/player/SlicedYouTubePlayer'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { ScrollArea } from '@/components/ui/scroll-area'
import { saveProgressAction } from '@/lib/actions/progress'

// ─── Types ────────────────────────────────────────────────────────────────────

export interface TranscriptSegment {
  start: number
  end: number
  text: string
}

interface SectionViewProps {
  sectionId: string
  ytVideoId: string
  startTimeSeconds: number
  endTimeSeconds: number
  textSummary: string | null
  transcript: TranscriptSegment[] | null
  quiz: {
    id: string
    questionText: string
    options: string[]
    correctAnswerIndex: number
  } | null
  initiallyCompleted: boolean
}

// ─── Component ────────────────────────────────────────────────────────────────

/**
 * SectionView — Client Component that owns the learning UX for a single section.
 */
export function SectionView({
  sectionId,
  ytVideoId,
  startTimeSeconds,
  endTimeSeconds,
  textSummary,
  transcript,
  quiz,
  initiallyCompleted,
}: SectionViewProps) {
  const [sectionEnded, setSectionEnded] = useState(initiallyCompleted)
  const [selectedIndex, setSelectedIndex] = useState<number | null>(null)
  const [submitted, setSubmitted] = useState(false)
  const [saving, setSaving] = useState(false)
  const [saveError, setSaveError] = useState<string | null>(null)
  const [activeTab, setActiveTab] = useState<'summary' | 'transcript'>('summary')
  const [currentTime, setCurrentTime] = useState(startTimeSeconds)

  const playerRef = useRef<SlicedYouTubePlayerRef>(null)
  const transcriptRefs = useRef<(HTMLDivElement | null)[]>([])

  // ── Sync transcript scroll ───────────────────────────────────────────────
  useEffect(() => {
    if (activeTab === 'transcript' && transcript) {
      const activeIndex = transcript.findIndex(
        (s) => currentTime >= s.start && currentTime <= s.end
      )
      if (activeIndex !== -1) {
        transcriptRefs.current[activeIndex]?.scrollIntoView({
          behavior: 'smooth',
          block: 'center',
        })
      }
    }
  }, [currentTime, activeTab, transcript])

  // ── When the sliced player reaches end_time ───────────────────────────────
  const handleSectionEnd = useCallback(async () => {
    setSectionEnded(true)

    // Persist completion (no quiz score yet) immediately
    const { error } = await saveProgressAction({
      sectionId,
      isCompleted: true,
      quizScore: undefined,
    })
    if (error) setSaveError(error)
  }, [sectionId])

  const handleTimeUpdate = useCallback((time: number) => {
    setCurrentTime(time)
  }, [])

  const handleTranscriptClick = (startTime: number) => {
    playerRef.current?.seekTo(startTime)
  }

  // ── Quiz submission ────────────────────────────────────────────────────────
  const handleSubmitQuiz = async () => {
    if (selectedIndex === null || !quiz) return
    setSaving(true)

    const isCorrect = selectedIndex === quiz.correctAnswerIndex
    const score = isCorrect ? 10 : 0

    const { error } = await saveProgressAction({
      sectionId,
      isCompleted: true,
      quizScore: score,
    })

    setSaving(false)
    if (error) {
      setSaveError(error)
    } else {
      setSubmitted(true)
    }
  }

  const isCorrect = submitted && selectedIndex === quiz?.correctAnswerIndex

  return (
    <div className="space-y-6">
      {/* ★ Sliced player */}
      <SlicedYouTubePlayer
        ref={playerRef}
        ytVideoId={ytVideoId}
        startTimeSeconds={startTimeSeconds}
        endTimeSeconds={endTimeSeconds}
        onSectionEnd={handleSectionEnd}
        onTimeUpdate={handleTimeUpdate}
        isCompleted={initiallyCompleted}
      />

      {/* Tabs Switcher */}
      <div className="flex border-b border-muted">
        <button
          onClick={() => setActiveTab('summary')}
          className={`px-4 py-2 text-sm font-medium transition-colors border-b-2 ${
            activeTab === 'summary'
              ? 'border-primary text-primary'
              : 'border-transparent text-muted-foreground hover:text-foreground'
          }`}
        >
          Summary
        </button>
        {transcript && (
          <button
            onClick={() => setActiveTab('transcript')}
            className={`px-4 py-2 text-sm font-medium transition-colors border-b-2 ${
              activeTab === 'transcript'
                ? 'border-primary text-primary'
                : 'border-transparent text-muted-foreground hover:text-foreground'
            }`}
          >
            Transcript
          </button>
        )}
      </div>

      {/* Tab Content */}
      <div className="min-h-[200px]">
        {activeTab === 'summary' && textSummary && (
          <Card>
            <CardHeader>
              <CardTitle className="text-base">Summary</CardTitle>
            </CardHeader>
            <CardContent>
              <p className="text-sm text-muted-foreground leading-relaxed">{textSummary}</p>
            </CardContent>
          </Card>
        )}

        {activeTab === 'transcript' && transcript && (
          <Card>
            <CardContent className="p-0">
              <ScrollArea className="h-[300px] p-4">
                <div className="space-y-2">
                  {transcript.map((segment, i) => {
                    const isActive = currentTime >= segment.start && currentTime <= segment.end
                    return (
                      <div
                        key={i}
                        ref={(el) => { transcriptRefs.current[i] = el }}
                        onClick={() => handleTranscriptClick(segment.start)}
                        className={`p-2 rounded-md cursor-pointer transition-colors hover:bg-muted/50 ${
                          isActive ? 'bg-primary/10 font-bold text-primary' : 'text-muted-foreground'
                        }`}
                      >
                        <span className="text-xs opacity-50 mr-3 tabular-nums">
                          {Math.floor(segment.start / 60)}:{(segment.start % 60).toFixed(0).padStart(2, '0')}
                        </span>
                        <span className="text-sm">{segment.text}</span>
                      </div>
                    )
                  })}
                </div>
              </ScrollArea>
            </CardContent>
          </Card>
        )}
      </div>

      {/* Quiz — locked until section ends */}
      {quiz && (
        <Card className={sectionEnded ? undefined : 'opacity-50 pointer-events-none'}>
          <CardHeader className="flex flex-row items-center gap-2">
            <CardTitle className="text-base">Quick Quiz</CardTitle>
            {!sectionEnded && (
              <Badge variant="outline" className="text-xs">
                Watch to unlock
              </Badge>
            )}
          </CardHeader>
          <CardContent className="space-y-3">
            <p className="font-medium text-sm">{quiz.questionText}</p>

            <div className="space-y-2">
              {quiz.options.map((option, i) => {
                let variant: 'outline' | 'secondary' | 'default' = 'outline'
                if (submitted) {
                  if (i === quiz.correctAnswerIndex) variant = 'default'
                  else if (i === selectedIndex) variant = 'secondary'
                } else if (i === selectedIndex) {
                  variant = 'secondary'
                }

                return (
                  <button
                    key={i}
                    onClick={() => !submitted && setSelectedIndex(i)}
                    disabled={submitted}
                    className={`w-full text-left rounded-lg border px-4 py-2.5 text-sm transition-colors
                      ${variant === 'default' ? 'border-primary bg-primary/10 text-primary font-medium' : ''}
                      ${variant === 'secondary' && !submitted ? 'border-primary bg-primary/5' : ''}
                      ${variant === 'secondary' && submitted ? 'border-destructive bg-destructive/10 text-destructive' : ''}
                      ${variant === 'outline' ? 'hover:bg-muted' : ''}
                    `}
                  >
                    {option}
                  </button>
                )
              })}
            </div>

            {submitted ? (
              <p
                className={`text-sm font-medium ${isCorrect ? 'text-green-600' : 'text-destructive'}`}
              >
                {isCorrect ? '✓ Correct! +10 points' : `✗ Incorrect. The right answer was: ${quiz.options[quiz.correctAnswerIndex]}`}
              </p>
            ) : (
              <Button
                onClick={handleSubmitQuiz}
                disabled={selectedIndex === null || saving || !sectionEnded}
                className="w-full"
              >
                {saving ? 'Saving...' : 'Submit answer'}
              </Button>
            )}

            {saveError && (
              <p className="text-xs text-destructive">{saveError}</p>
            )}
          </CardContent>
        </Card>
      )}
    </div>
  )
}
