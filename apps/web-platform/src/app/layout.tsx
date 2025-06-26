import type { Metadata } from 'next'
import { Inter } from 'next/font/google'
import './globals.css'
import dynamic from 'next/dynamic'
import { ThemeProvider } from '@/components/theme-provider'

// Dynamically import Auth0Provider with no SSR
const Auth0ProviderWrapper = dynamic(
  () => import('@/components/auth0-provider-wrapper').then(mod => ({ default: mod.Auth0ProviderWrapper })),
  { ssr: false }
)

const inter = Inter({ subsets: ['latin'] })

export const metadata: Metadata = {
  title: 'ChatMCP - AI Platform with MCP Tools',
  description: 'ChatGPT-style platform with Auth0-GenAI-secured MCP agent integration',
}

export default function RootLayout({
  children,
}: {
  children: React.ReactNode
}) {
  return (
    <html lang="en" suppressHydrationWarning>
      <body className={inter.className}>
        <Auth0ProviderWrapper>
          <ThemeProvider
            attribute="class"
            defaultTheme="dark"
            enableSystem
            disableTransitionOnChange
          >
            {children}
          </ThemeProvider>
        </Auth0ProviderWrapper>
      </body>
    </html>
  )
} 