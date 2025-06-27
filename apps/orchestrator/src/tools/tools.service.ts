import { Injectable, Logger } from '@nestjs/common';
import { SupabaseService } from '../supabase/supabase.service';
import * as crypto from 'crypto';

export interface UserTool {
  id: string;
  userId: string;
  toolType: string;
  toolName: string;
  enabled: boolean;
  settings?: any;
  createdAt: Date;
  updatedAt: Date;
}

@Injectable()
export class ToolsService {
  private readonly logger = new Logger(ToolsService.name);
  private readonly encryptionKey: string;

  constructor(private readonly supabase: SupabaseService) {
    this.encryptionKey = process.env.TOOLS_ENCRYPTION_KEY || 'default-key-change-in-production';
    if (this.encryptionKey === 'default-key-change-in-production') {
      this.logger.warn('Using default encryption key - set TOOLS_ENCRYPTION_KEY in production');
    }
  }

  async getUserTools(userId: string): Promise<UserTool[]> {
    try {
      const { data, error } = await this.supabase.getClient()
        .from('user_tools')
        .select('*')
        .eq('user_id', userId)
        .order('created_at', { ascending: false });

      if (error) {
        this.logger.error('Error fetching user tools:', error);
        throw new Error('Failed to fetch user tools');
      }

      return data || [];
    } catch (error) {
      this.logger.error('Error in getUserTools:', error);
      throw error;
    }
  }

  async addTool(
    userId: string, 
    toolType: string, 
    toolName: string, 
    credentials: any, 
    settings: any = {}
  ): Promise<UserTool> {
    try {
      const encryptedCredentials = this.encryptCredentials(credentials);
      
      const { data, error } = await this.supabase.getClient()
        .from('user_tools')
        .insert({
          user_id: userId,
          tool_type: toolType,
          tool_name: toolName,
          credentials: encryptedCredentials,
          settings,
          enabled: true,
        })
        .select()
        .single();

      if (error) {
        this.logger.error('Error adding tool:', error);
        throw new Error('Failed to add tool');
      }

      return data;
    } catch (error) {
      this.logger.error('Error in addTool:', error);
      throw error;
    }
  }

  async removeTool(userId: string, toolType: string, toolName: string): Promise<void> {
    try {
      const { error } = await this.supabase.getClient()
        .from('user_tools')
        .delete()
        .eq('user_id', userId)
        .eq('tool_type', toolType)
        .eq('tool_name', toolName);

      if (error) {
        this.logger.error('Error removing tool:', error);
        throw new Error('Failed to remove tool');
      }
    } catch (error) {
      this.logger.error('Error in removeTool:', error);
      throw error;
    }
  }

  async toggleTool(userId: string, toolType: string, toolName: string): Promise<UserTool> {
    try {
      // First get the current state
      const { data: currentTool, error: fetchError } = await this.supabase.getClient()
        .from('user_tools')
        .select('*')
        .eq('user_id', userId)
        .eq('tool_type', toolType)
        .eq('tool_name', toolName)
        .single();

      if (fetchError) {
        this.logger.error('Error fetching tool to toggle:', fetchError);
        throw new Error('Tool not found');
      }

      // Toggle the enabled state
      const { data, error } = await this.supabase.getClient()
        .from('user_tools')
        .update({ enabled: !currentTool.enabled })
        .eq('user_id', userId)
        .eq('tool_type', toolType)
        .eq('tool_name', toolName)
        .select()
        .single();

      if (error) {
        this.logger.error('Error toggling tool:', error);
        throw new Error('Failed to toggle tool');
      }

      return data;
    } catch (error) {
      this.logger.error('Error in toggleTool:', error);
      throw error;
    }
  }

  async getToolCredentials(userId: string, toolType: string, toolName: string): Promise<any> {
    try {
      const { data, error } = await this.supabase.getClient()
        .from('user_tools')
        .select('credentials')
        .eq('user_id', userId)
        .eq('tool_type', toolType)
        .eq('tool_name', toolName)
        .eq('enabled', true)
        .single();

      if (error) {
        this.logger.error('Error fetching tool credentials:', error);
        return null;
      }

      if (!data?.credentials) {
        return null;
      }

      return this.decryptCredentials(data.credentials);
    } catch (error) {
      this.logger.error('Error in getToolCredentials:', error);
      return null;
    }
  }

  private encryptCredentials(credentials: any): string {
    try {
      const text = JSON.stringify(credentials);
      const algorithm = 'aes-256-cbc';
      const key = crypto.scryptSync(this.encryptionKey, 'salt', 32);
      const iv = crypto.randomBytes(16);
      
      const cipher = crypto.createCipher(algorithm, key);
      let encrypted = cipher.update(text, 'utf8', 'hex');
      encrypted += cipher.final('hex');
      
      return iv.toString('hex') + ':' + encrypted;
    } catch (error) {
      this.logger.error('Error encrypting credentials:', error);
      throw new Error('Failed to encrypt credentials');
    }
  }

  private decryptCredentials(encryptedData: string): any {
    try {
      const algorithm = 'aes-256-cbc';
      const key = crypto.scryptSync(this.encryptionKey, 'salt', 32);
      
      const parts = encryptedData.split(':');
      const iv = Buffer.from(parts[0], 'hex');
      const encryptedText = parts[1];
      
      const decipher = crypto.createDecipher(algorithm, key);
      let decrypted = decipher.update(encryptedText, 'hex', 'utf8');
      decrypted += decipher.final('utf8');
      
      return JSON.parse(decrypted);
    } catch (error) {
      this.logger.error('Error decrypting credentials:', error);
      throw new Error('Failed to decrypt credentials');
    }
  }
} 