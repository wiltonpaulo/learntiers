'use server'

import { createAdminClient } from '@/lib/supabase/admin'
import { revalidatePath } from 'next/cache'
import { getTranscriptForAI } from '@/lib/ai-transcript-helper'

const AI_SERVICE_URL = 'https://api.groq.com/openai/v1/chat/completions'

/**
 * Internal helper to call AI with fallback across multiple models.
 * It iterates through the models provided in AI_MODELS env var.
 */
async function callAIServiceWithFallback(payload: any) {
  const apiKey = process.env.GROQ_API_KEY
  if (!apiKey) return { error: 'AI service not configured.' }

  // Parse models from ENV or use defaults
  const modelsStr = process.env.AI_MODELS || 'llama-3.1-8b-instant,llama-3.3-70b-versatile,mixtral-8x7b-32768'
  const models = modelsStr.split(',').map(m => m.trim())

  let lastError = 'No models available'

  for (const model of models) {
    try {
      const response = await fetch(AI_SERVICE_URL, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${apiKey}`,
        },
        body: JSON.stringify({ ...payload, model }),
      })

      if (!response.ok) {
        const errorData = await response.json().catch(() => ({}))
        lastError = errorData.error?.message || `Model ${model} failed with status ${response.status}`
        console.warn(`[AI Fallback] ${model} failed: ${lastError}`)
        continue // Try next model
      }

      const result = await response.json()
      if (result.choices?.[0]?.message?.content) {
        return { content: result.choices[0].message.content }
      }
      
      lastError = 'Empty response content'
    } catch (err) {
      lastError = err instanceof Error ? err.message : 'Unknown fetch error'
      console.error(`[AI Fallback] ${model} exception:`, lastError)
    }
  }

  return { error: `All AI models failed. Last error: ${lastError}` }
}

export async function generateTakeawaysAction(sectionId: string) {
  const transcriptRes = await getTranscriptForAI(sectionId)
  if ('error' in transcriptRes) return { error: transcriptRes.error }

  const { contextText } = transcriptRes

  const result = await callAIServiceWithFallback({
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
  })

  if (result.error) return { error: result.error }

  try {
    const content = JSON.parse(result.content!)
    const takeaways = content.takeaways

    if (!Array.isArray(takeaways)) return { error: 'Invalid response format from AI.' }

    const supabase = createAdminClient()
    await (supabase.from('course_sections') as any).update({ key_takeaways: takeaways }).eq('id', sectionId)

    revalidatePath('/')
    return { success: true, takeaways }
  } catch (err) {
    return { error: 'Failed to process AI response.' }
  }
}

export async function generatePlaygroundCodeAction(sectionId: string) {
  const transcriptRes = await getTranscriptForAI(sectionId)
  
  const contextText = 'error' in transcriptRes ? "No transcript available." : transcriptRes.contextText
  const section = 'error' in transcriptRes ? null : transcriptRes.section
  
  let sectionTitle = "General Programming"
  if (section) {
    sectionTitle = (section as any).title
  } else {
    const supabase = createAdminClient()
    const { data } = await supabase.from('course_sections').select('title').eq('id', sectionId).single()
    if (data) sectionTitle = (data as { title: string }).title
  }

  const result = await callAIServiceWithFallback({
    messages: [
      {
        role: 'system',
        content: `You are a world-class software engineer. Generate a single-file code example based on the lesson context.
        
        STRICT RULES:
        1. Language: Automatically detect (React/JSX, Python, YAML, etc).
        2. Formatting: Use standard, clean, and professional indentation.
        3. No explanations: Do not add text before or after the code.
        4. JSON Safety: You MUST properly escape all double quotes (\") and backslashes (\\) within the "code" value to ensure a valid JSON object.
        
        JSON SCHEMA:
        {
          "filename": "string (example: App.js)",
          "code": "string (the complete source code)"
        }`,
      },
      {
        role: 'user',
        content: `Lesson: ${sectionTitle}\nContext: ${contextText}`,
      },
    ],
    response_format: { type: 'json_object' },
    temperature: 0,
  })

  if (result.error) return { error: result.error }

  try {
    const content = JSON.parse(result.content!)
    const { filename, code } = content

    if (!code) return { error: 'AI failed to generate code content.' }

    const cleanCode = code.replace(/\\n\\n+/g, '\\n\\n').replace(/\\n +\\n/g, '\\n')

    const supabase = createAdminClient()
    const payload = JSON.stringify({ filename, code: cleanCode })
    await (supabase.from('course_sections') as any).update({ playground_code: payload }).eq('id', sectionId)

    revalidatePath('/')
    return { success: true, filename, code: cleanCode }
  } catch (err) {
    return { error: 'Failed to generate valid code JSON.' }
  }
}

export async function chatWithAIAction(sectionId: string, question: string, history: { role: 'user' | 'assistant', content: string }[]) {
  const transcriptRes = await getTranscriptForAI(sectionId)
  if ('error' in transcriptRes) return { error: transcriptRes.error }

  const { contextText, section } = transcriptRes

  const result = await callAIServiceWithFallback({
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
  })

  if (result.error) return { error: result.error }

  return { content: result.content }
}
