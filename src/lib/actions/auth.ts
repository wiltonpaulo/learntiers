'use server'

import { redirect } from 'next/navigation'
import { createClient } from '@/lib/supabase/server'
import { routing } from '@/i18n/routing'

// ─── Login ────────────────────────────────────────────────────────────────────

export async function loginAction(formData: FormData) {
  const email = formData.get('email') as string
  const password = formData.get('password') as string
  const locale = (formData.get('locale') as string) || routing.defaultLocale

  const supabase = await createClient()

  const { error } = await supabase.auth.signInWithPassword({ email, password })

  if (error) {
    redirect(`/${locale}/login?error=${encodeURIComponent(error.message)}`)
  }

  redirect(`/${locale}/courses`)
}

// ─── Register ─────────────────────────────────────────────────────────────────

export async function registerAction(formData: FormData) {
  const name = formData.get('name') as string
  const email = formData.get('email') as string
  const password = formData.get('password') as string
  const locale = (formData.get('locale') as string) || routing.defaultLocale

  const supabase = await createClient()

  const { error } = await supabase.auth.signUp({
    email,
    password,
    options: {
      data: { name }, // passed to raw_user_meta_data — the trigger reads this
    },
  })

  if (error) {
    redirect(`/${locale}/register?error=${encodeURIComponent(error.message)}`)
  }

  // After sign-up, redirect to login (or courses if email confirmation is disabled)
  redirect(`/${locale}/login?message=Check+your+email+to+confirm+your+account.`)
}

// ─── Logout ───────────────────────────────────────────────────────────────────

export async function logoutAction(formData: FormData) {
  const locale = (formData.get('locale') as string) || routing.defaultLocale
  const supabase = await createClient()
  await supabase.auth.signOut()
  redirect(`/${locale}/login`)
}
