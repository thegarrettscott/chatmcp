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
      
      // Handle streaming vs non-streaming separately
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
          // o3-specific parameters
          ...(request.model === 'o3' && {
            reasoning_effort: request.reasoning?.effort || 'low',
            reasoning_summary: request.reasoning?.summary || 'auto',
          }),
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
          // o3-specific parameters
          ...(request.model === 'o3' && {
            reasoning_effort: request.reasoning?.effort || 'low',
            reasoning_summary: request.reasoning?.summary || 'auto',
          }),
        });

        return {
          id: `response_${Date.now()}`,
          content: response.choices[0]?.message?.content || '',
          reasoning: (response.choices[0]?.message as any)?.reasoning || null,
        };
      }
    } catch (error) {
      this.logger.error('Failed to create OpenAI response:', error);
      throw new Error(`OpenAI API error: ${error.message}`);
    }
  }

  async *streamResponse(responseId: string): AsyncGenerator<ResponseChunk> {
    try {
      // This is a simplified implementation
      // In a real scenario, you would retrieve the actual stream based on responseId
      this.logger.log(`Streaming response: ${responseId}`);
      
      // Simulate streaming response for now
      const messages = [
        'I understand you\'re asking about ',
        'this topic. Let me think about it carefully.\n\n',
        'Based on my knowledge, I can provide you with ',
        'a comprehensive answer that covers the key points ',
        'you\'re interested in.\n\n',
        'Here\'s what I think: ',
        'This is a complex subject that requires careful consideration ',
        'of multiple factors and perspectives.',
      ];

      for (const message of messages) {
        yield {
          output_text: {
            delta: message,
          },
        };
        
        // Add delay to simulate real streaming
        await new Promise(resolve => setTimeout(resolve, 100));
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
      const models = await this.openai.models.list();
      const o3Available = models.data.some(model => model.id === 'o3');
      
      if (!o3Available) {
        this.logger.warn('o3 model not available, falling back to gpt-4');
        return false;
      }
      
      return true;
    } catch (error) {
      this.logger.error('Failed to validate o3 model:', error);
      return false;
    }
  }

  // Get the best available model
  async getBestAvailableModel(): Promise<string> {
    const o3Available = await this.validateO3Model();
    return o3Available ? 'o3' : 'gpt-4-turbo-preview';
  }
} 