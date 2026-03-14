/**
 * scripts/migrate.mjs
 *
 * Automated migration runner — executes SQL files from supabase/migrations/
 * in alphabetical order, skipping files that have already been applied.
 *
 * Runs automatically before `next build` via the `build` script in package.json.
 * Requires env var: POSTGRES_URL (direct PostgreSQL connection string)
 *
 * Format: postgresql://postgres:[password]@db.[project-ref].supabase.co:5432/postgres
 * Find it in: Supabase Dashboard → Settings → Database → Connection string (URI)
 */

import postgres from 'postgres'
import { readdir, readFile } from 'fs/promises'
import { existsSync } from 'fs'
import { join, dirname } from 'path'
import { fileURLToPath } from 'url'

const __dirname = dirname(fileURLToPath(import.meta.url))
const MIGRATIONS_DIR = join(__dirname, '..', 'supabase', 'migrations')

// ─── Load .env.local for local runs (Vercel injects env vars directly) ────────
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
    // Don't override vars already set by the environment (e.g. Vercel)
    if (key && !(key in process.env)) {
      process.env[key] = value
    }
  }
}

await loadEnvFile('.env.local')
await loadEnvFile('.env')

// ─── Validate env ─────────────────────────────────────────────────────────────

const POSTGRES_URL = process.env.POSTGRES_URL

if (!POSTGRES_URL) {
  console.error('\n❌  POSTGRES_URL is not set.')
  console.error('    Add it to .env.local and to Vercel environment variables.')
  console.error(
    '    Format: postgresql://postgres:[password]@db.[project-ref].supabase.co:5432/postgres',
  )
  console.error('    Find it: Supabase Dashboard → Settings → Database → Connection string\n')
  process.exit(1)
}

// ─── Connect ──────────────────────────────────────────────────────────────────

const sql = postgres(POSTGRES_URL, {
  ssl: 'require',
  max: 1,
  connect_timeout: 15,
  idle_timeout: 5,
  onnotice: () => {}, // suppress NOTICE messages
})

// ─── Bootstrap migrations table ───────────────────────────────────────────────

async function ensureMigrationsTable() {
  await sql`
    CREATE TABLE IF NOT EXISTS public._migrations (
      id         SERIAL      PRIMARY KEY,
      filename   TEXT        NOT NULL UNIQUE,
      applied_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
    )
  `
}

// ─── Get already-applied migrations ───────────────────────────────────────────

async function getAppliedMigrations() {
  const rows = await sql`SELECT filename FROM public._migrations ORDER BY filename`
  return new Set(rows.map((r) => r.filename))
}

// ─── Run a single migration file ─────────────────────────────────────────────

async function applyMigration(filename, applied) {
  if (applied.has(filename)) {
    console.log(`  ⏭  ${filename} (already applied)`)
    return
  }

  const filepath = join(MIGRATIONS_DIR, filename)
  const sqlContent = await readFile(filepath, 'utf8')

  // Run the entire file in a single transaction
  await sql.begin(async (tx) => {
    await tx.unsafe(sqlContent)
    await tx`INSERT INTO public._migrations (filename) VALUES (${filename})`
  })

  console.log(`  ✅ ${filename}`)
}

// ─── Main ─────────────────────────────────────────────────────────────────────

async function main() {
  console.log('\n🗄  Running database migrations...\n')

  try {
    await ensureMigrationsTable()
    const applied = await getAppliedMigrations()

    const files = (await readdir(MIGRATIONS_DIR))
      .filter((f) => f.endsWith('.sql'))
      .sort() // alphabetical = chronological given our 001_, 002_ naming

    if (files.length === 0) {
      console.log('  No migration files found.\n')
      return
    }

    for (const file of files) {
      await applyMigration(file, applied)
    }

    console.log('\n✓  Migrations complete.\n')
  } catch (err) {
    console.error('\n❌  Migration failed:', err.message)
    if (err.detail) console.error('   Detail:', err.detail)
    if (err.hint)   console.error('   Hint:  ', err.hint)
    process.exit(1)
  } finally {
    await sql.end()
  }
}

main()
