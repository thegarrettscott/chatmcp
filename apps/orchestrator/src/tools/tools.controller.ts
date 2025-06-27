import { Controller, Get, Post, Delete, Param, Query, Req, Res, UseGuards, Logger } from '@nestjs/common';
import { Response } from 'express';
import { AuthGuard } from '../auth/auth.guard';
import { ToolsService } from './tools.service';
import { SlackService } from './slack.service';

@Controller('tools')
export class ToolsController {
  private readonly logger = new Logger(ToolsController.name);

  constructor(
    private readonly toolsService: ToolsService,
    private readonly slackService: SlackService,
  ) {}

  @Get()
  @UseGuards(AuthGuard)
  async getUserTools(@Req() req: any) {
    const userId = req.user?.sub;
    if (!userId) {
      throw new Error('User not authenticated');
    }
    
    return this.toolsService.getUserTools(userId);
  }

  @Get('slack/connect')
  @UseGuards(AuthGuard)
  async connectSlack(@Req() req: any, @Res() res: Response) {
    const userId = req.user?.sub;
    if (!userId) {
      return res.status(401).json({ error: 'User not authenticated' });
    }

    try {
      const authUrl = await this.slackService.getAuthUrl(userId);
      return res.json({ authUrl });
    } catch (error) {
      this.logger.error('Error generating Slack auth URL:', error);
      return res.status(500).json({ error: 'Failed to generate auth URL' });
    }
  }

  @Get('slack/callback')
  async slackCallback(@Query('code') code: string, @Query('state') state: string, @Res() res: Response) {
    if (!code || !state) {
      return res.status(400).json({ error: 'Missing code or state parameter' });
    }

    try {
      const result = await this.slackService.handleCallback(code, state);
      
      if (result.success) {
        // Redirect back to frontend with success
        const frontendUrl = process.env.FRONTEND_URL || 'http://localhost:3000';
        return res.redirect(`${frontendUrl}/tools?slack=connected`);
      } else {
        return res.redirect(`${frontendUrl}/tools?error=slack_connection_failed`);
      }
    } catch (error) {
      this.logger.error('Error handling Slack callback:', error);
      const frontendUrl = process.env.FRONTEND_URL || 'http://localhost:3000';
      return res.redirect(`${frontendUrl}/tools?error=slack_connection_failed`);
    }
  }

  @Delete(':toolType/:toolName')
  @UseGuards(AuthGuard)
  async removeTool(
    @Req() req: any,
    @Param('toolType') toolType: string,
    @Param('toolName') toolName: string,
  ) {
    const userId = req.user?.sub;
    if (!userId) {
      throw new Error('User not authenticated');
    }

    return this.toolsService.removeTool(userId, toolType, toolName);
  }

  @Post(':toolType/:toolName/toggle')
  @UseGuards(AuthGuard)
  async toggleTool(
    @Req() req: any,
    @Param('toolType') toolType: string,
    @Param('toolName') toolName: string,
  ) {
    const userId = req.user?.sub;
    if (!userId) {
      throw new Error('User not authenticated');
    }

    return this.toolsService.toggleTool(userId, toolType, toolName);
  }
} 