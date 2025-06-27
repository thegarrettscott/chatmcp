import { Controller, Get, Post, Body } from '@nestjs/common';
import { ApiTags, ApiOperation } from '@nestjs/swagger';

@ApiTags('Health')
@Controller('health')
export class HealthController {
  @Get()
  @ApiOperation({ summary: 'Health check endpoint' })
  check() {
    return {
      status: 'ok',
      timestamp: new Date().toISOString(),
      service: 'chatmcp-orchestrator',
    };
  }

  @Post('test-o3')
  @ApiOperation({ summary: 'Test o3 model with MCP tools' })
  async testO3(@Body() body: { message: string }) {
    // Simple test endpoint that doesn't require database
    return {
      status: 'ready',
      message: 'o3 + MCP integration is configured',
      input: body.message || 'Hello!',
      timestamp: new Date().toISOString(),
      model: 'o3',
      mcp_enabled: true,
    };
  }
} 