import { createAdminClient } from '@/lib/supabase/admin'
import type { CourseSectionRow, CourseRow } from '@/types/database'

/**
 * Robustly resolves a transcript from a section or its parent course.
 * Handles both JSON arrays and S3 URLs.
 */
export async function getTranscriptForAI(sectionId: string) {
  const supabase = createAdminClient()

  // 1. Fetch section and course transcript info
  const { data: sectionRes, error: sectionError } = await supabase
    .from('course_sections')
    .select('id, transcript, course_id, start_time_seconds, end_time_seconds, title')
    .eq('id', sectionId)
    .single()

  const sectionData = sectionRes as unknown as CourseSectionRow

  if (sectionError || !sectionData) {
    return { error: 'Section not found' }
  }

  let transcriptData = sectionData.transcript

  // 2. If section has no transcript, fallback to parent course
  if (!transcriptData && sectionData.course_id) {
    const { data: courseData } = await supabase
      .from('courses')
      .select('transcript')
      .eq('id', sectionData.course_id)
      .single()
    transcriptData = (courseData as any)?.transcript
  }

  // 3. Resolve URL if it's an S3 link
  if (typeof transcriptData === 'string' && transcriptData.startsWith('http')) {
    try {
      // Direct fetch from Supabase/S3
      const res = await fetch(transcriptData, { cache: 'no-store' })
      if (res.ok) {
        transcriptData = await res.json()
      } else {
        console.error(`[AI Helper] Failed to fetch transcript URL: ${res.status}`)
        transcriptData = null
      }
    } catch (e) {
      console.error(`[AI Helper] Fetch error:`, e)
      transcriptData = null
    }
  }

  if (!transcriptData || !Array.isArray(transcriptData)) {
    return { error: 'No valid transcript available.' }
  }

  // 4. Filter for the specific section window
  const contextText = transcriptData
    .filter((s: any) => 
      s.start >= (sectionData.start_time_seconds ?? 0) && 
      s.start <= (sectionData.end_time_seconds ?? 99999)
    )
    .map((s: any) => s.text)
    .join(' ')

  if (!contextText || contextText.length < 20) {
    return { error: 'Transcript segment is too short for AI context.' }
  }

  return { contextText, section: sectionData }
}
