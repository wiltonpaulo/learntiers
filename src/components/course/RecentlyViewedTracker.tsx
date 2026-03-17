'use client'

import { useEffect } from 'react'

interface RecentlyViewedTrackerProps {
  course: {
    id: string
    title: string
    cover_image_url: string | null
    duration?: string
  }
}

export default function RecentlyViewedTracker({ course }: RecentlyViewedTrackerProps) {
  useEffect(() => {
    if (typeof window === 'undefined') return

    const storageKey = 'learntiers_recently_viewed'
    const maxItems = 5

    try {
      const stored = localStorage.getItem(storageKey)
      let items: any[] = stored ? JSON.parse(stored) : []

      // Remove if already exists (to move to top)
      items = items.filter((item: any) => item.id !== course.id)

      // Add to beginning
      items.unshift({
        id: course.id,
        title: course.title,
        cover_image_url: course.cover_image_url,
        duration: course.duration || 'Free',
        timestamp: Date.now()
      })

      // Limit size
      if (items.length > maxItems) {
        items = items.slice(0, maxItems)
      }

      localStorage.setItem(storageKey, JSON.stringify(items))
    } catch (e) {
      console.error('Error updating recently viewed:', e)
    }
  }, [course])

  return null
}
