import { createClient } from '@supabase/supabase-js'
import { readFile } from 'fs/promises'
import { existsSync } from 'fs'
import { join, dirname } from 'path'
import { fileURLToPath } from 'url'

const __dirname = dirname(fileURLToPath(import.meta.url))

async function loadEnvFile(filename) {
  const filepath = join(__dirname, '..', filename)
  if (!existsSync(filepath)) return
  const content = await readFile(filepath, 'utf8')
  for (const line of content.split('\n')) {
    const trimmed = line.trim()
    if (!trimmed || trimmed.startsWith('#')) continue
    const eqIdx = trimmed.indexOf('=')
    if (eqIdx === -1) continue
    const key = trimmed.slice(0, eqIdx).trim()
    const value = trimmed.slice(eqIdx + 1).trim()
    if (key && !(key in process.env)) {
      process.env[key] = value
    }
  }
}

await loadEnvFile('.env.local')

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL
const supabaseServiceRoleKey = process.env.SUPABASE_SERVICE_ROLE_KEY

if (!supabaseUrl || !supabaseServiceRoleKey) {
  console.error('Missing Supabase environment variables')
  process.exit(1)
}

const supabase = createClient(supabaseUrl, supabaseServiceRoleKey)

function generateSlug(title) {
  return title
    .toLowerCase()
    .normalize('NFD')
    .replace(/[\u0300-\u036f]/g, '') // remove accents
    .replace(/[^\w\s-]/g, '') // remove non-word chars
    .trim()
    .replace(/\s+/g, '-') // replace spaces with hyphens
    .replace(/-+/g, '-'); // replace multiple hyphens with single hyphen
}

async function populateSlugs() {
  const { data: courses, error: coursesError } = await supabase.from('courses').select('id, title, slug')
  
  if (coursesError) {
    console.error('Error fetching courses:', coursesError)
    return
  }

  for (const course of courses) {
    if (!course.slug) {
      const slug = generateSlug(course.title)
      await supabase.from('courses').update({ slug }).eq('id', course.id)
    }
  }

  const { data: sections, error: sectionsError } = await supabase.from('course_sections').select('id, title, slug')
  
  if (sectionsError) {
    console.error('Error fetching sections:', sectionsError)
    return
  }

  for (const section of sections) {
    if (!section.slug) {
      const slug = generateSlug(section.title)
      await supabase.from('course_sections').update({ slug }).eq('id', section.id)
    }
  }
}

populateSlugs()
