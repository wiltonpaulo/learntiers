'use client'

import type { ReactNode } from 'react'
import { useState, createContext, useContext } from 'react'
import { Button } from '@/components/ui/button'
import { PanelLeftClose, PanelLeftOpen } from 'lucide-react'
import { AIAssistantSidebar } from './AIAssistantSidebar'
import { cn } from '@/lib/utils'

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
}

export function SectionLayoutClient({
  sectionId,
  header,
  sidebar,
  children,
  completedCount,
  totalCount,
  transcript,
}: SectionLayoutClientProps) {
  const [isSidebarOpen, setIsSidebarOpen] = useState(true)
  const [isCinemaMode, setIsCinemaMode] = useState(false)
  const [isAISidebarOpen, setIsAISidebarOpen] = useState(true)

  return (
    <SectionLayoutContext.Provider value={{
      isCinemaMode, setIsCinemaMode,
      isAISidebarOpen, setIsAISidebarOpen,
      isSidebarOpen, setIsSidebarOpen
    }}>
      <div className="flex flex-col h-[calc(100vh-56px)] bg-background overflow-hidden">
        {/* Cabeçalho da Lição (Breadcrumbs) - Escondido apenas em Cinema Mode */}
        {!isCinemaMode && header}

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
            {/* Sidebar Header com Botão de Fechar integrado */}
            <div className="px-4 py-3 border-b shrink-0 flex items-center justify-between" style={{ backgroundColor: 'var(--nav-bg)' }}>
              <div>
                <p className="text-[10px] font-semibold text-white/50 uppercase tracking-wider">Course content</p>
                <p className="text-xs font-bold text-white mt-0.5">
                  {completedCount} / {totalCount} completed
                </p>
              </div>
              <Button 
                variant="ghost" 
                size="icon" 
                onClick={() => setIsSidebarOpen(false)}
                className="h-8 w-8 text-white/60 hover:text-white hover:bg-white/10"
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
            {/* Conteúdo (Vídeo + Abas) */}
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
              "flex-1 flex items-center justify-center gap-2 py-2 text-xs font-bold transition-all border-b-2",
              activeTab === 'ai' ? "border-primary text-primary" : "border-transparent text-muted-foreground hover:text-foreground"
            )}
          >
            <Sparkles className="w-3.5 h-3.5" />
            AI ASSISTANT
          </button>
          <button
            onClick={() => setActiveTab('transcript')}
            className={cn(
              "flex-1 flex items-center justify-center gap-2 py-2 text-xs font-bold transition-all border-b-2",
              activeTab === 'transcript' ? "border-primary text-primary" : "border-transparent text-muted-foreground hover:text-foreground"
            )}
          >
            <FileText className="w-3.5 h-3.5" />
            TRANSCRIPT
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
