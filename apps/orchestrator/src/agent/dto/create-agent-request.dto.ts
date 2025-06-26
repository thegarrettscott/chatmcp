import { IsString, IsOptional, IsUUID, MaxLength } from 'class-validator';
import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';

export class CreateAgentRequestDto {
  @ApiProperty({
    description: 'The user prompt/message to send to the AI agent',
    example: 'What is the weather like in San Francisco?',
  })
  @IsString()
  @MaxLength(4000)
  prompt: string;

  @ApiPropertyOptional({
    description: 'The conversation ID to continue (optional for new conversations)',
    example: '123e4567-e89b-12d3-a456-426614174000',
  })
  @IsOptional()
  @IsUUID()
  conversationId?: string;
} 