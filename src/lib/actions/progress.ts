'use server'

import { createClient } from '@/lib/supabase/server'
import { createAdminClient } from '@/lib/supabase/admin'
import type { UserProgressInsert } from '@/types/database'

interface SaveProgressArgs {
  sectionId: string
  isCompleted: boolean
  quizScore?: number
}

/**
 * Upserts a user_progress row for the authenticated user.
 * Called by the SectionView Client Component via server action binding.
 */
export async function saveProgressAction({
  sectionId,
  isCompleted,
  quizScore,
}: SaveProgressArgs): Promise<{ error?: string }> {
  const supabase = await createClient()

  const {
    data: { user },
  } = await supabase.auth.getUser()

  if (!user) {
    return { error: 'Not authenticated.' }
  }

  // Note: upsert and rpc use 'as any' casts because our hand-written Database
  // generic omits the internal `Relationships` field that Supabase's codegen
  // produces. Runtime behaviour is correct; this is a TS inference boundary only.
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const { error } = await (supabase as any).from('user_progress').upsert(
    {
      user_id: user.id,
      section_id: sectionId,
      is_completed: isCompleted,
      quiz_score: quizScore ?? null,
      updated_at: new Date().toISOString(),
    },
    { onConflict: 'user_id,section_id' },
  )

  if (error) {
    return { error: (error as { message: string }).message }
  }

  // If completed, increment total_score (base reward = quiz score or 10 pts)
  if (isCompleted) {
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    await (supabase as any).rpc('increment_user_score', {
      p_user_id: user.id,
      p_delta: quizScore ?? 10,
    })

    // Check for Course Completion & Issue Certificate
    try {
      // 1. Get the course_id for this section
      const { data: section } = await (supabase as any)
        .from('course_sections')
        .select('course_id')
        .eq('id', sectionId)
        .single()

      if (section && 'course_id' in section) {
        const courseId = section.course_id as string

        // 2. Count total sections in course
        const { count: totalSections } = await supabase
          .from('course_sections')
          .select('*', { count: 'exact', head: true })
          .eq('course_id', courseId)

        // 3. Count completed sections by this user
        // We join with course_sections to ensure we only count sections for THIS course
        const { count: completedSections } = await (supabase as any)
          .from('user_progress')
          .select('section_id', { count: 'exact', head: true })
          .eq('user_id', user.id)
          .eq('is_completed', true)
          .in('section_id', 
            (await (supabase as any).from('course_sections').select('id').eq('course_id', courseId)).data?.map((s: any) => s.id) || []
          )

        if (totalSections && completedSections && completedSections >= totalSections) {
          // 4. All sections done! Issue certificate using Admin client for reliability
          const adminDb = createAdminClient()
          await (adminDb as any).from('certificates').upsert(
            { user_id: user.id, course_id: courseId },
            { onConflict: 'user_id,course_id' }
          )
        }
      }
    } catch (e) {
      console.error('Error issuing certificate:', e)
    }
  }

  return {}
}

export async function saveLastPlaybackAction({
  courseId,
  sectionId,
  time,
}: {
  courseId: string
  sectionId: string
  time: number
}): Promise<{ error?: string }> {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return { error: 'Not authenticated.' }

  const { error } = await (supabase as any).from('user_course_settings').upsert(
    {
      user_id: user.id,
      course_id: courseId,
      last_section_id: sectionId,
      last_time_seconds: Math.floor(time),
      updated_at: new Date().toISOString(),
    },
    { onConflict: 'user_id,course_id' }
  )

  if (error) return { error: error.message }
  return {}
}
