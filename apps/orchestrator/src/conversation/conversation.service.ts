import { Injectable, NotFoundException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { Conversation } from '../entities/conversation.entity';
import { Message } from '../entities/message.entity';

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
}

export interface ConversationWithLastMessage extends Conversation {
  lastMessage: string;
  timestamp: Date;
}

@Injectable()
export class ConversationService {
  constructor(
    @InjectRepository(Conversation)
    private conversationRepository: Repository<Conversation>,
    @InjectRepository(Message)
    private messageRepository: Repository<Message>,
  ) {}

  async findAll(userId?: string): Promise<ConversationWithLastMessage[]> {
    const queryBuilder = this.conversationRepository
      .createQueryBuilder('conversation')
      .leftJoinAndSelect('conversation.messages', 'message')
      .orderBy('conversation.updatedAt', 'DESC');

    if (userId) {
      queryBuilder.where('conversation.userId = :userId', { userId });
    }

    const conversations = await queryBuilder.getMany();

    // Add lastMessage to each conversation
    return conversations.map(conversation => {
      const lastMessage = conversation.messages?.length > 0 
        ? conversation.messages[conversation.messages.length - 1]
        : null;

      return {
        ...conversation,
        lastMessage: lastMessage?.content || '',
        timestamp: conversation.updatedAt,
      } as ConversationWithLastMessage;
    });
  }

  async findOne(id: string, userId?: string): Promise<ConversationWithLastMessage> {
    const queryBuilder = this.conversationRepository
      .createQueryBuilder('conversation')
      .leftJoinAndSelect('conversation.messages', 'message')
      .where('conversation.id = :id', { id });

    if (userId) {
      queryBuilder.andWhere('conversation.userId = :userId', { userId });
    }

    const conversation = await queryBuilder.getOne();

    if (!conversation) {
      throw new NotFoundException('Conversation not found');
    }

    return {
      ...conversation,
      lastMessage: conversation.messages?.length > 0 
        ? conversation.messages[conversation.messages.length - 1].content
        : '',
      timestamp: conversation.updatedAt,
    } as ConversationWithLastMessage;
  }

  async create(createConversationDto: CreateConversationDto): Promise<ConversationWithLastMessage> {
    const conversation = this.conversationRepository.create({
      ...createConversationDto,
      userId: createConversationDto.userId || 'anonymous',
    });

    const savedConversation = await this.conversationRepository.save(conversation);
    
    return {
      ...savedConversation,
      lastMessage: '',
      timestamp: savedConversation.updatedAt,
    } as ConversationWithLastMessage;
  }

  async update(id: string, updates: Partial<Conversation>, userId?: string): Promise<ConversationWithLastMessage> {
    const conversation = await this.findOne(id, userId);
    
    // Update the base conversation properties
    const baseConversation = await this.conversationRepository.findOne({ where: { id } });
    if (!baseConversation) {
      throw new NotFoundException('Conversation not found');
    }
    
    Object.assign(baseConversation, updates);
    const updatedConversation = await this.conversationRepository.save(baseConversation);
    
    return {
      ...updatedConversation,
      lastMessage: conversation.lastMessage || '',
      timestamp: updatedConversation.updatedAt,
    } as ConversationWithLastMessage;
  }

  async remove(id: string, userId?: string): Promise<void> {
    const conversation = await this.conversationRepository.findOne({ where: { id } });
    if (!conversation) {
      throw new NotFoundException('Conversation not found');
    }
    
    if (userId && conversation.userId !== userId) {
      throw new NotFoundException('Conversation not found');
    }
    
    await this.conversationRepository.remove(conversation);
  }

  // Message operations
  async getMessages(conversationId: string, userId?: string): Promise<Message[]> {
    // First verify the conversation exists and user has access
    await this.findOne(conversationId, userId);

    return this.messageRepository.find({
      where: { conversationId },
      order: { createdAt: 'ASC' },
    });
  }

  async createMessage(createMessageDto: CreateMessageDto): Promise<Message> {
    const message = this.messageRepository.create(createMessageDto);
    const savedMessage = await this.messageRepository.save(message);

    // Update conversation's updatedAt timestamp
    await this.conversationRepository.update(
      createMessageDto.conversationId,
      { updatedAt: new Date() }
    );

    return savedMessage;
  }

  async updateMessage(id: string, updates: Partial<Message>): Promise<Message> {
    const message = await this.messageRepository.findOne({ where: { id } });
    
    if (!message) {
      throw new NotFoundException('Message not found');
    }

    Object.assign(message, updates);
    return this.messageRepository.save(message);
  }
} 