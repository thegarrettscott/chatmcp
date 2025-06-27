import { Injectable, NotFoundException, Inject } from '@nestjs/common';
import { SupabaseClient } from '@supabase/supabase-js';

export interface CreateConversationDto {
  title: string;
  userId?: string;
}

export interface CreateMessageDto {
  conversationId: string;
  role: 'user' | 'assistant' | 'system';
  content: string;
  reasoning?: {
    summary: string;
    effort: string;
  };
  functionCalls?: any[];
  functionOutputs?: any[];
}

export interface ConversationWithLastMessage {
  id: string;
  title: string;
  userId: string;
  createdAt: Date;
  updatedAt: Date;
  lastMessage: string;
  timestamp: Date;
}

@Injectable()
export class ConversationService {
  constructor(
    @Inject('SUPABASE_CLIENT')
    private supabase: SupabaseClient,
  ) {}

  async findAll(userId?: string): Promise<ConversationWithLastMessage[]> {
    let query = this.supabase
      .from('conversations')
      .select(`
        *,
        messages(content, created_at)
      `)
      .order('updated_at', { ascending: false });

    if (userId) {
      query = query.eq('user_id', userId);
    }

    const { data: conversations, error } = await query;

    if (error) {
      throw new Error(`Failed to fetch conversations: ${error.message}`);
    }

    return conversations?.map(conversation => ({
      id: conversation.id,
      title: conversation.title,
      userId: conversation.user_id,
      createdAt: new Date(conversation.created_at),
      updatedAt: new Date(conversation.updated_at),
      lastMessage: conversation.messages?.length > 0 
        ? conversation.messages[conversation.messages.length - 1].content 
        : '',
      timestamp: new Date(conversation.updated_at),
    })) || [];
  }

  async findOne(id: string, userId?: string): Promise<ConversationWithLastMessage> {
    let query = this.supabase
      .from('conversations')
      .select(`
        *,
        messages(content, created_at)
      `)
      .eq('id', id);

    if (userId) {
      query = query.eq('user_id', userId);
    }

    const { data: conversations, error } = await query.single();

    if (error || !conversations) {
      throw new NotFoundException('Conversation not found');
    }

    return {
      id: conversations.id,
      title: conversations.title,
      userId: conversations.user_id,
      createdAt: new Date(conversations.created_at),
      updatedAt: new Date(conversations.updated_at),
      lastMessage: conversations.messages?.length > 0 
        ? conversations.messages[conversations.messages.length - 1].content 
        : '',
      timestamp: new Date(conversations.updated_at),
    };
  }

  async create(createConversationDto: CreateConversationDto): Promise<ConversationWithLastMessage> {
    const { data: conversation, error } = await this.supabase
      .from('conversations')
      .insert({
        title: createConversationDto.title,
        user_id: createConversationDto.userId || 'anonymous',
      })
      .select()
      .single();

    if (error || !conversation) {
      throw new Error(`Failed to create conversation: ${error?.message}`);
    }

    return {
      id: conversation.id,
      title: conversation.title,
      userId: conversation.user_id,
      createdAt: new Date(conversation.created_at),
      updatedAt: new Date(conversation.updated_at),
      lastMessage: '',
      timestamp: new Date(conversation.updated_at),
    };
  }

  async update(id: string, updates: any, userId?: string): Promise<ConversationWithLastMessage> {
    // First verify access
    await this.findOne(id, userId);

    const { data: conversation, error } = await this.supabase
      .from('conversations')
      .update(updates)
      .eq('id', id)
      .select()
      .single();

    if (error || !conversation) {
      throw new Error(`Failed to update conversation: ${error?.message}`);
    }

    return {
      id: conversation.id,
      title: conversation.title,
      userId: conversation.user_id,
      createdAt: new Date(conversation.created_at),
      updatedAt: new Date(conversation.updated_at),
      lastMessage: '',
      timestamp: new Date(conversation.updated_at),
    };
  }

  async remove(id: string, userId?: string): Promise<void> {
    // First verify access
    await this.findOne(id, userId);

    const { error } = await this.supabase
      .from('conversations')
      .delete()
      .eq('id', id);

    if (error) {
      throw new Error(`Failed to delete conversation: ${error.message}`);
    }
  }

  // Message operations
  async getMessages(conversationId: string, userId?: string): Promise<any[]> {
    // First verify the conversation exists and user has access
    await this.findOne(conversationId, userId);

    const { data: messages, error } = await this.supabase
      .from('messages')
      .select('*')
      .eq('conversation_id', conversationId)
      .order('created_at', { ascending: true });

    if (error) {
      throw new Error(`Failed to fetch messages: ${error.message}`);
    }

    return messages || [];
  }

  async createMessage(createMessageDto: CreateMessageDto): Promise<any> {
    const { data: message, error } = await this.supabase
      .from('messages')
      .insert({
        conversation_id: createMessageDto.conversationId,
        role: createMessageDto.role,
        content: createMessageDto.content,
        reasoning: createMessageDto.reasoning,
        function_calls: createMessageDto.functionCalls,
        function_outputs: createMessageDto.functionOutputs,
      })
      .select()
      .single();

    if (error || !message) {
      throw new Error(`Failed to create message: ${error?.message}`);
    }

    // Update conversation's updated_at timestamp
    await this.supabase
      .from('conversations')
      .update({ updated_at: new Date() })
      .eq('id', createMessageDto.conversationId);

    return message;
  }

  async updateMessage(id: string, updates: any): Promise<any> {
    const { data: message, error } = await this.supabase
      .from('messages')
      .update(updates)
      .eq('id', id)
      .select()
      .single();

    if (error || !message) {
      throw new NotFoundException('Message not found');
    }

    return message;
  }
} 