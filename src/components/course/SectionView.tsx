'use client'

import { useState, useCallback } from 'react'
import { SlicedYouTubePlayer } from '@/components/player/SlicedYouTubePlayer'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { saveProgressAction } from '@/lib/actions/progress'

// ─── Types ────────────────────────────────────────────────────────────────────

interface QuizOption {
  index: number
  text: string
}

interface SectionViewProps {
  sectionId: string
  ytVideoId: string
  startTimeSeconds: number
  endTimeSeconds: number
  textSummary: string | null
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
 *
 * State machine:
 *   watching → section_ended → answering_quiz → completed
 *
 * The quiz is locked until the player fires onSectionEnd, enforcing the
 * business rule: students must watch the full slice before attempting the quiz.
 */
export function SectionView({
  sectionId,
  ytVideoId,
  startTimeSeconds,
  endTimeSeconds,
  textSummary,
  quiz,
  initiallyCompleted,
}: SectionViewProps) {
  const [sectionEnded, setSectionEnded] = useState(initiallyCompleted)
  const [selectedIndex, setSelectedIndex] = useState<number | null>(null)
  const [submitted, setSubmitted] = useState(false)
  const [saving, setSaving] = useState(false)
  const [saveError, setSaveError] = useState<string | null>(null)

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
        ytVideoId={ytVideoId}
        startTimeSeconds={startTimeSeconds}
        endTimeSeconds={endTimeSeconds}
        onSectionEnd={handleSectionEnd}
        isCompleted={initiallyCompleted}
      />

      {/* Text summary */}
      {textSummary && (
        <Card>
          <CardHeader>
            <CardTitle className="text-base">Summary</CardTitle>
          </CardHeader>
          <CardContent>
            <p className="text-sm text-muted-foreground leading-relaxed">{textSummary}</p>
          </CardContent>
        </Card>
      )}

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
