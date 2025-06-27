import { Injectable, Logger } from '@nestjs/common';
import axios from 'axios';

interface FunctionCall {
  name: string;
  arguments: string;
}

interface ToolExecutionResult {
  success: boolean;
  result?: any;
  error?: string;
}

@Injectable()
export class McpService {
  private readonly logger = new Logger(McpService.name);
  
  // Registry of available MCP tools
  private readonly toolRegistry = new Map<string, string>([
    ['weather', process.env.EXAMPLE_TOOL_URL || 'https://api.example-tool.com'],
    // Add more tools here as they become available
  ]);

  async executeTool(functionCall: FunctionCall): Promise<ToolExecutionResult> {
    try {
      this.logger.log(`Executing MCP tool: ${functionCall.name}`);
      
      // Parse function arguments
      let args: any = {};
      try {
        args = JSON.parse(functionCall.arguments);
      } catch (error) {
        this.logger.error('Failed to parse function arguments:', error);
        return {
          success: false,
          error: 'Invalid function arguments format',
        };
      }

      // Route to appropriate tool based on function name
      switch (functionCall.name) {
        case 'get_weather':
          return await this.executeWeatherTool(args);
        
        case 'search_web':
          return await this.executeWebSearchTool(args);
        
        default:
          this.logger.warn(`Unknown tool: ${functionCall.name}`);
          return {
            success: false,
            error: `Tool '${functionCall.name}' is not available`,
          };
      }
    } catch (error) {
      this.logger.error('Tool execution failed:', error);
      return {
        success: false,
        error: error.message,
      };
    }
  }

  private async executeWeatherTool(args: any): Promise<ToolExecutionResult> {
    try {
      const toolUrl = this.toolRegistry.get('weather');
      if (!toolUrl) {
        return {
          success: false,
          error: 'Weather tool not configured',
        };
      }

      const response = await axios.post(`${toolUrl}/weather/current`, {
        location: args.location,
        units: args.units || 'metric',
      }, {
        timeout: 10000,
        headers: {
          'Content-Type': 'application/json',
        },
      });

      return {
        success: true,
        result: response.data,
      };
    } catch (error) {
      this.logger.error('Weather tool execution failed:', error);
      return {
        success: false,
        error: `Weather API error: ${error.message}`,
      };
    }
  }

  private async executeWebSearchTool(args: any): Promise<ToolExecutionResult> {
    try {
      // Placeholder for web search tool
      // This would integrate with a search API like Bing, Google, etc.
      this.logger.log(`Web search for: ${args.query}`);
      
      return {
        success: true,
        result: {
          query: args.query,
          results: [
            {
              title: 'Example Search Result',
              url: 'https://example.com',
              snippet: 'This is a simulated search result for demonstration purposes.',
            },
          ],
        },
      };
    } catch (error) {
      this.logger.error('Web search tool execution failed:', error);
      return {
        success: false,
        error: `Web search error: ${error.message}`,
      };
    }
  }

  // Get available tools schema for OpenAI function calling
  async getAvailableTools(): Promise<any[]> {
    return [
      {
        type: 'function',
        function: {
          name: 'get_weather',
          description: 'Get current weather information for a location',
          parameters: {
            type: 'object',
            properties: {
              location: {
                type: 'string',
                description: 'The city and state, e.g. San Francisco, CA',
              },
              units: {
                type: 'string',
                enum: ['celsius', 'fahrenheit'],
                description: 'The temperature unit to use',
              },
            },
            required: ['location'],
          },
        },
      },
      {
        type: 'function',
        function: {
          name: 'search_web',
          description: 'Search the web for information',
          parameters: {
            type: 'object',
            properties: {
              query: {
                type: 'string',
                description: 'The search query',
              },
              max_results: {
                type: 'number',
                description: 'Maximum number of results to return',
                default: 5,
              },
            },
            required: ['query'],
          },
        },
      },
    ];
  }

  // Register a new MCP tool
  registerTool(name: string, url: string): void {
    this.toolRegistry.set(name, url);
    this.logger.log(`Registered MCP tool: ${name} at ${url}`);
  }

  // Get tool registry for debugging
  getToolRegistry(): Map<string, string> {
    return new Map(this.toolRegistry);
  }
} 