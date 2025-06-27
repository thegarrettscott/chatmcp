export interface Conversation {
  id: string;
  title: string;
  last_message?: string;
  created_at: Date | string;
  updated_at: Date | string;
  user_id: string;
}

export interface Message {
  id: string;
  conversation_id: string;
  role: 'user' | 'assistant' | 'system';
  content: string;
  created_at: Date | string;
  updated_at?: Date | string;
  reasoning?: {
    summary: string;
    effort: string;
  };
  function_calls?: FunctionCall[];
  function_outputs?: FunctionOutput[];
}

export interface FunctionCall {
  id: string;
  name: string;
  arguments: Record<string, any>;
  status: 'pending' | 'running' | 'completed' | 'failed';
}

export interface FunctionOutput {
  id: string;
  function_call_id: string;
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