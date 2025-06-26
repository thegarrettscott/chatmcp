import {
  Entity,
  PrimaryColumn,
  Column,
  CreateDateColumn,
  UpdateDateColumn,
  OneToMany,
} from 'typeorm';

@Entity('conversations')
export class Conversation {
  @PrimaryColumn('uuid')
  id: string;

  @Column({ type: 'varchar', length: 255 })
  title: string;

  @Column({ name: 'user_id', type: 'varchar', length: 255 })
  userId: string;

  @CreateDateColumn({ name: 'created_at' })
  createdAt: Date;

  @UpdateDateColumn({ name: 'updated_at' })
  updatedAt: Date;

  @Column({
    name: 'embedding',
    type: 'text',
    nullable: true,
    comment: 'OpenAI embedding for conversation search (stored as JSON)',
  })
  embedding?: string;

  @OneToMany('Message', 'conversation')
  messages: any[];
} 