'use client'

import { useState, useEffect, useCallback, useMemo } from 'react'
import { createClient } from '@/lib/supabase/client'
import { Button } from '@/components/ui/button'
import { Textarea } from '@/components/ui/textarea'
import { Badge } from '@/components/ui/badge'
import { ScrollArea } from '@/components/ui/scroll-area'
import { Loader2, StickyNote, Trash2, Clock, Edit2, X } from 'lucide-react'
import type { UserNoteRow } from '@/types/database'
import { useSectionLayout } from './SectionLayoutClient'
import { cn } from '@/lib/utils'

interface NotesTabProps {
  sectionId: string
}

export function NotesTab({ sectionId }: NotesTabProps) {
  const { 
    playerApi,
    startTimeSeconds,
    draftNoteContent: content, 
    setDraftNoteContent: setContent,
    draftCapturedTime: capturedTime,
    setDraftCapturedTime: setCapturedTimestamp
  } = useSectionLayout()

  const [notes, setNotes] = useState<UserNoteRow[]>([])
  const [isSaving, setIsSaving] = useState(false)
  const [isLoading, setIsLoading] = useState(true)
  const [editingNoteId, setEditingNoteId] = useState<string | null>(null)

  const getCurrentVideoTime = () => playerApi?.getCurrentTime() || 0
  const onSeekVideo = (seconds: number) => playerApi?.seekTo(seconds)

  const supabase = useMemo(() => createClient(), [])

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

  const formatTimestamp = (seconds: number) => {
    const h = Math.floor(seconds / 3600)
    const m = Math.floor((seconds % 3600) / 60)
    const s = Math.floor(seconds % 60)
    return h > 0 
      ? `${String(h).padStart(2, '0')}:${String(m).padStart(2, '0')}:${String(s).padStart(2, '0')}`
      : `${String(m).padStart(2, '0')}:${String(s).padStart(2, '0')}`
  }

  const formatDualTimestamp = (absoluteSeconds: number) => {
    const relativeSeconds = Math.max(0, absoluteSeconds - startTimeSeconds)
    return `${formatTimestamp(relativeSeconds)} (${formatTimestamp(absoluteSeconds)})`
  }

  const handleFocus = () => {
    if (content.length === 0 && !editingNoteId) {
      const time = getCurrentVideoTime();
      setCapturedTimestamp(Math.floor(time || 0));
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

    if (editingNoteId) {
      // UPDATE existing note
      const { error } = await (supabase.from('user_notes') as any)
        .update({
          content: content.trim(),
          timestamp_seconds: timestamp,
        })
        .eq('id', editingNoteId)

      if (!error) {
        setEditingNoteId(null)
        setContent('')
        setCapturedTimestamp(null)
        fetchNotes()
      }
    } else {
      // INSERT new note
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
    }
    setIsSaving(false)
  }

  const handleEditClick = (note: UserNoteRow) => {
    setEditingNoteId(note.id)
    setContent(note.content)
    setCapturedTimestamp(note.timestamp_seconds)
    // Scroll top focus? Handled by user clicking
  }

  const cancelEdit = () => {
    setEditingNoteId(null)
    setContent('')
    setCapturedTimestamp(null)
  }

  const handleDeleteNote = async (id: string) => {
    const { error } = await supabase.from('user_notes').delete().eq('id', id)
    if (!error) {
      setNotes(notes.filter(n => n.id !== id))
      if (editingNoteId === id) cancelEdit()
    }
  }

  return (
    <div className="flex flex-col h-full space-y-4">
      {/* Input Area */}
      <div className={cn(
        "space-y-3 p-4 rounded-xl border transition-all duration-300",
        editingNoteId 
          ? "bg-amber-500/5 border-amber-500/20 shadow-[0_0_15px_rgba(245,158,11,0.1)]" 
          : "bg-muted/30 border-slate-200 dark:border-white/5"
      )}>
        <div className="flex items-center justify-between">
          <label className="text-[10px] font-bold uppercase tracking-widest flex items-center gap-2 text-muted-foreground">
            {editingNoteId ? <Edit2 className="w-3.5 h-3.5 text-amber-500" /> : <StickyNote className="w-3.5 h-3.5 text-primary" />}
            {editingNoteId ? "Editing Note" : "Add Note"}
          </label>
          {capturedTime !== null && (
            <Badge variant="secondary" className={cn(
              "border-none px-2 py-0.5 text-[9px] font-black uppercase flex items-center gap-1 animate-in fade-in zoom-in-95",
              editingNoteId ? "bg-amber-500/10 text-amber-600" : "bg-primary/10 text-primary"
            )}>
              <span className="relative flex h-1.5 w-1.5 mr-0.5">
                <span className={cn("animate-ping absolute inline-flex h-full w-full rounded-full opacity-75", editingNoteId ? "bg-amber-500" : "bg-primary")}></span>
                <span className={cn("relative inline-flex rounded-full h-1.5 w-1.5", editingNoteId ? "bg-amber-500" : "bg-primary")}></span>
              </span>
              {editingNoteId ? "Note Position" : "Video Anchor Active"}
            </Badge>
          )}
        </div>
        <Textarea
          placeholder="Start typing to anchor your note to this moment..."
          value={content}
          onChange={(e) => setContent(e.target.value)}
          onFocus={handleFocus}
          className="min-h-[80px] bg-background resize-none text-sm border-none focus-visible:ring-1 focus-visible:ring-primary/20 shadow-inner rounded-lg"
        />
        <div className="flex justify-end gap-2">
          {editingNoteId ? (
            <Button variant="ghost" size="sm" onClick={cancelEdit} className="h-8 text-[10px] text-muted-foreground uppercase font-bold hover:text-destructive">
              <X className="w-3 h-3 mr-1" /> Cancel
            </Button>
          ) : (
            capturedTime !== null && (
              <Button variant="ghost" size="sm" onClick={() => setCapturedTimestamp(null)} className="h-8 text-[10px] text-muted-foreground uppercase font-bold hover:text-primary">
                Clear Anchor
              </Button>
            )
          )}
          <Button 
            onClick={handleSaveNote} 
            disabled={isSaving || !content.trim()} 
            size="sm"
            className={cn("h-8 font-bold shadow-md px-4", editingNoteId ? "bg-amber-500 hover:bg-amber-600" : "")}
          >
            {isSaving ? <Loader2 className="w-3.5 h-3.5 animate-spin mr-2" /> : null}
            {editingNoteId ? "Update Note" : `Save to ${formatDualTimestamp(capturedTime || Math.floor(getCurrentVideoTime()))}`}
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
              <div 
                key={note.id} 
                className={cn(
                  "group relative bg-card border rounded-xl p-4 transition-all",
                  editingNoteId === note.id 
                    ? "border-amber-500/50 bg-amber-500/5 ring-1 ring-amber-500/20" 
                    : "border-slate-200 dark:border-white/5 hover:border-primary/20 hover:shadow-md"
                )}
              >
                <div className="flex items-start justify-between gap-3 mb-3">
                  <button 
                    onClick={() => onSeekVideo(note.timestamp_seconds)}
                    className="flex items-center gap-2 px-2.5 py-1 bg-slate-100 dark:bg-white/5 hover:bg-primary hover:text-white rounded-lg transition-all text-[11px] font-bold text-slate-600 dark:text-slate-400 group/btn"
                  >
                    <Clock className="w-3.5 h-3.5 text-primary group-hover/btn:text-white" />
                    Jump to {formatDualTimestamp(note.timestamp_seconds)}
                  </button>
                  <div className="flex items-center gap-1 opacity-0 group-hover:opacity-100 transition-opacity">
                    <button 
                      onClick={() => handleEditClick(note)}
                      className="text-muted-foreground hover:text-primary p-1 transition-colors"
                      title="Edit note"
                    >
                      <Edit2 className="w-3.5 h-3.5" />
                    </button>
                    <button 
                      onClick={() => handleDeleteNote(note.id)}
                      className="text-muted-foreground hover:text-destructive p-1 transition-colors"
                      title="Delete note"
                    >
                      <Trash2 className="w-3.5 h-3.5" />
                    </button>
                  </div>
                </div>
                <p className="text-sm text-slate-700 dark:text-slate-300 whitespace-pre-wrap leading-relaxed">
                  {note.content}
                </p>
              </div>
            ))}
          </div>
        ) : (
          <div className="flex flex-col items-center justify-center py-12 text-center opacity-40">
            <div className="w-16 h-16 bg-muted rounded-full flex items-center justify-center mb-4">
              <StickyNote className="w-8 h-8" />
            </div>
            <p className="text-sm font-medium text-foreground">No notes yet</p>
            <p className="text-xs text-muted-foreground mt-1 max-w-[200px]">Type above to anchor thoughts to specific moments in the video.</p>
          </div>
        )}
      </ScrollArea>
    </div>
  )
}
