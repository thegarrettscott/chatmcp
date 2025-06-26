import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { AgentController } from './agent.controller';
import { AgentService } from './agent.service';
import { OpenAIService } from './openai.service';
import { McpService } from './mcp.service';
import { Conversation } from '../entities/conversation.entity';
import { Message } from '../entities/message.entity';
import { RedisModule } from '../redis/redis.module';

@Module({
  imports: [
    TypeOrmModule.forFeature([Conversation, Message]),
    RedisModule,
  ],
  controllers: [AgentController],
  providers: [AgentService, OpenAIService, McpService],
  exports: [AgentService, OpenAIService, McpService],
})
export class AgentModule {} 