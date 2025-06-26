import { Injectable, Logger } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { RedisService } from '../redis/redis.service';
import { Conversation } from '../entities/conversation.entity';
import { Message } from '../entities/message.entity';
import { CreateAgentRequestDto } from './dto/create-agent-request.dto';
import { OpenAIService } from './openai.service';
import { McpService } from './mcp.service';
import { v4 as uuidv4 } from 'uuid';

@Injectable()
export class AgentService {
  private readonly logger = new Logger(AgentService.name);

  constructor(
    @InjectRepository(Conversation)
    private conversationRepository: Repository<Conversation>,
    @InjectRepository(Message)
    private messageRepository: Repository<Message>,
    private readonly redisService: RedisService,
    private readonly openaiService: OpenAIService,
    private readonly mcpService: McpService,
  ) {}

  async createAgent(createAgentRequest: CreateAgentRequestDto, userId: string) {
    const { prompt, conversationId } = createAgentRequest;

    let conversation: Conversation;

    if (conversationId) {
      conversation = await this.conversationRepository.findOne({
        where: { id: conversationId, userId },
      });
      if (!conversation) {
        throw new Error('Conversation not found');
      }
    } else {
      // Create new conversation
      conversation = this.conversationRepository.create({
        id: uuidv4(),
        title: prompt.substring(0, 60),
        userId,
        createdAt: new Date(),
        updatedAt: new Date(),
      });
      await this.conversationRepository.save(conversation);
    }

    // Save user message
    const userMessage = this.messageRepository.create({
      id: uuidv4(),
      conversationId: conversation.id,
      role: 'user',
      content: prompt,
      createdAt: new Date(),
    });
    await this.messageRepository.save(userMessage);

    // Get user's tools from Redis
    const tools = await this.redisService.getUserTools(userId);

    // Create OpenAI response
    const response = await this.openaiService.createResponse({
      model: 'o3',
      input: [prompt],
      tools,
      reasoning: { effort: 'low', summary: 'auto' },
      stream: true,
    });

    // Store response ID in Redis
    await this.redisService.setResponseId(conversation.id, response.id);

    return {
      conversationId: conversation.id,
      streamId: response.id,
    };
  }

  async streamAgent(responseId: string, userId: string, res: any) {
    try {
      const stream = await this.openaiService.streamResponse(responseId);
      const conversationId = await this.redisService.getConversationId(responseId);

      let assistantMessage: Message | null = null;
      let currentContent = '';

      for await (const chunk of stream) {
        if (chunk.output_text?.delta) {
          currentContent += chunk.output_text.delta;
          
          // Send chunk to client
          res.write(`data: ${JSON.stringify({
            type: 'content',
            content: chunk.output_text.delta,
          })}\n\n`);
        }

        if (chunk.function_call) {
          // Execute MCP tool
          const functionCall = chunk.function_call;
          
          res.write(`data: ${JSON.stringify({
            type: 'function_call',
            functionCall,
          })}\n\n`);

          try {
            const result = await this.mcpService.executeTool(functionCall);
            
            res.write(`data: ${JSON.stringify({
              type: 'function_result',
              result,
            })}\n\n`);

            // Continue with function call output
            const functionResponse = await this.openaiService.continueWithFunctionOutput(
              responseId,
              functionCall,
              result,
            );

            if (functionResponse.output_text?.content) {
              currentContent += functionResponse.output_text.content;
              res.write(`data: ${JSON.stringify({
                type: 'content',
                content: functionResponse.output_text.content,
              })}\n\n`);
            }
          } catch (error) {
            this.logger.error('MCP tool execution failed:', error);
            res.write(`data: ${JSON.stringify({
              type: 'function_error',
              error: error.message,
            })}\n\n`);
          }
        }
      }

      // Save assistant message
      if (currentContent.trim()) {
        assistantMessage = this.messageRepository.create({
          id: uuidv4(),
          conversationId,
          role: 'assistant',
          content: currentContent,
          createdAt: new Date(),
        });
        await this.messageRepository.save(assistantMessage);
      }

      res.write(`data: ${JSON.stringify({ type: 'done' })}\n\n`);
      res.end();
    } catch (error) {
      this.logger.error('Streaming failed:', error);
      res.write(`data: ${JSON.stringify({
        type: 'error',
        error: error.message,
      })}\n\n`);
      res.end();
    }
  }
} 