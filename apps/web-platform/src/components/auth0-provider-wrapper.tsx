"use client"

import { UserProvider } from '@auth0/nextjs-auth0/client'
import { ReactNode } from 'react'

interface Auth0ProviderWrapperProps {
  children: ReactNode
}

export function Auth0ProviderWrapper({ children }: Auth0ProviderWrapperProps) {
  return (
    <UserProvider>
      {children}
    </UserProvider>
  )
} 