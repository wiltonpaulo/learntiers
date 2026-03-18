"use client"

import * as React from "react"
import Link from "next/link"
import { 
  User, 
  Settings, 
  LogOut, 
  ChevronRight,
  Award
} from "lucide-react"

import {
  HoverCard,
  HoverCardContent,
  HoverCardTrigger,
} from "@/components/ui/hover-card"
import {
  Avatar,
  AvatarFallback,
  AvatarImage,
} from "@/components/ui/avatar"
import { cn } from "@/lib/utils"

interface UserProfileDropdownProps {
  user: {
    name?: string | null
    email?: string | null
    image?: string | null
  }
  onLogout?: () => void
  locale: string
}

export function UserProfileDropdown({ 
  user, 
  onLogout,
  locale
}: UserProfileDropdownProps) {
  const [isOpen, setIsOpen] = React.useState(false)

  const getInitials = (name?: string | null, email?: string | null) => {
    if (!name) return email?.[0].toUpperCase() || "U"
    const parts = name.trim().split(/\s+/)
    if (parts.length === 0) return "U"
    if (parts.length === 1) return parts[0][0].toUpperCase()
    return (parts[0][0] + parts[parts.length - 1][0]).toUpperCase()
  }

  const initials = getInitials(user.name, user.email)

  return (
    <HoverCard openDelay={0} closeDelay={150} open={isOpen} onOpenChange={setIsOpen}>
      <HoverCardTrigger asChild>
        <button 
          className="outline-none focus:ring-0 rounded-full transition-all duration-300 group"
          onClick={() => setIsOpen(!isOpen)}
        >
          <Avatar className={cn(
            "cursor-pointer border transition-all duration-300 size-9",
            isOpen ? "border-primary ring-4 ring-primary/10" : "border-white/10 hover:border-white/30"
          )}>
            <AvatarImage src={user.image || ""} alt={user.name || "User avatar"} />
            <AvatarFallback className="bg-slate-800 text-slate-200 font-bold text-xs">
              {initials}
            </AvatarFallback>
          </Avatar>
        </button>
      </HoverCardTrigger>
      
      <HoverCardContent 
        className="w-72 bg-white border-slate-200 shadow-2xl p-2 rounded-2xl overflow-hidden animate-in fade-in zoom-in-95 duration-200 before:absolute before:inset-x-0 before:-top-4 before:h-4 before:content-['']" 
        align="end" 
        sideOffset={10}
      >
        {/* Header Section */}
        <div className="flex flex-col items-center p-4 pb-6 space-y-3">
          <Avatar size="lg" className="size-16 ring-4 ring-slate-50 border border-slate-100 shadow-inner">
            <AvatarImage src={user.image || ""} alt={user.name || "User avatar"} />
            <AvatarFallback className="bg-slate-100 text-slate-600 text-xl font-bold">
              {initials}
            </AvatarFallback>
          </Avatar>
          <div className="flex flex-col items-center text-center space-y-1">
            <p className="text-base font-bold text-slate-900 leading-tight">
              {user.name || "Student"}
            </p>
            <p className="text-xs text-slate-500 font-medium truncate max-w-[240px]">
              {user.email}
            </p>
          </div>
        </div>

        <div className="h-px bg-slate-100 -mx-2 mb-1" />

        {/* Menu Items */}
        <div className="space-y-0.5">
          <Link 
            href={`/${locale}/profile`} 
            className="flex items-center w-full rounded-xl hover:bg-slate-50 text-slate-600 hover:text-slate-900 transition-all duration-200 py-2.5 px-3 group"
            onClick={() => setIsOpen(false)}
          >
            <div className="p-1.5 rounded-lg bg-slate-50 group-hover:bg-primary/10 transition-colors mr-3 text-slate-400 group-hover:text-primary">
              <User className="size-4" />
            </div>
            <span className="flex-1 font-bold text-sm">View Profile</span>
            <ChevronRight className="size-3.5 opacity-0 group-hover:opacity-40 transition-opacity" />
          </Link>

          <Link 
            href={`/${locale}/certificates`} 
            className="flex items-center w-full rounded-xl hover:bg-slate-50 text-slate-600 hover:text-slate-900 transition-all duration-200 py-2.5 px-3 group"
            onClick={() => setIsOpen(false)}
          >
            <div className="p-1.5 rounded-lg bg-slate-50 group-hover:bg-amber-100 transition-colors mr-3 text-slate-400 group-hover:text-amber-600">
              <Award className="size-4" />
            </div>
            <span className="flex-1 font-bold text-sm">My Certificates</span>
            <ChevronRight className="size-3.5 opacity-0 group-hover:opacity-40 transition-opacity" />
          </Link>

          <Link 
            href={`/${locale}/settings`} 
            className="flex items-center w-full rounded-xl hover:bg-slate-50 text-slate-600 hover:text-slate-900 transition-all duration-200 py-2.5 px-3 group"
            onClick={() => setIsOpen(false)}
          >
            <div className="p-1.5 rounded-lg bg-slate-50 group-hover:bg-primary/10 transition-colors mr-3 text-slate-400 group-hover:text-primary">
              <Settings className="size-4" />
            </div>
            <span className="flex-1 font-bold text-sm">Account Settings</span>
            <ChevronRight className="size-3.5 opacity-0 group-hover:opacity-40 transition-opacity" />
          </Link>
        </div>

        <div className="h-px bg-slate-100 -mx-2 my-1" />

        <button 
          className="flex items-center w-full rounded-xl hover:bg-red-50 text-slate-500 hover:text-red-600 transition-all duration-200 py-2.5 px-3 group text-left"
          onClick={() => {
            setIsOpen(false)
            onLogout?.()
          }}
        >
          <div className="p-1.5 rounded-lg bg-slate-50 group-hover:bg-red-100 transition-colors mr-3 text-slate-400 group-hover:text-red-600">
            <LogOut className="size-4" />
          </div>
          <span className="font-bold text-sm flex-1">Log out</span>
        </button>
      </HoverCardContent>
    </HoverCard>
  )
}
