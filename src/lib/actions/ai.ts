'use server'

import { createAdminClient } from '@/lib/supabase/admin'
import { revalidatePath } from 'next/cache'
import { getTranscriptForAI } from '@/lib/ai-transcript-helper'

const GROQ_API_URL = 'https://api.groq.com/openai/v1/chat/completions'

export async function generateTakeawaysAction(sectionId: string) {
  const transcriptRes = await getTranscriptForAI(sectionId)
  if ('error' in transcriptRes) return { error: transcriptRes.error }

  const { contextText } = transcriptRes
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
        model: 'llama-3.1-8b-instant',
        messages: [
          {
            role: 'system',
            content: 'You are an expert educational assistant. Extract 3 to 5 key takeaways from the provided video transcript. Each takeaway must be a single, concise, and punchy English sentence. Return ONLY a JSON object with a "takeaways" key containing an array of strings.',
          },
          {
            role: 'user',
            content: `Transcript: ${contextText}`,
          },
        ],
        response_format: { type: 'json_object' },
        temperature: 0.5,
      }),
    })

    if (!response.ok) return { error: 'AI service communication failed.' }

    const result = await response.json()
    if (!result.choices?.[0]?.message?.content) return { error: 'Empty AI response.' }

    const content = JSON.parse(result.choices[0].message.content)
    const takeaways = content.takeaways

    if (!Array.isArray(takeaways)) return { error: 'Invalid response format from AI.' }

    const supabase = createAdminClient()
    await (supabase.from('course_sections') as any).update({ key_takeaways: takeaways }).eq('id', sectionId)

    revalidatePath('/')
    return { success: true, takeaways }
  } catch (err) {
    console.error('Generation error:', err)
    return { error: 'An unexpected error occurred.' }
  }
}

export async function generatePlaygroundCodeAction(sectionId: string) {
  const transcriptRes = await getTranscriptForAI(sectionId)
  if ('error' in transcriptRes) return { error: transcriptRes.error }

  const { contextText, section } = transcriptRes
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
        model: 'llama-3.1-8b-instant',
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
            content: `Lesson Title: ${(section as any).title}\nTranscript: ${contextText}`,
          },
        ],
        response_format: { type: 'json_object' },
        temperature: 0.6,
      }),
    })

    if (!response.ok) return { error: 'AI service communication failed.' }

    const result = await response.json()
    if (!result.choices?.[0]?.message?.content) return { error: 'Empty AI response.' }

    const content = JSON.parse(result.choices[0].message.content)
    const { filename, code } = content

    const supabase = createAdminClient()
    const payload = JSON.stringify({ filename, code })
    await (supabase.from('course_sections') as any).update({ playground_code: payload }).eq('id', sectionId)

    revalidatePath('/')
    return { success: true, filename, code }
  } catch (err) {
    console.error('Code generation error:', err)
    return { error: 'Failed to generate code.' }
  }
}

export async function chatWithAIAction(sectionId: string, question: string, history: { role: 'user' | 'assistant', content: string }[]) {
  const transcriptRes = await getTranscriptForAI(sectionId)
  if ('error' in transcriptRes) return { error: transcriptRes.error }

  const { contextText, section } = transcriptRes
  const apiKey = process.env.GROQ_API_KEY
  if (!apiKey) return { error: 'GROQ_API_KEY not set.' }

  try {
    const response = await fetch(GROQ_API_URL, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${apiKey}`,
      },
      body: JSON.stringify({
        model: 'llama-3.1-8b-instant',
        messages: [
          {
            role: 'system',
            content: `You are an elite, highly pedagogical teaching assistant for a world-class online course. 
            The current lesson is titled: "${(section as any).title ?? 'Unknown'}". 
            
            Your goal is to provide deep, well-structured, and visually organized explanations using the provided transcript as primary context.
            
            STRUCTURE & STYLE GUIDELINES:
            - **Visually Organized**: Use multiple newlines between sections and concepts to ensure readability.
            - **Bullet Points**: Use bullet points extensively for lists, features, steps, or components.
            - **High-Quality Language**: Use sophisticated yet accessible educational language. Be punchy and clear.
            - **Markdown Mastery**: Use bold (**text**) for emphasis on key terms and H3 (###) for sub-topics if needed.
            - **Code Blocks**: Always use proper syntax highlighting for code (\`\`\`javascript ... \`\`\`).
            - **Tone**: Professional, encouraging, and expert.
            
            ANSWERING RULES:
            - Answer in the same language as the student's question.
            - If the information is not in the transcript, use your general knowledge but mention it's additional context.
            - Keep paragraphs short (maximum 3 sentences).
            
            CONTEXT TRANSCRIPT:
            ${contextText.slice(0, 12000)}`
          },
          ...history,
          { role: 'user', content: question }
        ],
        temperature: 0.7,
      }),
    })

    if (!response.ok) return { error: 'Failed to reach Groq.' }

    const result = await response.json()
    if (!result.choices?.[0]?.message?.content) return { error: 'Empty AI response.' }

    return { content: result.choices[0].message.content }
  } catch (err) {
    return { error: 'Unexpected error in chat.' }
  }
}
