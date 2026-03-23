'use server'

import { redirect } from 'next/navigation'
import { createAdminClient } from '@/lib/supabase/admin'
import { createClient } from '@/lib/supabase/server'
import { fetchYouTubeTranscript, fetchYouTubeMetadata } from '@/lib/youtube'
import { parseSubtitleFile } from '@/lib/subtitle-parser'
import type { CourseRow, CourseSectionRow } from '@/types/database'
import { s3Client, S3_BUCKET } from '@/lib/s3'
import { PutObjectCommand } from '@aws-sdk/client-s3'
import { generateSlug } from '@/lib/utils'

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

  const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL?.replace(/\/$/, '')
  return `${supabaseUrl}/storage/v1/object/public/${S3_BUCKET}/${key}`
}

// ─── Courses ──────────────────────────────────────────────────────────────────

export async function createCourseAction(formData: FormData) {
  let courseSlug: string | null = null
  let errorMessage: string | null = null

  try {
    await assertAdmin()
    const db = createAdminClient()

    let courseData = {
      title: formData.get('title') as string,
      description: (formData.get('description') as string) || null,
      cover_image_url: (formData.get('cover_image_url') as string) || null,
      transcript: null as any,
    }

    let tempTranscript = null

    const transcriptFile = formData.get('transcript_file') as File | null
    if (transcriptFile && transcriptFile.size > 0) {
      const text = await transcriptFile.text()
      tempTranscript = parseSubtitleFile(text)
    }

    let sectionsToImport: any[] = []

    const importFile = formData.get('import_file') as File | null
    if (importFile && importFile.size > 0) {
      try {
        const text = await importFile.text()
        const json = JSON.parse(text)
        
        if (json.title) courseData.title = json.title
        if (json.description) courseData.description = json.description
        if (json.cover_image_url) courseData.cover_image_url = json.cover_image_url
        
        if (Array.isArray(json.sections)) {
          sectionsToImport = json.sections
        }
      } catch (e) {
        errorMessage = 'Invalid JSON file format.'
        throw new Error(errorMessage)
      }
    }

    if (!courseData.title) {
      errorMessage = 'Course title is required.'
      throw new Error(errorMessage)
    }

    let youtubeChannelName = null
    let youtubeChannelUrl = null
    if (sectionsToImport.length > 0 && sectionsToImport[0].yt_video_id) {
      const meta = await fetchYouTubeMetadata(sectionsToImport[0].yt_video_id)
      if (meta) {
        youtubeChannelName = meta.authorName
        youtubeChannelUrl = meta.authorUrl
      }
    }

    const slug = generateSlug(courseData.title)

    const { data: course, error: courseError } = await db.from('courses').insert({
      title: courseData.title,
      slug,
      description: courseData.description,
      cover_image_url: courseData.cover_image_url,
      transcript: null,
      youtube_channel_name: youtubeChannelName,
      youtube_channel_url: youtubeChannelUrl,
    } as never).select('id, slug').single()

    if (courseError) {
      errorMessage = courseError.message
      throw new Error(errorMessage)
    }

    const courseId = (course as { id: string }).id
    courseSlug = (course as { slug: string }).slug

    if (tempTranscript) {
      try {
        const transcriptUrl = await uploadTranscriptToS3(courseId, tempTranscript)
        await db.from('courses').update({ transcript: transcriptUrl } as never).eq('id', courseId)
      } catch (s3Error) {
        // Log S3 error but don't fail course creation
      }
    }

    if (sectionsToImport.length > 0) {
      for (let i = 0; i < sectionsToImport.length; i++) {
        const s = sectionsToImport[i]
        const sectionSlug = generateSlug(s.title || `Lesson ${i + 1}`)
        const { data: section, error: sectionError } = await db.from('course_sections').insert({
          course_id: courseId,
          title: s.title || `Lesson ${i + 1}`,
          slug: sectionSlug,
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
  } catch (err: any) {
    if (errorMessage) {
      redirect(`/admin/courses/new?error=${encodeURIComponent(errorMessage)}`)
    }
    redirect(`/admin/courses/new?error=${encodeURIComponent(err.message || 'Failed to create course.')}`)
  }

  if (courseSlug) {
    redirect(`/admin/courses/${courseSlug}`)
  }
}

export async function updateCourseAction(formData: FormData) {
  let courseSlug: string | null = null
  let courseId: string | null = null

  try {
    await assertAdmin()
    courseId = formData.get('courseId') as string
    const db = createAdminClient()

    const title = formData.get('title') as string
    const slug = generateSlug(title)
    courseSlug = slug

    let updatePayload: any = {
      title,
      slug,
      description: (formData.get('description') as string) || null,
      cover_image_url: (formData.get('cover_image_url') as string) || null,
    }

    const transcriptFile = formData.get('transcript_file') as File | null
    if (transcriptFile && transcriptFile.size > 0) {
      const text = await transcriptFile.text()
      const transcriptData = parseSubtitleFile(text)
      try {
        const transcriptUrl = await uploadTranscriptToS3(courseId, transcriptData)
        updatePayload.transcript = transcriptUrl
      } catch (s3Error) {
        // Log S3 error
      }
    }

    const { data: currentCourse } = await db
      .from('courses')
      .select('youtube_channel_name, id, transcript')
      .eq('id', courseId)
      .single() as { data: Pick<CourseRow, 'youtube_channel_name' | 'id' | 'transcript'> | null }

    if (currentCourse) {
      if (currentCourse.transcript && Array.isArray(currentCourse.transcript) && !updatePayload.transcript) {
        try {
          const transcriptUrl = await uploadTranscriptToS3(courseId, currentCourse.transcript)
          updatePayload.transcript = transcriptUrl
        } catch (s3Error) {
          // Log migration error
        }
      }

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
    if (error) throw new Error(error.message)

  } catch (err: any) {
    redirect(`/admin/courses/${courseId || ''}?error=${encodeURIComponent(err.message || 'Failed to update course.')}`)
  }

  redirect(`/admin/courses/${courseSlug}?success=Course+updated.`)
}

export async function deleteCourseAction(formData: FormData) {
  try {
    await assertAdmin()
    const courseId = formData.get('courseId') as string
    const db = createAdminClient()

    const { error } = await db.from('courses').delete().eq('id', courseId)
    if (error) throw new Error(error.message)
  } catch (err: any) {
    // Optionally redirect back with error
    redirect(`/admin/courses?error=${encodeURIComponent(err.message || 'Failed to delete course.')}`)
  }

  redirect('/admin/courses')
}

// ─── Sections ─────────────────────────────────────────────────────────────────

export async function createSectionAction(formData: FormData) {
  let courseSlug: string | null = null

  try {
    await assertAdmin()
    const courseId = formData.get('courseId') as string
    const db = createAdminClient()

    const { data: courseData } = await (db.from('courses').select('slug').eq('id', courseId).single() as any) as { data: { slug: string } | null }
    courseSlug = courseData?.slug || courseId

    const { count } = await db
      .from('course_sections')
      .select('*', { count: 'exact', head: true })
      .eq('course_id', courseId)

    const title = formData.get('title') as string
    const slug = generateSlug(title)
    const yt_video_id = formData.get('yt_video_id') as string

    const { error } = await db.from('course_sections').insert({
      course_id: courseId,
      title,
      slug,
      yt_video_id: yt_video_id,
      start_time_seconds: parseInt(formData.get('start_time_seconds') as string, 10),
      end_time_seconds: parseInt(formData.get('end_time_seconds') as string, 10),
      text_summary: (formData.get('text_summary') as string) || null,
      playground_code: (formData.get('playground_code') as string) || null,
      order_index: count ?? 0,
    } as never)

    if (error) throw new Error(error.message)

    if (count === 0) {
      const meta = await fetchYouTubeMetadata(yt_video_id)
      if (meta) {
        await db.from('courses').update({
          youtube_channel_name: meta.authorName,
          youtube_channel_url: meta.authorUrl
        } as never).eq('id', courseId)
      }
    }
  } catch (err: any) {
    redirect(`/admin/courses/${courseSlug || ''}/sections/new?error=${encodeURIComponent(err.message || 'Failed to create section.')}`)
  }

  redirect(`/admin/courses/${courseSlug}?success=Section+added.`)
}

export async function updateSectionAction(formData: FormData) {
  let courseSlug: string | null = null
  let sectionSlug: string | null = null

  try {
    await assertAdmin()
    const courseId = formData.get('courseId') as string
    const sectionId = formData.get('sectionId') as string
    const db = createAdminClient()

    const { data: courseData } = await (db.from('courses').select('slug').eq('id', courseId).single() as any) as { data: { slug: string } | null }
    courseSlug = courseData?.slug || courseId

    const title = formData.get('title') as string
    const slug = generateSlug(title)
    sectionSlug = slug

    let updatePayload: any = {
      title,
      slug,
      yt_video_id: formData.get('yt_video_id') as string,
      start_time_seconds: parseInt(formData.get('start_time_seconds') as string, 10),
      end_time_seconds: parseInt(formData.get('end_time_seconds') as string, 10),
      text_summary: (formData.get('text_summary') as string) || null,
      playground_code: (formData.get('playground_code') as string) || null,
      order_index: parseInt(formData.get('order_index') as string, 10),
    }

    const { error } = await db.from('course_sections').update(updatePayload as never).eq('id', sectionId)
    if (error) throw new Error(error.message)

  } catch (err: any) {
    redirect(`/admin/courses/${courseSlug || ''}/sections/${sectionSlug || ''}/edit?error=${encodeURIComponent(err.message || 'Failed to update section.')}`)
  }

  redirect(`/admin/courses/${courseSlug}?success=Section+updated.`)
}

export async function deleteSectionAction(formData: FormData) {
  let courseSlug: string | null = null

  try {
    await assertAdmin()
    const courseId = formData.get('courseId') as string
    const sectionId = formData.get('sectionId') as string
    const db = createAdminClient()

    const { data: courseData } = await (db.from('courses').select('slug').eq('id', courseId).single() as any) as { data: { slug: string } | null }
    courseSlug = courseData?.slug || courseId

    const { error } = await db.from('course_sections').delete().eq('id', sectionId)
    if (error) throw new Error(error.message)
  } catch (err: any) {
    redirect(`/admin/courses/${courseSlug || ''}?error=${encodeURIComponent(err.message || 'Failed to delete section.')}`)
  }

  redirect(`/admin/courses/${courseSlug}?success=Section+deleted.`)
}

// ─── Quizzes ──────────────────────────────────────────────────────────────────

export async function upsertQuizAction(formData: FormData) {
  let courseSlug: string | null = null
  let sectionSlug: string | null = null

  try {
    await assertAdmin()
    const courseId = formData.get('courseId') as string
    const sectionId = formData.get('sectionId') as string
    const db = createAdminClient()

    const [{ data: courseData }, { data: sectionData }] = await Promise.all([
      db.from('courses').select('slug').eq('id', courseId).single() as any,
      db.from('course_sections').select('slug').eq('id', sectionId).single() as any
    ])
    courseSlug = courseData?.slug || courseId
    sectionSlug = sectionData?.slug || sectionId

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

    if (error) throw new Error(error.message)
  } catch (err: any) {
    redirect(`/admin/courses/${courseSlug || ''}/sections/${sectionSlug || ''}/edit?error=${encodeURIComponent(err.message || 'Failed to save quiz.')}`)
  }

  redirect(`/admin/courses/${courseSlug}/sections/${sectionSlug}/edit?success=Quiz+saved.`)
}

export async function deleteQuizAction(formData: FormData) {
  let courseSlug: string | null = null
  let sectionSlug: string | null = null

  try {
    await assertAdmin()
    const courseId = formData.get('courseId') as string
    const sectionId = formData.get('sectionId') as string
    const db = createAdminClient()

    const [{ data: courseData }, { data: sectionData }] = await Promise.all([
      db.from('courses').select('slug').eq('id', courseId).single() as any,
      db.from('course_sections').select('slug').eq('id', sectionId).single() as any
    ])
    courseSlug = courseData?.slug || courseId
    sectionSlug = sectionData?.slug || sectionId

    const { error } = await db.from('quizzes').delete().eq('section_id', sectionId)
    if (error) throw new Error(error.message)
  } catch (err: any) {
    redirect(`/admin/courses/${courseSlug || ''}/sections/${sectionSlug || ''}/edit?error=${encodeURIComponent(err.message || 'Failed to delete quiz.')}`)
  }

  redirect(`/admin/courses/${courseSlug}/sections/${sectionSlug}/edit?success=Quiz+removed.`)
}
