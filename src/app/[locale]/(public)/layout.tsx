import { PublicNavbar } from "@/components/layout/PublicNavbar"
import { PublicFooter } from "@/components/layout/PublicFooter"

interface PublicLayoutProps {
  children: React.ReactNode
}

export default function PublicLayout({ children }: PublicLayoutProps) {
  return (
    <div className="min-h-screen flex flex-col bg-slate-50">
      <PublicNavbar />
      <main className="flex-1">
        {children}
      </main>
      <PublicFooter />
    </div>
  )
}
