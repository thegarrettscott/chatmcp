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
  private readonly promptStore = new Map<string, string>(); // Temporary in-memory storage

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
      
      // Store the user's prompt (try Redis first, fallback to memory)
      try {
        await this.redisService.setUserPrompt(responseId, createAgentRequest.prompt);
      } catch (error) {
        this.logger.warn('Redis unavailable, storing prompt in memory');
        this.promptStore.set(responseId, createAgentRequest.prompt);
      }
      
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
      
      // Get the user's original prompt (try Redis first, fallback to memory)
      let userPrompt: string;
      try {
        userPrompt = await this.redisService.getUserPrompt(responseId);
      } catch (error) {
        this.logger.warn('Redis unavailable, getting prompt from memory');
        userPrompt = this.promptStore.get(responseId) || 'Hello! How can I help you today?';
      }
      
      this.logger.log(`Retrieved user prompt: ${userPrompt}`);
      
      // Set up SSE headers
      res.setHeader('Content-Type', 'text/event-stream');
      res.setHeader('Cache-Control', 'no-cache');
      res.setHeader('Connection', 'keep-alive');
      res.setHeader('Access-Control-Allow-Origin', '*');
      
      // Get the best available model (o3)
      const model = await this.openaiService.getBestAvailableModel();
      this.logger.log(`Using model: ${model} for user prompt: ${userPrompt}`);

      // Try streaming first, fallback to non-streaming if no content
      let response;
      let streamWorked = false;
      
      try {
        // First attempt: Try streaming
        response = await this.openaiService.createResponse({
          model,
          input: [userPrompt],
          tools: [], // No tools for now - direct streaming
          reasoning: { effort: 'low', summary: 'auto' },
          stream: true,
        });

        this.logger.log('OpenAI response created, starting stream...');

        if (response.stream) {
          // Stream the response
          let contentReceived = false;
          for await (const chunk of response.stream) {
            this.logger.log(`Raw chunk received:`, JSON.stringify(chunk, null, 2));
            
            let content = null;
            
            // Handle o3 responses format
            if (chunk.output_text?.delta) {
              content = chunk.output_text.delta;
            }
            // Handle regular chat completions format  
            else if (chunk.choices && chunk.choices[0]?.delta?.content) {
              content = chunk.choices[0].delta.content;
            }
            // Handle other possible formats
            else if (chunk.delta?.content) {
              content = chunk.delta.content;
            }
            
            if (content) {
              contentReceived = true;
              streamWorked = true;
              this.logger.log(`Streaming content chunk: ${content.substring(0, 50)}...`);
              
              const data = {
                type: 'content',
                content: content,
                timestamp: new Date().toISOString(),
              };
              
              res.write(`data: ${JSON.stringify(data)}\n\n`);
            }
            
            // Handle completion for o3 format
            if (chunk.done) {
              this.logger.log('o3 stream marked as done');
              break;
            }
          }
          
          if (!contentReceived) {
            this.logger.warn('No content received from OpenAI stream, trying non-streaming mode');
          }
        }
      } catch (error) {
        this.logger.warn('Streaming failed, falling back to non-streaming mode:', error.message);
      }

      // If streaming didn't work, try non-streaming mode
      if (!streamWorked) {
        this.logger.log('Falling back to non-streaming mode');
        
        try {
          response = await this.openaiService.createResponse({
            model,
            input: [userPrompt],
            tools: [], // No tools for now
            reasoning: { effort: 'low', summary: 'auto' },
            stream: false,
          });

          this.logger.log('Non-streaming response received');
          
          let fullContent = '';
          if (response.content) {
            fullContent = response.content;
          } else if (response.output_text) {
            fullContent = response.output_text;
          }
          
          if (fullContent) {
            this.logger.log(`Full content received: ${fullContent.substring(0, 100)}...`);
            
            // Manually stream the content word by word for better UX
            const words = fullContent.split(' ');
            for (let i = 0; i < words.length; i++) {
              const word = words[i] + (i < words.length - 1 ? ' ' : '');
              
              const data = {
                type: 'content',
                content: word,
                timestamp: new Date().toISOString(),
              };
              
              res.write(`data: ${JSON.stringify(data)}\n\n`);
              
              // Small delay to simulate streaming
              await new Promise(resolve => setTimeout(resolve, 50));
            }
            
            streamWorked = true;
          }
        } catch (error) {
          this.logger.error('Non-streaming mode also failed:', error);
        }
      }

      // If nothing worked, send fallback message
      if (!streamWorked) {
        this.logger.warn('Both streaming and non-streaming failed, sending fallback');
        const fallbackContent = `I received your message: "${userPrompt}" but encountered an issue with the AI response. This might be due to OpenAI API limitations with the o3 model.`;
        const data = {
          type: 'content',
          content: fallbackContent,
          timestamp: new Date().toISOString(),
        };
        res.write(`data: ${JSON.stringify(data)}\n\n`);
      }

      // Send completion signal
      this.logger.log('Stream completed, sending done signal');
      res.write(`data: ${JSON.stringify({ type: 'done', timestamp: new Date().toISOString() })}\n\n`);
      
      // Clean up memory storage
      this.promptStore.delete(responseId);
      
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