'use client'

import { useState, useRef, useEffect } from 'react'
import { X, Sparkles, ArrowUp, MessageCircle, Loader2 } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { ScrollArea } from '@/components/ui/scroll-area'
import { Input } from '@/components/ui/input'
import { cn } from '@/lib/utils'
import { chatWithAIAction } from '@/lib/actions/ai'
import ReactMarkdown from 'react-markdown'
import remarkGfm from 'remark-gfm'

interface Message {
  role: 'user' | 'assistant'
  content: string
}

interface AIAssistantSidebarProps {
  sectionId: string
  isOpen: boolean
  onClose: () => void
  hideHeader?: boolean
}

const SUGGESTED_QUESTIONS = [
  "Can you summarize the main points of this video?",
  "What is the key concept explained here?",
  "Can you give me a practical example of this?",
  "How does this relate to the previous lesson?"
]

export function AIAssistantSidebar({ sectionId, isOpen, onClose, hideHeader = false }: AIAssistantSidebarProps) {
  const [messages, setMessages] = useState<Message[]>([])
  const [input, setInput] = useState('')
  const [isLoading, setIsLoading] = useState(false)
  
  const messagesEndRef = useRef<HTMLDivElement>(null)

  // Auto-scroll to bottom function
  const scrollToBottom = (behavior: ScrollBehavior = "smooth") => {
    // Usamos um pequeno timeout para garantir que o DOM já renderizou o conteúdo novo
    setTimeout(() => {
      messagesEndRef.current?.scrollIntoView({ behavior, block: "end" })
    }, 100)
  }

  // Scroll when messages change
  useEffect(() => {
    if (messages.length > 0) {
      scrollToBottom()
    }
  }, [messages, isLoading])

  const handleSend = async (text: string) => {
    const question = text.trim()
    if (!question || isLoading) return

    const userMessage: Message = { role: 'user', content: question }
    setMessages(prev => [...prev, userMessage])
    setInput('')
    setIsLoading(true)

    try {
      const result = await chatWithAIAction(sectionId, question, messages)
      
      if (result.error) {
        setMessages(prev => [...prev, { role: 'assistant', content: `**Error:** ${result.error}` }])
      } else if (result.content) {
        setMessages(prev => [...prev, { role: 'assistant', content: result.content! }])
      }
    } catch (err) {
      setMessages(prev => [...prev, { role: 'assistant', content: "Sorry, I encountered an unexpected error." }])
    } finally {
      setIsLoading(false)
    }
  }

  if (!isOpen) return null

  return (
    <aside className={cn(
      "border-l bg-card flex flex-col h-full animate-in slide-in-from-right duration-300 shadow-2xl z-40 relative",
      hideHeader ? "w-full border-l-0" : "w-80 md:w-96"
    )}>
      {/* ── Header ── */}
      {!hideHeader && (
        <div className="h-14 px-4 flex items-center justify-between border-b shrink-0 bg-background">
          <div className="flex items-center gap-2">
            <span className="text-sm font-bold bg-primary/10 text-primary px-2.5 py-1 rounded-full flex items-center gap-1.5">
              <Sparkles className="w-3.5 h-3.5 fill-primary" />
              AI Tutor
            </span>
          </div>
          <Button variant="ghost" size="icon" onClick={onClose} className="h-8 w-8 text-muted-foreground hover:bg-muted">
            <X className="w-4 h-4" />
          </Button>
        </div>
      )}

      {/* ── Chat Content ── */}
      <div className="flex-1 min-h-0 overflow-y-auto custom-scrollbar p-4">
        <div className="space-y-6">
          {messages.length === 0 ? (
            <div className="py-4 space-y-8 animate-in fade-in duration-500">
              {/* Greeting */}
              <div className="space-y-2">
                <h2 className="text-xl font-bold tracking-tight text-foreground">
                  Do you have any questions about this course?
                </h2>
                <p className="text-[11px] text-muted-foreground leading-relaxed">
                  Our AI assistant may make mistakes. Verify for accuracy.
                </p>
              </div>

              {/* Suggested Questions */}
              <div className="space-y-3">
                <p className="text-[10px] font-bold uppercase tracking-widest text-muted-foreground/70">
                  Suggested Questions
                </p>
                <div className="space-y-2">
                  {SUGGESTED_QUESTIONS.map((q, i) => (
                    <Button 
                      key={i} 
                      variant="outline" 
                      onClick={() => handleSend(q)}
                      className="w-full justify-start text-left h-auto py-3 px-4 text-xs whitespace-normal hover:bg-primary/5 hover:text-primary hover:border-primary/30 transition-all border-dashed"
                    >
                      <MessageCircle className="w-3.5 h-3.5 mr-2 shrink-0 opacity-50" />
                      {q}
                    </Button>
                  ))}
                </div>
              </div>
            </div>
          ) : (
            <div className="space-y-6">
              {messages.map((m, i) => (
                <div key={i} className={cn("flex flex-col gap-2 animate-in fade-in slide-in-from-bottom-2 duration-300", m.role === 'user' ? "items-end" : "items-start")}>
                  <div className={cn(
                    "max-w-[90%] rounded-2xl px-4 py-3 text-sm shadow-sm",
                    m.role === 'user' 
                      ? "bg-primary text-primary-foreground rounded-tr-none" 
                      : "bg-muted text-foreground rounded-tl-none border"
                  )}>
                    {m.role === 'user' ? (
                      m.content
                    ) : (
                      <div className="prose prose-sm dark:prose-invert prose-p:leading-relaxed prose-pre:bg-slate-900 prose-pre:text-slate-100 max-w-none">
                        <ReactMarkdown remarkPlugins={[remarkGfm]}>
                          {m.content}
                        </ReactMarkdown>
                      </div>
                    )}
                  </div>
                </div>
              ))}
              {isLoading && (
                <div className="flex items-center gap-2 text-muted-foreground text-xs animate-pulse">
                  <div className="bg-muted rounded-2xl rounded-tl-none px-4 py-2.5 border">
                    <Loader2 className="h-4 w-4 animate-spin text-primary" />
                  </div>
                </div>
              )}
              {/* Invisible anchor for scrolling */}
              <div ref={messagesEndRef} className="h-px w-full" />
            </div>
          )}
        </div>
      </div>

      {/* ── Input Area ── */}
      <div className="p-4 border-t bg-background/80 backdrop-blur-sm shrink-0">
        <form 
          onSubmit={(e) => { e.preventDefault(); handleSend(input); }}
          className="relative flex items-center gap-2"
        >
          <div className="relative flex-1">
            <Input 
              value={input}
              onChange={(e) => setInput(e.target.value)}
              placeholder="Ask a question..." 
              disabled={isLoading}
              className="pr-10 h-11 bg-muted/50 border-transparent focus:border-primary/30 focus:ring-0 transition-all rounded-xl text-sm"
            />
            <Button 
              type="submit"
              size="icon" 
              disabled={isLoading || !input.trim()}
              className={cn(
                "absolute right-1 top-1 h-9 w-9 shadow-lg rounded-lg transition-all",
                input.trim() ? "bg-primary text-white scale-100" : "bg-muted text-muted-foreground scale-90"
              )}
            >
              <ArrowUp className="w-4 h-4" />
            </Button>
          </div>
        </form>
      </div>
    </aside>
  )
}
