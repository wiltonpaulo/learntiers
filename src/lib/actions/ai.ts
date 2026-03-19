'use server'

import { createAdminClient } from '@/lib/supabase/admin'
import { revalidatePath } from 'next/cache'

const GROQ_API_URL = 'https://api.groq.com/openai/v1/chat/completions'

export async function generateTakeawaysAction(sectionId: string) {
  const supabase = createAdminClient()

  // 1. Fetch section and course transcript
  const { data: sectionData, error: sectionError } = await supabase
    .from('course_sections')
    .select('id, title, transcript, course_id, start_time_seconds, end_time_seconds')
    .eq('id', sectionId)
    .single()

  const section = sectionData as any

  if (sectionError || !section) {
    console.error('Supabase error:', sectionError)
    return { error: 'Section not found' }
  }

  // 2. Determine transcript to use
  let transcriptData = section.transcript
  if (!transcriptData) {
    const { data: courseData } = await supabase
      .from('courses')
      .select('transcript')
      .eq('id', section.course_id)
      .single()
    transcriptData = (courseData as any)?.transcript
  }

  if (!transcriptData || !Array.isArray(transcriptData)) {
    return { error: 'No transcript available. Please upload a transcript to the course first.' }
  }

  // 3. Filter transcript for the section time window
  const filteredText = transcriptData
    .filter((s: any) => s.start >= section.start_time_seconds && s.start <= section.end_time_seconds)
    .map((s: any) => s.text)
    .join(' ')

  if (!filteredText || filteredText.length < 50) {
    return { error: 'Transcript segment is too short to generate takeaways.' }
  }

  // 4. Call Groq API
  const apiKey = process.env.GROQ_API_KEY
  if (!apiKey) {
    return { error: 'GROQ_API_KEY is not configured.' }
  }

  try {
    const response = await fetch(GROQ_API_URL, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${apiKey}`,
      },
      body: JSON.stringify({
        model: 'llama-3.3-70b-versatile',
        messages: [
          {
            role: 'system',
            content: 'You are an expert educational assistant. Extract 3 to 5 key takeaways from the provided video transcript. Each takeaway must be a single, concise, and punchy English sentence. Return ONLY a JSON object with a "takeaways" key containing an array of strings.',
          },
          {
            role: 'user',
            content: `Transcript: ${filteredText}`,
          },
        ],
        response_format: { type: 'json_object' },
        temperature: 0.5,
      }),
    })

    if (!response.ok) {
      const err = await response.text()
      console.error('Groq API error:', err)
      return { error: 'AI service communication failed.' }
    }

    const result = await response.json()
    const content = JSON.parse(result.choices[0].message.content)
    const takeaways = content.takeaways

    if (!Array.isArray(takeaways)) {
      return { error: 'Invalid response format from AI.' }
    }

    // 5. Save to Database
    const { error: updateError } = await (supabase.from('course_sections') as any)
      .update({ key_takeaways: takeaways })
      .eq('id', sectionId)

    if (updateError) {
      console.error('Update error:', updateError)
      return { error: 'Failed to save takeaways.' }
    }

    revalidatePath('/')
    return { success: true, takeaways }
  } catch (err) {
    console.error('Generation error:', err)
    return { error: 'An unexpected error occurred.' }
  }
}

export async function generatePlaygroundCodeAction(sectionId: string) {
  const supabase = createAdminClient()

  // 1. Fetch section and course context
  const { data: sectionData, error: sectionError } = await supabase
    .from('course_sections')
    .select('id, title, transcript, course_id, start_time_seconds, end_time_seconds')
    .eq('id', sectionId)
    .single()

  const section = sectionData as any
  if (sectionError || !section) return { error: 'Section not found' }

  // 2. Determine transcript
  let transcriptData = section.transcript
  if (!transcriptData && section.course_id) {
    const { data: courseData } = await supabase.from('courses').select('transcript').eq('id', section.course_id).single()
    transcriptData = (courseData as any)?.transcript
  }

  // Handle URL transcript if it's a string (new S3 logic)
  if (typeof transcriptData === 'string' && transcriptData.startsWith('http')) {
    const res = await fetch(transcriptData)
    if (res.ok) transcriptData = await res.json()
  }

  if (!transcriptData || !Array.isArray(transcriptData)) {
    return { error: 'No transcript available for code generation.' }
  }

  const contextText = transcriptData
    .filter((s: any) => s.start >= section.start_time_seconds && s.start <= section.end_time_seconds)
    .map((s: any) => s.text)
    .join(' ')

  const apiKey = process.env.GROQ_API_KEY
  if (!apiKey) return { error: 'GROQ_API_KEY not configured.' }

  try {
    const response = await fetch(GROQ_API_URL, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${apiKey}`,
      },
      body: JSON.stringify({
        model: 'llama-3.3-70b-versatile',
        messages: [
          {
            role: 'system',
            content: `You are an expert developer assistant. Based on the video transcript provided, detect the most appropriate programming language or file format discussed (e.g. React, Python, YAML, JSON, Dockerfile, etc).
            
            Create a single-file example that demonstrates the concepts discussed in this lesson.
            
            REQUIREMENTS:
            - The code must be high-quality and idiomatic.
            - Include comments explaining the code based on the lesson context.
            - Detect the best filename (e.g. App.js, script.py, config.yaml, index.html).
            - Return ONLY a JSON object with:
              "filename": the suggested name of the file.
              "code": the string of the source code.`,
          },
          {
            role: 'user',
            content: `Lesson Title: ${section.title}\nTranscript: ${contextText}`,
          },
        ],
        response_format: { type: 'json_object' },
        temperature: 0.6,
      }),
    })

    const result = await response.json()
    const content = JSON.parse(result.choices[0].message.content)
    const { filename, code } = content

    // 3. Save to Database (We save as a JSON string to keep both filename and code)
    const payload = JSON.stringify({ filename, code })
    await (supabase.from('course_sections') as any)
      .update({ playground_code: payload })
      .eq('id', sectionId)

    revalidatePath('/')
    return { success: true, filename, code }
  } catch (err) {
    console.error('Code generation error:', err)
    return { error: 'Failed to generate code.' }
  }
}

