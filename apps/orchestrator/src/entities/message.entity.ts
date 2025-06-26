import {
  Entity,
  PrimaryColumn,
  Column,
  CreateDateColumn,
  ManyToOne,
  JoinColumn,
} from 'typeorm';
import { Conversation } from './conversation.entity';

@Entity('messages')
export class Message {
  @PrimaryColumn('uuid')
  id: string;

  @Column({ name: 'conversation_id', type: 'uuid' })
  conversationId: string;

  @Column({
    type: 'varchar',
    length: 50,
    enum: ['user', 'assistant', 'system'],
  })
  role: 'user' | 'assistant' | 'system';

  @Column({ type: 'text' })
  content: string;

  @CreateDateColumn({ name: 'created_at' })
  createdAt: Date;

  @Column({
    type: 'jsonb',
    nullable: true,
    comment: 'Reasoning data from o3 model',
  })
  reasoning?: {
    summary?: string;
    effort?: string;
  };

  @Column({
    type: 'jsonb',
    nullable: true,
    comment: 'Function call data',
  })
  functionCalls?: any[];

  @Column({
    type: 'jsonb',
    nullable: true,
    comment: 'Function output data',
  })
  functionOutputs?: any[];

  @ManyToOne(() => Conversation, (conversation) => conversation.messages, {
    onDelete: 'CASCADE',
  })
  @JoinColumn({ name: 'conversation_id' })
  conversation: Conversation;
} 