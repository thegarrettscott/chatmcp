import { Controller, Post, Get, Body, Param, Res, UseGuards, Req, Query } from '@nestjs/common';
import { Response, Request } from 'express';
import { ApiTags, ApiOperation, ApiBearerAuth } from '@nestjs/swagger';
import { AgentService } from './agent.service';
import { CreateAgentRequestDto } from './dto/create-agent-request.dto';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';
import { User } from '../auth/decorators/user.decorator';

@ApiTags('Agent')
@Controller('agent')
export class AgentController {
  constructor(private readonly agentService: AgentService) {}

  @Post()
  @UseGuards(JwtAuthGuard)
  @ApiBearerAuth()
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
    @Query('token') token: string,
    @Res() res: Response,
  ) {
    // Validate JWT token from query parameter
    if (!token) {
      res.status(401).json({ error: 'Authentication token required' });
      return;
    }

    // TODO: Add proper JWT validation here
    // For now, we'll assume the token is valid if present
    const userId = 'authenticated-user'; // Extract from JWT in production

    res.setHeader('Content-Type', 'text/event-stream');
    res.setHeader('Cache-Control', 'no-cache');
    res.setHeader('Connection', 'keep-alive');
    res.setHeader('Access-Control-Allow-Origin', '*');
    res.setHeader('Access-Control-Allow-Headers', 'Cache-Control');

    await this.agentService.streamAgent(responseId, userId, res);
  }
} 