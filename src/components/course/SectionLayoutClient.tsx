'use client'

import type { ReactNode } from 'react'
import { useState, createContext, useContext } from 'react'
import { Button } from '@/components/ui/button'
import { PanelLeftClose, PanelLeftOpen, GraduationCap, Trophy, ChevronLeft } from 'lucide-react'
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
  header: ReactNode // Still accepting it but we will replace its logic
  sidebar: ReactNode
  children: ReactNode
  completedCount: number
  totalCount: number
  transcript: any[] | null
  courseTitle?: string
  sectionTitle?: string
  ytVideoId?: string
  youtubeChannelName?: string | null
  youtubeChannelUrl?: string | null
}

export function SectionLayoutClient({
  sectionId,
  header,
  sidebar,
  children,
  completedCount,
  totalCount,
  transcript,
  courseTitle,
  sectionTitle,
  ytVideoId,
  youtubeChannelName,
  youtubeChannelUrl,
}: SectionLayoutClientProps) {
  const [isSidebarOpen, setIsSidebarOpen] = useState(true)
  const [isCinemaMode, setIsCinemaMode] = useState(false)
  const [isAISidebarOpen, setIsAISidebarOpen] = useState(true)
  const { locale, courseId } = useParams()

  const progressPercentage = Math.round((completedCount / totalCount) * 100) || 0

  return (
    <SectionLayoutContext.Provider value={{
      isCinemaMode, setIsCinemaMode,
      isAISidebarOpen, setIsAISidebarOpen,
      isSidebarOpen, setIsSidebarOpen
    }}>
      {/* Container Principal que ocupa toda a tela */}
      <div className="flex flex-col h-screen bg-background overflow-hidden fixed inset-0 z-[60]">
        
        {/* NOVO HEADER CUSTOMIZADO (IMERSIVO) */}
        <header 
          className="h-14 border-b flex items-center justify-between px-4 shrink-0 transition-all duration-500"
          style={{ backgroundColor: 'var(--nav-bg)', color: 'var(--nav-fg)' }}
        >
          {/* Lado Esquerdo: Logo | Link */}
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

          {/* Lado Direito: YouTube Link + Troféu + Círculo de Progresso */}
          <div className="flex items-center gap-4 sm:gap-6">
            {ytVideoId && (
              <div className="hidden lg:flex items-center gap-4 pr-2">
                <div className="flex flex-col items-end leading-none">
                  <span className="text-[10px] text-white/50 font-medium mb-0.5">Creator</span>
                  <a 
                    href={youtubeChannelUrl || '#'} 
                    target="_blank" 
                    rel="noopener noreferrer"
                    className="text-base font-semibold text-slate-200 hover:text-primary transition-colors"
                  >
                    {youtubeChannelName || 'Official Channel'}
                  </a>
                </div>
                
                <div className="h-8 w-px bg-white/10 mx-1" />

                <a 
                  href={`https://www.youtube.com/watch?v=${ytVideoId}`}
                  target="_blank" 
                  rel="noopener noreferrer"
                  className="flex flex-col items-start leading-none group px-2"
                >
                  <span className="text-[10px] text-white/50 font-medium mb-0.5">Watch on</span>
                  <div className="flex items-center gap-1.5">
                    <svg className="w-4 h-4 fill-current text-white/60 group-hover:text-[#FF0000] transition-colors" viewBox="0 0 24 24">
                      <path d="M23.498 6.186a3.016 3.016 0 0 0-2.122-2.136C19.505 3.545 12 3.545 12 3.545s-7.505 0-9.377.505A3.017 3.016 0 0 0 .502 6.186C0 8.07 0 12 0 12s0 3.93.502 5.814a3.016 3.016 0 0 0 2.122 2.136c1.871.505 9.376.505 9.376.505s7.505 0 9.377-.505a3.015 3.016 0 0 0 2.122-2.136C24 15.93 24 12 24 12s0-3.93-.502-5.814zM9.545 15.568V8.432L15.818 12l-6.273 3.568z"/>
                    </svg>
                    <span className="text-sm font-bold text-white/90 group-hover:text-white transition-colors">YouTube</span>
                  </div>
                </a>
              </div>
            )}

            <div className="h-8 w-px bg-white/10 hidden lg:block" />

            <div className="flex items-center gap-3 bg-white/5 px-3 py-1.5 rounded-full border border-white/10">
              <div className="relative w-8 h-8 flex items-center justify-center">
                {/* SVG Progress Circle */}
                <svg className="absolute inset-0 w-full h-full -rotate-90" viewBox="0 0 36 36">
                  <circle
                    className="text-white/10"
                    stroke="currentColor"
                    strokeWidth="3"
                    fill="transparent"
                    r="16"
                    cx="18"
                    cy="18"
                  />
                  <circle
                    className="text-primary transition-all duration-1000 ease-out"
                    stroke="currentColor"
                    strokeWidth="3"
                    strokeDasharray={`${progressPercentage}, 100`}
                    strokeLinecap="round"
                    fill="transparent"
                    r="16"
                    cx="18"
                    cy="18"
                  />
                </svg>
                <Trophy className={cn("w-3.5 h-3.5", progressPercentage === 100 ? "text-yellow-400" : "text-white/40")} />
              </div>
              <div className="flex flex-col leading-none">
                <span className="text-[10px] font-bold text-white/50 tracking-tight">Your Progress</span>
                <span className="text-xs font-black text-white tabular-nums">{progressPercentage}%</span>
              </div>
            </div>
          </div>
        </header>

        <div className="flex flex-1 min-h-0 overflow-hidden relative">
          
          {/* Botão flutuante para Abrir Sidebar quando fechada */}
          {!isSidebarOpen && !isCinemaMode && (
            <Button
              variant="secondary"
              size="icon"
              onClick={() => setIsSidebarOpen(true)}
              className="absolute left-4 top-4 z-30 shadow-md rounded-full border bg-white dark:bg-slate-900 animate-in fade-in slide-in-from-left-2"
            >
              <PanelLeftOpen className="w-4 h-4" />
            </Button>
          )}

          {/* Left Sidebar */}
          <aside
            className={cn(
              'flex-col border-r bg-card transition-all duration-300 ease-in-out h-full relative',
              isSidebarOpen && !isCinemaMode ? 'w-80 flex' : 'w-0 hidden',
            )}
          >
            {/* Sidebar Header integrado */}
            <div className="px-4 py-3 border-b shrink-0 flex items-center justify-between bg-muted/30">
              <div>
                <p className="text-[10px] font-bold text-muted-foreground uppercase tracking-wider">Course content</p>
                <p className="text-xs font-bold text-foreground mt-0.5">
                  {completedCount} / {totalCount} lessons
                </p>
              </div>
              <Button 
                variant="ghost" 
                size="icon" 
                onClick={() => setIsSidebarOpen(false)}
                className="h-8 w-8 text-muted-foreground hover:text-foreground"
              >
                <PanelLeftClose className="w-4 h-4" />
              </Button>
            </div>
            <div className="flex-1 min-h-0 overflow-y-auto custom-scrollbar">
              {sidebar}
            </div>
          </aside>

          {/* Main Content Area */}
          <main className="flex-1 flex flex-col min-w-0 h-full relative bg-white dark:bg-slate-950 overflow-hidden">
            <div className="flex-1 min-h-0 overflow-y-auto custom-scrollbar">
              <div className="w-full h-full">
                {children}
              </div>
            </div>
          </main>

          {/* Right Sidebar (AI Assistant / Transcript in Cinema Mode) */}
          {(isCinemaMode || isAISidebarOpen) && (
            <div className={cn(
              "border-l bg-card flex flex-col h-full transition-all duration-300 ease-in-out shrink-0",
              isCinemaMode ? "w-[450px]" : "w-80 md:w-96"
            )}>
              {isCinemaMode ? (
                <CinemaSidebar sectionId={sectionId} transcript={transcript} onClose={() => setIsCinemaMode(false)} />
              ) : (
                <AIAssistantSidebar 
                  sectionId={sectionId}
                  isOpen={isAISidebarOpen} 
                  onClose={() => setIsAISidebarOpen(false)} 
                />
              )}
            </div>
          )}
        </div>
      </div>
    </SectionLayoutContext.Provider>
  )
}

