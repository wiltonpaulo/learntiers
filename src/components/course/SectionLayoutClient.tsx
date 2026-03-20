'use client'

import type { ReactNode } from 'react'
import { useState, createContext, useContext, useEffect, useRef, useCallback, useMemo } from 'react'
import { Button } from '@/components/ui/button'
import { PanelLeftClose, PanelLeftOpen, GraduationCap, Trophy, ChevronLeft, ChevronRight } from 'lucide-react'
import { AIAssistantSidebar } from './AIAssistantSidebar'
import { cn } from '@/lib/utils'
import Link from 'next/link'
import { useParams } from 'next/navigation'
import { HoverCard, HoverCardContent, HoverCardTrigger } from '@/components/ui/hover-card'

// ─── Contexto para partilhar estado do layout ────────────────────────────────
interface Message {
  role: 'user' | 'assistant'
  content: string
}

interface SectionLayoutContextType {
  isCinemaMode: boolean
  setIsCinemaMode: (v: boolean) => void
  isAISidebarOpen: boolean
  setIsAISidebarOpen: (v: boolean) => void
  isSidebarOpen: boolean
  setIsSidebarOpen: (v: boolean) => void
  messages: Message[]
  setMessages: React.Dispatch<React.SetStateAction<Message[]>>
  isChatLoading: boolean
  setIsChatLoading: (v: boolean) => void
  autoplay: boolean
  setAutoplay: (v: boolean) => void
  draftNoteContent: string
  setDraftNoteContent: (v: string) => void
  draftCapturedTime: number | null
  setDraftCapturedTime: (v: number | null) => void
  currentTime: number
  setCurrentTime: (v: number) => void
  onSeek: (seconds: number) => void
  startTimeSeconds: number
  playerApi: {
    getCurrentTime: () => number
    seekTo: (seconds: number) => void
  } | null
  setPlayerApi: (api: { getCurrentTime: () => number; seekTo: (seconds: number) => void } | null) => void
}

const SectionLayoutContext = createContext<SectionLayoutContextType | undefined>(undefined)

export const useSectionLayout = () => {
  const context = useContext(SectionLayoutContext)
  if (!context) throw new Error('useSectionLayout must be used within SectionLayoutProvider')
  return context
}

interface SectionLayoutClientProps {
  sectionId: string
  header: ReactNode
  sidebar: ReactNode
  children: ReactNode
  completedCount: number
  totalCount: number
  transcript: any[] | null
  playgroundCode?: string | null
  courseTitle?: string
  sectionTitle?: string
  ytVideoId?: string
  startTimeSeconds: number
  youtubeChannelName?: string | null
  youtubeChannelUrl?: string | null
  nextSection?: { id: string; title: string } | null
}

