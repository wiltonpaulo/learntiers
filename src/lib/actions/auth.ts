'use server'

import { redirect } from 'next/navigation'
import { createClient } from '@/lib/supabase/server'
import { revalidatePath } from 'next/cache'

// ─── Login ────────────────────────────────────────────────────────────────────

export async function loginAction(formData: FormData) {
  const email = formData.get('email') as string
  const password = formData.get('password') as string
  const locale = formData.get('locale') as string || 'en'
  const nextInput = (formData.get('next') as string) || '/my-learning'

  // 1. Standardize the path: Ensure it starts with / and remove any existing locale prefix
  let cleanPath = nextInput;
  if (!cleanPath.startsWith('/')) cleanPath = '/' + cleanPath;

  // Remove ANY known locale prefix to get the logical path
  const locales = ['en', 'es', 'pt-br'];
  for (const loc of locales) {
    if (cleanPath.startsWith(`/${loc}/`)) {
      cleanPath = cleanPath.replace(`/${loc}`, '');
      break;
    } else if (cleanPath === `/${loc}`) {
      cleanPath = '/';
      break;
    }
  }

  // 2. Apply default redirect logic for high-level pages
  // We want users coming from home or catalog to land in my-learning
  const landingPages = ['/', '/courses', '/leaderboard'];
  if (landingPages.includes(cleanPath)) {
    cleanPath = '/my-learning';
  }

  // 3. Final Absolute Destination with the current locale
  // Example: cleanPath "/my-learning" + locale "en" -> "/en/my-learning"
  const finalDestination = `/${locale}${cleanPath === '/' ? '' : cleanPath}`;

  try {
    const supabase = await createClient()
    const { error } = await supabase.auth.signInWithPassword({ email, password })
    if (error) throw new Error(error.message)
    revalidatePath('/', 'layout')
  } catch (err: any) {
    // Preserve email and next destination even on error to keep the context
    const errorUrl = `/${locale}/?auth=login&error=${encodeURIComponent(err.message || 'Login failed.')}&next=${encodeURIComponent(cleanPath)}&email=${encodeURIComponent(email)}`
    redirect(errorUrl)
  }

  redirect(finalDestination)
}

// ─── Signup ───────────────────────────────────────────────────────────────────

export async function signupAction(formData: FormData) {
  const name = formData.get('name') as string
  const email = formData.get('email') as string
  const password = formData.get('password') as string
  const locale = formData.get('locale') as string || 'en'
  const next = formData.get('next') as string || '/my-learning'

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
    redirect(`/${locale}/?auth=register&error=${encodeURIComponent(err.message || 'Signup failed.')}&email=${encodeURIComponent(email)}&name=${encodeURIComponent(name)}`)
  }

  const loginUrl = `/${locale}/?auth=login&message=Check+your+email+to+confirm+your+account.&next=${encodeURIComponent(next)}&email=${encodeURIComponent(email)}`
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
    revalidatePath('/', 'layout')
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
    revalidatePath('/', 'layout')
  } catch (err) {
    // Sign out failed, but we still redirect to home
  }
  redirect('/')
}
