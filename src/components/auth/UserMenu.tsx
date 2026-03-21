"use client"

import { UserProfileDropdown } from "./UserProfileDropdown"
import { logoutAction } from "@/lib/actions/auth"

interface UserMenuProps {
  user: {
    name?: string | null
    email?: string | null
    image?: string | null
  }
}

export function UserMenu({ user }: UserMenuProps) {
  const handleLogout = async () => {
    const formData = new FormData()
    await logoutAction(formData)
  }

  return (
    <UserProfileDropdown 
      user={user} 
      onLogout={handleLogout}
    />
  )
}
