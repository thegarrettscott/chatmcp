"use client"

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import { useAuth0 } from '@auth0/auth0-react'
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
  const { logout } = useAuth0()
  const { conversations, addConversation } = useChatStore()
  const [isToolsOpen, setIsToolsOpen] = useState(false)
  const [isSettingsOpen, setIsSettingsOpen] = useState(false)

  const handleNewChat = async () => {
    const newConversation = {
      id: `conv_${Date.now()}`,
      title: 'New Chat',
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
      userId: 'current-user'
    }
    
    addConversation(newConversation)
    router.push(`/chat/${newConversation.id}`)
  }

  const handleLogout = () => {
    logout({ logoutParams: { returnTo: window.location.origin } })
  }

  return (
    <div className="w-80 bg-card border-r border-border flex flex-col">
      {/* Header */}
      <div className="p-4 border-b border-border">
        <Button 
          onClick={handleNewChat}
          className="w-full justify-start gap-2"
          variant="outline"
        >
          <Plus className="h-4 w-4" />
          New Chat
        </Button>
      </div>

      {/* Conversation List */}
      <div className="flex-1 overflow-y-auto">
        <ConversationList conversations={conversations} />
      </div>

      {/* Footer */}
      <div className="p-4 border-t border-border space-y-2">
        <Sheet open={isToolsOpen} onOpenChange={setIsToolsOpen}>
          <SheetTrigger asChild>
            <Button variant="outline" className="w-full justify-start gap-2">
              <Wrench className="h-4 w-4" />
              My Tools
            </Button>
          </SheetTrigger>
          <SheetContent side="left" className="w-80">
            <ToolsDrawer />
          </SheetContent>
        </Sheet>

        <div className="flex gap-2">
          <Button
            variant="outline"
            size="sm"
            className="flex-1"
            onClick={() => setIsSettingsOpen(true)}
          >
            <Settings className="h-4 w-4" />
          </Button>
          <Button
            variant="outline"
            size="sm"
            onClick={handleLogout}
          >
            <LogOut className="h-4 w-4" />
          </Button>
        </div>
      </div>

      <SettingsModal 
        open={isSettingsOpen} 
        onOpenChange={setIsSettingsOpen} 
      />
    </div>
  )
} 