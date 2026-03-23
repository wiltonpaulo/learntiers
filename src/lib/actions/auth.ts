'use server'

import { redirect } from 'next/navigation'
import { createClient } from '@/lib/supabase/server'

// ─── Login ────────────────────────────────────────────────────────────────────

export async function loginAction(formData: FormData) {
  const email = formData.get('email') as string
  const password = formData.get('password') as string
  const locale = formData.get('locale') as string || 'en'
  let next = (formData.get('next') as string) || `/${locale}/my-learning`

  if (next === '/' || next === `/${locale}` || next === `/${locale}/`) {
    next = `/${locale}/my-learning`
  }

  if (next.startsWith('http')) {
    try {
      const url = new URL(next)
      next = url.pathname + url.search
    } catch {
      next = `/${locale}/my-learning`
    }
  }

  try {
    const supabase = await createClient()
    const { error } = await supabase.auth.signInWithPassword({ email, password })
    if (error) throw new Error(error.message)
  } catch (err: any) {
    const errorUrl = `/${locale}/?auth=login&error=${encodeURIComponent(err.message || 'Login failed.')}${next ? `&next=${encodeURIComponent(next)}` : ''}`
    redirect(errorUrl)
  }

  redirect(next)
}

// ─── Signup ───────────────────────────────────────────────────────────────────

export async function signupAction(formData: FormData) {
  const name = formData.get('name') as string
  const email = formData.get('email') as string
  const password = formData.get('password') as string
  const locale = formData.get('locale') as string || 'en'
  const next = formData.get('next') as string

  try {
    const supabase = await createClient()
    const { error } = await supabase.auth.signUp({
      email,
      password,
      options: {
        data: { name },
      },
    })
    if (error) throw new Error(error.message)
  } catch (err: any) {
    redirect(`/${locale}/?auth=register&error=${encodeURIComponent(err.message || 'Signup failed.')}`)
  }

  const loginUrl = `/${locale}/?auth=login&message=Check+your+email+to+confirm+your+account.${next ? `&next=${encodeURIComponent(next)}` : ''}`
  redirect(loginUrl)
}

// ─── Update Profile ───────────────────────────────────────────────────────────

export async function updateProfileAction(formData: FormData) {
  let locale = 'en'
  try {
    const name = formData.get('name') as string
    const phone = formData.get('phone') as string
    const country = formData.get('country') as string
    locale = formData.get('locale') as string || 'en'

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

    if (error) throw new Error(error.message)

    await supabase.auth.updateUser({
      data: { name }
    })
  } catch (err: any) {
    redirect(`/${locale}/settings?error=${encodeURIComponent(err.message || 'Update failed.')}`)
  }

  redirect(`/${locale}/settings?success=Profile+updated`)
}

export async function updatePasswordAction(formData: FormData) {
  let locale = 'en'
  try {
    const password = formData.get('password') as string
    locale = formData.get('locale') as string || 'en'

    const supabase = await createClient()
    const { error } = await supabase.auth.updateUser({
      password: password
    })

    if (error) throw new Error(error.message)
  } catch (err: any) {
    redirect(`/${locale}/settings?error=${encodeURIComponent(err.message || 'Password update failed.')}`)
  }

  redirect(`/${locale}/settings?success=Password+updated`)
}

// ─── Logout ───────────────────────────────────────────────────────────────────

export async function logoutAction(formData: FormData) {
  try {
    const supabase = await createClient()
    await supabase.auth.signOut()
  } catch (err) {
    // Sign out failed, but we still redirect to home
  }
  redirect('/')
}
