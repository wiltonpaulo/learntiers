'use client'

import { createContext, useContext, ReactNode } from 'react'

interface PlayerContextType {
  getCurrentTime: () => number
  seekTo: (seconds: number) => void
}

const PlayerContext = createContext<PlayerContextType | undefined>(undefined)

export const usePlayer = () => {
  const context = useContext(PlayerContext)
  if (!context) {
    // Return a fallback to avoid crashes, though ideally it should be used within provider
    return {
      getCurrentTime: () => 0,
      seekTo: () => {}
    }
  }
  return context
}

export function PlayerProvider({ 
  children, 
  getCurrentTime, 
  seekTo 
}: { 
  children: ReactNode, 
  getCurrentTime: () => number, 
  seekTo: (seconds: number) => void 
}) {
  return (
    <PlayerContext.Provider value={{ getCurrentTime, seekTo }}>
      {children}
    </PlayerContext.Provider>
  )
}