export function SectionLayoutClient({
  sectionId,
  header,
  sidebar,
  children,
  completedCount,
  totalCount,
  transcript,
  playgroundCode,
  courseTitle,
  sectionTitle,
  ytVideoId,
  startTimeSeconds,
  youtubeChannelName,
  youtubeChannelUrl,
  nextSection,
}: SectionLayoutClientProps) {
  const [isSidebarOpen, setIsSidebarOpen] = useState(true)
  const [isCinemaMode, setIsCinemaMode] = useState(false)
  const [isAISidebarOpen, setIsAISidebarOpen] = useState(false)
  const [messages, setMessages] = useState<Message[]>([])
  const [isChatLoading, setIsChatLoading] = useState(false)
  const [autoplay, setAutoplay] = useState(true)
  const [currentTime, setCurrentTime] = useState(0)
  const [draftNoteContent, setDraftNoteContent] = useState('')
  const [draftCapturedTime, setDraftCapturedTime] = useState<number | null>(null)
  const [playerApi, setPlayerApi] = useState<{ getCurrentTime: () => number; seekTo: (seconds: number) => void } | null>(null)
  const { locale, courseId } = useParams()

  // ─── Persistence ───────────────────────────────────────────────────────────
  const [leftWidth, setLeftWidth] = useState(320)
  const [rightWidth, setRightWidth] = useState(450)
  const [isResizingLeft, setIsResizingLeft] = useState(false)
  const [isResizingRight, setIsResizingRight] = useState(false)
  const [isMounted, setIsMounted] = useState(false)

  useEffect(() => {
    const savedLeftWidth = localStorage.getItem('lt-layout-left-width')
    const savedRightWidth = localStorage.getItem('lt-layout-right-width')
    const savedSidebarOpen = localStorage.getItem('lt-layout-sidebar-open')
    const savedCinemaMode = localStorage.getItem('lt-layout-cinema-mode')
    const savedAIOpen = localStorage.getItem('lt-layout-ai-open')
    const savedAutoplay = localStorage.getItem('lt-layout-autoplay')
    
    if (savedLeftWidth) setLeftWidth(parseInt(savedLeftWidth, 10))
    if (savedRightWidth) setRightWidth(parseInt(savedRightWidth, 10))
    if (savedSidebarOpen !== null) setIsSidebarOpen(savedSidebarOpen === 'true')
    if (savedCinemaMode !== null) setIsCinemaMode(savedCinemaMode === 'true')
    if (savedAIOpen !== null) setIsAISidebarOpen(savedAIOpen === 'true')
    if (savedAutoplay !== null) setAutoplay(savedAutoplay === 'true')
    
    setIsMounted(true)
  }, [])

  useEffect(() => {
    if (!isMounted) return
    localStorage.setItem('lt-layout-left-width', leftWidth.toString())
    localStorage.setItem('lt-layout-right-width', rightWidth.toString())
    localStorage.setItem('lt-layout-sidebar-open', isSidebarOpen.toString())
    localStorage.setItem('lt-layout-cinema-mode', isCinemaMode.toString())
    localStorage.setItem('lt-layout-ai-open', isAISidebarOpen.toString())
    localStorage.setItem('lt-layout-autoplay', autoplay.toString())
  }, [leftWidth, rightWidth, isSidebarOpen, isCinemaMode, isAISidebarOpen, autoplay, isMounted])

  // ─── Shortcuts ────────────────────────────────────────────────────────────
  useEffect(() => {
    const handleEsc = (e: KeyboardEvent) => {
      if (e.key === 'Escape' && isCinemaMode) {
        setIsCinemaMode(false)
        setIsSidebarOpen(true)
      }
    }
    window.addEventListener('keydown', handleEsc)
    return () => window.removeEventListener('keydown', handleEsc)
  }, [isCinemaMode])

  const startResizingLeft = useCallback((e: React.MouseEvent) => {
    e.preventDefault()
    setIsResizingLeft(true)
  }, [])

  const startResizingRight = useCallback((e: React.MouseEvent) => {
    e.preventDefault()
    setIsResizingRight(true)
  }, [])

  const stopResizing = useCallback(() => {
    setIsResizingLeft(false)
    setIsResizingRight(false)
  }, [])

  const resize = useCallback((e: MouseEvent) => {
    if (isResizingLeft) {
      const newWidth = e.clientX
      if (newWidth < 50) {
        setIsSidebarOpen(false)
      } else if (newWidth > 200 && newWidth < 500) {
        setIsSidebarOpen(true)
        setLeftWidth(newWidth)
      }
    }
    if (isResizingRight) {
      const newWidth = window.innerWidth - e.clientX
      if (newWidth > 300 && newWidth < 800) setRightWidth(newWidth)
    }
  }, [isResizingLeft, isResizingRight])

  useEffect(() => {
    window.addEventListener('mousemove', resize)
    window.addEventListener('mouseup', stopResizing)
    return () => {
      window.removeEventListener('mousemove', resize)
      window.removeEventListener('mouseup', stopResizing)
    }
  }, [resize, stopResizing])

  const onSeek = useCallback((s: number) => {
    playerApi?.seekTo(s)
  }, [playerApi])

  const progressPercentage = Math.round((completedCount / totalCount) * 100) || 0

  if (!isMounted) return <div className="h-screen w-screen bg-background" />

  const contextValue = {
    isCinemaMode, setIsCinemaMode,
    isAISidebarOpen, setIsAISidebarOpen,
    isSidebarOpen, setIsSidebarOpen,
    messages, setMessages,
    isChatLoading, setIsChatLoading,
    autoplay, setAutoplay,
    draftNoteContent, setDraftNoteContent,
    draftCapturedTime, setDraftCapturedTime,
    startTimeSeconds,
    currentTime, setCurrentTime,
    onSeek,
    playerApi, setPlayerApi
  }

  return (
    <SectionLayoutContext.Provider value={contextValue}>
      <div className={cn(
        "flex flex-col h-screen bg-background overflow-hidden fixed inset-0 z-[60]",
        (isResizingLeft || isResizingRight) && "cursor-col-resize select-none"
      )}>
        
        {/* HEADER */}
        <header 
          className="h-14 border-b flex items-center justify-between px-4 shrink-0 z-50 shadow-sm relative"
          style={{ backgroundColor: 'var(--nav-bg)', color: 'var(--nav-fg)' }}
        >
          <div className="flex items-center gap-4 min-w-0 flex-1">
            <Link href={`/${locale}`} className="flex items-center gap-2 hover:opacity-80 transition-opacity shrink-0">
              <div className="w-8 h-8 rounded-lg bg-primary flex items-center justify-center shadow-lg shadow-primary/20">
                <GraduationCap className="w-5 h-5 text-white" />
              </div>
              <span className="font-bold text-lg text-white tracking-tight hidden sm:block">LearnTiers</span>
            </Link>
            <div className="h-6 w-px bg-white/20 mx-1 shrink-0" />
            <Link 
              href={`/${locale}/courses/${courseId}`}
              className="flex items-center gap-1.5 text-base font-medium text-slate-300 hover:text-white transition-colors truncate"
            >
              <ChevronLeft className="w-4 h-4 shrink-0" />
              <span className="truncate">{courseTitle}</span>
            </Link>
          </div>

          <div className="flex items-center gap-4">
            <div className="flex items-center gap-3 bg-white/5 px-3 py-1.5 rounded-full border border-white/10">
              <HoverCard openDelay={100} closeDelay={100}>
                <HoverCardTrigger asChild>
                  <div className="relative w-7 h-7 flex items-center justify-center cursor-pointer">
                    <svg className="absolute inset-0 w-full h-full -rotate-90" viewBox="0 0 36 36">
                      <circle className="text-white/10" stroke="currentColor" strokeWidth="3" fill="transparent" r="16" cx="18" cy="18" />
                      <circle className="text-primary transition-all duration-1000" stroke="currentColor" strokeWidth="3" strokeDasharray={`${progressPercentage}, 100`} strokeLinecap="round" fill="transparent" r="16" cx="18" cy="18" />
                    </svg>
                    <Trophy className={cn("w-3 h-3", progressPercentage === 100 ? "text-yellow-400" : "text-white/40")} />
                  </div>
                </HoverCardTrigger>
                <HoverCardContent 
                  side="bottom" 
                  align="end" 
                  sideOffset={10}
                  className="w-72 bg-white border-slate-200 shadow-2xl p-4 rounded-2xl overflow-hidden animate-in fade-in zoom-in-95 duration-200 z-[100]"
                >
                  <div className="flex flex-col gap-4">
                    <div className="flex items-center gap-3">
                      <div className={cn(
                        "p-2 rounded-xl flex items-center justify-center transition-colors",
                        progressPercentage === 100 ? "bg-amber-100 text-amber-600" : "bg-primary/10 text-primary"
                      )}>
                        <Trophy className="w-5 h-5" />
                      </div>
                      <div className="flex flex-col">
                        <span className="text-sm font-bold text-slate-900">Course Progress</span>
                        <span className="text-[10px] font-bold text-slate-400 uppercase tracking-wider">{progressPercentage}% Complete</span>
                      </div>
                    </div>

                    <div className="space-y-2">
                      <div className="flex justify-between items-center text-xs">
                        <span className="text-slate-500 font-medium">Lessons</span>
                        <span className="text-slate-900 font-bold">{completedCount} / {totalCount}</span>
                      </div>
                      <div className="h-2 w-full bg-slate-100 rounded-full overflow-hidden">
                        <div 
                          className={cn(
                            "h-full transition-all duration-1000",
                            progressPercentage === 100 ? "bg-amber-500" : "bg-primary"
                          )} 
                          style={{ width: `${progressPercentage}%` }} 
                        />
                      </div>
                    </div>

                    <div className="h-px bg-slate-100 -mx-4" />

                    <div className="flex items-start gap-2 pt-1">
                      <div className="mt-0.5">
                        <div className="w-1.5 h-1.5 rounded-full bg-primary mt-1" />
                      </div>
                      <p className="text-xs text-slate-600 leading-relaxed font-medium">
                        {progressPercentage === 100 
                          ? "Congratulations! You've earned your certificate of completion." 
                          : "Finish all lessons and quizzes to unlock your certificate of completion."}
                      </p>
                    </div>
                  </div>
                </HoverCardContent>
              </HoverCard>
              <span className="text-xs font-black text-white tabular-nums">{progressPercentage}%</span>
            </div>
          </div>
        </header>

        <div className="flex flex-1 min-h-0 overflow-hidden relative">
          
          {/* LEFT SIDEBAR (SPLIT SCREEN in Normal, OVERLAY in Cinema) */}
          <aside
            onMouseLeave={() => isCinemaMode && setIsSidebarOpen(false)}
            className={cn(
              'flex flex-col bg-card h-full shrink-0 transition-all duration-500 ease-in-out',
              isCinemaMode 
                ? 'absolute left-0 top-0 z-[70] shadow-2xl border-r' 
                : 'relative border-r z-20',
              (!isSidebarOpen) ? (isCinemaMode ? '-translate-x-full' : 'w-0 -translate-x-full overflow-hidden') : 'translate-x-0'
            )}
            style={{ width: isSidebarOpen || isCinemaMode ? `${leftWidth}px` : 0 }}
          >
            <div className="px-4 py-3 border-b shrink-0 flex items-center justify-between bg-muted/30">
              <span className="text-[10px] font-bold text-muted-foreground uppercase tracking-wider">Course content</span>
              <button 
                onClick={() => setIsSidebarOpen(false)} 
                className="w-8 h-8 rounded-full bg-primary flex items-center justify-center text-white shadow-lg hover:scale-110 transition-transform group"
                title="Close Sidebar"
              >
                <ChevronLeft className="w-5 h-5" />
              </button>
            </div>
            <div className="flex-1 min-h-0 overflow-y-auto custom-scrollbar">
              {sidebar}
            </div>
          </aside>

          {/* SPLITTER LEFT (Always present on edge if closed, or between if open) */}
          <div 
            onMouseDown={!isCinemaMode ? startResizingLeft : undefined}
            onMouseEnter={() => isCinemaMode && setIsSidebarOpen(true)}
            onDoubleClick={() => setIsSidebarOpen(!isSidebarOpen)}
            className={cn(
              "w-1 relative z-50 group flex items-center justify-center transition-all duration-300",
              !isCinemaMode ? "cursor-col-resize" : "cursor-default",
              isResizingLeft ? "bg-primary w-1.5" : "bg-transparent hover:bg-primary/20",
              !isSidebarOpen && "left-0"
            )}
          >
              {/* A LÍNGUA / HANDLE (O efeito visual centralizado) */}
              <div 
                onClick={() => !isResizingLeft && setIsSidebarOpen(!isSidebarOpen)}
                className={cn(
                  "absolute h-20 w-1.5 rounded-full transition-all duration-300 flex items-center justify-center shadow-lg",
                  isSidebarOpen 
                    ? "bg-slate-300 dark:bg-slate-700 group-hover:bg-primary group-hover:w-4" 
                    : "bg-primary w-2 h-24 hover:w-6 shadow-[0_0_15px_rgba(168,85,247,0.5)] animate-in slide-in-from-left-2"
                )}
              >
                {isSidebarOpen ? (
                  <div className="w-0.5 h-8 bg-white/30 rounded-full group-hover:opacity-100" />
                ) : (
                  <ChevronRight className="w-4 h-4 text-white opacity-0 group-hover:opacity-100 transition-opacity" />
                )}
              </div>
            </div>

          {/* MAIN CONTENT */}
          <main className="flex-1 flex flex-col min-w-0 h-full relative bg-white dark:bg-slate-950 overflow-hidden z-10">
            <div className="flex-1 min-h-0 overflow-y-auto custom-scrollbar">
              {children}
            </div>

            {/* FLOATING NEXT BUTTON */}
            {nextSection && (
              <div className="absolute bottom-6 right-6 z-[40] animate-in fade-in slide-in-from-bottom-4 duration-500">
                <Link
                  href={`/${locale}/courses/${courseId}/sections/${nextSection.id}`}
                  className="flex items-center gap-3 bg-white/80 dark:bg-slate-900/80 backdrop-blur-md border border-slate-200 dark:border-white/10 p-2 pl-4 rounded-full shadow-2xl hover:shadow-primary/20 hover:border-primary/30 transition-all group max-w-[280px]"
                >
                  <div className="flex flex-col min-w-0">
                    <span className="text-[10px] font-bold text-muted-foreground uppercase tracking-widest leading-none text-[9px]">Up next</span>
                    <span className="text-xs font-bold truncate text-slate-700 dark:text-slate-200 mt-1">{nextSection.title}</span>
                  </div>
                  <div className="w-10 h-10 rounded-full bg-primary flex items-center justify-center text-white shadow-lg group-hover:scale-110 transition-transform shrink-0">
                    <ChevronRight className="w-6 h-6" />
                  </div>
                </Link>
              </div>
            )}
          </main>

          {/* RIGHT SIDEBAR (SPLIT SCREEN) */}
          {(isCinemaMode || isAISidebarOpen) && (
            <>
              {/* SPLITTER RIGHT */}
              <div 
                onMouseDown={startResizingRight}
                className={cn(
                  "w-2 relative z-50 cursor-col-resize group transition-colors",
                  isResizingRight ? "bg-primary/20" : "hover:bg-primary/10"
                )}
              >
                <div className={cn("absolute left-0 w-0.5 h-full transition-colors", isResizingRight ? "bg-primary" : "bg-transparent group-hover:bg-primary/30")} />
                <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-1 h-8 bg-border rounded-full group-hover:bg-primary/50" />
              </div>

              <div 
                className={cn("bg-card flex flex-col h-full shrink-0")}
                style={{ width: `${isCinemaMode ? rightWidth : (isAISidebarOpen ? 380 : 0)}px` }}
              >
                {isCinemaMode ? (
                  <CinemaSidebar sectionId={sectionId} transcript={transcript} playgroundCode={playgroundCode} onClose={() => setIsCinemaMode(false)} />
                ) : (
                  <AIAssistantSidebar sectionId={sectionId} isOpen={isAISidebarOpen} onClose={() => setIsAISidebarOpen(false)} />
                )}
              </div>
            </>
          )}
        </div>
      </div>
    </SectionLayoutContext.Provider>
  )
}

