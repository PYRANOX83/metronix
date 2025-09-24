'use client'

import { SessionProvider } from "next-auth/react"
import { ReactNode } from "react"

interface ClientSessionProviderProps {
  children: ReactNode
  refetchOnWindowFocus?: boolean
  refetchInterval?: number
  basePath?: string
  staleTime?: number
  retry?: number
  retryDelay?: number
}

export function ClientSessionProvider({ children, ...props }: ClientSessionProviderProps) {
  return (
    <SessionProvider 
      refetchOnWindowFocus={false}
      refetchInterval={0}
      basePath="/api/auth"
      staleTime={60 * 1000}
      retry={1}
      retryDelay={1000}
      {...props}
    >
      {children}
    </SessionProvider>
  )
}