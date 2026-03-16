'use client'

import { useState, useEffect, useCallback, useMemo } from 'react'
import { createClient } from '@/lib/supabase/client'
import { Button } from '@/components/ui/button'
import { Textarea } from '@/components/ui/textarea'
import { Badge } from '@/components/ui/badge'
import { ScrollArea } from '@/components/ui/scroll-area'
import { Loader2, StickyNote, Trash2, Clock } from 'lucide-react'
import type { UserNoteRow, Database } from '@/types/database'

interface NotesTabProps {
  sectionId: string
  getCurrentVideoTime: () => number
  onSeekVideo: (seconds: number) => void
}

export function NotesTab({ sectionId, getCurrentVideoTime, onSeekVideo }: NotesTabProps) {
  const [notes, setNotes] = useState<UserNoteRow[]>([])
  const [content, setContent] = useState('')
  const [isSaving, setIsSaving] = useState(false)
  const [isLoading, setIsLoading] = useState(true)
  const [capturedTime, setCapturedTimestamp] = useState<number | null>(null)

  // Memoize the client to avoid re-creations and type issues
  const supabase = useMemo(() => createClient(), [])

  // Carregar notas
  const fetchNotes = useCallback(async () => {
    const { data: { user } } = await supabase.auth.getUser()
    if (!user) return

    const { data, error } = await supabase
      .from('user_notes')
      .select('*')
      .eq('section_id', sectionId)
      .eq('user_id', user.id)
      .order('timestamp_seconds', { ascending: true })

    if (!error && data) {
      setNotes(data as UserNoteRow[])
    }
    setIsLoading(false)
  }, [sectionId, supabase])

  useEffect(() => {
    fetchNotes()
  }, [fetchNotes])

  // Capturar o tempo atual quando o utilizador começa a escrever
  const handleFocus = () => {
    if (content.length === 0) {
      setCapturedTimestamp(Math.floor(getCurrentVideoTime()))
    }
  }

  const handleSaveNote = async () => {
    if (!content.trim()) return
    setIsSaving(true)

    const { data: { user } } = await supabase.auth.getUser()
    if (!user) {
      setIsSaving(false)
      return
    }

    const timestamp = capturedTime !== null ? capturedTime : Math.floor(getCurrentVideoTime())

    // Forçamos a tipagem aqui para evitar o erro de 'never' do compilador
    const { error } = await (supabase.from('user_notes') as any).insert({
      user_id: user.id,
      section_id: sectionId,
      content: content.trim(),
      timestamp_seconds: timestamp,
    })

    if (!error) {
      setContent('')
      setCapturedTimestamp(null)
      fetchNotes()
    }
    setIsSaving(false)
  }

  const handleDeleteNote = async (id: string) => {
    const { error } = await supabase.from('user_notes').delete().eq('id', id)
    if (!error) {
      setNotes(notes.filter(n => n.id !== id))
    }
  }

  const formatTimestamp = (seconds: number) => {
    const m = Math.floor(seconds / 60)
    const s = seconds % 60
    return `${String(m).padStart(2, '0')}:${String(s).padStart(2, '0')}`
  }

  return (
    <div className="flex flex-col h-full space-y-4">
      {/* Input Area */}
      <div className="space-y-3 bg-muted/30 p-4 rounded-xl border">
        <div className="flex items-center justify-between">
          <label className="text-sm font-semibold flex items-center gap-2 text-foreground">
            <StickyNote className="w-4 h-4 text-primary" />
            Add a new note
          </label>
          {capturedTime !== null && (
            <Badge variant="secondary" className="font-mono text-[10px]">
              Anchored at {formatTimestamp(capturedTime)}
            </Badge>
          )}
        </div>
        <Textarea
          placeholder="Write your note here... The current video time will be captured."
          value={content}
          onChange={(e) => setContent(e.target.value)}
          onFocus={handleFocus}
          className="min-h-[80px] bg-background resize-none text-sm"
        />
        <div className="flex justify-end">
          <Button 
            onClick={handleSaveNote} 
            disabled={isSaving || !content.trim()} 
            size="sm"
            className="font-bold"
          >
            {isSaving ? <Loader2 className="w-4 h-4 animate-spin mr-2" /> : null}
            Save Note
          </Button>
        </div>
      </div>

      {/* Notes List */}
      <ScrollArea className="flex-1 -mx-1 px-1">
        {isLoading ? (
          <div className="flex justify-center py-8">
            <Loader2 className="w-6 h-6 animate-spin text-muted-foreground" />
          </div>
        ) : notes.length > 0 ? (
          <div className="space-y-3 pb-4">
            {notes.map((note) => (
              <div key={note.id} className="group relative bg-card border rounded-lg p-3 transition-all hover:shadow-sm">
                <div className="flex items-start justify-between gap-3 mb-2">
                  <Badge 
                    onClick={() => onSeekVideo(note.timestamp_seconds)}
                    className="cursor-pointer font-mono bg-slate-100 text-slate-900 hover:bg-emerald-500 hover:text-white transition-colors border-none"
                  >
                    <Clock className="w-3 h-3 mr-1" />
                    {formatTimestamp(note.timestamp_seconds)}
                  </Badge>
                  <button 
                    onClick={() => handleDeleteNote(note.id)}
                    className="opacity-0 group-hover:opacity-100 transition-opacity text-muted-foreground hover:text-destructive p-1"
                  >
                    <Trash2 className="w-3.5 h-3.5" />
                  </button>
                </div>
                <p className="text-sm text-foreground/90 whitespace-pre-wrap leading-relaxed">
                  {note.content}
                </p>
              </div>
            ))}
          </div>
        ) : (
          <div className="flex flex-col items-center justify-center py-12 text-center opacity-40">
            <StickyNote className="w-12 h-12 mb-2" />
            <p className="text-sm">No notes yet. Start typing to anchor thoughts to specific moments.</p>
          </div>
        )}
      </ScrollArea>
    </div>
  )
}
