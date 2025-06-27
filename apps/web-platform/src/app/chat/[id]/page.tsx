"use client"

import { useEffect, useState } from 'react'
import { useParams, useRouter } from 'next/navigation'
import { useUser } from '@auth0/nextjs-auth0/client'
import { useChatStore } from '@/stores/chat-store'
import { ChatMain } from '@/components/chat-main'
import { ConversationList } from '@/components/conversation-list'
import { ToolsDrawer } from '@/components/tools-drawer'
import { SettingsModal } from '@/components/settings-modal'
import { Button } from '@/components/ui/button'
import { Sheet, SheetContent, SheetTrigger } from '@/components/ui/sheet'
import { Menu, Settings, Wrench, RefreshCw } from 'lucide-react'

export default function ChatPage() {
  const { user, isLoading: authLoading } = useUser()
  const params = useParams()
  const router = useRouter()
  const conversationId = params.id as string
  
  const {
    conversations,
    currentConversation,
    isLoading,
    error,
    initialized,
    fetchConversations,
    createConversation,
    setCurrentConversation,
    deleteConversation,
    setInitialized,
    clearError,
  } = useChatStore()

  const [showSettings, setShowSettings] = useState(false)
  const [showTools, setShowTools] = useState(false)

  // Initialize the store when user is available
  useEffect(() => {
    if (user && !initialized) {
      fetchConversations().then(() => {
        setInitialized(true)
      })
    }
  }, [user, initialized, fetchConversations, setInitialized])

  // Handle conversation selection
  useEffect(() => {
    if (!initialized) return

    if (conversationId && conversationId !== 'new') {
      const conversation = conversations.find(c => c.id === conversationId)
      if (conversation) {
        setCurrentConversation(conversation)
      } else {
        // Conversation not found, redirect to new chat
        console.log('Conversation not found, redirecting to new chat')
        router.replace('/chat/new')
        return
      }
    } else {
      setCurrentConversation(null)
    }
  }, [conversationId, conversations, setCurrentConversation, router, initialized])

  const handleNewConversation = async () => {
    try {
      const newConversation = await createConversation('New Chat')
      router.push(`/chat/${newConversation.id}`)
    } catch (error) {
      console.error('Failed to create conversation:', error)
    }
  }

  const handleDeleteConversation = async (id: string) => {
    try {
      await deleteConversation(id)
      if (conversationId === id) {
        router.push('/chat/new')
      }
    } catch (error) {
      console.error('Failed to delete conversation:', error)
    }
  }

  if (authLoading || (user && !initialized)) {
    return (
      <div className="flex items-center justify-center h-screen">
        <div className="text-center">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary mx-auto mb-4"></div>
          <p>Loading...</p>
        </div>
      </div>
    )
  }

  if (!user) {
    return (
      <div className="flex items-center justify-center h-screen">
        <div className="text-center">
          <h1 className="text-2xl font-bold mb-4">Please sign in</h1>
          <Button
            onClick={() => window.location.href = '/api/auth/login'}
            className="inline-flex items-center justify-center rounded-md text-sm font-medium ring-offset-background transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 disabled:pointer-events-none disabled:opacity-50 bg-primary text-primary-foreground hover:bg-primary/90 h-10 px-4 py-2"
          >
            Sign In
          </Button>
        </div>
      </div>
    )
  }

  if (error) {
    return (
      <div className="flex items-center justify-center h-screen">
        <div className="text-center max-w-md">
          <RefreshCw className="w-12 h-12 mx-auto mb-4 text-destructive" />
          <h1 className="text-2xl font-bold mb-4">Error Loading Data</h1>
          <p className="text-muted-foreground mb-6">{error}</p>
          <div className="space-y-3">
            <Button onClick={() => {
              clearError()
              fetchConversations()
            }}>
              Try Again
            </Button>
            <Button variant="outline" onClick={() => router.push('/chat/new')}>
              Start New Chat
            </Button>
          </div>
        </div>
      </div>
    )
  }

  return (
    <div className="flex h-screen bg-background">
      {/* Desktop Sidebar */}
      <div className="hidden md:flex md:w-80 md:flex-col md:border-r">
        <div className="flex-1 flex flex-col min-h-0">
          <ConversationList
            conversations={conversations}
            onNewConversation={handleNewConversation}
            onDeleteConversation={handleDeleteConversation}
          />
        </div>
        
        <div className="border-t p-4 space-y-2">
          <Button
            variant="outline"
            onClick={() => setShowTools(true)}
            className="w-full justify-start gap-2"
          >
            <Wrench className="w-4 h-4" />
            Tools
          </Button>
          <Button
            variant="outline"
            onClick={() => setShowSettings(true)}
            className="w-full justify-start gap-2"
          >
            <Settings className="w-4 h-4" />
            Settings
          </Button>
        </div>
      </div>

      {/* Main Content */}
      <div className="flex-1 flex flex-col min-h-0">
        {/* Mobile Header */}
        <div className="md:hidden border-b p-4 flex items-center gap-4">
          <Sheet>
            <SheetTrigger asChild>
              <Button variant="outline" size="icon">
                <Menu className="w-4 h-4" />
              </Button>
            </SheetTrigger>
            <SheetContent side="left" className="w-80 p-0">
              <div className="flex flex-col h-full">
                <ConversationList
                  conversations={conversations}
                  onNewConversation={handleNewConversation}
                  onDeleteConversation={handleDeleteConversation}
                />
                
                <div className="border-t p-4 space-y-2">
                  <Button
                    variant="outline"
                    onClick={() => setShowTools(true)}
                    className="w-full justify-start gap-2"
                  >
                    <Wrench className="w-4 h-4" />
                    Tools
                  </Button>
                  <Button
                    variant="outline"
                    onClick={() => setShowSettings(true)}
                    className="w-full justify-start gap-2"
                  >
                    <Settings className="w-4 h-4" />
                    Settings
                  </Button>
                </div>
              </div>
            </SheetContent>
          </Sheet>
          
          <h1 className="font-semibold">
            {conversationId === 'new' ? 'New Chat' : currentConversation?.title || 'Chat'}
          </h1>
        </div>

        {/* Chat Main */}
        <div className="flex-1 min-h-0">
          <ChatMain conversationId={conversationId} />
        </div>
      </div>

      {/* Modals */}
      <ToolsDrawer open={showTools} onOpenChange={setShowTools} />
      <SettingsModal open={showSettings} onOpenChange={setShowSettings} />
    </div>
  )
} 