import {
  Controller,
  Get,
  Post,
  Put,
  Delete,
  Body,
  Param,
  Query,
  UseGuards,
} from '@nestjs/common';
import { ConversationService, CreateConversationDto } from './conversation.service';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';
import { User } from '../auth/decorators/user.decorator';

@Controller('conversations')
@UseGuards(JwtAuthGuard)
export class ConversationController {
  constructor(private readonly conversationService: ConversationService) {}

  @Get()
  async findAll(@User() user: any) {
    return this.conversationService.findAll(user?.sub);
  }

  @Get(':id')
  async findOne(@Param('id') id: string, @User() user: any) {
    return this.conversationService.findOne(id, user?.sub);
  }

  @Post()
  async create(@Body() createConversationDto: CreateConversationDto, @User() user: any) {
    return this.conversationService.create({
      ...createConversationDto,
      userId: user?.sub || 'anonymous',
    });
  }

  @Put(':id')
  async update(
    @Param('id') id: string,
    @Body() updates: any,
    @User() user: any,
  ) {
    return this.conversationService.update(id, updates, user?.sub);
  }

  @Delete(':id')
  async remove(@Param('id') id: string, @User() user: any) {
    await this.conversationService.remove(id, user?.sub);
    return { message: 'Conversation deleted successfully' };
  }

  @Get(':id/messages')
  async getMessages(@Param('id') id: string, @User() user: any) {
    return this.conversationService.getMessages(id, user?.sub);
  }

  @Post(':id/messages')
  async createMessage(
    @Param('id') conversationId: string,
    @Body() createMessageDto: any,
    @User() user: any,
  ) {
    // Verify user has access to this conversation
    await this.conversationService.findOne(conversationId, user?.sub);
    
    return this.conversationService.createMessage({
      ...createMessageDto,
      conversationId,
    });
  }
} 