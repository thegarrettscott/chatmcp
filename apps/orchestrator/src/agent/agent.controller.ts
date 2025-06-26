import { Controller, Post, Get, Body, Param, Res, UseGuards, Req } from '@nestjs/common';
import { Response, Request } from 'express';
import { ApiTags, ApiOperation, ApiBearerAuth } from '@nestjs/swagger';
import { AgentService } from './agent.service';
import { CreateAgentRequestDto } from './dto/create-agent-request.dto';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';
import { User } from '../auth/decorators/user.decorator';

@ApiTags('Agent')
@Controller('agent')
@UseGuards(JwtAuthGuard)
@ApiBearerAuth()
export class AgentController {
  constructor(private readonly agentService: AgentService) {}

  @Post()
  @ApiOperation({ summary: 'Create a new agent conversation' })
  async createAgent(
    @Body() createAgentRequest: CreateAgentRequestDto,
    @User() user: any,
    @Req() req: Request,
  ) {
    return this.agentService.createAgent(createAgentRequest, user.sub);
  }

  @Get('stream/:responseId')
  @ApiOperation({ summary: 'Stream agent response with MCP tool execution' })
  async streamAgent(
    @Param('responseId') responseId: string,
    @User() user: any,
    @Res() res: Response,
  ) {
    res.setHeader('Content-Type', 'text/event-stream');
    res.setHeader('Cache-Control', 'no-cache');
    res.setHeader('Connection', 'keep-alive');
    res.setHeader('Access-Control-Allow-Origin', '*');
    res.setHeader('Access-Control-Allow-Headers', 'Cache-Control');

    await this.agentService.streamAgent(responseId, user.sub, res);
  }
} 