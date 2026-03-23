import { createClient } from '@/lib/supabase/server'
import { redirect } from 'next/navigation'
import { getLocale } from 'next-intl/server'
import { Label } from '@/components/ui/label'
import { Button } from '@/components/ui/button'
import { updateProfileAction, updatePasswordAction } from '@/lib/actions/auth'
import { User, Lock, Phone, Globe, ShieldCheck, Mail, Settings as SettingsIcon, AlertCircle, ChevronLeft } from 'lucide-react'
import type { UserRow } from '@/types/database'
import Link from 'next/link'
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs'

export default async function SettingsPage({
  searchParams,
}: {
  searchParams: Promise<{ success?: string; error?: string }>
}) {
  const locale = await getLocale()
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  const { success, error } = await searchParams

  if (!user) redirect(`/${locale}/?auth=login&next=${encodeURIComponent(`/${locale}/settings`)}`)

  const { data: profile } = await supabase
    .from('users')
    .select('name, email, phone, country')
    .eq('id', user.id)
    .single()

  const userProfile = profile as Pick<UserRow, 'name' | 'email' | 'phone' | 'country'> | null
  
  const getInitials = (name?: string | null, email?: string | null) => {
    if (!name) return email?.[0].toUpperCase() || "U"
    const parts = name.trim().split(/\s+/)
    if (parts.length === 0) return "U"
    if (parts.length === 1) return parts[0][0].toUpperCase()
    return (parts[0][0] + parts[parts.length - 1][0]).toUpperCase()
  }

  const initials = getInitials(userProfile?.name, userProfile?.email)

  return (
    <div className="min-h-screen bg-background text-foreground">
      {/* ── Page Header ── */}
      <div className="py-10 px-4 border-b" style={{ backgroundColor: 'var(--nav-bg)' }}>
        <div className="container mx-auto max-w-3xl flex items-center justify-between">
          <div className="flex items-center gap-5">
            <div className="w-16 h-16 rounded-2xl bg-primary flex items-center justify-center text-white text-2xl font-bold shrink-0 shadow-lg shadow-primary/20">
              {initials}
            </div>
            <div>
              <h1 className="text-2xl font-bold text-white">Settings</h1>
              <p className="text-white/60 text-sm mt-0.5">{userProfile?.email}</p>
            </div>
          </div>
          <Link 
            href={`/${locale}/profile`}
            className="flex items-center gap-2 text-sm font-bold text-white/70 hover:text-white transition-colors bg-white/5 px-4 py-2 rounded-xl border border-white/10"
          >
            <ChevronLeft className="w-4 h-4" />
            Back to Profile
          </Link>
        </div>
      </div>

      <div className="container mx-auto max-w-3xl px-4 py-10 space-y-8">
        {/* Status Messages */}
        {(success || error) && (
          <div className="animate-in fade-in slide-in-from-top-4 duration-500">
            {success && (
              <div className="bg-emerald-500/10 border border-emerald-500/20 text-emerald-600 dark:text-emerald-400 px-4 py-4 rounded-xl text-sm font-bold flex items-center gap-3">
                <ShieldCheck className="w-5 h-5 text-emerald-500" />
                {success}
              </div>
            )}
            {error && (
              <div className="bg-red-500/10 border border-red-500/20 text-red-600 dark:text-red-400 px-4 py-4 rounded-xl text-sm font-bold flex items-center gap-3">
                <AlertCircle className="w-5 h-5 text-red-500" />
                {error}
              </div>
            )}
          </div>
        )}

        <Tabs defaultValue="profile" className="w-full">
          <TabsList className="grid w-full grid-cols-2 h-12 bg-muted/50 p-1 rounded-xl mb-8">
            <TabsTrigger value="profile" className="rounded-lg font-bold text-xs uppercase tracking-widest gap-2">
              <User className="w-4 h-4" />
              Public Profile
            </TabsTrigger>
            <TabsTrigger value="security" className="rounded-lg font-bold text-xs uppercase tracking-widest gap-2">
              <Lock className="w-4 h-4" />
              Security
            </TabsTrigger>
          </TabsList>

          {/* Profile Tab */}
          <TabsContent value="profile" className="space-y-6 animate-in fade-in zoom-in-95 duration-300 outline-none">
            <div className="flex items-center gap-3 pb-2 border-b border-border">
              <h2 className="text-xl font-bold">Public Profile</h2>
            </div>
            
            <form action={updateProfileAction} className="space-y-6">
              <input type="hidden" name="locale" value={locale} />
              
              <div className="grid gap-6 sm:grid-cols-2">
                <div className="space-y-2">
                  <Label htmlFor="name" className="text-xs font-black uppercase tracking-widest text-muted-foreground ml-1">Full Name</Label>
                  <div className="relative group">
                    <User className="absolute left-4 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground group-focus-within:text-primary transition-colors" />
                    <input 
                      id="name" 
                      name="name" 
                      defaultValue={userProfile?.name || ''} 
                      placeholder="Your full name"
                      required 
                      className="w-full h-12 bg-muted/30 border border-input rounded-xl pl-11 pr-4 text-sm focus:outline-none focus:ring-2 focus:ring-primary/20 focus:border-primary transition-all"
                    />
                  </div>
                </div>

                <div className="space-y-2">
                  <Label htmlFor="email" className="text-xs font-black uppercase tracking-widest text-muted-foreground ml-1">Email Address</Label>
                  <div className="relative opacity-60">
                    <Mail className="absolute left-4 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
                    <input 
                      id="email" 
                      value={userProfile?.email || ''} 
                      disabled 
                      className="w-full h-12 bg-muted/30 border border-input rounded-xl pl-11 pr-4 text-sm cursor-not-allowed"
                    />
                  </div>
                </div>

                <div className="space-y-2">
                  <Label htmlFor="phone" className="text-xs font-black uppercase tracking-widest text-muted-foreground ml-1">Phone Number</Label>
                  <div className="relative group">
                    <Phone className="absolute left-4 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground group-focus-within:text-primary transition-colors" />
                    <input 
                      id="phone" 
                      name="phone" 
                      defaultValue={userProfile?.phone || ''} 
                      placeholder="+55 11 00000-0000"
                      className="w-full h-12 bg-muted/30 border border-input rounded-xl pl-11 pr-4 text-sm focus:outline-none focus:ring-2 focus:ring-primary/20 focus:border-primary transition-all"
                    />
                  </div>
                </div>

                <div className="space-y-2">
                  <Label htmlFor="country" className="text-xs font-black uppercase tracking-widest text-muted-foreground ml-1">Country</Label>
                  <div className="relative group">
                    <Globe className="absolute left-4 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground group-focus-within:text-primary transition-colors" />
                    <input 
                      id="country" 
                      name="country" 
                      defaultValue={userProfile?.country || ''} 
                      placeholder="e.g. Brazil"
                      className="w-full h-12 bg-muted/30 border border-input rounded-xl pl-11 pr-4 text-sm focus:outline-none focus:ring-2 focus:ring-primary/20 focus:border-primary transition-all"
                    />
                  </div>
                </div>
              </div>

              <div className="flex justify-end pt-2">
                <Button type="submit" className="h-12 px-10 bg-primary hover:bg-primary/90 text-white font-black text-xs uppercase tracking-widest rounded-xl shadow-lg shadow-primary/20 transition-all active:scale-95">
                  Update Profile
                </Button>
              </div>
            </form>
          </TabsContent>

          {/* Security Tab */}
          <TabsContent value="security" className="space-y-6 animate-in fade-in zoom-in-95 duration-300 outline-none">
            <div className="flex items-center gap-3 pb-2 border-b border-border">
              <h2 className="text-xl font-bold">Security</h2>
            </div>
            
            <form action={updatePasswordAction} className="space-y-6">
              <input type="hidden" name="locale" value={locale} />
              
              <div className="grid gap-6 sm:grid-cols-2">
                <div className="space-y-2">
                  <Label htmlFor="password" className="text-xs font-black uppercase tracking-widest text-muted-foreground ml-1">New Password</Label>
                  <div className="relative group">
                    <Lock className="absolute left-4 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground group-focus-within:text-primary transition-colors" />
                    <input 
                      id="password" 
                      name="password" 
                      type="password" 
                      placeholder="Minimum 6 characters"
                      required 
                      minLength={6}
                      className="w-full h-12 bg-muted/30 border border-input rounded-xl pl-11 pr-4 text-sm focus:outline-none focus:ring-2 focus:ring-primary/20 focus:border-primary transition-all"
                    />
                  </div>
                </div>

                <div className="space-y-2">
                  <Label htmlFor="confirmPassword" className="text-xs font-black uppercase tracking-widest text-muted-foreground ml-1">Confirm Password</Label>
                  <div className="relative group">
                    <ShieldCheck className="absolute left-4 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground group-focus-within:text-primary transition-colors" />
                    <input 
                      id="confirmPassword" 
                      name="confirmPassword" 
                      type="password" 
                      placeholder="Repeat new password"
                      required 
                      minLength={6}
                      className="w-full h-12 bg-muted/30 border border-input rounded-xl pl-11 pr-4 text-sm focus:outline-none focus:ring-2 focus:ring-primary/20 focus:border-primary transition-all"
                    />
                  </div>
                </div>
              </div>

              <div className="flex justify-end pt-2">
                <Button type="submit" className="h-12 px-10 bg-primary hover:bg-primary/90 text-white font-black text-xs uppercase tracking-widest rounded-xl shadow-lg shadow-primary/20 transition-all active:scale-95">
                  Change Password
                </Button>
              </div>
            </form>
          </TabsContent>
        </Tabs>
      </div>
    </div>
  )
}
