"use client"

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import { useUser } from '@auth0/nextjs-auth0/client'
import { Plus, Settings, Wrench, LogOut } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Sheet, SheetContent, SheetTrigger } from '@/components/ui/sheet'
import { useChatStore } from '@/stores/chat-store'
import { useToolStore } from '@/stores/tool-store'
import { ConversationList } from './conversation-list'
import { ToolsDrawer } from './tools-drawer'
import { SettingsModal } from './settings-modal'

export function ChatSidebar() {
  const router = useRouter()
  const { user } = useUser()
  const { conversations, addConversation, deleteConversation } = useChatStore()
  const [isToolsOpen, setIsToolsOpen] = useState(false)
  const [isSettingsOpen, setIsSettingsOpen] = useState(false)

  const handleNewChat = async () => {
    const now = new Date();
    const newConversation = {
      id: `conv_${Date.now()}`,
      title: 'New Chat',
      lastMessage: '',
      timestamp: now,
      createdAt: now.toISOString(),
      updatedAt: now.toISOString(),
      userId: user?.sub || 'current-user'
    }
    
    addConversation(newConversation)
    router.push(`/chat/${newConversation.id}`)
  }

  const handleLogout = () => {
    window.location.href = '/api/auth/logout'
  }

  return (
    <div className="w-64 bg-muted/50 border-r border-border flex flex-col h-full">
      {/* Header */}
      <div className="p-4 border-b border-border">
        <Button 
          onClick={handleNewChat}
          className="w-full justify-start"
          size="sm"
        >
          <Plus className="w-4 h-4 mr-2" />
          New Chat
        </Button>
      </div>

      {/* Conversations */}
      <div className="flex-1 overflow-hidden">
        <ConversationList 
          conversations={conversations}
          onDeleteConversation={deleteConversation}
        />
      </div>

      {/* Footer */}
      <div className="p-4 border-t border-border space-y-2">
        <Button
          onClick={() => setIsToolsOpen(true)}
          variant="ghost"
          className="w-full justify-start"
          size="sm"
        >
          <Wrench className="w-4 h-4 mr-2" />
          Tools
        </Button>
        
        <Button
          onClick={() => setIsSettingsOpen(true)}
          variant="ghost"
          className="w-full justify-start"
          size="sm"
        >
          <Settings className="w-4 h-4 mr-2" />
          Settings
        </Button>
        
        <Button
          onClick={handleLogout}
          variant="ghost"
          className="w-full justify-start"
          size="sm"
        >
          <LogOut className="w-4 h-4 mr-2" />
          Sign Out
        </Button>
      </div>

      {/* Modals */}
      <ToolsDrawer 
        open={isToolsOpen} 
        onOpenChange={setIsToolsOpen}
      />
      <SettingsModal 
        open={isSettingsOpen} 
        onOpenChange={setIsSettingsOpen}
      />
    </div>
  )
} 