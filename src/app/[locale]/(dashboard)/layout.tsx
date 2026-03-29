import { Link } from '@/i18n/routing'
import { getLocale } from 'next-intl/server'
import { headers } from 'next/headers'
import { createClient } from '@/lib/supabase/server'
import { BookOpen, Trophy, GraduationCap, LogIn } from 'lucide-react'
import type { UserRow, UserProgressRow } from '@/types/database'
import { UserMenu } from '@/components/auth/UserMenu'
import SearchOverlay from '@/components/ui/SearchOverlay'
import { ScoreHoverCard } from '@/components/dashboard/ScoreHoverCard'
import { PublicNavbar } from "@/components/layout/PublicNavbar"
import { PublicFooter } from "@/components/layout/PublicFooter"

interface DashboardLayoutProps {
  children: React.ReactNode
}

export default async function DashboardLayout({ children }: DashboardLayoutProps) {
  const locale = await getLocale()
  const headersList = await headers()
  const pathname = headersList.get('x-pathname') || ''
  const isSectionPage = pathname.includes('/sections/')

  return (
    <div className="min-h-screen flex flex-col bg-background">
      <PublicNavbar />

      {/* Page content */}
      <main className="flex-1 min-h-0">{children}</main>

      {/* Footer (hidden on section pages to allow independent internal scrolls) */}
      {!isSectionPage && (
        <PublicFooter />
      )}
    </div>
  )
}
