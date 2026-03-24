"use client"

import { UserProfileDropdown } from "./UserProfileDropdown"
import { logoutAction } from "@/lib/actions/auth"
import { createClient } from "@/lib/supabase/client"
import { useRouter } from "next/navigation"

interface UserMenuProps {
  user: {
    name?: string | null
    email?: string | null
    image?: string | null
  }
}

export function UserMenu({ user }: UserMenuProps) {
  const supabase = createClient()
  const router = useRouter()

  const handleLogout = async () => {
    // 1. Sign out on the client (clears local state/memory)
    // This will trigger the onAuthStateChange listener in PublicNavbar
    await supabase.auth.signOut()
    
    // 2. Sign out on the server (clears cookies and redirects)
    const formData = new FormData()
    await logoutAction(formData)
    
    // 3. Force a hard refresh to home to be absolutely sure
    window.location.href = '/'
  }

  return (
    <UserProfileDropdown 
      user={user} 
      onLogout={handleLogout}
    />
  )
}
