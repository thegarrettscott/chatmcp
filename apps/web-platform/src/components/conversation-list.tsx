'use client'

import { useState } from 'react'
import { Button } from '@/components/ui/button'
import { ScrollArea } from '@/components/ui/scroll-area'
import { Plus, MessageSquare, Trash2 } from 'lucide-react'
import Link from 'next/link'
import { useParams } from 'next/navigation'

interface Conversation {
  id: string
  title: string
  lastMessage: string
  timestamp: Date
}

interface ConversationListProps {
  conversations: Conversation[]
  onNewConversation: () => void
  onDeleteConversation: (id: string) => void
}

export function ConversationList({ 
  conversations, 
  onNewConversation, 
  onDeleteConversation 
}: ConversationListProps) {
  const params = useParams()
  const currentId = params.id as string

  return (
    <div className="flex flex-col h-full">
      {/* Header */}
      <div className="p-4 border-b">
        <Button 
          onClick={onNewConversation}
          className="w-full justify-start gap-2"
          variant="outline"
        >
          <Plus className="w-4 h-4" />
          New Chat
        </Button>
      </div>

      {/* Conversations */}
      <ScrollArea className="flex-1">
        <div className="p-2 space-y-1">
          {conversations.map((conversation) => (
            <div
              key={conversation.id}
              className={`group relative flex items-center gap-3 p-3 rounded-lg hover:bg-muted transition-colors ${
                currentId === conversation.id ? 'bg-muted' : ''
              }`}
            >
              <Link 
                href={`/chat/${conversation.id}`}
                className="flex-1 min-w-0"
              >
                <div className="flex items-center gap-2">
                  <MessageSquare className="w-4 h-4 flex-shrink-0" />
                  <div className="min-w-0 flex-1">
                    <p className="text-sm font-medium truncate">
                      {conversation.title}
                    </p>
                    <p className="text-xs text-muted-foreground truncate">
                      {conversation.lastMessage}
                    </p>
                  </div>
                </div>
                <p className="text-xs text-muted-foreground mt-1">
                  {conversation.timestamp.toLocaleDateString()}
                </p>
              </Link>
              
              <Button
                variant="ghost"
                size="icon"
                className="opacity-0 group-hover:opacity-100 transition-opacity h-6 w-6"
                onClick={() => onDeleteConversation(conversation.id)}
              >
                <Trash2 className="w-3 h-3" />
              </Button>
            </div>
          ))}
          
          {conversations.length === 0 && (
            <div className="p-4 text-center text-muted-foreground">
              <MessageSquare className="w-8 h-8 mx-auto mb-2 opacity-50" />
              <p className="text-sm">No conversations yet</p>
              <p className="text-xs">Start a new chat to begin</p>
            </div>
          )}
        </div>
      </ScrollArea>
    </div>
  )
} 