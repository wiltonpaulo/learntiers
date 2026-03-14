import { type NextRequest } from 'next/server'
import createIntlMiddleware from 'next-intl/middleware'
import { updateSession } from '@/lib/supabase/middleware'
import { routing } from './i18n/routing'

const intlMiddleware = createIntlMiddleware(routing)

export async function middleware(request: NextRequest) {
  // 1. Refresh the Supabase session — must happen first so Server Components
  //    downstream receive an up-to-date auth cookie.
  const { supabaseResponse } = await updateSession(request)

  // 2. Run next-intl locale routing
  const intlResponse = intlMiddleware(request)

  // 3. Merge Supabase auth cookies into the intl response so neither
  //    middleware loses its cookie writes.
  supabaseResponse.cookies.getAll().forEach((cookie) => {
    intlResponse.cookies.set(cookie.name, cookie.value, cookie)
  })

  return intlResponse
}

export const config = {
  matcher: ['/((?!_next|api|favicon.ico|.*\\..*).*)'],
}
