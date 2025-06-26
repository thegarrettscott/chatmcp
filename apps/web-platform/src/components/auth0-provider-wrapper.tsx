"use client"

import { Auth0Provider } from '@auth0/auth0-react'
import { ReactNode } from 'react'

interface Auth0ProviderWrapperProps {
  children: ReactNode
}

export function Auth0ProviderWrapper({ children }: Auth0ProviderWrapperProps) {
  return (
    <Auth0Provider
      domain={process.env.NEXT_PUBLIC_AUTH0_DOMAIN!}
      clientId={process.env.NEXT_PUBLIC_AUTH0_CLIENT_ID!}
      authorizationParams={{
        redirect_uri: typeof window !== 'undefined' ? window.location.origin : '',
        audience: process.env.NEXT_PUBLIC_AUTH0_AUDIENCE,
        scope: 'openid profile email genai-agent'
      }}
    >
      {children}
    </Auth0Provider>
  )
} 