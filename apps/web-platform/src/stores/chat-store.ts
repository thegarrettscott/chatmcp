import { create } from 'zustand'
import { persist } from 'zustand/middleware'
import { Conversation, Message, ChatState } from '@/types'

interface ChatStore extends ChatState {
  setConversations: (conversations: Conversation[]) => void
  addConversation: (conversation: Conversation) => void
  updateConversation: (id: string, updates: Partial<Conversation>) => void
  deleteConversation: (id: string) => void
  setCurrentConversation: (conversation: Conversation | null) => void
  setMessages: (messages: Message[]) => void
  addMessage: (message: Message) => void
  updateMessage: (id: string, updates: Partial<Message>) => void
  setLoading: (loading: boolean) => void
  setError: (error: string | null) => void
  clearError: () => void
}

const sampleConversations: Conversation[] = [
  {
    id: '1',
    title: 'Getting Started with MCP',
    lastMessage: 'How do I set up my first MCP tool?',
    timestamp: new Date('2024-01-15T10:30:00Z'),
    createdAt: '2024-01-15T10:30:00Z',
    updatedAt: '2024-01-15T10:30:00Z',
    userId: 'user1'
  },
  {
    id: '2',
    title: 'API Integration Help',
    lastMessage: 'I need help integrating the weather API',
    timestamp: new Date('2024-01-14T15:45:00Z'),
    createdAt: '2024-01-14T15:45:00Z',
    updatedAt: '2024-01-14T15:45:00Z',
    userId: 'user1'
  },
  {
    id: '3',
    title: 'Database Schema Design',
    lastMessage: 'What\'s the best way to structure my user table?',
    timestamp: new Date('2024-01-13T09:20:00Z'),
    createdAt: '2024-01-13T09:20:00Z',
    updatedAt: '2024-01-13T09:20:00Z',
    userId: 'user1'
  }
]

export const useChatStore = create<ChatStore>()(
  persist(
    (set, get) => ({
      conversations: sampleConversations,
      currentConversation: null,
      messages: [],
      isLoading: false,
      error: null,

      setConversations: (conversations) => set({ conversations }),
      
      addConversation: (conversation) => 
        set((state) => ({ 
          conversations: [conversation, ...state.conversations] 
        })),
      
      updateConversation: (id, updates) =>
        set((state) => ({
          conversations: state.conversations.map((conv) =>
            conv.id === id ? { ...conv, ...updates } : conv
          ),
          currentConversation: state.currentConversation?.id === id
            ? { ...state.currentConversation, ...updates }
            : state.currentConversation,
        })),
      
      deleteConversation: (id) =>
        set((state) => ({
          conversations: state.conversations.filter((conv) => conv.id !== id),
          currentConversation: state.currentConversation?.id === id
            ? null
            : state.currentConversation,
        })),
      
      setCurrentConversation: (conversation) => set({ currentConversation: conversation }),
      
      setMessages: (messages) => set({ messages }),
      
      addMessage: (message) =>
        set((state) => ({ messages: [...state.messages, message] })),
      
      updateMessage: (id, updates) =>
        set((state) => ({
          messages: state.messages.map((msg) =>
            msg.id === id ? { ...msg, ...updates } : msg
          ),
        })),
      
      setLoading: (isLoading) => set({ isLoading }),
      
      setError: (error) => set({ error }),
      
      clearError: () => set({ error: null }),
    }),
    {
      name: 'chat-storage',
      partialize: (state) => ({
        conversations: state.conversations,
        currentConversation: state.currentConversation,
      }),
    }
  )
) 