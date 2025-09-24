'use client'

import { ReactNode } from "react"
import { usePathname } from "next/navigation"
import { ClientSessionProvider } from "@/components/ClientSessionProvider"

interface ProvidersProps {
  children: ReactNode
}

export function Providers({ children }: ProvidersProps) {
  const pathname = usePathname()
  const isAuthPage = pathname?.startsWith('/auth/')

  return (
    <ClientSessionProvider
      refetchOnWindowFocus={false}
      refetchInterval={0}
      basePath="/api/auth"
      staleTime={5 * 60 * 1000} // 5 minutes
      retry={1}
      retryDelay={1000}
    >
      {children}
    </ClientSessionProvider>
  )
}