import { Injectable, Logger } from '@nestjs/common';
import OpenAI from 'openai';

interface CreateResponseRequest {
  model: string;
  input: string[];
  tools?: any[];
  reasoning?: {
    effort: 'low' | 'medium' | 'high';
    summary: 'auto' | 'none';
  };
  stream?: boolean;
}

interface ResponseChunk {
  output_text?: {
    delta?: string;
    content?: string;
  };
  function_call?: {
    name: string;
    arguments: string;
  };
  reasoning?: {
    summary?: string;
    effort?: string;
  };
  done?: boolean;
}

@Injectable()
export class OpenAIService {
  private readonly logger = new Logger(OpenAIService.name);
  private readonly openai: OpenAI;

  constructor() {
    this.openai = new OpenAI({
      apiKey: process.env.OPENAI_API_KEY,
    });
  }

  async createResponse(request: CreateResponseRequest) {
    try {
      this.logger.log(`Creating OpenAI response with model: ${request.model}`);
      
      // Use /responses endpoint for o3 reasoning models with MCP integration
      if (request.model === 'o3' || request.model === 'o3-mini' || request.model === 'o4-mini') {
        // Convert function tools to MCP format for o3
        const mcpTools = request.tools?.map(tool => {
          if (tool.type === 'function') {
            return {
              type: 'mcp',
              server_label: tool.function?.name || 'example_tool',
              server_url: process.env.EXAMPLE_TOOL_URL || 'http://localhost:5001',
              require_approval: 'never'
            };
          }
          return tool;
        }) || [];

        const response = await (this.openai as any).responses.create({
          model: request.model,
          input: [
            {
              role: 'user',
              content: [
                {
                  type: 'input_text',
                  text: request.input.join('\n'),
                }
              ]
            }
          ],
          tools: mcpTools,
          stream: request.stream || false,
          reasoning: {
            effort: request.reasoning?.effort || 'low',
          },
          max_output_tokens: 4096,
        });

        if (request.stream) {
          return {
            id: response.id,
            stream: response,
          };
        } else {
          return {
            id: response.id,
            content: response.output_text || '',
            reasoning: response.reasoning || null,
          };
        }
      } else {
        // Use traditional chat completions for other models
        if (request.stream) {
          const response = await this.openai.chat.completions.create({
            model: request.model,
            messages: [
              {
                role: 'user',
                content: request.input.join('\n'),
              },
            ],
            tools: request.tools,
            stream: true,
          });

          return {
            id: `response_${Date.now()}`,
            stream: response,
          };
        } else {
          const response = await this.openai.chat.completions.create({
            model: request.model,
            messages: [
              {
                role: 'user',
                content: request.input.join('\n'),
              },
            ],
            tools: request.tools,
            stream: false,
          });

          return {
            id: `response_${Date.now()}`,
            content: response.choices[0]?.message?.content || '',
            reasoning: null,
          };
        }
      }
    } catch (error) {
      this.logger.error('Failed to create OpenAI response:', error);
      throw new Error(`OpenAI API error: ${error.message}`);
    }
  }

  async *streamResponse(responseId: string): AsyncGenerator<ResponseChunk> {
    try {
      this.logger.log(`Streaming response: ${responseId}`);
      
      // For now, return a simple completion message
      // In a real implementation, you would either:
      // 1. Store the stream from the original request and replay it
      // 2. Use the OpenAI responses.retrieve() method if available
      // 3. Stream from a different source based on the responseId
      
      const message = "I apologize, but I'm having trouble connecting to the AI service right now. This is a simulated response.";
      
      // Split the message into chunks for streaming effect
      const words = message.split(' ');
      for (let i = 0; i < words.length; i++) {
        const chunk = words[i] + (i < words.length - 1 ? ' ' : '');
        yield {
          output_text: {
            delta: chunk,
          },
        };
        
        // Add delay to simulate real streaming
        await new Promise(resolve => setTimeout(resolve, 50));
      }

      yield { done: true };
    } catch (error) {
      this.logger.error('Failed to stream response:', error);
      throw error;
    }
  }

  async continueWithFunctionOutput(
    responseId: string,
    functionCall: any,
    functionResult: any,
  ) {
    try {
      this.logger.log(`Continuing response ${responseId} with function output`);
      
      // Create a follow-up completion with the function result
      const response = await this.openai.chat.completions.create({
        model: 'o3',
        messages: [
          {
            role: 'assistant',
            content: null,
            function_call: functionCall,
          },
          {
            role: 'function',
            name: functionCall.name,
            content: JSON.stringify(functionResult),
          },
        ],
        stream: false,
      });

      return {
        output_text: {
          content: response.choices[0]?.message?.content || '',
        },
      };
    } catch (error) {
      this.logger.error('Failed to continue with function output:', error);
      throw error;
    }
  }

  // Helper method to validate o3 model availability
  async validateO3Model(): Promise<boolean> {
    try {
      // Try to make a simple request to the responses endpoint to validate o3 access
      const testResponse = await (this.openai as any).responses.create({
        model: 'o3',
        input: 'Hello',
        max_output_tokens: 10,
        store: false, // Don't store this test request
      });
      
      this.logger.log('o3 model validation successful');
      return true;
    } catch (error) {
      this.logger.warn('o3 model not available, will use fallback:', error.message);
      return false;
    }
  }

  // Get the best available model
  async getBestAvailableModel(): Promise<string> {
    // For now, assume o3 is available since it's configured in production
    // In production, you might want to cache this validation result
    const hasValidApiKey = !!process.env.OPENAI_API_KEY;
    
    if (hasValidApiKey) {
      this.logger.log('Using standard o3 model for reasoning and MCP tasks');
      return 'o3'; // Uses standard o3 model with MCP tools via responses endpoint
    } else {
      this.logger.warn('No OpenAI API key configured, falling back to gpt-4-turbo-preview');
      return 'gpt-4-turbo-preview';
    }
  }
} 