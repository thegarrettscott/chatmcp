import { Module } from '@nestjs/common';
import { AgentController } from './agent.controller';
import { AgentService } from './agent.service';
import { OpenAIService } from './openai.service';
import { McpService } from './mcp.service';
import { RedisModule } from '../redis/redis.module';

@Module({
  imports: [
    RedisModule,
  ],
  controllers: [AgentController],
  providers: [AgentService, OpenAIService, McpService],
  exports: [AgentService, OpenAIService, McpService],
})
export class AgentModule {} 