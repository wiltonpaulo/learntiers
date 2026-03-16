'use client'

import { useState } from 'react'
import { Button } from '@/components/ui/button'
import { ScrollArea } from '@/components/ui/scroll-area'
import { PanelRightClose, PanelRightOpen, Zap, Lightbulb, Loader2, Sparkles } from 'lucide-react'
import { cn } from '@/lib/utils'
import { generateTakeawaysAction } from '@/lib/actions/ai'

interface TakeawaysSidebarProps {
  sectionId: string
  initialTakeaways: string[]
}

export function TakeawaysSidebar({ sectionId, initialTakeaways }: TakeawaysSidebarProps) {
  const [isOpen, setIsOpen] = useState(true)
  const [takeaways, setTakeaways] = useState<string[]>(initialTakeaways)
  const [isGenerating, setIsGenerating] = useState(false)
  const [error, setError] = useState<string | null>(null)

  const handleGenerate = async () => {
    setIsGenerating(true)
    setError(null)
    
    try {
      const result = await generateTakeawaysAction(sectionId)
      if (result.error) {
        setError(result.error)
      } else if (result.takeaways) {
        setTakeaways(result.takeaways)
      }
    } catch (err) {
      setError('Failed to generate takeaways.')
    } finally {
      setIsGenerating(false)
    }
  }

  return (
    <div
      className={cn(
        'relative flex flex-col h-full border-l border-border transition-all duration-300 ease-in-out bg-slate-50 dark:bg-slate-900/30',
        isOpen ? 'w-80' : 'w-12'
      )}
    >
      {/* Toggle Button */}
      <div className="flex items-center justify-center h-12 border-b border-border shrink-0">
        <Button
          variant="ghost"
          size="icon"
          onClick={() => setIsOpen(!isOpen)}
          title={isOpen ? 'Collapse sidebar' : 'Expand sidebar'}
          className="h-8 w-8 text-muted-foreground hover:text-foreground"
        >
          {isOpen ? <PanelRightClose className="h-4 w-4" /> : <PanelRightOpen className="h-4 w-4" />}
        </Button>
      </div>

      {/* Sidebar Content */}
      <div
        className={cn(
          'flex-1 flex flex-col min-h-0 transition-opacity duration-200',
          isOpen ? 'opacity-100' : 'opacity-0 pointer-events-none'
        )}
      >
        {/* Header */}
        <div className="px-6 py-4 flex items-center gap-2 border-b border-border bg-slate-100/50 dark:bg-slate-800/50 shrink-0">
          <Lightbulb className="h-4 w-4 text-amber-500" />
          <h2 className="text-sm font-bold tracking-tight uppercase text-slate-700 dark:text-slate-300">
            Key Takeaways
          </h2>
        </div>

        {/* Content Area */}
        <ScrollArea className="flex-1">
          <div className="px-6 py-6">
            {takeaways && takeaways.length > 0 ? (
              <ul className="space-y-6">
                {takeaways.map((point, idx) => (
                  <li key={idx} className="flex gap-3 group animate-in slide-in-from-right-2 duration-300" style={{ animationDelay: `${idx * 50}ms` }}>
                    <div className="mt-1 shrink-0">
                      <div className="w-5 h-5 rounded-full bg-amber-500/10 flex items-center justify-center transition-transform group-hover:scale-110">
                        <Zap className="h-3 w-3 text-amber-500 fill-amber-500" />
                      </div>
                    </div>
                    <p className="text-sm leading-relaxed text-slate-600 dark:text-slate-400 font-medium">
                      {point}
                    </p>
                  </li>
                ))}
              </ul>
            ) : (
              <div className="flex flex-col items-center justify-center py-8 text-center space-y-4">
                <div className="w-12 h-12 rounded-full bg-primary/10 flex items-center justify-center">
                  <Sparkles className="h-6 w-6 text-primary" />
                </div>
                <div className="space-y-1">
                  <p className="text-sm font-semibold">No takeaways yet</p>
                  <p className="text-xs text-muted-foreground">Generate AI-powered summaries from this lesson.</p>
                </div>
                
                <Button 
                  onClick={handleGenerate} 
                  disabled={isGenerating}
                  className="w-full font-bold shadow-sm"
                >
                  {isGenerating ? (
                    <>
                      <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                      Generating...
                    </>
                  ) : (
                    <>
                      <Sparkles className="mr-2 h-4 w-4" />
                      Generate with Grok
                    </>
                  )}
                </Button>
                
                {error && (
                  <p className="text-[10px] text-destructive bg-destructive/10 p-2 rounded border border-destructive/20">
                    {error}
                  </p>
                )}
              </div>
            )}
          </div>
        </ScrollArea>
      </div>

      {/* Vertical Label when collapsed */}
      {!isOpen && (
        <div className="absolute top-20 left-0 w-full flex justify-center">
          <span 
            className="text-[10px] font-bold text-muted-foreground uppercase tracking-[0.2em] whitespace-nowrap rotate-90 origin-center"
            style={{ transform: 'rotate(90deg) translateY(-50%)' }}
          >
            Takeaways
          </span>
        </div>
      )}
    </div>
  )
}
