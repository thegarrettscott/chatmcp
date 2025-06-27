import { Injectable, Logger } from '@nestjs/common';
import { Redis } from 'ioredis';

@Injectable()
export class RedisService {
  private readonly logger = new Logger(RedisService.name);
  private readonly redis: Redis | null = null;
  private redisEnabled: boolean;

  constructor() {
    // Only initialize Redis if REDIS_URL is provided
    if (process.env.REDIS_URL) {
      this.redis = new Redis(process.env.REDIS_URL);
      this.redisEnabled = true;
      
      this.redis.on('connect', () => {
        this.logger.log('Connected to Redis');
      });

      this.redis.on('error', (error) => {
        this.logger.warn('Redis connection error (continuing without Redis):', error);
        this.redisEnabled = false;
      });
    } else {
      this.logger.warn('No REDIS_URL provided, running without Redis');
      this.redisEnabled = false;
    }
  }

  async getUserTools(userId: string): Promise<any[]> {
    if (!this.redisEnabled || !this.redis) {
      // Return default tools if Redis is not available
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
    }

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
    if (!this.redisEnabled || !this.redis) {
      this.logger.warn('Redis not available, skipping setUserTools');
      return;
    }

    try {
      const toolsKey = `user:${userId}:tools`;
      await this.redis.set(toolsKey, JSON.stringify(tools));
      this.logger.log(`Updated tools for user: ${userId}`);
    } catch (error) {
      this.logger.error('Failed to set user tools:', error);
    }
  }

  async setResponseId(conversationId: string, responseId: string): Promise<void> {
    if (!this.redisEnabled || !this.redis) {
      this.logger.warn('Redis not available, skipping setResponseId');
      return;
    }

    try {
      const key = `response:${responseId}`;
      await this.redis.set(key, conversationId, 'EX', 3600); // Expire in 1 hour
    } catch (error) {
      this.logger.error('Failed to set response ID:', error);
    }
  }

  async getConversationId(responseId: string): Promise<string | null> {
    if (!this.redisEnabled || !this.redis) {
      this.logger.warn('Redis not available, returning null for getConversationId');
      return null;
    }

    try {
      const key = `response:${responseId}`;
      return await this.redis.get(key);
    } catch (error) {
      this.logger.error('Failed to get conversation ID:', error);
      return null;
    }
  }

  async cacheResponse(key: string, data: any, ttl: number = 3600): Promise<void> {
    if (!this.redisEnabled || !this.redis) {
      this.logger.warn('Redis not available, skipping cacheResponse');
      return;
    }

    try {
      await this.redis.set(key, JSON.stringify(data), 'EX', ttl);
    } catch (error) {
      this.logger.error('Failed to cache response:', error);
    }
  }

  async getCachedResponse(key: string): Promise<any | null> {
    if (!this.redisEnabled || !this.redis) {
      this.logger.warn('Redis not available, returning null for getCachedResponse');
      return null;
    }

    try {
      const data = await this.redis.get(key);
      return data ? JSON.parse(data) : null;
    } catch (error) {
      this.logger.error('Failed to get cached response:', error);
      return null;
    }
  }

  async deleteKey(key: string): Promise<void> {
    if (!this.redisEnabled || !this.redis) {
      this.logger.warn('Redis not available, skipping deleteKey');
      return;
    }

    try {
      await this.redis.del(key);
    } catch (error) {
      this.logger.error('Failed to delete key:', error);
    }
  }

  async setUserPrompt(responseId: string, prompt: string): Promise<void> {
    if (!this.redisEnabled || !this.redis) {
      this.logger.warn('Redis not available, skipping setUserPrompt');
      return;
    }

    try {
      const key = `prompt:${responseId}`;
      await this.redis.set(key, prompt, 'EX', 3600); // Expire in 1 hour
      this.logger.log(`Stored prompt for response: ${responseId}`);
    } catch (error) {
      this.logger.error('Failed to set user prompt:', error);
    }
  }

  async getUserPrompt(responseId: string): Promise<string | null> {
    if (!this.redisEnabled || !this.redis) {
      this.logger.warn('Redis not available, returning fallback prompt');
      return 'Hello! How can I help you today?'; // Fallback prompt
    }

    try {
      const key = `prompt:${responseId}`;
      const prompt = await this.redis.get(key);
      return prompt || 'Hello! How can I help you today?'; // Fallback if not found
    } catch (error) {
      this.logger.error('Failed to get user prompt:', error);
      return 'Hello! How can I help you today?'; // Fallback on error
    }
  }

  async onModuleDestroy() {
    if (this.redis) {
      await this.redis.disconnect();
    }
  }
} 