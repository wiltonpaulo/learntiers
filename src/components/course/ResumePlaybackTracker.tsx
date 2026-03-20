'use client'

import { useEffect, useRef } from 'react'
import { saveLastPlaybackAction } from '@/lib/actions/progress'

interface ResumePlaybackTrackerProps {
  courseId: string
  sectionId: string
  currentTime: number
}

/**
 * Tracks and persists the current playback position for each lesson.
 * Saves to both localStorage (instant) and Database (sync).
 */
export function ResumePlaybackTracker({ courseId, sectionId, currentTime }: ResumePlaybackTrackerProps) {
  const lastSavedTimeRef = useRef<number>(currentTime)

  useEffect(() => {
    // We only save every 15 seconds to the DB to avoid excessive requests
    // But we save to localStorage every 5 seconds for local continuity
    const diff = Math.abs(currentTime - lastSavedTimeRef.current)
    
    if (diff >= 5) {
      const storageKey = `lt-resume-${courseId}`
      const data = {
        sectionId,
        time: currentTime,
        updatedAt: Date.now()
      }
      localStorage.setItem(storageKey, JSON.stringify(data))
      
      // Save to DB every 15 seconds or so
      if (diff >= 15) {
        saveLastPlaybackAction({ courseId, sectionId, time: currentTime })
        lastSavedTimeRef.current = currentTime
      }
    }
  }, [courseId, sectionId, currentTime])

  return null
}
