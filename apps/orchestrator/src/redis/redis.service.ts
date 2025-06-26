import { Injectable, Logger } from '@nestjs/common';
import { Redis } from 'ioredis';

@Injectable()
export class RedisService {
  private readonly logger = new Logger(RedisService.name);
  private readonly redis: Redis;

  constructor() {
    this.redis = new Redis(process.env.REDIS_URL || 'redis://localhost:6379');
    
    this.redis.on('connect', () => {
      this.logger.log('Connected to Redis');
    });

    this.redis.on('error', (error) => {
      this.logger.error('Redis connection error:', error);
    });
  }

  async getUserTools(userId: string): Promise<any[]> {
    try {
      const toolsKey = `user:${userId}:tools`;
      const tools = await this.redis.get(toolsKey);
      
      if (tools) {
        return JSON.parse(tools);
      }
      
      // Return default tools if none configured
      return [
        {
          type: 'function',
          function: {
            name: 'get_weather',
            description: 'Get current weather information for a location',
            parameters: {
              type: 'object',
              properties: {
                location: {
                  type: 'string',
                  description: 'The city and state, e.g. San Francisco, CA',
                },
                units: {
                  type: 'string',
                  enum: ['celsius', 'fahrenheit'],
                  description: 'The temperature unit to use',
                },
              },
              required: ['location'],
            },
          },
        },
      ];
    } catch (error) {
      this.logger.error('Failed to get user tools:', error);
      return [];
    }
  }

  async setUserTools(userId: string, tools: any[]): Promise<void> {
    try {
      const toolsKey = `user:${userId}:tools`;
      await this.redis.set(toolsKey, JSON.stringify(tools));
      this.logger.log(`Updated tools for user: ${userId}`);
    } catch (error) {
      this.logger.error('Failed to set user tools:', error);
    }
  }

  async setResponseId(conversationId: string, responseId: string): Promise<void> {
    try {
      const key = `response:${responseId}`;
      await this.redis.set(key, conversationId, 'EX', 3600); // Expire in 1 hour
    } catch (error) {
      this.logger.error('Failed to set response ID:', error);
    }
  }

  async getConversationId(responseId: string): Promise<string | null> {
    try {
      const key = `response:${responseId}`;
      return await this.redis.get(key);
    } catch (error) {
      this.logger.error('Failed to get conversation ID:', error);
      return null;
    }
  }

  async cacheResponse(key: string, data: any, ttl: number = 3600): Promise<void> {
    try {
      await this.redis.set(key, JSON.stringify(data), 'EX', ttl);
    } catch (error) {
      this.logger.error('Failed to cache response:', error);
    }
  }

  async getCachedResponse(key: string): Promise<any | null> {
    try {
      const data = await this.redis.get(key);
      return data ? JSON.parse(data) : null;
    } catch (error) {
      this.logger.error('Failed to get cached response:', error);
      return null;
    }
  }

  async deleteKey(key: string): Promise<void> {
    try {
      await this.redis.del(key);
    } catch (error) {
      this.logger.error('Failed to delete key:', error);
    }
  }

  async onModuleDestroy() {
    await this.redis.disconnect();
  }
} 