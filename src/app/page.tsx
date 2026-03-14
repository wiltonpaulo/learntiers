import { redirect } from 'next/navigation'
import { routing } from '@/i18n/routing'

/**
 * Root page — redirects to the default locale.
 * next-intl middleware also handles this, but this covers direct / requests.
 */
export default function RootPage() {
  redirect(`/${routing.defaultLocale}`)
}
