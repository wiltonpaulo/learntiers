"use client"

import * as React from "react"
import { Dialog } from "@/components/ui/dialog"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Mail, ArrowRight, Loader2, Lock, User } from "lucide-react"
import { loginAction, signupAction } from "@/lib/actions/auth"
import { usePathname, useSearchParams, useRouter } from "next/navigation"

interface AuthModalProps {
  isOpen: boolean
  onClose: () => void
  initialView?: 'login' | 'register'
}

export function AuthModal({ isOpen, onClose, initialView = 'login' }: AuthModalProps) {
  const [view, setView] = React.useState<'login' | 'register'>(initialView)
  const [isLoading, setIsLoading] = React.useState(false)
  const pathname = usePathname()
  const searchParams = useSearchParams()
  const router = useRouter()
  
  const locale = pathname.split('/')[1] || 'en'
  const error = searchParams.get('error')
  const message = searchParams.get('message')
  const nextParam = searchParams.get('next')

  // Sync internal view with prop changes
  React.useEffect(() => {
    setView(initialView)
  }, [initialView])

  const handleSubmit = () => {
    setIsLoading(true)
  }

  const toggleView = () => {
    const newView = view === 'login' ? 'register' : 'login'
    setView(newView)
    // Update URL without full refresh to stay in sync
    const params = new URLSearchParams(searchParams.toString())
    params.set('auth', newView)
    router.replace(`${pathname}?${params.toString()}`, { scroll: false })
  }

  return (
    <Dialog 
      isOpen={isOpen} 
      onClose={onClose} 
      title={view === 'login' ? 'Welcome back' : 'Create your account'}
    >
      <div className="space-y-6">
        {/* Status Messages */}
        {error && (
          <div className="p-3 rounded-lg bg-destructive/10 border border-destructive/20 text-destructive text-xs font-medium">
            {decodeURIComponent(error)}
          </div>
        )}
        {message && (
          <div className="p-3 rounded-lg bg-purple-50 border border-purple-100 text-purple-600 text-xs font-medium">
            {decodeURIComponent(message)}
          </div>
        )}

        <div className="space-y-2 text-center pb-2">
          <p className="text-sm text-slate-500">
            {view === 'login' 
              ? 'Enter your credentials to access your courses.' 
              : 'Join thousands of engineers mastering the latest tech.'}
          </p>
        </div>

        {/* Form */}
        <form action={view === 'login' ? loginAction : signupAction} onSubmit={handleSubmit} className="space-y-4">
          <input type="hidden" name="locale" value={locale} />
          <input type="hidden" name="next" value={nextParam || pathname} />
          
          {view === 'register' && (
            <div className="space-y-2">
              <Label htmlFor="name" className="text-slate-400 font-bold text-[10px] uppercase tracking-widest ml-1">Full Name</Label>
              <div className="relative">
                <User className="absolute left-3.5 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
                <Input id="name" name="name" placeholder="John Doe" className="bg-slate-50 border-slate-200 h-12 rounded-xl text-slate-900 focus:ring-primary/20 pl-10" required />
              </div>
            </div>
          )}

          <div className="space-y-2">
            <Label htmlFor="email" className="text-slate-400 font-bold text-[10px] uppercase tracking-widest ml-1">Email Address</Label>
            <div className="relative">
              <Mail className="absolute left-3.5 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
              <Input id="email" name="email" type="email" placeholder="you@example.com" className="bg-slate-50 border-slate-200 h-12 rounded-xl text-slate-900 focus:ring-primary/20 pl-10" required />
            </div>
          </div>

          <div className="space-y-2">
            <div className="flex justify-between items-center px-1">
              <Label htmlFor="password" className="text-slate-400 font-bold text-[10px] uppercase tracking-widest">Password</Label>
              {view === 'login' && (
                <button type="button" className="text-[10px] font-bold text-primary hover:underline">Forgot password?</button>
              )}
            </div>
            <div className="relative">
              <Lock className="absolute left-3.5 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
              <Input id="password" name="password" type="password" placeholder="••••••••" className="bg-slate-50 border-slate-200 h-12 rounded-xl text-slate-900 focus:ring-primary/20 pl-10" required />
            </div>
          </div>

          <Button type="submit" disabled={isLoading} className="w-full h-12 rounded-xl font-bold text-base bg-purple-600 hover:bg-purple-700 text-white shadow-lg shadow-purple-100 transition-all active:scale-[0.98] mt-2">
            {isLoading ? <Loader2 className="w-5 h-5 animate-spin" /> : (
              <>
                {view === 'login' ? 'Sign In' : 'Create Account'}
                <ArrowRight className="w-5 h-5 ml-2" />
              </>
            )}
          </Button>
        </form>

        <div className="pt-4 border-t border-slate-100">
          <p className="text-center text-xs text-slate-500">
            {view === 'login' ? "Don't have an account?" : "Already have an account?"}
            <button 
              type="button"
              onClick={toggleView}
              className="ml-1.5 text-purple-600 font-black uppercase tracking-tighter hover:underline"
            >
              {view === 'login' ? 'Sign up for free' : 'Log in here'}
            </button>
          </p>
        </div>
      </div>
    </Dialog>
  )
}
