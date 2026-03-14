'use server'

import { redirect } from 'next/navigation'
import { createAdminClient } from '@/lib/supabase/admin'
import { createClient } from '@/lib/supabase/server'
import { routing } from '@/i18n/routing'

// ─── Guard helper ─────────────────────────────────────────────────────────────

async function assertAdmin() {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) throw new Error('Not authenticated.')

  const adminEmails = (process.env.ADMIN_EMAILS ?? '')
    .split(',')
    .map((e) => e.trim().toLowerCase())

  if (!adminEmails.includes(user.email?.toLowerCase() ?? '')) {
    throw new Error('Not authorized.')
  }
}

// ─── Courses ──────────────────────────────────────────────────────────────────

export async function createCourseAction(formData: FormData) {
  await assertAdmin()
  const locale = (formData.get('locale') as string) || routing.defaultLocale
  const db = createAdminClient()

  const { data, error } = await db.from('courses').insert({
    title: formData.get('title') as string,
    description: (formData.get('description') as string) || null,
    cover_image_url: (formData.get('cover_image_url') as string) || null,
  } as never).select('id').single()

  if (error) redirect(`/${locale}/admin/courses/new?error=${encodeURIComponent(error.message)}`)

  redirect(`/${locale}/admin/courses/${(data as { id: string }).id}`)
}

export async function updateCourseAction(formData: FormData) {
  await assertAdmin()
  const locale = (formData.get('locale') as string) || routing.defaultLocale
  const courseId = formData.get('courseId') as string
  const db = createAdminClient()

  const { error } = await db.from('courses').update({
    title: formData.get('title') as string,
    description: (formData.get('description') as string) || null,
    cover_image_url: (formData.get('cover_image_url') as string) || null,
  } as never).eq('id', courseId)

  if (error) redirect(`/${locale}/admin/courses/${courseId}?error=${encodeURIComponent(error.message)}`)

  redirect(`/${locale}/admin/courses/${courseId}?success=Course+updated.`)
}

export async function deleteCourseAction(formData: FormData) {
  await assertAdmin()
  const locale = (formData.get('locale') as string) || routing.defaultLocale
  const courseId = formData.get('courseId') as string
  const db = createAdminClient()

  await db.from('courses').delete().eq('id', courseId)

  redirect(`/${locale}/admin/courses`)
}

// ─── Sections ─────────────────────────────────────────────────────────────────

export async function createSectionAction(formData: FormData) {
  await assertAdmin()
  const locale = (formData.get('locale') as string) || routing.defaultLocale
  const courseId = formData.get('courseId') as string
  const db = createAdminClient()

  // Auto-assign order_index = current count
  const { count } = await db
    .from('course_sections')
    .select('*', { count: 'exact', head: true })
    .eq('course_id', courseId)

  const { error } = await db.from('course_sections').insert({
    course_id: courseId,
    title: formData.get('title') as string,
    yt_video_id: formData.get('yt_video_id') as string,
    start_time_seconds: parseInt(formData.get('start_time_seconds') as string, 10),
    end_time_seconds: parseInt(formData.get('end_time_seconds') as string, 10),
    text_summary: (formData.get('text_summary') as string) || null,
    order_index: count ?? 0,
  } as never)

  if (error) redirect(`/${locale}/admin/courses/${courseId}/sections/new?error=${encodeURIComponent(error.message)}`)

  redirect(`/${locale}/admin/courses/${courseId}?success=Section+added.`)
}

export async function updateSectionAction(formData: FormData) {
  await assertAdmin()
  const locale = (formData.get('locale') as string) || routing.defaultLocale
  const courseId = formData.get('courseId') as string
  const sectionId = formData.get('sectionId') as string
  const db = createAdminClient()

  const { error } = await db.from('course_sections').update({
    title: formData.get('title') as string,
    yt_video_id: formData.get('yt_video_id') as string,
    start_time_seconds: parseInt(formData.get('start_time_seconds') as string, 10),
    end_time_seconds: parseInt(formData.get('end_time_seconds') as string, 10),
    text_summary: (formData.get('text_summary') as string) || null,
    order_index: parseInt(formData.get('order_index') as string, 10),
  } as never).eq('id', sectionId)

  if (error) redirect(`/${locale}/admin/courses/${courseId}/sections/${sectionId}/edit?error=${encodeURIComponent(error.message)}`)

  redirect(`/${locale}/admin/courses/${courseId}?success=Section+updated.`)
}

export async function deleteSectionAction(formData: FormData) {
  await assertAdmin()
  const locale = (formData.get('locale') as string) || routing.defaultLocale
  const courseId = formData.get('courseId') as string
  const sectionId = formData.get('sectionId') as string
  const db = createAdminClient()

  await db.from('course_sections').delete().eq('id', sectionId)

  redirect(`/${locale}/admin/courses/${courseId}?success=Section+deleted.`)
}

// ─── Quizzes ──────────────────────────────────────────────────────────────────

export async function upsertQuizAction(formData: FormData) {
  await assertAdmin()
  const locale = (formData.get('locale') as string) || routing.defaultLocale
  const courseId = formData.get('courseId') as string
  const sectionId = formData.get('sectionId') as string
  const db = createAdminClient()

  const options = [
    formData.get('option_0') as string,
    formData.get('option_1') as string,
    formData.get('option_2') as string,
    formData.get('option_3') as string,
  ]

  const payload = {
    section_id: sectionId,
    question_text: formData.get('question_text') as string,
    options_json: options,
    correct_answer_index: parseInt(formData.get('correct_answer_index') as string, 10),
  }

  const { error } = await (db as never as {
    from: (t: string) => {
      upsert: (v: unknown, o: unknown) => Promise<{ error: null | { message: string } }>
    }
  })
    .from('quizzes')
    .upsert(payload, { onConflict: 'section_id' })

  if (error) redirect(`/${locale}/admin/courses/${courseId}/sections/${sectionId}/edit?error=${encodeURIComponent(error.message)}`)

  redirect(`/${locale}/admin/courses/${courseId}/sections/${sectionId}/edit?success=Quiz+saved.`)
}

export async function deleteQuizAction(formData: FormData) {
  await assertAdmin()
  const locale = (formData.get('locale') as string) || routing.defaultLocale
  const courseId = formData.get('courseId') as string
  const sectionId = formData.get('sectionId') as string
  const db = createAdminClient()

  await db.from('quizzes').delete().eq('section_id', sectionId)

  redirect(`/${locale}/admin/courses/${courseId}/sections/${sectionId}/edit?success=Quiz+removed.`)
}
