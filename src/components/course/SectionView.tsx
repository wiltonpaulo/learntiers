'use client'

import { useState, useCallback, useRef, useEffect, useMemo } from 'react'
import { SlicedYouTubePlayer, SlicedYouTubePlayerRef } from '@/components/player/SlicedYouTubePlayer'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { saveProgressAction } from '@/lib/actions/progress'
import { NotesTab } from './NotesTab'

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
  onNextSection?: () => void
}

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
  onNextSection,
}: SectionViewProps) {
  const [sectionEnded, setSectionEnded] = useState(initiallyCompleted)
  const [selectedIndex, setSelectedIndex] = useState<number | null>(null)
  const [submitted, setSubmitted] = useState(false)
  const [saving, setSaving] = useState(false)
  const [saveError, setSaveError] = useState<string | null>(null)
  const [activeTab, setActiveTab] = useState<'summary' | 'transcript' | 'notes'>('summary')
  const [currentTime, setCurrentTime] = useState(startTimeSeconds)
  const [activeLineIndex, setActiveLineIndex] = useState(-1)

  const playerRef = useRef<SlicedYouTubePlayerRef>(null)
  const scrollContainerRef = useRef<HTMLDivElement>(null)
  const transcriptRefs = useRef<(HTMLDivElement | null)[]>([])

  // ── Filter transcript for this section ──────────────────────────────────
  const filteredTranscript = useMemo(() => {
    if (!transcript) return null
    return transcript.filter(
      (s) => s.start >= startTimeSeconds - 2 && s.start <= endTimeSeconds
    )
  }, [transcript, startTimeSeconds, endTimeSeconds])

  // ── Identify current line index based on time ───────────────────────────
  useEffect(() => {
    if (!filteredTranscript) return
    const index = filteredTranscript.findIndex(
      (s) => currentTime >= s.start && currentTime <= s.end
    )
    if (index !== -1 && index !== activeLineIndex) {
      setActiveLineIndex(index)
    }
  }, [currentTime, filteredTranscript, activeLineIndex])

  // ── Trigger scroll only when activeLineIndex changes ────────────────────
  useEffect(() => {
    if (activeTab === 'transcript' && activeLineIndex !== -1 && scrollContainerRef.current) {
      const scrollTargetIndex = Math.max(0, activeLineIndex - 1)
      const element = transcriptRefs.current[scrollTargetIndex]
      const container = scrollContainerRef.current
      
      if (element && container) {
        const targetScrollTop = element.offsetTop - 16
        container.scrollTo({ top: targetScrollTop, behavior: 'smooth' })
      }
    }
  }, [activeLineIndex, activeTab])

  const handleSectionEnd = useCallback(async () => {
    setSectionEnded(true)
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

  const handleSeekVideo = (seconds: number) => {
    playerRef.current?.seekTo(seconds)
  }

  const getCurrentTime = () => currentTime

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
    if (error) setSaveError(error)
    else setSubmitted(true)
  }

  const isCorrectResult = submitted && selectedIndex === quiz?.correctAnswerIndex

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
        onNextSection={onNextSection}
      />

      {/* Tabs Switcher */}
      <div className="flex border-b border-muted">
        <button
          onClick={() => setActiveTab('summary')}
          className={`px-4 py-2 text-sm font-medium transition-colors border-b-2 ${
            activeTab === 'summary' ? 'border-primary text-primary' : 'border-transparent text-muted-foreground hover:text-foreground'
          }`}
        >
          Summary
        </button>
        {filteredTranscript && filteredTranscript.length > 0 && (
          <button
            onClick={() => setActiveTab('transcript')}
            className={`px-4 py-2 text-sm font-medium transition-colors border-b-2 ${
              activeTab === 'transcript' ? 'border-primary text-primary' : 'border-transparent text-muted-foreground hover:text-foreground'
            }`}
          >
            Transcript
          </button>
        )}
        <button
          onClick={() => setActiveTab('notes')}
          className={`px-4 py-2 text-sm font-medium transition-colors border-b-2 ${
            activeTab === 'notes' ? 'border-primary text-primary' : 'border-transparent text-muted-foreground hover:text-foreground'
          }`}
        >
          Notes
        </button>
      </div>

      {/* Tab Content */}
      <div className="min-h-[220px]">
        {activeTab === 'summary' && textSummary && (
          <Card>
            <CardHeader><CardTitle className="text-base">Summary</CardTitle></CardHeader>
            <CardContent>
              <p className="text-sm text-muted-foreground leading-relaxed">{textSummary}</p>
            </CardContent>
          </Card>
        )}

        {activeTab === 'transcript' && filteredTranscript && (
          <Card>
            <CardContent className="p-0">
              <div ref={scrollContainerRef} className="h-[200px] overflow-y-auto p-4 custom-scrollbar relative">
                <div className="space-y-2">
                  {filteredTranscript.map((segment, i) => (
                    <div
                      key={i}
                      ref={(el) => { transcriptRefs.current[i] = el }}
                      onClick={() => handleSeekVideo(segment.start)}
                      className={`p-2 rounded-md cursor-pointer transition-all duration-300 hover:bg-muted/50 ${
                        i === activeLineIndex ? 'bg-primary/10 font-bold text-primary text-base border-l-4 border-primary pl-3' : 'text-muted-foreground/70 text-sm border-l-4 border-transparent'
                      }`}
                    >
                      <span>{segment.text}</span>
                    </div>
                  ))}
                </div>
              </div>
            </CardContent>
          </Card>
        )}

        {activeTab === 'notes' && (
          <NotesTab 
            sectionId={sectionId} 
            getCurrentVideoTime={getCurrentTime} 
            onSeekVideo={handleSeekVideo} 
          />
        )}
      </div>

      {/* Quiz Section */}
      {quiz && (
        <Card className={sectionEnded ? undefined : 'opacity-50 pointer-events-none'}>
          <CardHeader className="flex flex-row items-center gap-2">
            <CardTitle className="text-base">Quick Quiz</CardTitle>
            {!sectionEnded && <Badge variant="outline" className="text-xs">Watch to unlock</Badge>}
          </CardHeader>
          <CardContent className="space-y-3">
            <p className="font-medium text-sm">{quiz.questionText}</p>
            <div className="space-y-2">
              {quiz.options.map((option, i) => (
                <button
                  key={i}
                  onClick={() => !submitted && setSelectedIndex(i)}
                  disabled={submitted}
                  className={`w-full text-left rounded-lg border px-4 py-2.5 text-sm transition-colors
                    ${(submitted && i === quiz.correctAnswerIndex) ? 'border-primary bg-primary/10 text-primary font-medium' : 
                      (selectedIndex === i) ? (submitted ? 'border-destructive bg-destructive/10 text-destructive' : 'border-primary bg-primary/5') : 'hover:bg-muted'}
                  `}
                >
                  {option}
                </button>
              ))}
            </div>
            {submitted ? (
              <p className={`text-sm font-medium ${isCorrectResult ? 'text-green-600' : 'text-destructive'}`}>
                {isCorrectResult ? '✓ Correct! +10 points' : `✗ Incorrect. The right answer was: ${quiz.options[quiz.correctAnswerIndex]}`}
              </p>
            ) : (
              <Button onClick={handleSubmitQuiz} disabled={selectedIndex === null || saving || !sectionEnded} className="w-full">
                {saving ? 'Saving...' : 'Submit answer'}
              </Button>
            )}
            {saveError && <p className="text-xs text-destructive">{saveError}</p>}
          </CardContent>
        </Card>
      )}
    </div>
  )
}
