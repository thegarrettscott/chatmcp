import { Entity, PrimaryGeneratedColumn, Column, OneToMany, CreateDateColumn, UpdateDateColumn } from 'typeorm';
import { Message } from './message.entity';

@Entity('conversations')
export class Conversation {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @Column({ type: 'varchar', length: 255 })
  title: string;

  @Column({ name: 'user_id', type: 'varchar', length: 255 })
  userId: string;

  @CreateDateColumn({ name: 'created_at', type: 'timestamp with time zone' })
  createdAt: Date;

  @UpdateDateColumn({ name: 'updated_at', type: 'timestamp with time zone' })
  updatedAt: Date;

  @Column({
    name: 'embedding',
    type: 'text',
    nullable: true,
    comment: 'OpenAI embedding for conversation search (stored as JSON)',
  })
  embedding?: string;

  @OneToMany(() => Message, (message) => message.conversation, { cascade: true })
  messages?: Message[];

  // Virtual properties for API response
  lastMessage?: string;
  timestamp?: Date;
} 