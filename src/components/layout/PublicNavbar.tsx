"use client"

import * as React from "react"
import { Link, usePathname, useRouter } from "@/i18n/routing"
import { 
  GraduationCap, 
  Search, 
  Menu, 
  X, 
  ChevronDown,
  Code2,
  Cloud,
  Container,
  LayoutDashboard,
  Zap,
  BookOpen,
  LogIn
} from "lucide-react"
import { Button } from "@/components/ui/button"
import { 
  DropdownMenu, 
  DropdownMenuContent, 
  DropdownMenuItem, 
  DropdownMenuTrigger,
  DropdownMenuSeparator,
  DropdownMenuLabel
} from "@/components/ui/dropdown-menu"
import { cn } from "@/lib/utils"
import { createClient } from "@/lib/supabase/client"
import { UserMenu } from "@/components/auth/UserMenu"
import { AuthModal } from "@/components/auth/AuthModal"
import { useSearchParams } from "next/navigation"
import SearchOverlay from "@/components/ui/SearchOverlay"
import { NavbarScore } from "./NavbarScore"
import { ShieldCheck } from "lucide-react"

const ADMIN_EMAILS = (process.env.NEXT_PUBLIC_ADMIN_EMAILS || 'wiltonpaulo@gmail.com')
  .split(',')
  .map(email => email.trim().toLowerCase());

const EXPLORE_ITEMS = [
  {
    title: "DevOps Engineering",
    description: "Master Docker, Kubernetes, and CI/CD pipelines.",
    icon: <Container className="w-5 h-5 text-blue-400" />,
    href: "/courses?q=devops"
  },
  {
    title: "Cloud Architecture",
    description: "AWS, GCP, and Azure professional training.",
    icon: <Cloud className="w-5 h-5 text-sky-400" />,
    href: "/courses?q=cloud"
  },
  {
    title: "Backend Development",
    description: "Go, Python, and Node.js high-performance systems.",
    icon: <Code2 className="w-5 h-5 text-emerald-400" />,
    href: "/courses?q=backend"
  },
  {
    title: "AI & Data Science",
    description: "Machine learning and AI integration for engineers.",
    icon: <Zap className="w-5 h-5 text-purple-400" />,
    href: "/courses?q=ai"
  }
]

