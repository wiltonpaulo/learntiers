import { redirect } from 'next/navigation'

/**
 * Root locale page — redirects to the dashboard.
 * Unauthenticated users will be redirected to /login by middleware.
 */
export default function HomePage({ params }: { params: Promise<{ locale: string }> }) {
  // Unwrap params — in Next.js 15 params is a Promise in Server Components
  return params.then(({ locale }) => {
    redirect(`/${locale}/courses`)
  })
}
