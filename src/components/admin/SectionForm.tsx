'use client'

import { useState, useCallback } from 'react'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Textarea } from '@/components/ui/textarea'
import { Separator } from '@/components/ui/separator'
import { Youtube, Clock, HelpCircle, X } from 'lucide-react'

// ─── Types ────────────────────────────────────────────────────────────────────

export interface SectionFormValues {
  title: string
  yt_video_id: string
  start_time_seconds: number
  end_time_seconds: number
  text_summary: string
  order_index: number
}

interface SectionFormProps {
  locale: string
  courseId: string
  sectionId?: string
  defaults?: Partial<SectionFormValues>
  action: (formData: FormData) => Promise<void>
  submitLabel?: string
  cancelHref: string
}

// ─── Helpers ──────────────────────────────────────────────────────────────────

function secondsToHms(s: number): string {
  if (!s || s < 0) return '0:00'
  const h = Math.floor(s / 3600)
  const m = Math.floor((s % 3600) / 60)
  const sec = Math.floor(s % 60)
  const pad = (n: number) => String(n).padStart(2, '0')
  return h > 0 ? `${h}:${pad(m)}:${pad(sec)}` : `${m}:${pad(sec)}`
}

// ─── Component ────────────────────────────────────────────────────────────────

export function SectionForm({
  locale,
  courseId,
  sectionId,
  defaults,
  action,
  submitLabel = 'Save lesson',
  cancelHref,
}: SectionFormProps) {
  const [videoId, setVideoId] = useState(defaults?.yt_video_id ?? '')
  const [startSec, setStartSec] = useState(defaults?.start_time_seconds ?? 0)
  const [endSec, setEndSec] = useState(defaults?.end_time_seconds ?? 60)
  const [showQuiz, setShowQuiz] = useState(false)

  const previewUrl = videoId
    ? `https://www.youtube.com/embed/${videoId}?start=${startSec}&autoplay=0&rel=0`
    : null

  return (
    <form action={action} className="space-y-8">
      <input type="hidden" name="locale" value={locale} />
      <input type="hidden" name="courseId" value={courseId} />
      {sectionId && <input type="hidden" name="sectionId" value={sectionId} />}

      {/* ── Lesson details ─────────────────────────────────────────────── */}
      <section className="rounded-xl border bg-background p-6 space-y-5">
        <h2 className="text-sm font-semibold flex items-center gap-2">
          <Youtube className="w-4 h-4 text-red-500" />
          Lesson details
        </h2>
        <Separator />

        <div className="space-y-1.5">
          <Label htmlFor="title">Title <span className="text-destructive">*</span></Label>
          <Input id="title" name="title" defaultValue={defaults?.title} placeholder="e.g. What is useState?" required />
        </div>

        {/* YouTube video ID */}
        <div className="space-y-1.5">
          <Label htmlFor="yt_video_id">
            YouTube Video ID <span className="text-destructive">*</span>
          </Label>
          <div className="flex gap-2">
            <Input
              id="yt_video_id"
              name="yt_video_id"
              value={videoId}
              onChange={(e) => setVideoId(e.target.value.trim())}
              placeholder="dQw4w9WgXcQ"
              required
              className="font-mono"
            />
            {videoId && (
              <a
                href={`https://youtu.be/${videoId}`}
                target="_blank"
                rel="noopener noreferrer"
                className="shrink-0 inline-flex items-center gap-1 border rounded-lg px-3 text-xs font-medium hover:bg-muted transition-colors"
              >
                Open ↗
              </a>
            )}
          </div>
          <p className="text-xs text-muted-foreground">
            The 11-character ID from the YouTube URL: youtube.com/watch?v=<strong>dQw4w9WgXcQ</strong>
          </p>
        </div>

        {/* YouTube embed preview */}
        {previewUrl && (
          <div className="space-y-1.5">
            <p className="text-xs font-medium text-muted-foreground">Preview (starts at {secondsToHms(startSec)})</p>
            <div className="aspect-video rounded-xl overflow-hidden border bg-black">
              <iframe
                key={`${videoId}-${startSec}`}
                src={previewUrl}
                allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture"
                allowFullScreen
                className="w-full h-full"
              />
            </div>
          </div>
        )}

        {/* Timestamps ────────────────────────────────────────────────── */}
        <div className="grid grid-cols-2 gap-4">
          <TimeInput
            id="start_time_seconds"
            name="start_time_seconds"
            label="Start time"
            value={startSec}
            onChange={setStartSec}
          />
          <TimeInput
            id="end_time_seconds"
            name="end_time_seconds"
            label="End time"
            value={endSec}
            onChange={setEndSec}
          />
        </div>

        {startSec >= 0 && endSec > startSec && (
          <div className="flex items-center gap-2 text-xs text-muted-foreground bg-muted/40 rounded-lg px-3 py-2">
            <Clock className="w-3.5 h-3.5 shrink-0" />
            Slice: <strong>{secondsToHms(startSec)}</strong> → <strong>{secondsToHms(endSec)}</strong>
            <span className="ml-auto font-medium">{secondsToHms(endSec - startSec)} duration</span>
          </div>
        )}

        {/* Summary */}
        <div className="space-y-1.5">
          <Label htmlFor="text_summary">Summary <span className="text-muted-foreground text-xs font-normal">(optional)</span></Label>
          <Textarea
            id="text_summary"
            name="text_summary"
            defaultValue={defaults?.text_summary}
            placeholder="Key takeaways from this lesson..."
            rows={3}
          />
        </div>

        {sectionId && (
          <div className="space-y-1.5">
            <Label htmlFor="order_index">Order</Label>
            <Input
              id="order_index"
              name="order_index"
              type="number"
              min={0}
              defaultValue={defaults?.order_index ?? 0}
              className="w-24"
            />
          </div>
        )}
      </section>

      {/* ── Quiz (optional) ───────────────────────────────────────────── */}
      <section className="rounded-xl border bg-background overflow-hidden">
        <button
          type="button"
          onClick={() => setShowQuiz(!showQuiz)}
          className="w-full flex items-center justify-between px-6 py-4 hover:bg-muted/30 transition-colors text-left"
        >
          <h2 className="text-sm font-semibold flex items-center gap-2">
            <HelpCircle className="w-4 h-4 text-orange-500" />
            Quiz question
            <span className="text-xs font-normal text-muted-foreground">(optional)</span>
          </h2>
          <span className="text-xs text-muted-foreground">{showQuiz ? 'Hide ▲' : 'Add quiz ▼'}</span>
        </button>

        {showQuiz && (
          <div className="px-6 pb-6 space-y-5 border-t">
            <div className="h-4" />
            <div className="space-y-1.5">
              <Label htmlFor="question_text">Question</Label>
              <Input id="question_text" name="question_text" placeholder="What does useState return?" />
            </div>

            <div className="space-y-3">
              <Label>Answer options</Label>
              {[0, 1, 2, 3].map((i) => (
                <div key={i} className="flex items-center gap-3">
                  <input
                    type="radio"
                    name="correct_answer_index"
                    value={String(i)}
                    id={`correct_${i}`}
                    className="w-4 h-4 accent-primary"
                    required={i === 0}
                  />
                  <Input
                    name={`option_${i}`}
                    placeholder={`Option ${i + 1}`}
                    className="flex-1"
                  />
                  <label htmlFor={`correct_${i}`} className="text-xs text-muted-foreground w-16 shrink-0">
                    {i === 0 ? '← correct?' : ''}
                  </label>
                </div>
              ))}
              <p className="text-xs text-muted-foreground">
                Select the radio button next to the correct answer.
              </p>
            </div>
          </div>
        )}
      </section>

      {/* Submit */}
      <div className="flex items-center justify-end gap-3">
        <a
          href={cancelHref}
          className="text-sm text-muted-foreground hover:text-foreground transition-colors px-4 py-2"
        >
          Cancel
        </a>
        <button
          type="submit"
          className="bg-primary text-white text-sm font-semibold px-5 py-2 rounded-lg hover:bg-primary/90 transition-colors"
        >
          {submitLabel}
        </button>
      </div>
    </form>
  )
}

// ─── TimeInput sub-component ──────────────────────────────────────────────────

function TimeInput({
  id,
  name,
  label,
  value,
  onChange,
}: {
  id: string
  name: string
  label: string
  value: number
  onChange: (v: number) => void
}) {
  return (
    <div className="space-y-1.5">
      <Label htmlFor={id}>{label} (seconds)</Label>
      <Input
        id={id}
        name={name}
        type="number"
        min={0}
        value={value}
        onChange={(e) => onChange(parseInt(e.target.value, 10) || 0)}
        required
      />
      <p className="text-xs text-muted-foreground tabular-nums">{secondsToHms(value)}</p>
    </div>
  )
}
