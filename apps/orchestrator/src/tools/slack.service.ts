import { Injectable, Logger } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { ToolsService } from './tools.service';
import axios from 'axios';
import * as crypto from 'crypto';

interface SlackOAuthResponse {
  ok: boolean;
  access_token?: string;
  team?: {
    id: string;
    name: string;
  };
  authed_user?: {
    id: string;
  };
  error?: string;
}

@Injectable()
export class SlackService {
  private readonly logger = new Logger(SlackService.name);
  private readonly clientId: string;
  private readonly clientSecret: string;
  private readonly redirectUri: string;
  private readonly pendingStates = new Map<string, { userId: string; timestamp: number }>();

  constructor(
    private readonly configService: ConfigService,
    private readonly toolsService: ToolsService,
  ) {
    this.clientId = this.configService.get<string>('SLACK_CLIENT_ID');
    this.clientSecret = this.configService.get<string>('SLACK_CLIENT_SECRET');
    
    // Use the current domain for the redirect URI
    const orchestratorUrl = this.configService.get<string>('ORCHESTRATOR_URL') || 'https://chatmcp-orchestrator.fly.dev';
    this.redirectUri = `${orchestratorUrl}/tools/slack/callback`;
    
    if (!this.clientId || !this.clientSecret) {
      this.logger.error('Slack OAuth credentials not configured');
    }

    // Clean up expired states every 10 minutes
    setInterval(() => this.cleanupExpiredStates(), 10 * 60 * 1000);
  }

  async getAuthUrl(userId: string): Promise<string> {
    if (!this.clientId) {
      throw new Error('Slack client ID not configured');
    }

    // Generate a secure state parameter
    const state = crypto.randomBytes(32).toString('hex');
    
    // Store the state with user ID and timestamp
    this.pendingStates.set(state, {
      userId,
      timestamp: Date.now(),
    });

    const scopes = [
      'channels:read',
      'channels:history',
      'chat:write',
      'users:read',
      'users:read.email',
      'team:read',
      'files:read',
      'files:write',
    ].join(',');

    const authUrl = `https://slack.com/oauth/v2/authorize?` +
      `client_id=${this.clientId}&` +
      `scope=${encodeURIComponent(scopes)}&` +
      `redirect_uri=${encodeURIComponent(this.redirectUri)}&` +
      `state=${state}`;

    this.logger.log(`Generated Slack auth URL for user ${userId}`);
    return authUrl;
  }

  async handleCallback(code: string, state: string): Promise<{ success: boolean; error?: string }> {
    try {
      // Verify state parameter
      const stateData = this.pendingStates.get(state);
      if (!stateData) {
        this.logger.error('Invalid or expired state parameter');
        return { success: false, error: 'Invalid state parameter' };
      }

      // Check if state is expired (30 minutes)
      if (Date.now() - stateData.timestamp > 30 * 60 * 1000) {
        this.pendingStates.delete(state);
        this.logger.error('Expired state parameter');
        return { success: false, error: 'State parameter expired' };
      }

      const userId = stateData.userId;
      this.pendingStates.delete(state);

      // Exchange code for access token
      const tokenResponse = await axios.post<SlackOAuthResponse>(
        'https://slack.com/api/oauth.v2.access',
        new URLSearchParams({
          client_id: this.clientId,
          client_secret: this.clientSecret,
          code,
          redirect_uri: this.redirectUri,
        }),
        {
          headers: {
            'Content-Type': 'application/x-www-form-urlencoded',
          },
        }
      );

      if (!tokenResponse.data.ok) {
        this.logger.error('Slack OAuth error:', tokenResponse.data.error);
        return { success: false, error: tokenResponse.data.error };
      }

      const { access_token, team, authed_user } = tokenResponse.data;

      if (!access_token || !team) {
        this.logger.error('Missing access token or team info in Slack response');
        return { success: false, error: 'Invalid response from Slack' };
      }

      // Store the tool credentials
      await this.toolsService.addTool(
        userId,
        'slack',
        team.name,
        {
          accessToken: access_token,
          teamId: team.id,
          teamName: team.name,
          userId: authed_user?.id,
        },
        {
          connectedAt: new Date().toISOString(),
        }
      );

      this.logger.log(`Successfully connected Slack workspace "${team.name}" for user ${userId}`);
      return { success: true };
    } catch (error) {
      this.logger.error('Error handling Slack callback:', error);
      return { success: false, error: 'Internal server error' };
    }
  }

  async getSlackTools(userId: string): Promise<any[]> {
    try {
      const tools = await this.toolsService.getUserTools(userId);
      return tools.filter(tool => tool.toolType === 'slack' && tool.enabled);
    } catch (error) {
      this.logger.error('Error fetching Slack tools:', error);
      return [];
    }
  }

  private cleanupExpiredStates(): void {
    const now = Date.now();
    const expiredStates: string[] = [];

    for (const [state, data] of this.pendingStates.entries()) {
      if (now - data.timestamp > 30 * 60 * 1000) { // 30 minutes
        expiredStates.push(state);
      }
    }

    expiredStates.forEach(state => this.pendingStates.delete(state));
    
    if (expiredStates.length > 0) {
      this.logger.log(`Cleaned up ${expiredStates.length} expired OAuth states`);
    }
  }
} 