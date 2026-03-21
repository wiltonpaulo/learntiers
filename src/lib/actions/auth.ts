'use server'

import { redirect } from 'next/navigation'
import { createClient } from '@/lib/supabase/server'

// ─── Login ────────────────────────────────────────────────────────────────────

export async function loginAction(formData: FormData) {
  const email = formData.get('email') as string
  const password = formData.get('password') as string
  const next = (formData.get('next') as string) || '/courses'

  const supabase = await createClient()

  const { error } = await supabase.auth.signInWithPassword({ email, password })

  if (error) {
    const errorUrl = `/login?error=${encodeURIComponent(error.message)}${next ? `&next=${encodeURIComponent(next)}` : ''}`
    redirect(errorUrl)
  }

  redirect(next)
}

// ─── Register ─────────────────────────────────────────────────────────────────

export async function registerAction(formData: FormData) {
  const name = formData.get('name') as string
  const email = formData.get('email') as string
  const password = formData.get('password') as string

  const supabase = await createClient()

  const { error } = await supabase.auth.signUp({
    email,
    password,
    options: {
      data: { name }, // passed to raw_user_meta_data — the trigger reads this
    },
  })

  if (error) {
    redirect(`/register?error=${encodeURIComponent(error.message)}`)
  }

  // After sign-up, redirect to login (or courses if email confirmation is disabled)
  redirect('/login?message=Check+your+email+to+confirm+your+account.')
}

// ─── Update Profile ───────────────────────────────────────────────────────────

export async function updateProfileAction(formData: FormData) {
  const name = formData.get('name') as string
  const phone = formData.get('phone') as string
  const country = formData.get('country') as string

  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()

  if (!user) throw new Error('Not authenticated.')

  const { error } = await (supabase.from('users') as any)
    .update({ 
      name, 
      phone: phone || null, 
      country: country || null 
    })
    .eq('id', user.id)

  if (error) {
    redirect(`/settings?error=${encodeURIComponent(error.message)}`)
  }

  // Also update metadata if possible (optional but good for consistency)
  await supabase.auth.updateUser({
    data: { name }
  })

  redirect('/settings?success=Profile+updated')
}

export async function updatePasswordAction(formData: FormData) {
  const password = formData.get('password') as string

  const supabase = await createClient()
  
  const { error } = await supabase.auth.updateUser({
    password: password
  })

  if (error) {
    redirect(`/settings?error=${encodeURIComponent(error.message)}`)
  }

  redirect('/settings?success=Password+updated')
}

// ─── Logout ───────────────────────────────────────────────────────────────────

export async function logoutAction(formData: FormData) {
  const supabase = await createClient()
  await supabase.auth.signOut()
  redirect('/login')
}
