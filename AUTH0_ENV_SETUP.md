# Auth0 Environment Variables Setup

After switching to `@auth0/nextjs-auth0`, you need to update your environment variables:

## Required Environment Variables

Add these to your Vercel environment variables:

```bash
# Generate a secret key for JWT signing
AUTH0_SECRET='use [openssl rand -hex 32] to generate a 32 bytes value'

# Your app's base URL (Vercel will provide this automatically in production)
AUTH0_BASE_URL='https://your-vercel-app.vercel.app'

# Your Auth0 domain (same as before)
AUTH0_ISSUER_BASE_URL='https://your-domain.auth0.com'

# Your Auth0 application credentials (same as before)
AUTH0_CLIENT_ID='your-auth0-client-id'
AUTH0_CLIENT_SECRET='your-auth0-client-secret'

# Optional - if you want to use a custom audience
AUTH0_AUDIENCE='https://api.chatmcp.com'
```

## Auth0 Application Settings

Make sure your Auth0 application is configured with:

**Allowed Callback URLs:**
```
https://your-vercel-app.vercel.app/api/auth/callback
```

**Allowed Logout URLs:**
```
https://your-vercel-app.vercel.app
```

**Allowed Web Origins:**
```
https://your-vercel-app.vercel.app
```

## Generate AUTH0_SECRET

Run this command to generate a secure secret:
```bash
openssl rand -hex 32
```

## Changes Made

1. ✅ Created `/api/auth/[auth0]/route.ts` - handles login, logout, callback
2. ✅ Switched from `@auth0/auth0-react` to `@auth0/nextjs-auth0`
3. ✅ Updated all components to use `useUser()` instead of `useAuth0()`
4. ✅ Fixed signin redirects to use proper Auth0 API routes
5. ✅ Removed unused Auth0 React dependencies

The signin redirect issue should now be resolved! 