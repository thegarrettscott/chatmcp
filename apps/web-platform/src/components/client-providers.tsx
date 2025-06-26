"use client"

import dynamic from 'next/dynamic'
import { ReactNode } from 'react'

// Dynamically import Auth0Provider with no SSR
const Auth0ProviderWrapper = dynamic(
  () => import('@/components/auth0-provider-wrapper').then(mod => ({ default: mod.Auth0ProviderWrapper })),
  { ssr: false }
)

interface ClientProvidersProps {
  children: ReactNode
}

export function ClientProviders({ children }: ClientProvidersProps) {
  return (
    <Auth0ProviderWrapper>
      {children}
    </Auth0ProviderWrapper>
  )
} 