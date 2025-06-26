export interface Conversation {
  id: string;
  title: string;
  lastMessage: string;
  timestamp: Date;
  createdAt: string;
  updatedAt: string;
  userId: string;
}

export interface Message {
  id: string;
  conversationId: string;
  role: 'user' | 'assistant' | 'system';
  content: string;
  createdAt: string;
  reasoning?: {
    summary: string;
    effort: string;
  };
  functionCalls?: FunctionCall[];
  functionOutputs?: FunctionOutput[];
}

export interface FunctionCall {
  id: string;
  name: string;
  arguments: Record<string, any>;
  status: 'pending' | 'running' | 'completed' | 'failed';
}

export interface FunctionOutput {
  id: string;
  functionCallId: string;
  output: any;
  error?: string;
}

export interface Tool {
  id: string;
  name: string;
  description: string;
  url: string;
  schema: any;
  enabled: boolean;
}

export interface User {
  sub: string;
  email: string;
  name: string;
  picture?: string;
}

export interface ChatState {
  conversations: Conversation[];
  currentConversation: Conversation | null;
  messages: Message[];
  isLoading: boolean;
  error: string | null;
}

export interface ToolState {
  tools: Tool[];
  isLoading: boolean;
  error: string | null;
} 