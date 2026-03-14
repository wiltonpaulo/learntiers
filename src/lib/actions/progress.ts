'use server'

import { createClient } from '@/lib/supabase/server'
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
  }

  return {}
}
