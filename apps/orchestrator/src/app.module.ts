import { Module } from '@nestjs/common';
import { ConfigModule } from '@nestjs/config';
import { ScheduleModule } from '@nestjs/schedule';
import { TerminusModule } from '@nestjs/terminus';
import { AgentModule } from './agent/agent.module';
import { DatabaseModule } from './database/database.module';
import { RedisModule } from './redis/redis.module';
import { AuthModule } from './auth/auth.module';
import { HealthController } from './health/health.controller';
import { ConversationModule } from './conversation/conversation.module';
import { SupabaseModule } from './supabase/supabase.module';
import { ToolsModule } from './tools/tools.module';

@Module({
  imports: [
    ConfigModule.forRoot({
      isGlobal: true,
      envFilePath: ['.env.local', '.env'],
    }),
    // Using Supabase instead of TypeORM
    ScheduleModule.forRoot(),
    TerminusModule,
    DatabaseModule,
    RedisModule,
    AuthModule,
    AgentModule,
    ConversationModule,
    SupabaseModule,
    ToolsModule,
  ],
  controllers: [HealthController],
})
export class AppModule {} 