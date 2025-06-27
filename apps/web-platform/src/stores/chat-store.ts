import { create } from 'zustand'
import { Conversation, Message, ChatState } from '@/types'
import { supabase } from '@/lib/supabase'

interface ChatStore extends ChatState {
  // Conversation management
  fetchConversations: () => Promise<void>
  createConversation: (title: string) => Promise<Conversation>
  setConversations: (conversations: Conversation[]) => void
  addConversation: (conversation: Conversation) => void
  updateConversation: (id: string, updates: Partial<Conversation>) => void
  deleteConversation: (id: string) => Promise<void>
  setCurrentConversation: (conversation: Conversation | null) => void
  
  // Message management
  fetchMessages: (conversationId: string) => Promise<Message[]>
  setMessages: (messages: Message[]) => void
  addMessage: (message: Message) => void
  updateMessage: (id: string, updates: Partial<Message>) => void
  
  // State management
  setLoading: (loading: boolean) => void
  setError: (error: string | null) => void
  clearError: () => void
  
  // Utilities
  initialized: boolean
  setInitialized: (initialized: boolean) => void
}

// Helper function for date handling
const ensureDate = (timestamp: Date | string | null | undefined): Date => {
  if (!timestamp) {
    return new Date();
  }
  if (timestamp instanceof Date) {
    return timestamp;
  }
  try {
    const date = new Date(timestamp);
    if (isNaN(date.getTime())) {
      console.warn('Invalid timestamp, using current date:', timestamp);
      return new Date();
    }
    return date;
  } catch (error) {
    console.warn('Error parsing timestamp, using current date:', timestamp, error);
    return new Date();
  }
};

// Helper function to convert conversation data
const convertConversation = (conversation: any): Conversation => ({
  ...conversation,
  created_at: ensureDate(conversation.created_at),
  updated_at: ensureDate(conversation.updated_at),
});

// Helper function to convert message data
const convertMessage = (message: any): Message => ({
  ...message,
  created_at: ensureDate(message.created_at),
  updated_at: ensureDate(message.updated_at),
});

export const useChatStore = create<ChatStore>()((set, get) => ({
  // Initial state
  conversations: [],
  currentConversation: null,
  messages: [],
  isLoading: false,
  error: null,
  initialized: false,

  // Conversation management
  fetchConversations: async () => {
    try {
      set({ isLoading: true, error: null })
      
      const { data: conversations, error } = await supabase
        .from('conversations')
        .select('*')
        .order('updated_at', { ascending: false })
      
      if (error) throw error
      
      // Convert timestamps to Date objects
      const convertedConversations = (conversations || []).map(convertConversation)
      
      set({ conversations: convertedConversations, isLoading: false })
    } catch (error) {
      console.error('Failed to fetch conversations:', error)
      set({ 
        error: error instanceof Error ? error.message : 'Failed to fetch conversations',
        isLoading: false 
      })
    }
  },

  createConversation: async (title: string) => {
    try {
      set({ isLoading: true, error: null })
      
      const { data: conversation, error } = await supabase
        .from('conversations')
        .insert([{ 
          title, 
          user_id: 'anonymous' // For demo purposes, you can update this with actual user ID
        }])
        .select()
        .single()
      
      if (error) throw error
      
      // Convert timestamps to Date objects
      const convertedConversation = convertConversation(conversation)
      
      set((state) => ({ 
        conversations: [convertedConversation, ...state.conversations],
        isLoading: false 
      }))
      
      return convertedConversation
    } catch (error) {
      console.error('Failed to create conversation:', error)
      set({ 
        error: error instanceof Error ? error.message : 'Failed to create conversation',
        isLoading: false 
      })
      throw error
    }
  },

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
  
  deleteConversation: async (id: string) => {
    try {
      set({ isLoading: true, error: null })
      
      const { error } = await supabase
        .from('conversations')
        .delete()
        .eq('id', id)
      
      if (error) throw error
      
      set((state) => ({
        conversations: state.conversations.filter((conv) => conv.id !== id),
        currentConversation: state.currentConversation?.id === id
          ? null
          : state.currentConversation,
        isLoading: false
      }))
    } catch (error) {
      console.error('Failed to delete conversation:', error)
      set({ 
        error: error instanceof Error ? error.message : 'Failed to delete conversation',
        isLoading: false 
      })
      throw error
    }
  },
  
  setCurrentConversation: (conversation) => set({ currentConversation: conversation }),
  
  // Message management
  fetchMessages: async (conversationId: string) => {
    try {
      set({ isLoading: true, error: null })
      
      const { data: messages, error } = await supabase
        .from('messages')
        .select('*')
        .eq('conversation_id', conversationId)
        .order('created_at', { ascending: true })
      
      if (error) throw error
      
      // Convert timestamps to Date objects
      const convertedMessages = (messages || []).map(convertMessage)
      
      set({ messages: convertedMessages, isLoading: false })
      return convertedMessages
    } catch (error) {
      console.error('Failed to fetch messages:', error)
      set({ 
        error: error instanceof Error ? error.message : 'Failed to fetch messages',
        isLoading: false 
      })
      return []
    }
  },
  
  setMessages: (messages) => set({ messages }),
  
  addMessage: async (message: Message) => {
    try {
      const { data: newMessage, error } = await supabase
        .from('messages')
        .insert([message])
        .select()
        .single()
      
      if (error) throw error
      
      // Convert timestamps to Date objects
      const convertedMessage = convertMessage(newMessage)
      
      set((state) => ({ messages: [...state.messages, convertedMessage] }))
      return convertedMessage
    } catch (error) {
      console.error('Failed to add message:', error)
      set({ 
        error: error instanceof Error ? error.message : 'Failed to add message'
      })
      throw error
    }
  },
  
  updateMessage: (id, updates) =>
    set((state) => ({
      messages: state.messages.map((msg) =>
        msg.id === id ? { ...msg, ...updates } : msg
      ),
    })),
  
  // State management
  setLoading: (isLoading) => set({ isLoading }),
  
  setError: (error) => set({ error }),
  
  clearError: () => set({ error: null }),
  
  // Utilities
  setInitialized: (initialized) => set({ initialized }),
}))

// Export the helper function for use in components
export { ensureDate }; 