export function PublicNavbar() {
  const [isMobileMenuOpen, setIsMobileMenuOpen] = React.useState(false)
  const [isAuthModalOpen, setIsAuthModalOpen] = React.useState(false)
  const [authModalView, setAuthModalView] = React.useState<'login' | 'register'>('login')
  const [user, setUser] = React.useState<any>(null)
  const [loading, setLoading] = React.useState(true)
  const [mounted, setMounted] = React.useState(false)
  
  const isAdmin = React.useMemo(() => {
    if (!user?.email) return false;
    return ADMIN_EMAILS.includes(user.email.toLowerCase());
  }, [user]);

  const router = useRouter()
  const pathname = usePathname() // This is now i18n-aware (doesn't include locale prefix)
  const searchParams = useSearchParams()
  const supabase = createClient()

  // Handle URL-based Auth triggers (e.g. ?auth=login)
  React.useEffect(() => {
    setMounted(true)
    const authType = searchParams.get('auth')
    if (authType === 'login' || authType === 'register') {
      setAuthModalView(authType)
      setIsAuthModalOpen(true)
    }
  }, [searchParams])

  React.useEffect(() => {
    // Initial fetch
    const checkUser = async () => {
      const { data: { user } } = await supabase.auth.getUser()
      setUser(user)
      setLoading(false)
    }
    
    checkUser()

    // Real-time listener
    const { data: { subscription } } = supabase.auth.onAuthStateChange((_event, session) => {
      setUser(session?.user ?? null)
      setLoading(false)
    })

    return () => {
      subscription.unsubscribe()
    }
  }, [supabase])

  const openLogin = () => {
    setAuthModalView('login')
    setIsAuthModalOpen(true)
    // Update URL to reflect state without full refresh
    const params = new URLSearchParams(searchParams.toString())
    params.set('auth', 'login')
    router.replace(`${pathname}?${params.toString()}`, { scroll: false })
  }

  const openRegister = () => {
    setAuthModalView('register')
    setIsAuthModalOpen(true)
    const params = new URLSearchParams(searchParams.toString())
    params.set('auth', 'register')
    router.replace(`${pathname}?${params.toString()}`, { scroll: false })
  }

  const closeAuthModal = () => {
    setIsAuthModalOpen(false)
    // Clean up URL
    const params = new URLSearchParams(searchParams.toString())
    params.delete('auth')
    params.delete('error')
    params.delete('message')
    router.replace(`${pathname}?${params.toString()}`, { scroll: false })
  }

  return (
    <>
      <header className="sticky top-0 z-50 w-full bg-[#1c1d1f] border-b border-white/5 backdrop-blur-md h-16">
        <div className="container mx-auto h-full flex items-center justify-between px-4 gap-4">
          {/* Left: Logo + Desktop Nav */}
          <div className="flex items-center gap-6">
            <Link href="/" className="flex items-center gap-2 shrink-0 group">
              <div className="w-8 h-8 rounded-lg bg-primary flex items-center justify-center shadow-lg shadow-primary/20 group-hover:bg-primary/90 transition-colors">
                <GraduationCap className="w-5 h-5 text-white" />
              </div>
              <span className="font-bold text-lg tracking-tight text-white hidden sm:inline-block">LearnTiers</span>
            </Link>

            <nav className="hidden lg:flex items-center gap-1">
              {mounted && (
                <>
                  <DropdownMenu>
                    <DropdownMenuTrigger asChild>
                      <Button variant="ghost" className="gap-1 text-sm font-medium text-white/70 hover:text-white hover:bg-white/10 transition-colors h-9">
                        Explore <ChevronDown className="w-4 h-4 opacity-50" />
                      </Button>
                    </DropdownMenuTrigger>
                    <DropdownMenuContent align="start" className="w-[450px] p-4 grid grid-cols-2 gap-2 bg-[#1c1d1f] border-white/10 shadow-2xl rounded-2xl">
                      <DropdownMenuLabel className="col-span-2 text-[10px] uppercase tracking-widest text-slate-500 mb-2 px-3 font-black">Learning Tracks</DropdownMenuLabel>
                      {EXPLORE_ITEMS.map((item) => (
                        <Link key={item.title} href={item.href}>
                          <DropdownMenuItem className="flex items-start gap-3 p-3 cursor-pointer rounded-xl hover:bg-white/5 focus:bg-white/5 transition-colors border border-transparent hover:border-white/5">
                            <div className="mt-0.5 p-2 rounded-lg bg-white/5">{item.icon}</div>
                            <div className="space-y-1">
                              <p className="text-sm font-bold text-white leading-none">{item.title}</p>
                              <p className="text-xs text-slate-400 leading-snug line-clamp-2">{item.description}</p>
                            </div>
                          </DropdownMenuItem>
                        </Link>
                      ))}
                    </DropdownMenuContent>
                  </DropdownMenu>

                  <NavLink href="/courses">Courses</NavLink>
                  <NavLink href="/leaderboard">Ranking</NavLink>
                </>
              )}
            </nav>
          </div>

          {/* Center: Search (Hidden on very small, visible on sm+) */}
          <div className="flex-1 max-w-md hidden md:block">
            {mounted && <SearchOverlay />}
          </div>

          {/* Right: User + Auth */}
          <div className="flex items-center gap-2 sm:gap-3">
            <nav className="hidden lg:flex items-center gap-1">
              {mounted && user && (
                <>
                  {isAdmin && (
                    <Link 
                      href="/admin" 
                      className="px-4 py-2 text-sm font-bold text-amber-400 hover:text-amber-300 hover:bg-white/10 rounded-md transition-all h-9 flex items-center gap-1.5"
                    >
                      <ShieldCheck className="w-4 h-4" />
                      Admin
                    </Link>
                  )}
                  <NavLink href="/my-learning">My Learning</NavLink>
                </>
              )}
            </nav>

            {mounted && !loading ? (
              user ? (
                <div className="flex items-center gap-3">
                  <NavbarScore userId={user.id} />
                  <UserMenu user={{
                    name: user.user_metadata?.name || user.email?.split('@')[0],
                    email: user.email,
                    image: user.user_metadata?.avatar_url
                  }} />
                </div>
              ) : (
                <div className="flex items-center gap-2">
                  <Button 
                    variant="ghost" 
                    size="sm" 
                    className="font-bold text-white/80 hover:text-white hover:bg-white/10 hidden sm:inline-flex"
                    onClick={openLogin}
                  >
                    <LogIn className="w-4 h-4 mr-1.5" />
                    Log In
                  </Button>
                  <Button 
                    size="sm" 
                    className="font-bold bg-white text-slate-900 hover:bg-slate-100 rounded-md px-5 h-9 transition-colors shadow-lg shadow-black/20"
                    onClick={openRegister}
                  >
                    Get Started
                  </Button>
                </div>
              )
            ) : (
              <div className="w-[100px]" />
            )}

            {/* Mobile Menu Toggle */}
            <Button 
              variant="ghost" 
              size="icon" 
              className="lg:hidden text-white/70 hover:text-white hover:bg-white/10"
              onClick={() => setIsMobileMenuOpen(!isMobileMenuOpen)}
            >
              {isMobileMenuOpen ? <X className="w-6 h-6" /> : <Menu className="w-6 h-6" />}
            </Button>
          </div>
        </div>

        {/* Mobile Menu Overlay */}
        {isMobileMenuOpen && (
          <div className="lg:hidden absolute top-full left-0 right-0 bg-[#1c1d1f] border-b border-white/10 animate-in slide-in-from-top-2 duration-200 shadow-xl overflow-y-auto max-h-[calc(100vh-4rem)]">
            <div className="p-4 space-y-6">
              {/* Search in Mobile */}
              <div className="md:hidden">
                <SearchOverlay />
              </div>

              <div className="space-y-1">
                <p className="text-[10px] uppercase font-bold text-slate-500 px-3 mb-2 tracking-widest">Explore Tracks</p>
                {EXPLORE_ITEMS.map((item) => (
                  <Link 
                    key={item.title} 
                    href={item.href}
                    onClick={() => setIsMobileMenuOpen(false)}
                    className="flex items-center gap-4 p-3 rounded-xl hover:bg-white/5 transition-colors group"
                  >
                    <div className="p-2 rounded-lg bg-white/5 group-hover:bg-white/10 transition-colors">{item.icon}</div>
                    <div className="flex-1">
                      <p className="text-sm font-bold text-white">{item.title}</p>
                      <p className="text-[11px] text-slate-400 line-clamp-1">{item.description}</p>
                    </div>
                  </Link>
                ))}
              </div>

              <DropdownMenuSeparator className="bg-white/5" />
              
              <div className="grid grid-cols-1 gap-2">
                <Button variant="ghost" asChild className="justify-start font-bold gap-3 h-12 rounded-xl text-white/70 hover:text-white hover:bg-white/5">
                  <Link href="/courses" onClick={() => setIsMobileMenuOpen(false)}>
                    <BookOpen className="w-5 h-5 text-primary" />
                    All Courses
                  </Link>
                </Button>
                <Button variant="ghost" asChild className="justify-start font-bold gap-3 h-12 rounded-xl text-white/70 hover:text-white hover:bg-white/5">
                  <Link href="/leaderboard" onClick={() => setIsMobileMenuOpen(false)}>
                    <Zap className="w-5 h-5 text-amber-500" />
                    Global Ranking
                  </Link>
                </Button>
                {user && (
                  <Button variant="ghost" asChild className="justify-start font-bold gap-3 h-12 rounded-xl text-white/70 hover:text-white hover:bg-white/5">
                    <Link href="/my-learning" onClick={() => setIsMobileMenuOpen(false)}>
                      <LayoutDashboard className="w-5 h-5 text-primary" />
                      My Learning
                    </Link>
                  </Button>
                )}
                {user && isAdmin && (
                  <Button variant="ghost" asChild className="justify-start font-bold gap-3 h-12 rounded-xl text-amber-400 hover:text-amber-300 hover:bg-white/5">
                    <Link href="/admin" onClick={() => setIsMobileMenuOpen(false)}>
                      <ShieldCheck className="w-5 h-5" />
                      Admin Panel
                    </Link>
                  </Button>
                )}
              </div>

              <div className="pt-2">
                {!user ? (
                  <div className="grid grid-cols-2 gap-3">
                    <Button variant="outline" className="font-bold h-11 rounded-xl border-white/10 text-white hover:bg-white/5" onClick={() => { setIsMobileMenuOpen(false); openLogin(); }}>
                      Log In
                    </Button>
                    <Button className="font-bold h-11 rounded-xl bg-white text-slate-900 hover:bg-slate-100 shadow-lg" onClick={() => { setIsMobileMenuOpen(false); openRegister(); }}>
                      Sign Up
                    </Button>
                  </div>
                ) : (
                  <div className="p-2 bg-white/5 rounded-xl">
                    <p className="text-[10px] uppercase font-black text-slate-500 mb-3 px-2">Account</p>
                    <div className="flex items-center gap-3 px-2 pb-2">
                       <UserMenu user={{
                        name: user.user_metadata?.name || user.email?.split('@')[0],
                        email: user.email,
                        image: user.user_metadata?.avatar_url
                      }} />
                      <div className="min-w-0">
                        <p className="text-sm font-bold text-white truncate">{user.user_metadata?.name || user.email?.split('@')[0]}</p>
                        <p className="text-[10px] text-slate-400 truncate">{user.email}</p>
                      </div>
                    </div>
                  </div>
                )}
              </div>
            </div>
          </div>
        )}
      </header>

      <AuthModal 
        isOpen={isAuthModalOpen} 
        onClose={closeAuthModal} 
        initialView={authModalView}
      />
    </>
  )
}

function NavLink({ href, children }: { href: string; children: React.ReactNode }) {
  return (
    <Link 
      href={href} 
      className="px-4 py-2 text-sm font-medium text-white/70 hover:text-white hover:bg-white/10 rounded-md transition-all h-9 flex items-center"
    >
      {children}
    </Link>
  )
}
