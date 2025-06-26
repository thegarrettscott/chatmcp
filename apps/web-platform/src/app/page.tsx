"use client"

import { useEffect } from 'react'
import { useRouter } from 'next/navigation'
import { useAuth0 } from '@auth0/auth0-react'
import { useChatStore } from '@/stores/chat-store'

export default function HomePage() {
  const router = useRouter()
  const { isAuthenticated, isLoading } = useAuth0()
  const { conversations, currentConversation } = useChatStore()

  useEffect(() => {
    if (!isLoading) {
      if (!isAuthenticated) {
        return
      }

      if (currentConversation) {
        router.push(`/chat/${currentConversation.id}`)
      } else if (conversations.length > 0) {
        router.push(`/chat/${conversations[0].id}`)
      } else {
        router.push('/chat/new')
      }
    }
  }, [isAuthenticated, isLoading, conversations, currentConversation, router])

  if (isLoading) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <div className="animate-spin rounded-full h-32 w-32 border-b-2 border-primary"></div>
      </div>
    )
  }

  if (!isAuthenticated) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <div className="text-center">
          <h1 className="text-4xl font-bold mb-4">Welcome to ChatMCP</h1>
          <p className="text-muted-foreground mb-8">
            Your AI platform with MCP tool integration
          </p>
          <button
            onClick={() => window.location.href = '/api/auth/login'}
            className="bg-primary text-primary-foreground px-6 py-3 rounded-lg hover:bg-primary/90 transition-colors"
          >
            Sign In
          </button>
        </div>
      </div>
    )
  }

  return (
    <div className="flex items-center justify-center min-h-screen">
      <div className="animate-spin rounded-full h-32 w-32 border-b-2 border-primary"></div>
    </div>
  )
} 