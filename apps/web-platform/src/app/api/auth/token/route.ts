import { getAccessToken } from '@auth0/nextjs-auth0';

export async function GET() {
  try {
    const { accessToken } = await getAccessToken({
      scopes: ['openid', 'profile', 'email']
    });
    
    if (!accessToken) {
      return new Response(JSON.stringify({ error: 'No access token available' }), {
        status: 401,
        headers: { 'Content-Type': 'application/json' }
      });
    }

    return new Response(JSON.stringify({ accessToken }), {
      status: 200,
      headers: { 'Content-Type': 'application/json' }
    });
  } catch (error: any) {
    console.error('Error getting access token:', error);
    return new Response(JSON.stringify({ error: error.message || 'Failed to get access token' }), {
      status: 500,
      headers: { 'Content-Type': 'application/json' }
    });
  }
} 