import { Sparkles, FileText, X as CloseIcon, Code2, StickyNote } from 'lucide-react'
import { PlaygroundTab } from './PlaygroundTab'
import { NotesTab } from './NotesTab'
import { TranscriptView } from './TranscriptView'

function CinemaSidebar({ sectionId, transcript, playgroundCode, onClose }: { sectionId: string, transcript: any[] | null, playgroundCode?: string | null, onClose: () => void }) {
  const { currentTime, onSeek } = useSectionLayout()
  const [activeTab, setActiveTab] = useState<'ai' | 'transcript' | 'playground' | 'notes'>('transcript')
  const [isMounted, setIsMounted] = useState(false)

  // Load persisted tab
  useEffect(() => {
    const savedTab = localStorage.getItem('lt-cinema-active-tab')
    if (savedTab && ['ai', 'transcript', 'playground', 'notes'].includes(savedTab)) {
      setActiveTab(savedTab as any)
    }
    setIsMounted(true)
  }, [])

  // Save tab on change
  const handleTabChange = (tab: 'ai' | 'transcript' | 'playground' | 'notes') => {
    setActiveTab(tab)
    localStorage.setItem('lt-cinema-active-tab', tab)
  }

  const activeLineIndex = useMemo(() => {
    if (!transcript) return -1
    return transcript.findIndex(s => currentTime >= s.start && currentTime <= s.end)
  }, [currentTime, transcript])

  if (!isMounted) return null

  return (
    <div className="flex flex-col h-full bg-card">
      <div className="h-14 flex items-center justify-between border-b px-2 shrink-0 bg-background">
        <div className="flex flex-1">
          {['ai', 'transcript', 'playground', 'notes'].map((tab) => (
            <button
              key={tab}
              onClick={() => handleTabChange(tab as any)}
              className={cn(
                "flex-1 flex items-center justify-center gap-2 py-2 text-xs font-semibold transition-all border-b-2 capitalize",
                activeTab === tab ? "border-primary text-primary" : "border-transparent text-muted-foreground hover:text-foreground"
              )}
            >
              {tab === 'ai' && <Sparkles className="w-3.5 h-3.5 text-primary fill-primary/10" />}
              {tab === 'transcript' && <FileText className="w-3.5 h-3.5" />}
              {tab === 'playground' && <Code2 className="w-3.5 h-3.5" />}
              {tab === 'notes' && <StickyNote className="w-3.5 h-3.5" />}
              {tab === 'playground' ? 'Code' : tab === 'ai' ? 'AI Tutor' : tab}
            </button>
          ))}
        </div>
        <Button variant="ghost" size="icon" onClick={onClose} className="h-8 w-8 ml-2 text-muted-foreground shrink-0"><CloseIcon className="w-4 h-4" /></Button>
      </div>
      <div className="flex-1 min-h-0 relative">
        <div className={cn("absolute inset-0", activeTab !== 'ai' && "hidden")}>
           <AIAssistantSidebar sectionId={sectionId} isOpen={true} onClose={() => {}} hideHeader={true} />
        </div>
        <div className={cn("absolute inset-0 overflow-hidden flex flex-col", activeTab !== 'transcript' && "hidden")}>
          {transcript ? (
            <TranscriptView 
              transcript={transcript} 
              currentTime={currentTime} 
              activeLineIndex={activeLineIndex}
              onSeek={onSeek}
              isCinemaMode={true}
            />
          ) : (
            <div className="flex items-center justify-center h-full text-muted-foreground text-sm italic">
              No transcript available for this lesson.
            </div>
          )}
        </div>
        <div className={cn("absolute inset-0 overflow-hidden flex flex-col p-4", activeTab !== 'playground' && "hidden")}>
           <PlaygroundTab sectionId={sectionId} initialCode={playgroundCode} />
        </div>
        <div className={cn("absolute inset-0 overflow-hidden flex flex-col p-4", activeTab !== 'notes' && "hidden")}>
           <NotesTab sectionId={sectionId} />
        </div>
      </div>
    </div>
  )
}
