import { Injectable, Logger, Inject } from '@nestjs/common';
import { SupabaseClient } from '@supabase/supabase-js';
import { RedisService } from '../redis/redis.service';
import { CreateAgentRequestDto } from './dto/create-agent-request.dto';
import { OpenAIService } from './openai.service';
import { McpService } from './mcp.service';
import { v4 as uuidv4 } from 'uuid';
import { Response } from 'express';

@Injectable()
export class AgentService {
  private readonly logger = new Logger(AgentService.name);

  constructor(
    @Inject('SUPABASE_CLIENT')
    private supabase: SupabaseClient,
    private readonly redisService: RedisService,
    private readonly openaiService: OpenAIService,
    private readonly mcpService: McpService,
  ) {}

  async createAgent(createAgentRequest: CreateAgentRequestDto, userId: string) {
    try {
      this.logger.log(`Creating agent for user: ${userId}`);
      
      // Generate a unique response ID
      const responseId = uuidv4();
      
      // Store the user's prompt in Redis for streaming
      await this.redisService.setUserPrompt(responseId, createAgentRequest.prompt);
      
      // Create initial conversation record (simplified)
      const conversation = {
        id: uuidv4(),
        title: createAgentRequest.prompt.substring(0, 50) + '...',
        userId,
        createdAt: new Date(),
        updatedAt: new Date(),
      };

      this.logger.log(`Agent created with response ID: ${responseId}`);
      
      return {
        responseId,
        conversationId: conversation.id,
        status: 'processing',
        message: 'Agent is processing your request with o3 model',
      };
    } catch (error) {
      this.logger.error('Failed to create agent:', error);
      throw error;
    }
  }

  async streamAgent(responseId: string, userId: string, res: Response) {
    try {
      this.logger.log(`Starting stream for response: ${responseId}`);
      
      // Get the user's original prompt
      const userPrompt = await this.redisService.getUserPrompt(responseId);
      this.logger.log(`Retrieved user prompt: ${userPrompt}`);
      
      // Get the best available model (o3)
      const model = await this.openaiService.getBestAvailableModel();

      // Create OpenAI response with o3 using the actual user prompt
      const response = await this.openaiService.createResponse({
        model,
        input: [userPrompt],
        tools: [], // No tools for now - direct streaming
        reasoning: { effort: 'low', summary: 'auto' },
        stream: true,
      });

      if (response.stream) {
        // Stream the response
        for await (const chunk of response.stream) {
          if (chunk.choices && chunk.choices[0]?.delta?.content) {
            const data = {
              type: 'content',
              content: chunk.choices[0].delta.content,
              timestamp: new Date().toISOString(),
            };
            
            res.write(`data: ${JSON.stringify(data)}\n\n`);
          }
        }
      }

      // Send completion signal
      res.write(`data: ${JSON.stringify({ type: 'done', timestamp: new Date().toISOString() })}\n\n`);
      res.end();

    } catch (error) {
      this.logger.error('Stream error:', error);
      res.write(`data: ${JSON.stringify({ 
        type: 'error', 
        error: error.message,
        timestamp: new Date().toISOString() 
      })}\n\n`);
      res.end();
    }
  }

  // Simple test method for o3 model
  async testO3WithMCP(prompt: string, userId: string) {
    try {
      this.logger.log(`Testing o3 model with prompt: ${prompt}`);
      
      // Test the o3 model (no tools for now)
      const model = await this.openaiService.getBestAvailableModel();
      
      const response = await this.openaiService.createResponse({
        model,
        input: [prompt],
        tools: [], // No tools for now
        reasoning: { effort: 'low', summary: 'auto' },
        stream: false,
      });

      return {
        model,
        response: response.content || 'Test completed successfully',
        tools_available: 0,
        mcp_enabled: false, // Disabled for now
        timestamp: new Date().toISOString(),
      };
    } catch (error) {
      this.logger.error('o3 test failed:', error);
      throw error;
    }
  }
} 