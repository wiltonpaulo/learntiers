"use client"

import { UserProfileDropdown } from "./UserProfileDropdown"
import { logoutAction } from "@/lib/actions/auth"
import { useRouter } from "next/navigation"

interface UserMenuProps {
  user: {
    name?: string | null
    email?: string | null
    image?: string | null
  }
  locale: string
}

export function UserMenu({ user, locale }: UserMenuProps) {
  const handleLogout = async () => {
    const formData = new FormData()
    formData.append("locale", locale)
    await logoutAction(formData)
  }

  return (
    <UserProfileDropdown 
      user={user} 
      onLogout={handleLogout}
      locale={locale}
    />
  )
}
