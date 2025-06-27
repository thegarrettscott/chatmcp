'use client'

import { useState, useRef, useEffect } from 'react'
import { useUser } from '@auth0/nextjs-auth0/client'
import { useRouter } from 'next/navigation'
import { useChatStore } from '@/stores/chat-store'
import { Message } from '@/types'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { ScrollArea } from '@/components/ui/scroll-area'
import { Send, Bot, User, Loader2 } from 'lucide-react'
import { ensureDate } from '@/stores/chat-store'

interface ChatMainProps {
  conversationId: string
}

export function ChatMain({ conversationId }: ChatMainProps) {
  const { user } = useUser()
  const router = useRouter()
  const [messages, setMessages] = useState<Message[]>([])
  const [input, setInput] = useState('')
  const [isLoading, setIsLoading] = useState(false)
  const [isLoadingMessages, setIsLoadingMessages] = useState(false)
  const scrollAreaRef = useRef<HTMLDivElement>(null)

  const {
    currentConversation,
    createConversation,
    setCurrentConversation,
    fetchMessages,
  } = useChatStore()

  // Fetch messages when conversation changes
  useEffect(() => {
    if (conversationId && conversationId !== 'new') {
      setIsLoadingMessages(true)
      fetchMessages(conversationId)
        .then((fetchedMessages) => {
          setMessages(fetchedMessages || [])
        })
        .catch((error) => {
          console.error('Failed to fetch messages:', error)
          setMessages([])
        })
        .finally(() => {
          setIsLoadingMessages(false)
        })
    } else {
      setMessages([])
    }
  }, [conversationId, fetchMessages])

  useEffect(() => {
    // Scroll to bottom when messages change
    if (scrollAreaRef.current) {
      const scrollContainer = scrollAreaRef.current.querySelector('[data-radix-scroll-area-viewport]')
      if (scrollContainer) {
        scrollContainer.scrollTop = scrollContainer.scrollHeight
      }
    }
  }, [messages])

  const formatTimestamp = (timestamp: Date | string | null | undefined): string => {
    try {
      const date = ensureDate(timestamp);
      return date.toLocaleTimeString();
    } catch (error) {
      console.error('Error formatting timestamp:', error);
      return 'Invalid time';
    }
  };

  const handleSend = async () => {
    if (!input.trim() || isLoading || !user) return

    const currentInput = input
    setInput('')
    setIsLoading(true)

    try {
      let activeConversationId = conversationId

      // If we're in a new chat, create a conversation first
      if (conversationId === 'new') {
        const newConversation = await createConversation(currentInput.slice(0, 50) + '...')
        activeConversationId = newConversation.id
        setCurrentConversation(newConversation)
        // Update the URL to the new conversation
        router.replace(`/chat/${newConversation.id}`)
      }

      // Add user message to local state immediately
      const userMessage: Message = {
        id: Date.now().toString(),
        conversation_id: activeConversationId,
        role: 'user',
        content: currentInput,
        created_at: new Date().toISOString()
      }
      setMessages(prev => [...prev, userMessage])

      // Call orchestrator API directly (temporarily without auth)
      const response = await fetch(`${process.env.NEXT_PUBLIC_ORCHESTRATOR_URL || 'https://chatmcp.fly.dev'}/agent`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          prompt: currentInput,
          conversationId: activeConversationId,
        }),
      })

      if (!response.ok) {
        throw new Error(`API call failed: ${response.statusText}`)
      }

      const result = await response.json()
      
      // Set up Server-Sent Events for streaming (temporarily without token)
      const eventSource = new EventSource(
        `${process.env.NEXT_PUBLIC_ORCHESTRATOR_URL || 'https://chatmcp.fly.dev'}/agent/stream/${result.responseId}`
      )

      let assistantContent = ''
      const assistantMessage: Message = {
        id: (Date.now() + 1).toString(),
        conversation_id: activeConversationId,
        role: 'assistant',
        content: '',
        created_at: new Date().toISOString()
      }

      setMessages(prev => [...prev, assistantMessage])

      eventSource.onmessage = (event) => {
        const data = JSON.parse(event.data)
        
        if (data.type === 'content') {
          assistantContent += data.content
          setMessages(prev => 
            prev.map(msg => 
              msg.id === assistantMessage.id 
                ? { ...msg, content: assistantContent }
                : msg
            )
          )
        } else if (data.type === 'done') {
          eventSource.close()
          setIsLoading(false)
        } else if (data.type === 'error') {
          console.error('Streaming error:', data.error)
          eventSource.close()
          setIsLoading(false)
        }
      }

      eventSource.onerror = (error) => {
        console.error('EventSource error:', error)
        eventSource.close()
        setIsLoading(false)
        
        // Fallback to simulated response
        const fallbackMessage: Message = {
          id: (Date.now() + 1).toString(),
          conversation_id: activeConversationId,
          role: 'assistant',
          content: `I apologize, but I'm having trouble connecting to the AI service right now. This is a simulated response to: "${currentInput}"`,
          created_at: new Date().toISOString()
        }
        
        setMessages(prev => [...prev.slice(0, -1), fallbackMessage])
      }

    } catch (error) {
      console.error('Failed to send message:', error)
      setIsLoading(false)
      
      // Fallback to simulated response
      const fallbackMessage: Message = {
        id: (Date.now() + 1).toString(),
        conversation_id: conversationId,
        role: 'assistant',
        content: `I apologize, but I'm having trouble connecting to the AI service right now. This is a simulated response to: "${currentInput}"`,
        created_at: new Date().toISOString()
      }
      
      setMessages(prev => [...prev, fallbackMessage])
    }
  }

  const handleKeyPress = (e: React.KeyboardEvent<HTMLInputElement>) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault()
      handleSend()
    }
  }

  return (
    <div className="flex flex-col h-full min-h-0">
      {/* Header */}
      <div className="flex-shrink-0 border-b border-border p-4 bg-background/95 backdrop-blur supports-[backdrop-filter]:bg-background/60">
        <h2 className="font-semibold text-lg">
          {conversationId === 'new' ? 'New Chat' : currentConversation?.title || 'Chat'}
        </h2>
      </div>

      {/* Messages Area */}
      <ScrollArea className="flex-1 p-4" ref={scrollAreaRef}>
        <div className="space-y-6 max-w-4xl mx-auto">
          {isLoadingMessages ? (
            <div className="text-center py-12">
              <Loader2 className="w-8 h-8 mx-auto mb-4 animate-spin text-muted-foreground" />
              <p className="text-muted-foreground">Loading messages...</p>
            </div>
          ) : messages.length === 0 ? (
            <div className="text-center py-12">
              <Bot className="w-12 h-12 mx-auto mb-4 text-muted-foreground" />
              <h3 className="text-lg font-medium mb-2">Start a conversation</h3>
              <p className="text-muted-foreground">
                Ask me anything! I&apos;m powered by OpenAI&apos;s o3 model with MCP tool integration.
              </p>
            </div>
          ) : (
            messages.map((message) => (
              <div
                key={message.id}
                className={`flex gap-4 ${
                  message.role === 'user' ? 'justify-end' : 'justify-start'
                }`}
              >
                {message.role === 'assistant' && (
                  <div className="w-8 h-8 rounded-full bg-primary flex items-center justify-center flex-shrink-0">
                    <Bot className="w-4 h-4 text-primary-foreground" />
                  </div>
                )}
                
                <div
                  className={`max-w-[80%] lg:max-w-[70%] rounded-2xl px-4 py-3 ${
                    message.role === 'user'
                      ? 'bg-primary text-primary-foreground ml-12'
                      : 'bg-muted'
                  }`}
                >
                  <div className="prose prose-sm max-w-none dark:prose-invert">
                    <p className="mb-0 whitespace-pre-wrap">{message.content}</p>
                  </div>
                  {message.reasoning && (
                    <div className="mt-2 p-2 bg-black/10 rounded text-xs">
                      <p><strong>Reasoning:</strong> {message.reasoning.summary}</p>
                      <p><strong>Effort:</strong> {message.reasoning.effort}</p>
                    </div>
                  )}
                  <p className="text-xs opacity-70 mt-2">
                    {formatTimestamp(message.created_at)}
                  </p>
                </div>
                
                {message.role === 'user' && (
                  <div className="w-8 h-8 rounded-full bg-muted flex items-center justify-center flex-shrink-0">
                    <User className="w-4 h-4" />
                  </div>
                )}
              </div>
            ))
          )}
          
          {isLoading && (
            <div className="flex gap-4 justify-start">
              <div className="w-8 h-8 rounded-full bg-primary flex items-center justify-center flex-shrink-0">
                <Bot className="w-4 h-4 text-primary-foreground" />
              </div>
              <div className="bg-muted rounded-2xl px-4 py-3">
                <div className="flex items-center space-x-2">
                  <Loader2 className="w-4 h-4 animate-spin" />
                  <span className="text-sm text-muted-foreground">Thinking...</span>
                </div>
              </div>
            </div>
          )}
        </div>
      </ScrollArea>

      {/* Input Area */}
      <div className="flex-shrink-0 border-t border-border p-4 bg-background/95 backdrop-blur supports-[backdrop-filter]:bg-background/60">
        <div className="max-w-4xl mx-auto">
          <div className="flex gap-3">
            <Input
              value={input}
              onChange={(e) => setInput(e.target.value)}
              onKeyPress={handleKeyPress}
              placeholder="Type your message..."
              disabled={isLoading}
              className="flex-1 min-h-[44px] resize-none"
            />
            <Button
              onClick={handleSend}
              disabled={!input.trim() || isLoading}
              size="icon"
              className="h-[44px] w-[44px] flex-shrink-0"
            >
              <Send className="w-4 h-4" />
            </Button>
          </div>
          <p className="text-xs text-muted-foreground mt-2 text-center">
            Powered by OpenAI o3 with MCP tool integration
          </p>
        </div>
      </div>
    </div>
  )
} 