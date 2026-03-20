'use client'

import { useState, useCallback, useRef, useEffect, useMemo } from 'react'
import { SlicedYouTubePlayer, SlicedYouTubePlayerRef } from '@/components/player/SlicedYouTubePlayer'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { saveProgressAction } from '@/lib/actions/progress'
import { NotesTab } from './NotesTab'
import { cn } from '@/lib/utils'
import { Sparkles, Loader2, Zap, Lightbulb, CheckCircle2 } from 'lucide-react'
import { generateTakeawaysAction } from '@/lib/actions/ai'
import { useSectionLayout } from './SectionLayoutClient'
import { PlaygroundTab } from './PlaygroundTab'
import { ResumePlaybackTracker } from './ResumePlaybackTracker'
import { useParams } from 'next/navigation'
import { TranscriptView } from './TranscriptView'
import Link from 'next/link'

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
  playgroundCode?: string | null
  initialSavedTime?: number | null
  quiz: {
    id: string
    questionText: string
    options: string[]
    correctAnswerIndex: number
  } | null
  initialTakeaways: string[]
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
  playgroundCode,
  initialSavedTime,
  quiz,
  initialTakeaways,
  initiallyCompleted,
  onNextSection,
}: SectionViewProps) {
  const [sectionEnded, setSectionEnded] = useState(initiallyCompleted)
  const [selectedIndex, setSelectedIndex] = useState<number | null>(null)
  const [submitted, setSubmitted] = useState(false)
  const [saving, setSaving] = useState(false)
  const [saveError, setSaveError] = useState<string | null>(null)
  const [activeTab, setActiveTab] = useState<'summary' | 'takeaways' | 'transcript' | 'playground' | 'notes'>('summary')
  const [currentTime, setCurrentTime] = useState(startTimeSeconds)
  const [activeLineIndex, setActiveLineIndex] = useState(-1)
  const [isTheaterMode, setIsTheaterMode] = useState(false)
  
  const { isCinemaMode, setPlayerApi, setCurrentTime: setGlobalCurrentTime, autoplay, setAutoplay } = useSectionLayout()
  const params = useParams()
  const courseId = params.courseId as string

  const [hasResumed, setHasResumed] = useState(false)
  const playerRef = useRef<SlicedYouTubePlayerRef>(null)

  // Handle Resume logic on first load
  useEffect(() => {
    if (hasResumed || !playerRef.current) return
    
    const storageKey = `lt-resume-${courseId}`
    const savedData = localStorage.getItem(storageKey)
    
    let resumeTime = 0

    // Priority 1: Database (passed via props)
    if (initialSavedTime && initialSavedTime > startTimeSeconds + 2) {
      resumeTime = initialSavedTime
    } 
    // Priority 2: LocalStorage
    else if (savedData) {
      try {
        const { sectionId: savedSectionId, time } = JSON.parse(savedData)
        if (savedSectionId === sectionId && time > startTimeSeconds + 5) {
          resumeTime = time
        }
      } catch (e) {
        console.error("Resume error:", e)
      }
    }

    if (resumeTime > 0) {
      setTimeout(() => {
        playerRef.current?.seekTo(resumeTime)
        setHasResumed(true)
      }, 1000)
    } else {
      setHasResumed(true)
    }
  }, [sectionId, courseId, startTimeSeconds, hasResumed, initialSavedTime])


  // Register Player API in global layout context
  useEffect(() => {
    setPlayerApi({
      getCurrentTime: () => playerRef.current?.getCurrentTime() || 0,
      seekTo: (seconds: number) => playerRef.current?.seekTo(seconds)
    })
    return () => setPlayerApi(null)
  }, [setPlayerApi])

  // Ensure modes are exclusive
  useEffect(() => {
    if (isCinemaMode) {
      if (isTheaterMode) setIsTheaterMode(false)
      setActiveTab('transcript')
    }
  }, [isCinemaMode])

  // ESC shortcut for Theater Mode
  useEffect(() => {
    const handleEsc = (e: KeyboardEvent) => {
      if (e.key === 'Escape' && isTheaterMode) {
        setIsTheaterMode(false)
      }
    }
    window.addEventListener('keydown', handleEsc)
    return () => window.removeEventListener('keydown', handleEsc)
  }, [isTheaterMode])

  // Takeaways State
  const [takeaways, setTakeaways] = useState<string[]>(initialTakeaways || [])
  const [isGeneratingTakeaways, setIsGeneratingTakeaways] = useState(false)
  const [takeawaysError, setTakeawaysError] = useState<string | null>(null)

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
    setGlobalCurrentTime(time)
  }, [setGlobalCurrentTime])

  const handleSeekVideo = (seconds: number) => {
    playerRef.current?.seekTo(seconds)
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
    if (error) setSaveError(error)
    else setSubmitted(true)
  }

  const isCorrectResult = submitted && selectedIndex === quiz?.correctAnswerIndex

  // ── Takeaways generation ───────────────────────────────────────────────────
  const handleGenerateTakeaways = async () => {
    setIsGeneratingTakeaways(true)
    setTakeawaysError(null)
    try {
      const result = await generateTakeawaysAction(sectionId)
      if (result.error) {
        setTakeawaysError(result.error)
      } else if (result.takeaways) {
        setTakeaways(result.takeaways)
      }
    } catch (err) {
      setTakeawaysError('Failed to generate takeaways.')
    } finally {
      setIsGeneratingTakeaways(false)
    }
  }

  return (
    <div className="flex flex-col w-full min-h-full">
      <ResumePlaybackTracker courseId={courseId} sectionId={sectionId} currentTime={currentTime} />
      
      {/* ★ Video Section */}
      <div className={cn(
        "w-full transition-all duration-500 ease-in-out bg-white dark:bg-slate-900",
        (isTheaterMode || isCinemaMode) ? "py-0" : "py-6",
        !isCinemaMode && "border-b"
      )}>
        <div className={cn(
          "mx-auto relative transition-all duration-500",
          isCinemaMode ? "max-w-none w-full px-6 py-6" : isTheaterMode ? "max-w-none w-full px-0" : "max-w-5xl px-4 md:px-6"
        )}>
          <div className={cn("mx-auto transition-all duration-500", isCinemaMode ? "max-w-[1280px]" : "max-w-none")}>
            <SlicedYouTubePlayer
              ref={playerRef}
              ytVideoId={ytVideoId}
              startTimeSeconds={startTimeSeconds}
              endTimeSeconds={endTimeSeconds}
              onSectionEnd={handleSectionEnd}
              onTimeUpdate={handleTimeUpdate}
              isCompleted={initiallyCompleted}
              onNextSection={onNextSection}
              isTheaterMode={isTheaterMode}
              toggleTheater={() => setIsTheaterMode(!isTheaterMode)}
            />
          </div>
        </div>
      </div>

      {/* ★ Interactive Content Section */}
      <div className={cn(
        "w-full max-w-5xl mx-auto px-4 md:px-6 py-8 space-y-8 transition-all duration-300",
        isCinemaMode ? "opacity-0 h-0 overflow-hidden pointer-events-none p-0" : "opacity-100"
      )}>
        {/* Tabs Switcher */}
        <div className="flex border-b border-muted">
          {['summary', 'takeaways', 'playground', 'transcript', 'notes'].map((tab) => (
            (tab !== 'transcript' || (filteredTranscript && filteredTranscript.length > 0)) && (
              <button
                key={tab}
                onClick={() => setActiveTab(tab as any)}
                className={cn(
                  "px-4 py-2 text-sm font-medium transition-colors border-b-2 capitalize",
                  activeTab === tab ? "border-primary text-primary" : "border-transparent text-muted-foreground hover:text-foreground"
                )}
              >
                {tab === 'playground' ? 'Code' : tab}
              </button>
            )
          ))}
        </div>

        {/* Tab Content */}
        <div className="min-h-[200px]">
          {activeTab === 'summary' && textSummary && (
            <Card>
              <CardHeader className="py-3 px-4"><CardTitle className="text-sm font-bold uppercase tracking-wider opacity-70">Summary</CardTitle></CardHeader>
              <CardContent className="px-4 pb-4">
                <p className="text-sm text-muted-foreground leading-relaxed">{textSummary}</p>
              </CardContent>
            </Card>
          )}

          {activeTab === 'takeaways' && (
            <Card>
              <CardHeader className="py-3 px-4 flex flex-row items-center justify-between">
                <div className="flex items-center gap-2">
                  <Lightbulb className="h-4 w-4 text-amber-500" />
                  <CardTitle className="text-sm font-bold uppercase tracking-wider opacity-70">Key Takeaways</CardTitle>
                </div>
                <Button variant="outline" size="sm" onClick={handleGenerateTakeaways} disabled={isGeneratingTakeaways} className="h-8 text-xs font-bold shadow-sm">
                  {isGeneratingTakeaways ? <><Loader2 className="mr-2 h-3 w-3 animate-spin" />Generating...</> : <><Sparkles className="mr-2 h-3 w-3 text-primary" />AI Generate</>}
                </Button>
              </CardHeader>
              <CardContent className="px-6 py-6">
                {takeawaysError && <p className="text-xs text-destructive mb-4 bg-destructive/10 p-2 rounded border border-destructive/20">{takeawaysError}</p>}
                {takeaways && takeaways.length > 0 ? (
                  <ul className="space-y-6">
                    {takeaways.map((point, idx) => (
                      <li key={idx} className="flex gap-3 group animate-in slide-in-from-right-2 duration-300" style={{ animationDelay: `${idx * 50}ms` }}>
                        <div className="mt-1 shrink-0"><div className="w-5 h-5 rounded-full bg-amber-500/10 flex items-center justify-center transition-transform group-hover:scale-110"><Zap className="h-3 w-3 text-amber-500 fill-amber-500" /></div></div>
                        <p className="text-sm leading-relaxed text-slate-600 dark:text-slate-400 font-medium">{point}</p>
                      </li>
                    ))}
                  </ul>
                ) : (
                  <div className="flex flex-col items-center justify-center py-8 text-center space-y-4">
                    <div className="w-12 h-12 rounded-full bg-primary/10 flex items-center justify-center"><Sparkles className="h-6 w-6 text-primary" /></div>
                    <div className="space-y-1"><p className="text-sm font-semibold">No takeaways yet</p><p className="text-xs text-muted-foreground">Generate AI-powered summaries from this lesson.</p></div>
                  </div>
                )}
              </CardContent>
            </Card>
          )}

          {activeTab === 'transcript' && filteredTranscript && (
            <Card>
              <CardContent className="p-0 h-[400px]">
                <TranscriptView 
                  transcript={filteredTranscript} 
                  currentTime={currentTime} 
                  activeLineIndex={activeLineIndex}
                  onSeek={handleSeekVideo}
                  isCinemaMode={false}
                />
              </CardContent>
            </Card>
          )}

          {activeTab === 'playground' && (
            <PlaygroundTab sectionId={sectionId} initialCode={playgroundCode} />
          )}
          
          {activeTab === 'notes' && (
            <NotesTab sectionId={sectionId} />
          )}
        </div>

        {/* Quiz Section */}
        {quiz && (
          <Card className={sectionEnded ? undefined : 'opacity-50 pointer-events-none'}>
            <CardHeader className="py-3 px-4 flex flex-row items-center gap-2">
              <CardTitle className="text-sm font-bold uppercase tracking-wider opacity-70">Quick Quiz</CardTitle>
              {!sectionEnded && <Badge variant="outline" className="text-[10px] uppercase">Watch to unlock</Badge>}
            </CardHeader>
            <CardContent className="space-y-3 px-4 pb-4">
              <p className="font-medium text-sm">{quiz.questionText}</p>
              <div className="space-y-2">
                {quiz.options.map((option, i) => (
                  <button
                    key={i}
                    onClick={() => !submitted && setSelectedIndex(i)}
                    disabled={submitted}
                    className={cn(
                      "w-full text-left rounded-lg border px-4 py-2 text-sm transition-colors",
                      (submitted && i === quiz.correctAnswerIndex) ? 'border-primary bg-primary/10 text-primary font-medium' : 
                      (selectedIndex === i) ? (submitted ? 'border-destructive bg-destructive/10 text-destructive' : 'border-primary bg-primary/5') : 'hover:bg-muted'
                    )}
                  >
                    {option}
                  </button>
                ))}
              </div>
              {submitted ? (
                <p className={cn("text-sm font-medium", isCorrectResult ? 'text-green-600' : 'text-destructive')}>
                  {isCorrectResult ? '✓ Correct! +10 points' : `✗ Incorrect. The right answer was: ${quiz.options[quiz.correctAnswerIndex]}`}
                </p>
              ) : (
                <Button onClick={handleSubmitQuiz} disabled={selectedIndex === null || saving || !sectionEnded} className="w-full h-9 text-sm">
                  {saving ? 'Saving...' : 'Submit answer'}
                </Button>
              )}
              {saveError && <p className="text-xs text-destructive">{saveError}</p>}
            </CardContent>
          </Card>
        )}
      </div>
    </div>
  )
}