export async function chatWithAIAction(sectionId: string, question: string, history: { role: 'user' | 'assistant', content: string }[]) {
  const supabase = createAdminClient()
  const apiKey = process.env.GROQ_API_KEY

  if (!apiKey) return { error: 'GROQ_API_KEY not set.' }

  // 1. Get Transcript context
  const { data: sectionData } = await supabase
    .from('course_sections')
    .select('title, transcript, course_id, start_time_seconds, end_time_seconds')
    .eq('id', sectionId)
    .single()

  const section = sectionData as any

  let transcriptData = section?.transcript
  if (!transcriptData && section?.course_id) {
    const { data: courseData } = await supabase.from('courses').select('transcript').eq('id', section.course_id).single()
    transcriptData = (courseData as any)?.transcript
  }

  const contextText = Array.isArray(transcriptData) 
    ? transcriptData
        .filter((s: any) => s.start >= (section?.start_time_seconds ?? 0) && s.start <= (section?.end_time_seconds ?? 99999))
        .map((s: any) => s.text)
        .join(' ')
    : ''

  try {
    const response = await fetch(GROQ_API_URL, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${apiKey}`,
      },
      body: JSON.stringify({
        model: 'llama-3.3-70b-versatile',
        messages: [
          {
            role: 'system',
            content: `You are a helpful teaching assistant for a course. 
            The current lesson is titled: "${section?.title ?? 'Unknown'}". 
            Use the following transcript as context to answer student questions concisely.
            
            FORMATTING RULES:
            - ALWAYS use Markdown for structure.
            - Use bullet points or numbered lists for components or steps.
            - Use bold (**text**) for key terms.
            - Use code blocks (\`code\`) for technical commands.
            - Keep paragraphs short and fluid.
            - Answer in the same language as the student's question.
            
            CONTEXT TRANSCRIPT:
            ${contextText.slice(0, 10000)}`
          },
          ...history,
          { role: 'user', content: question }
        ],
        temperature: 0.7,
      }),
    })

    if (!response.ok) return { error: 'Failed to reach Groq.' }

    const result = await response.json()
    return { content: result.choices[0].message.content }
  } catch (err) {
    return { error: 'Unexpected error in chat.' }
  }
}
