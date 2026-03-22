import { createClient } from '@supabase/supabase-js'
import { readFile } from 'fs/promises'
import { join, dirname } from 'path'
import { fileURLToPath } from 'url'
import { existsSync } from 'fs'

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

async function uploadLogo() {
  const logoPath = join(__dirname, '..', 'src', 'app', 'icon.png')
  
  if (!existsSync(logoPath)) {
    console.error('Logo file not found at:', logoPath)
    return
  }

  const fileBuffer = await readFile(logoPath)
  
  console.log('Uploading logo to Supabase Storage...')
  
  // 1. Ensure bucket exists and is public
  const { data: bucket, error: bucketError } = await supabase.storage.getBucket('learntiers-assets')
  
  if (bucketError) {
    console.log('Creating bucket "learntiers-assets"...')
    await supabase.storage.createBucket('learntiers-assets', {
      public: true
    })
  }

  // 2. Upload file
  const { data, error } = await supabase.storage.from('learntiers-assets').upload('logo.png', fileBuffer, {
    contentType: 'image/png',
    upsert: true
  })

  if (error) {
    console.error('Error uploading logo:', error)
    return
  }

  // 3. Get public URL
  const { data: { publicUrl } } = supabase.storage.from('learntiers-assets').getPublicUrl('logo.png')

  console.log('\n✅ Logo uploaded successfully!')
  console.log('Public URL:', publicUrl)
  console.log('\nYou can now use this URL in your email templates.')
}

uploadLogo()
