'use server'

import { createClient } from '@/lib/supabase/server'

export interface FilterOptions {
  levels: string[]
  tracks: string[]
  skills: string[]
}

export async function getFilterOptionsAction(): Promise<FilterOptions> {
  const supabase = await createClient()

  // 1. Fetch all unique non-null levels and tracks
  const { data: courses, error } = await (supabase
    .from('courses')
    .select('level, suggested_track, skills') as any)

  if (error) {
    console.error('[getFilterOptionsAction] Error:', error)
    return { levels: [], tracks: [], skills: [] }
  }

  const levelsSet = new Set<string>()
  const tracksSet = new Set<string>()
  const skillsSet = new Set<string>()

  courses?.forEach((course: any) => {
    if (course.level) levelsSet.add(course.level)
    if (course.suggested_track) tracksSet.add(course.suggested_track)
    if (Array.isArray(course.skills)) {
      course.skills.forEach((s: string) => skillsSet.add(s))
    }
  })

  const LEVEL_ORDER = ['Beginner', 'Intermediate', 'Advanced']

  return {
    levels: Array.from(levelsSet).sort((a, b) => LEVEL_ORDER.indexOf(a) - LEVEL_ORDER.indexOf(b)),
    tracks: Array.from(tracksSet).sort(),
    skills: Array.from(skillsSet).sort()
  }
}
