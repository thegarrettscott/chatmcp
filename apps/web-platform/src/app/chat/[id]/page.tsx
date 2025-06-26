"use client"

import { useEffect } from 'react'
import { useParams } from 'next/navigation'
import { useUser } from '@auth0/nextjs-auth0/client'
import { ChatSidebar } from '@/components/chat-sidebar'
import { ChatMain } from '@/components/chat-main'
import { useChatStore } from '@/stores/chat-store'

export default function ChatPage() {
  const params = useParams()
  const { user, isLoading } = useUser()
  const { setCurrentConversation, conversations } = useChatStore()
  const conversationId = params.id as string

  useEffect(() => {
    if (conversationId && conversationId !== 'new') {
      const conversation = conversations.find(c => c.id === conversationId)
      if (conversation) {
        setCurrentConversation(conversation)
      }
    } else {
      setCurrentConversation(null)
    }
  }, [conversationId, conversations, setCurrentConversation])

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
          <h1 className="text-4xl font-bold mb-4">Please Sign In</h1>
          <p className="text-muted-foreground mb-8">
            You need to be authenticated to access the chat
          </p>
          <a
            href="/api/auth/login"
            className="bg-primary text-primary-foreground px-6 py-3 rounded-lg hover:bg-primary/90 transition-colors inline-block"
          >
            Sign In
          </a>
        </div>
      </div>
    )
  }

  return (
    <div className="flex h-screen bg-background">
      <ChatSidebar />
      <ChatMain conversationId={conversationId} />
    </div>
  )
} 