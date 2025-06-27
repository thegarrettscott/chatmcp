import { Module } from '@nestjs/common';
import { ConfigModule } from '@nestjs/config';
// import { TypeOrmModule } from '@nestjs/typeorm';
import { ScheduleModule } from '@nestjs/schedule';
import { TerminusModule } from '@nestjs/terminus';
// import { AgentModule } from './agent/agent.module';
import { DatabaseModule } from './database/database.module';
import { RedisModule } from './redis/redis.module';
import { AuthModule } from './auth/auth.module';
import { HealthController } from './health/health.controller';
// import { ConversationModule } from './conversation/conversation.module';
import { SupabaseModule } from './supabase/supabase.module';

@Module({
  imports: [
    ConfigModule.forRoot({
      isGlobal: true,
      envFilePath: ['.env.local', '.env'],
    }),
    // TypeOrmModule.forRoot({
    //   type: 'postgres',
    //   url: process.env.DATABASE_URL,
    //   entities: [__dirname + '/**/*.entity{.ts,.js}'],
    //   synchronize: process.env.NODE_ENV !== 'production',
    //   logging: process.env.NODE_ENV === 'development',
    //   ssl: {
    //     rejectUnauthorized: false,
    //   },
    //   extra: {
    //     connectionTimeoutMillis: 10000,
    //     queryTimeoutMillis: 10000,
    //     max: 1,
    //   },
    //   retryAttempts: 3,
    //   retryDelay: 3000,
    // }),
    ScheduleModule.forRoot(),
    TerminusModule,
    DatabaseModule,
    RedisModule,
    AuthModule,
    // AgentModule,
    // ConversationModule,
    SupabaseModule,
  ],
  controllers: [HealthController],
})
export class AppModule {} 