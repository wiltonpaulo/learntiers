'use server'

import { redirect } from 'next/navigation'
import { createAdminClient } from '@/lib/supabase/admin'
import { createClient } from '@/lib/supabase/server'
import { routing } from '@/i18n/routing'
import { fetchYouTubeTranscript, fetchYouTubeMetadata } from '@/lib/youtube'
import { parseSubtitleFile } from '@/lib/subtitle-parser'
import type { CourseRow, CourseSectionRow } from '@/types/database'
import { s3Client, S3_BUCKET } from '@/lib/s3'
import { PutObjectCommand } from '@aws-sdk/client-s3'

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

async function uploadTranscriptToS3(courseId: string, transcript: any) {
  const key = `transcripts/${courseId}.json`
  const body = JSON.stringify(transcript)
  
  await s3Client.send(new PutObjectCommand({
    Bucket: S3_BUCKET,
    Key: key,
    Body: body,
    ContentType: 'application/json'
  }))

  // Construct the public URL (assuming the bucket/folder is public)
  // For Supabase S3, the format is usually: {S3_ENDPOINT}/{S3_BUCKET}/{Key}
  // But for better portability, we can store just the key or the full URL
  const endpoint = process.env.S3_ENDPOINT?.replace(/\/s3$/, '')
  return `${endpoint}/${S3_BUCKET}/${key}`
}

// ─── Courses ──────────────────────────────────────────────────────────────────

export async function createCourseAction(formData: FormData) {
  await assertAdmin()
  const locale = (formData.get('locale') as string) || routing.defaultLocale
  const db = createAdminClient()

  let courseData = {
    title: formData.get('title') as string,
    description: (formData.get('description') as string) || null,
    cover_image_url: (formData.get('cover_image_url') as string) || null,
    transcript: null as any,
  }

  let tempTranscript = null

  // Handle Transcript File
  const transcriptFile = formData.get('transcript_file') as File | null
  if (transcriptFile && transcriptFile.size > 0) {
    const text = await transcriptFile.text()
    tempTranscript = parseSubtitleFile(text)
  }

  let sectionsToImport: any[] = []

  // Check for JSON import
  const importFile = formData.get('import_file') as File | null
  if (importFile && importFile.size > 0) {
    try {
      const text = await importFile.text()
      const json = JSON.parse(text)
      
      // Override course data if present in JSON
      if (json.title) courseData.title = json.title
      if (json.description) courseData.description = json.description
      if (json.cover_image_url) courseData.cover_image_url = json.cover_image_url
      
      if (Array.isArray(json.sections)) {
        sectionsToImport = json.sections
      }
    } catch (e) {
      return redirect(`/${locale}/admin/courses/new?error=${encodeURIComponent('Invalid JSON file format.')}`)
    }
  }

  if (!courseData.title) {
    return redirect(`/${locale}/admin/courses/new?error=${encodeURIComponent('Course title is required.')}`)
  }

  // Auto-fetch channel info from the first section if available
  let youtubeChannelName = null
  let youtubeChannelUrl = null
  if (sectionsToImport.length > 0 && sectionsToImport[0].yt_video_id) {
    const meta = await fetchYouTubeMetadata(sectionsToImport[0].yt_video_id)
    if (meta) {
      youtubeChannelName = meta.authorName
      youtubeChannelUrl = meta.authorUrl
    }
  }

  const { data: course, error: courseError } = await db.from('courses').insert({
    title: courseData.title,
    description: courseData.description,
    cover_image_url: courseData.cover_image_url,
    transcript: null, // Insert null initially
    youtube_channel_name: youtubeChannelName,
    youtube_channel_url: youtubeChannelUrl,
  } as never).select('id').single()

  if (courseError) {
    return redirect(`/${locale}/admin/courses/new?error=${encodeURIComponent(courseError.message)}`)
  }

  const courseId = (course as { id: string }).id

  // If we had a transcript, upload it to S3 now that we have the courseId
  if (tempTranscript) {
    try {
      const transcriptUrl = await uploadTranscriptToS3(courseId, tempTranscript)
      await db.from('courses').update({ transcript: transcriptUrl } as never).eq('id', courseId)
    } catch (s3Error) {
      console.error('S3 Upload Error:', s3Error)
      // Optional: Handle error (maybe notify user that transcript upload failed)
    }
  }

  // Import sections if any
  if (sectionsToImport.length > 0) {
    for (let i = 0; i < sectionsToImport.length; i++) {
      const s = sectionsToImport[i]
      const { data: section, error: sectionError } = await db.from('course_sections').insert({
        course_id: courseId,
        title: s.title || `Lesson ${i + 1}`,
        yt_video_id: s.yt_video_id,
        start_time_seconds: parseInt(s.start_time_seconds || s.start || 0, 10),
        end_time_seconds: parseInt(s.end_time_seconds || s.end || 0, 10),
        text_summary: s.text_summary || s.summary || null,
        order_index: i,
      } as never).select('id').single()

      if (!sectionError && section && s.quiz) {
        const quiz = s.quiz
        const options = Array.isArray(quiz.options) ? quiz.options : []
        await (db as any).from('quizzes').upsert({
          section_id: (section as { id: string }).id,
          question_text: quiz.question_text || quiz.question,
          options_json: options,
          correct_answer_index: parseInt(quiz.correct_answer_index || 0, 10),
        }, { onConflict: 'section_id' })
      }
    }
  }

  redirect(`/${locale}/admin/courses/${courseId}`)
}

