'use client'

import type { ReactNode } from 'react'
import { useState } from 'react'
import { Button } from '@/components/ui/button'
import { PanelLeftClose, PanelLeftOpen, Maximize, Minimize, Sparkles } from 'lucide-react'
import { AIAssistantSidebar } from './AIAssistantSidebar'
import { cn } from '@/lib/utils'

interface SectionLayoutClientProps {
  sectionId: string
  header: ReactNode
  sidebar: ReactNode
  children: ReactNode
  completedCount: number
  totalCount: number
}

export function SectionLayoutClient({
  sectionId,
  header,
  sidebar,
  children,
  completedCount,
  totalCount,
}: SectionLayoutClientProps) {
  const [isSidebarOpen, setIsSidebarOpen] = useState(true)
  const [isCinemaMode, setIsCinemaMode] = useState(false)
  const [isAISidebarOpen, setIsAISidebarOpen] = useState(true)

  return (
    <div className="flex flex-col h-[calc(100vh-56px)] bg-background overflow-hidden">
      {!isCinemaMode && header}

      <div className="flex flex-1 min-h-0 overflow-hidden">
        {/* Left Sidebar */}
        <aside
          className={cn(
            'flex-col border-r bg-card transition-all duration-300 ease-in-out h-full',
            isSidebarOpen && !isCinemaMode ? 'w-80 flex' : 'w-0 hidden',
          )}
        >
          <div className="px-4 py-3 border-b shrink-0" style={{ backgroundColor: 'var(--nav-bg)' }}>
            <p className="text-xs font-semibold text-white/60 uppercase tracking-wider">Course content</p>
            <p className="text-sm font-bold text-white mt-0.5">
              {completedCount} / {totalCount} completed
            </p>
          </div>
          <div className="flex-1 min-h-0 overflow-y-auto custom-scrollbar">
            {sidebar}
          </div>
        </aside>

        {/* Main Content Area */}
        <main className="flex-1 flex flex-col min-w-0 h-full relative">
          {/* Controls Bar */}
          <div className="flex items-center gap-2 p-2 border-b bg-card shrink-0 h-12">
            <Button
              variant="ghost"
              size="icon"
              onClick={() => setIsSidebarOpen(!isSidebarOpen)}
              className={cn(isCinemaMode && 'hidden')}
            >
              {isSidebarOpen ? (
                <PanelLeftClose className="w-5 h-5" />
              ) : (
                <PanelLeftOpen className="w-5 h-5" />
              )}
            </Button>

            <div className="flex-1" />

            <div className="flex items-center gap-1">
              {/* ✨ AI Assistant Toggle Button */}
              {!isCinemaMode && !isAISidebarOpen && (
                <Button 
                  variant="ghost" 
                  size="sm" 
                  onClick={() => setIsAISidebarOpen(true)}
                  className="gap-2 text-primary hover:text-primary hover:bg-primary/5 font-bold animate-in fade-in zoom-in duration-300"
                >
                  <Sparkles className="w-4 h-4 fill-primary" />
                  Ask AI
                </Button>
              )}

              <Button variant="ghost" size="icon" onClick={() => setIsCinemaMode(!isCinemaMode)}>
                {isCinemaMode ? <Minimize className="w-5 h-5" /> : <Maximize className="w-5 h-5" />}
              </Button>
            </div>
          </div>

          {/* Video and Lesson Content */}
          <div className="flex-1 min-h-0 overflow-y-auto custom-scrollbar">
            <div
              className={cn(
                'mx-auto transition-all duration-300 ease-in-out p-6 md:p-8',
                isCinemaMode ? 'max-w-7xl' : 'max-w-5xl',
              )}
            >
              {children}
            </div>
          </div>
        </main>

        {/* Right Sidebar (AI Assistant) */}
        {!isCinemaMode && (
          <AIAssistantSidebar 
            sectionId={sectionId}
            isOpen={isAISidebarOpen} 
            onClose={() => setIsAISidebarOpen(false)} 
          />
        )}
      </div>
    </div>
  )
}