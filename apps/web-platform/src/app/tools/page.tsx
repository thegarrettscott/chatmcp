'use client';

import { useState, useEffect, useCallback } from 'react';
import { useUser } from '@auth0/nextjs-auth0/client';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Trash2, Power, PowerOff, ExternalLink } from 'lucide-react';
import { useToast } from '@/hooks/use-toast';

interface UserTool {
  id: string;
  userId: string;
  toolType: string;
  toolName: string;
  enabled: boolean;
  settings?: any;
  createdAt: string;
  updatedAt: string;
}

export default function ToolsPage() {
  const { user, isLoading: userLoading } = useUser();
  const [tools, setTools] = useState<UserTool[]>([]);
  const [loading, setLoading] = useState(true);
  const [connecting, setConnecting] = useState(false);
  const { toast } = useToast();

  const getAccessToken = useCallback(async () => {
    const response = await fetch('/api/auth/token');
    const data = await response.json();
    return data.accessToken;
  }, []);

  const fetchTools = useCallback(async () => {
    try {
      const response = await fetch(`${process.env.NEXT_PUBLIC_API_URL}/tools`, {
        headers: {
          'Authorization': `Bearer ${await getAccessToken()}`,
        },
      });

      if (response.ok) {
        const data = await response.json();
        setTools(data);
      } else {
        toast({
          title: "Error",
          description: "Failed to fetch tools",
          variant: "destructive",
        });
      }
    } catch (error) {
      console.error('Error fetching tools:', error);
      toast({
        title: "Error",
        description: "Failed to fetch tools",
        variant: "destructive",
      });
    } finally {
      setLoading(false);
    }
  }, [getAccessToken, toast]);

  useEffect(() => {
    if (user) {
      fetchTools();
    }
  }, [user, fetchTools]);

  useEffect(() => {
    // Check for connection status in URL params
    const urlParams = new URLSearchParams(window.location.search);
    const slackStatus = urlParams.get('slack');
    const error = urlParams.get('error');

    if (slackStatus === 'connected') {
      toast({
        title: "Success",
        description: "Slack workspace connected successfully!",
      });
      fetchTools(); // Refresh tools list
      // Clean up URL
      window.history.replaceState({}, '', '/tools');
    } else if (error) {
      toast({
        title: "Error",
        description: "Failed to connect Slack workspace",
        variant: "destructive",
      });
      // Clean up URL
      window.history.replaceState({}, '', '/tools');
    }
  }, [toast, fetchTools]);

  const connectSlack = async () => {
    setConnecting(true);
    try {
      const response = await fetch(`${process.env.NEXT_PUBLIC_API_URL}/tools/slack/connect`, {
        headers: {
          'Authorization': `Bearer ${await getAccessToken()}`,
        },
      });

      if (response.ok) {
        const data = await response.json();
        // Redirect to Slack OAuth
        window.location.href = data.authUrl;
      } else {
        toast({
          title: "Error",
          description: "Failed to initiate Slack connection",
          variant: "destructive",
        });
      }
    } catch (error) {
      console.error('Error connecting to Slack:', error);
      toast({
        title: "Error",
        description: "Failed to connect to Slack",
        variant: "destructive",
      });
    } finally {
      setConnecting(false);
    }
  };

  const toggleTool = async (tool: UserTool) => {
    try {
      const response = await fetch(
        `${process.env.NEXT_PUBLIC_API_URL}/tools/${tool.toolType}/${tool.toolName}/toggle`,
        {
          method: 'POST',
          headers: {
            'Authorization': `Bearer ${await getAccessToken()}`,
          },
        }
      );

      if (response.ok) {
        const updatedTool = await response.json();
        setTools(tools.map(t => t.id === tool.id ? updatedTool : t));
        toast({
          title: "Success",
          description: `${tool.toolName} ${updatedTool.enabled ? 'enabled' : 'disabled'}`,
        });
      } else {
        toast({
          title: "Error",
          description: "Failed to toggle tool",
          variant: "destructive",
        });
      }
    } catch (error) {
      console.error('Error toggling tool:', error);
      toast({
        title: "Error",
        description: "Failed to toggle tool",
        variant: "destructive",
      });
    }
  };

  const removeTool = async (tool: UserTool) => {
    if (!confirm(`Are you sure you want to remove ${tool.toolName}?`)) {
      return;
    }

    try {
      const response = await fetch(
        `${process.env.NEXT_PUBLIC_API_URL}/tools/${tool.toolType}/${tool.toolName}`,
        {
          method: 'DELETE',
          headers: {
            'Authorization': `Bearer ${await getAccessToken()}`,
          },
        }
      );

      if (response.ok) {
        setTools(tools.filter(t => t.id !== tool.id));
        toast({
          title: "Success",
          description: `${tool.toolName} removed`,
        });
      } else {
        toast({
          title: "Error",
          description: "Failed to remove tool",
          variant: "destructive",
        });
      }
    } catch (error) {
      console.error('Error removing tool:', error);
      toast({
        title: "Error",
        description: "Failed to remove tool",
        variant: "destructive",
      });
    }
  };

  if (userLoading || loading) {
    return (
      <div className="container mx-auto px-4 py-8">
        <div className="animate-pulse">
          <div className="h-8 bg-gray-200 rounded w-1/4 mb-4"></div>
          <div className="h-4 bg-gray-200 rounded w-1/2 mb-8"></div>
          <div className="grid gap-4">
            {[1, 2, 3].map(i => (
              <div key={i} className="h-32 bg-gray-200 rounded"></div>
            ))}
          </div>
        </div>
      </div>
    );
  }

  if (!user) {
    return (
      <div className="container mx-auto px-4 py-8">
        <div className="text-center">
          <h1 className="text-2xl font-bold mb-4">Please log in to manage your tools</h1>
        </div>
      </div>
    );
  }

  const slackTools = tools.filter(tool => tool.toolType === 'slack');
  const hasSlack = slackTools.length > 0;

  return (
    <div className="container mx-auto px-4 py-8">
      <div className="mb-8">
        <h1 className="text-3xl font-bold mb-2">AI Tools</h1>
        <p className="text-muted-foreground">
          Connect external services to enhance your AI conversations
        </p>
      </div>

      <div className="grid gap-6">
        {/* Slack Integration */}
        <Card>
          <CardHeader>
            <div className="flex items-center justify-between">
              <div>
                <CardTitle className="flex items-center gap-2">
                  <div className="w-6 h-6 bg-[#4A154B] rounded flex items-center justify-center">
                    <span className="text-white text-sm font-bold">S</span>
                  </div>
                  Slack
                </CardTitle>
                <CardDescription>
                  Connect your Slack workspace to read messages, send messages, and manage channels
                </CardDescription>
              </div>
              {hasSlack ? (
                <Badge variant="secondary" className="bg-green-100 text-green-800">
                  Connected
                </Badge>
              ) : (
                <Badge variant="outline">Not Connected</Badge>
              )}
            </div>
          </CardHeader>
          <CardContent>
            {hasSlack ? (
              <div className="space-y-4">
                {slackTools.map(tool => (
                  <div key={tool.id} className="flex items-center justify-between p-4 border rounded-lg">
                    <div>
                      <h4 className="font-medium">{tool.toolName}</h4>
                      <p className="text-sm text-muted-foreground">
                        Connected {new Date(tool.createdAt).toLocaleDateString()}
                      </p>
                    </div>
                    <div className="flex items-center gap-2">
                      <Button
                        variant="outline"
                        size="sm"
                        onClick={() => toggleTool(tool)}
                      >
                        {tool.enabled ? (
                          <>
                            <Power className="w-4 h-4 mr-2" />
                            Enabled
                          </>
                        ) : (
                          <>
                            <PowerOff className="w-4 h-4 mr-2" />
                            Disabled
                          </>
                        )}
                      </Button>
                      <Button
                        variant="destructive"
                        size="sm"
                        onClick={() => removeTool(tool)}
                      >
                        <Trash2 className="w-4 h-4" />
                      </Button>
                    </div>
                  </div>
                ))}
              </div>
            ) : (
              <div className="text-center py-6">
                <p className="text-muted-foreground mb-4">
                  Connect your Slack workspace to enable AI interactions with your channels and messages
                </p>
                <Button onClick={connectSlack} disabled={connecting}>
                  {connecting ? (
                    'Connecting...'
                  ) : (
                    <>
                      <ExternalLink className="w-4 h-4 mr-2" />
                      Connect Slack Workspace
                    </>
                  )}
                </Button>
              </div>
            )}
          </CardContent>
        </Card>

        {/* More tools can be added here */}
        <Card className="opacity-50">
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <div className="w-6 h-6 bg-gray-400 rounded flex items-center justify-center">
                <span className="text-white text-sm">+</span>
              </div>
              More Tools Coming Soon
            </CardTitle>
            <CardDescription>
              GitHub, Google Drive, Notion, and more integrations are in development
            </CardDescription>
          </CardHeader>
        </Card>
      </div>
    </div>
  );
} 