export async function updateCourseAction(formData: FormData) {
  await assertAdmin()
  const locale = (formData.get('locale') as string) || routing.defaultLocale
  const courseId = formData.get('courseId') as string
  const db = createAdminClient()

  let updatePayload: any = {
    title: formData.get('title') as string,
    description: (formData.get('description') as string) || null,
    cover_image_url: (formData.get('cover_image_url') as string) || null,
  }

  // Handle Transcript File
  const transcriptFile = formData.get('transcript_file') as File | null
  if (transcriptFile && transcriptFile.size > 0) {
    const text = await transcriptFile.text()
    const transcriptData = parseSubtitleFile(text)
    try {
      const transcriptUrl = await uploadTranscriptToS3(courseId, transcriptData)
      updatePayload.transcript = transcriptUrl
    } catch (s3Error) {
      console.error('S3 Upload Error:', s3Error)
    }
  }

  // Auto-fetch channel info and check for legacy transcript migration
  const { data: currentCourse } = await db
    .from('courses')
    .select('youtube_channel_name, id, transcript')
    .eq('id', courseId)
    .single() as { data: Pick<CourseRow, 'youtube_channel_name' | 'id' | 'transcript'> | null }

  if (currentCourse) {
    // 1. Automatic Migration: If transcript is still a JSON array, move it to S3
    if (currentCourse.transcript && Array.isArray(currentCourse.transcript) && !updatePayload.transcript) {
      try {
        const transcriptUrl = await uploadTranscriptToS3(courseId, currentCourse.transcript)
        updatePayload.transcript = transcriptUrl
      } catch (s3Error) {
        console.error('Migration S3 Error:', s3Error)
      }
    }

    // 2. Channel Info Fetch
    if (!currentCourse.youtube_channel_name) {
      const { data: firstSection } = await db
        .from('course_sections')
        .select('yt_video_id')
        .eq('course_id', courseId)
        .order('order_index')
        .limit(1)
        .single() as { data: Pick<CourseSectionRow, 'yt_video_id'> | null }
      
      if (firstSection?.yt_video_id) {
        const meta = await fetchYouTubeMetadata(firstSection.yt_video_id)
        if (meta) {
          updatePayload.youtube_channel_name = meta.authorName
          updatePayload.youtube_channel_url = meta.authorUrl
        }
      }
    }
  }

  const { error } = await db.from('courses').update(updatePayload as never).eq('id', courseId)

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

  const yt_video_id = formData.get('yt_video_id') as string

  const { error } = await db.from('course_sections').insert({
    course_id: courseId,
    title: formData.get('title') as string,
    yt_video_id: yt_video_id,
    start_time_seconds: parseInt(formData.get('start_time_seconds') as string, 10),
    end_time_seconds: parseInt(formData.get('end_time_seconds') as string, 10),
    text_summary: (formData.get('text_summary') as string) || null,
    order_index: count ?? 0,
  } as never)

  // Also update course channel info if it's the first section
  if (count === 0) {
    const meta = await fetchYouTubeMetadata(yt_video_id)
    if (meta) {
      await db.from('courses').update({
        youtube_channel_name: meta.authorName,
        youtube_channel_url: meta.authorUrl
      } as never).eq('id', courseId)
    }
  }

  if (error) redirect(`/${locale}/admin/courses/${courseId}/sections/new?error=${encodeURIComponent(error.message)}`)

  redirect(`/${locale}/admin/courses/${courseId}?success=Section+added.`)
}

export async function updateSectionAction(formData: FormData) {
  await assertAdmin()
  const locale = (formData.get('locale') as string) || routing.defaultLocale
  const courseId = formData.get('courseId') as string
  const sectionId = formData.get('sectionId') as string
  const db = createAdminClient()

  let updatePayload: any = {
    title: formData.get('title') as string,
    yt_video_id: formData.get('yt_video_id') as string,
    start_time_seconds: parseInt(formData.get('start_time_seconds') as string, 10),
    end_time_seconds: parseInt(formData.get('end_time_seconds') as string, 10),
    text_summary: (formData.get('text_summary') as string) || null,
    order_index: parseInt(formData.get('order_index') as string, 10),
  }

  const { error } = await db.from('course_sections').update(updatePayload as never).eq('id', sectionId)

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
