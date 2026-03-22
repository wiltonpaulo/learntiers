import type { Metadata } from 'next'
import { Inter, Mrs_Saint_Delafield } from 'next/font/google'
import { NextIntlClientProvider } from 'next-intl'
import { getMessages } from 'next-intl/server'
import { notFound } from 'next/navigation'
import { routing } from '@/i18n/routing'
import { cn } from '@/lib/utils'
import '../globals.css'

const inter = Inter({ subsets: ['latin'], variable: '--font-inter' })
const signature = Mrs_Saint_Delafield({ 
  weight: '400',
  subsets: ['latin'],
  variable: '--font-signature'
})

export const metadata: Metadata = {
  title: 'LearnTiers',
  description: 'Curated micro-lessons from YouTube — learn, quiz, rank.',
}

interface LocaleLayoutProps {
  children: React.ReactNode
  params: Promise<{ locale: string }>
}

export default async function LocaleLayout({ children, params }: LocaleLayoutProps) {
  const { locale } = await params

  // Validate locale
  if (!routing.locales.includes(locale as (typeof routing.locales)[number])) {
    notFound()
  }

  const messages = await getMessages()

  return (
    <html lang={locale} className={cn(inter.variable, signature.variable)} suppressHydrationWarning>
      <body className="min-h-screen bg-background font-sans antialiased" suppressHydrationWarning>
        <NextIntlClientProvider messages={messages}>
          {children}
        </NextIntlClientProvider>
      </body>
    </html>
  )
}
