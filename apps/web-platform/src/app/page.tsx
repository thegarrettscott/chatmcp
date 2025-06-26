"use client"

import { useEffect } from 'react'
import { useRouter } from 'next/navigation'
import { useUser } from '@auth0/nextjs-auth0/client'
import { useChatStore } from '@/stores/chat-store'

export default function HomePage() {
  const router = useRouter()
  const { user, isLoading } = useUser()
  const { conversations, currentConversation } = useChatStore()

  useEffect(() => {
    if (!isLoading) {
      if (!user) {
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
  }, [user, isLoading, conversations, currentConversation, router])

  if (isLoading) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <div className="animate-spin rounded-full h-32 w-32 border-b-2 border-primary"></div>
      </div>
    )
  }

  if (!user) {
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