import { Sparkles, FileText, X as CloseIcon } from 'lucide-react'

function CinemaSidebar({ sectionId, transcript, onClose }: { sectionId: string, transcript: any[] | null, onClose: () => void }) {
  const [activeTab, setActiveTab] = useState<'ai' | 'transcript'>('transcript')

  return (
    <div className="flex flex-col h-full bg-card">
      {/* Tabs Header */}
      <div className="h-14 flex items-center justify-between border-b px-2 shrink-0 bg-background">
        <div className="flex flex-1">
          <button
            onClick={() => setActiveTab('ai')}
            className={cn(
              "flex-1 flex items-center justify-center gap-2 py-2 text-sm font-semibold transition-all border-b-2",
              activeTab === 'ai' ? "border-primary text-primary" : "border-transparent text-muted-foreground hover:text-foreground"
            )}
          >
            <Sparkles className="w-3.5 h-3.5" />
            AI Tutor
          </button>
          <button
            onClick={() => setActiveTab('transcript')}
            className={cn(
              "flex-1 flex items-center justify-center gap-2 py-2 text-sm font-semibold transition-all border-b-2",
              activeTab === 'transcript' ? "border-primary text-primary" : "border-transparent text-muted-foreground hover:text-foreground"
            )}
          >
            <FileText className="w-3.5 h-3.5" />
            Transcript
          </button>
        </div>
        <Button variant="ghost" size="icon" onClick={onClose} className="h-8 w-8 ml-2 text-muted-foreground hover:bg-muted shrink-0">
          <CloseIcon className="w-4 h-4" />
        </Button>
      </div>

      {/* Tab Content */}
      <div className="flex-1 min-h-0 relative">
        <div className={cn("absolute inset-0", activeTab !== 'ai' && "hidden")}>
           <AIAssistantSidebar sectionId={sectionId} isOpen={true} onClose={() => {}} hideHeader={true} />
        </div>
        
        <div className={cn("absolute inset-0 overflow-hidden flex flex-col", activeTab !== 'transcript' && "hidden")}>
          <div className="p-4 flex-1 overflow-y-auto custom-scrollbar" id="cinema-transcript-container">
             <div id="cinema-transcript-portal" className="h-full" />
          </div>
        </div>
      </div>
    </div>
  )
}
