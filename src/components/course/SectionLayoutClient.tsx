'use client'

import type { ReactNode } from 'react'
import { useState, createContext, useContext, useEffect, useRef, useCallback } from 'react'
import { Button } from '@/components/ui/button'
import { PanelLeftClose, PanelLeftOpen, GraduationCap, Trophy, ChevronLeft, ChevronRight } from 'lucide-react'
import { AIAssistantSidebar } from './AIAssistantSidebar'
import { cn } from '@/lib/utils'
import Link from 'next/link'
import { useParams } from 'next/navigation'

// ─── Contexto para partilhar estado do layout ────────────────────────────────
interface SectionLayoutContextType {
  isCinemaMode: boolean
  setIsCinemaMode: (v: boolean) => void
  isAISidebarOpen: boolean
  setIsAISidebarOpen: (v: boolean) => void
  isSidebarOpen: boolean
  setIsSidebarOpen: (v: boolean) => void
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
  youtubeChannelName?: string | null
  youtubeChannelUrl?: string | null
}

export function SectionLayoutClient({
  sectionId,
  sidebar,
  children,
  completedCount,
  totalCount,
  transcript,
  playgroundCode,
  courseTitle,
  ytVideoId,
  youtubeChannelName,
  youtubeChannelUrl,
}: SectionLayoutClientProps) {
  const [isSidebarOpen, setIsSidebarOpen] = useState(true)
  const [isCinemaMode, setIsCinemaMode] = useState(false)
  const [isAISidebarOpen, setIsAISidebarOpen] = useState(true)
  const { locale, courseId } = useParams()

  // ─── Persistence & Resizing ───────────────────────────────────────────────
  const [leftWidth, setLeftWidth] = useState(320)
  const [rightWidth, setRightWidth] = useState(450)
  const [isResizingLeft, setIsResizingLeft] = useState(false)
  const [isResizingRight, setIsResizingRight] = useState(false)
  const [isMounted, setIsMounted] = useState(false)

  // Load from localStorage
  useEffect(() => {
    const savedLeftWidth = localStorage.getItem('lt-layout-left-width')
    const savedRightWidth = localStorage.getItem('lt-layout-right-width')
    const savedSidebarOpen = localStorage.getItem('lt-layout-sidebar-open')
    
    if (savedLeftWidth) setLeftWidth(parseInt(savedLeftWidth, 10))
    if (savedRightWidth) setRightWidth(parseInt(savedRightWidth, 10))
    if (savedSidebarOpen !== null) setIsSidebarOpen(savedSidebarOpen === 'true')
    
    setIsMounted(true)
  }, [])

  // Save to localStorage
  useEffect(() => {
    if (!isMounted) return
    localStorage.setItem('lt-layout-left-width', leftWidth.toString())
    localStorage.setItem('lt-layout-right-width', rightWidth.toString())
    localStorage.setItem('lt-layout-sidebar-open', isSidebarOpen.toString())
  }, [leftWidth, rightWidth, isSidebarOpen, isMounted])

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
      if (newWidth > 200 && newWidth < 500) setLeftWidth(newWidth)
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

  const progressPercentage = Math.round((completedCount / totalCount) * 100) || 0

  // Prevents hydrations flicker for widths
  if (!isMounted) return <div className="h-screen w-screen bg-background" />

  return (
    <SectionLayoutContext.Provider value={{
      isCinemaMode, setIsCinemaMode,
      isAISidebarOpen, setIsAISidebarOpen,
      isSidebarOpen, setIsSidebarOpen
    }}>
      <div className={cn(
        "flex flex-col h-screen bg-background overflow-hidden fixed inset-0 z-[60]",
        (isResizingLeft || isResizingRight) && "cursor-col-resize select-none"
      )}>
        
        {/* HEADER */}
        <header 
          className="h-14 border-b flex items-center justify-between px-4 shrink-0 z-50 shadow-sm"
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
            {ytVideoId && (
              <div className="hidden lg:flex items-center gap-4 pr-2">
                <div className="flex flex-col items-end leading-none">
                  <span className="text-[10px] text-white/50 font-medium mb-0.5 uppercase">Creator</span>
                  <a href={youtubeChannelUrl || '#'} target="_blank" rel="noopener noreferrer" className="text-sm font-bold text-slate-200 hover:text-primary transition-colors">
                    {youtubeChannelName || 'Official Channel'}
                  </a>
                </div>
                <div className="h-8 w-px bg-white/10 mx-1" />
                <a href={`https://www.youtube.com/watch?v=${ytVideoId}`} target="_blank" rel="noopener noreferrer" className="flex flex-col items-start leading-none group px-2">
                  <span className="text-[10px] text-white/50 font-medium mb-0.5 uppercase">Source</span>
                  <div className="flex items-center gap-1.5 font-bold text-white/90 group-hover:text-white text-sm">YouTube</div>
                </a>
              </div>
            )}
            <div className="flex items-center gap-3 bg-white/5 px-3 py-1.5 rounded-full border border-white/10">
              <div className="relative w-7 h-7 flex items-center justify-center">
                <svg className="absolute inset-0 w-full h-full -rotate-90" viewBox="0 0 36 36">
                  <circle className="text-white/10" stroke="currentColor" strokeWidth="3" fill="transparent" r="16" cx="18" cy="18" />
                  <circle className="text-primary transition-all duration-1000" stroke="currentColor" strokeWidth="3" strokeDasharray={`${progressPercentage}, 100`} strokeLinecap="round" fill="transparent" r="16" cx="18" cy="18" />
                </svg>
                <Trophy className={cn("w-3 h-3", progressPercentage === 100 ? "text-yellow-400" : "text-white/40")} />
              </div>
              <span className="text-xs font-black text-white">{progressPercentage}%</span>
            </div>
          </div>
        </header>

        <div className="flex flex-1 min-h-0 overflow-hidden relative">
          
          {/* A LÍNGUA / HANDLE (Lateral Esquerda) */}
          {!isSidebarOpen && !isCinemaMode && (
            <div 
              onClick={() => setIsSidebarOpen(true)}
              className="absolute left-0 top-1/2 -translate-y-1/2 z-50 group cursor-pointer"
            >
              <div className="h-20 w-4 bg-primary hover:w-6 flex items-center justify-center rounded-r-xl shadow-lg transition-all duration-300">
                <ChevronRight className="w-3 h-3 text-white animate-pulse" />
              </div>
            </div>
          )}

          {/* Left Sidebar */}
          <aside
            className={cn(
              'flex flex-col bg-card h-full relative shrink-0',
              (!isSidebarOpen || isCinemaMode) ? 'w-0 overflow-hidden invisible' : 'flex border-r'
            )}
            style={isSidebarOpen && !isCinemaMode ? { width: `${leftWidth}px` } : {}}
          >
            <div className="px-4 py-3 border-b shrink-0 flex items-center justify-between bg-muted/30">
              <span className="text-[10px] font-bold text-muted-foreground uppercase tracking-wider">Lessons</span>
              <Button variant="ghost" size="icon" onClick={() => setIsSidebarOpen(false)} className="h-7 w-7 text-muted-foreground">
                <PanelLeftClose className="w-4 h-4" />
              </Button>
            </div>
            <div className="flex-1 min-h-0 overflow-y-auto custom-scrollbar">
              {sidebar}
            </div>

            {/* Splitter Left */}
            {isSidebarOpen && !isCinemaMode && (
              <div 
                onMouseDown={startResizingLeft}
                className={cn(
                  "absolute top-0 -right-0.5 w-1 h-full z-50 cursor-col-resize hover:bg-primary/50 transition-colors",
                  isResizingLeft && "bg-primary w-0.5"
                )}
              />
            )}
          </aside>

          {/* Main Content Area */}
          <main className="flex-1 flex flex-col min-w-0 h-full relative bg-white dark:bg-slate-950 overflow-hidden">
            <div className="flex-1 min-h-0 overflow-y-auto custom-scrollbar">
              {children}
            </div>
          </main>

          {/* Right Sidebar */}
          {(isCinemaMode || isAISidebarOpen) && (
            <>
              {/* Splitter Right */}
              <div 
                onMouseDown={startResizingRight}
                className={cn(
                  "w-1 relative z-50 cursor-col-resize group transition-colors hover:bg-primary/50",
                  isResizingRight ? "bg-primary" : "bg-border"
                )}
              >
                <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-4 h-12 flex items-center justify-center opacity-0 group-hover:opacity-100">
                  <div className="w-1 h-8 bg-primary/30 rounded-full" />
                </div>
              </div>

              <div 
                className={cn("bg-card flex flex-col h-full shrink-0", !isCinemaMode && "border-l")}
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

import { Sparkles, FileText, X as CloseIcon, Code2 } from 'lucide-react'
import { PlaygroundTab } from './PlaygroundTab'

function CinemaSidebar({ sectionId, transcript, playgroundCode, onClose }: { sectionId: string, transcript: any[] | null, playgroundCode?: string | null, onClose: () => void }) {
  const [activeTab, setActiveTab] = useState<'ai' | 'transcript' | 'playground'>('transcript')

  return (
    <div className="flex flex-col h-full bg-card">
      <div className="h-14 flex items-center justify-between border-b px-2 shrink-0 bg-background">
        <div className="flex flex-1">
          {['ai', 'transcript', 'playground'].map((tab) => (
            <button
              key={tab}
              onClick={() => setActiveTab(tab as any)}
              className={cn(
                "flex-1 flex items-center justify-center gap-2 py-2 text-xs font-semibold transition-all border-b-2 capitalize",
                activeTab === tab ? "border-primary text-primary" : "border-transparent text-muted-foreground hover:text-foreground"
              )}
            >
              {tab === 'ai' && <Sparkles className="w-3 h-3" />}
              {tab === 'transcript' && <FileText className="w-3 h-3" />}
              {tab === 'playground' && <Code2 className="w-3 h-3" />}
              {tab === 'ai' ? 'AI Tutor' : tab}
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
          <div className="p-4 flex-1 overflow-y-auto custom-scrollbar" id="cinema-transcript-container">
             <div id="cinema-transcript-portal" className="h-full" />
          </div>
        </div>
        <div className={cn("absolute inset-0 overflow-hidden flex flex-col p-4", activeTab !== 'playground' && "hidden")}>
           <PlaygroundTab sectionId={sectionId} initialCode={playgroundCode} />
        </div>
      </div>
    </div>
  )
}
