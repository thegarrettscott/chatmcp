# Supabase Setup Guide

## Overview

The ChatMCP platform now uses **Supabase** as the backend database and authentication provider. This provides:

- ✅ **Managed PostgreSQL** with automatic backups and scaling
- ✅ **Built-in authentication** (can replace or complement Auth0)
- ✅ **Real-time subscriptions** for live chat updates
- ✅ **Edge functions** for serverless compute
- ✅ **Dashboard and SQL editor** for easy management
- ✅ **Free tier** perfect for development and small projects

## Supabase Project Setup

### 1. Create Supabase Project

1. Go to [supabase.com](https://supabase.com) and create an account
2. Click "New Project"
3. Choose your organization
4. Set project details:
   - **Name**: `chatmcp-platform`
   - **Database Password**: Generate a strong password (save it!)
   - **Region**: Choose closest to your users
5. Click "Create new project"
6. Wait 2-3 minutes for provisioning

### 2. Get Your Project Credentials

From your Supabase dashboard:

1. Go to **Settings** → **API**
2. Copy these values:
   - **Project URL** (e.g., `https://your-project.supabase.co`)
   - **API Key (anon/public)** - for frontend
   - **API Key (service_role)** - for backend (keep secret!)

### 3. Set Up Database Schema

Go to **SQL Editor** in your Supabase dashboard and run this migration:

```sql
-- Enable UUID extension
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";

-- Create conversations table
CREATE TABLE conversations (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    title VARCHAR(255) NOT NULL,
    user_id VARCHAR(255) NOT NULL,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Create messages table
CREATE TABLE messages (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    conversation_id UUID NOT NULL REFERENCES conversations(id) ON DELETE CASCADE,
    role VARCHAR(50) NOT NULL CHECK (role IN ('user', 'assistant', 'system')),
    content TEXT NOT NULL,
    reasoning JSONB,
    function_calls JSONB,
    function_outputs JSONB,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Create indexes for better performance
CREATE INDEX idx_conversations_user_id ON conversations(user_id);
CREATE INDEX idx_conversations_updated_at ON conversations(updated_at DESC);
CREATE INDEX idx_messages_conversation_id ON messages(conversation_id);
CREATE INDEX idx_messages_created_at ON messages(created_at);

-- Enable Row Level Security (RLS)
ALTER TABLE conversations ENABLE ROW LEVEL SECURITY;
ALTER TABLE messages ENABLE ROW LEVEL SECURITY;

-- Create RLS policies for conversations
CREATE POLICY "Users can view their own conversations" ON conversations
    FOR SELECT USING (auth.uid()::text = user_id);

CREATE POLICY "Users can insert their own conversations" ON conversations
    FOR INSERT WITH CHECK (auth.uid()::text = user_id);

CREATE POLICY "Users can update their own conversations" ON conversations
    FOR UPDATE USING (auth.uid()::text = user_id);

CREATE POLICY "Users can delete their own conversations" ON conversations
    FOR DELETE USING (auth.uid()::text = user_id);

-- Create RLS policies for messages
CREATE POLICY "Users can view messages from their conversations" ON messages
    FOR SELECT USING (
        conversation_id IN (
            SELECT id FROM conversations WHERE user_id = auth.uid()::text
        )
    );

CREATE POLICY "Users can insert messages to their conversations" ON messages
    FOR INSERT WITH CHECK (
        conversation_id IN (
            SELECT id FROM conversations WHERE user_id = auth.uid()::text
        )
    );

-- Create function to update conversation timestamp
CREATE OR REPLACE FUNCTION update_conversation_updated_at()
RETURNS TRIGGER AS $$
BEGIN
    UPDATE conversations 
    SET updated_at = NOW() 
    WHERE id = NEW.conversation_id;
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Create trigger to automatically update conversation timestamp
CREATE TRIGGER trigger_update_conversation_updated_at
    AFTER INSERT OR UPDATE ON messages
    FOR EACH ROW
    EXECUTE FUNCTION update_conversation_updated_at();
```

## Environment Configuration

### Backend (.env)

Update `apps/orchestrator/.env`:

```env
# Supabase
SUPABASE_URL=https://your-project.supabase.co
SUPABASE_SERVICE_ROLE_KEY=your-service-role-key
SUPABASE_ANON_KEY=your-anon-key

# Database URL (for TypeORM)
DATABASE_URL=postgresql://postgres:your-db-password@db.your-project.supabase.co:5432/postgres

# Auth0 (optional - can use Supabase Auth instead)
AUTH0_DOMAIN=your-auth0-domain.auth0.com
AUTH0_AUDIENCE=your-api-identifier

# OpenAI
OPENAI_API_KEY=your-openai-key

# Redis (optional)
REDIS_URL=redis://localhost:6379
```

### Frontend (.env.local)

Update `apps/web-platform/.env.local`:

```env
# Supabase
NEXT_PUBLIC_SUPABASE_URL=https://your-project.supabase.co
NEXT_PUBLIC_SUPABASE_ANON_KEY=your-anon-key

# Auth0 (if using Auth0 instead of Supabase Auth)
AUTH0_SECRET=your-32-character-secret
AUTH0_BASE_URL=http://localhost:3000
AUTH0_ISSUER_BASE_URL=https://your-auth0-domain.auth0.com
AUTH0_CLIENT_ID=your-client-id
AUTH0_CLIENT_SECRET=your-client-secret

# API
NEXT_PUBLIC_ORCHESTRATOR_URL=http://localhost:4000
```

## Authentication Options

You have two options for authentication:

### Option A: Keep Auth0 (Recommended for existing setup)
- Continue using Auth0 for authentication
- Use Supabase only for database
- Minimal changes to existing code

### Option B: Switch to Supabase Auth
- Use Supabase's built-in authentication
- Simpler setup, fewer services
- Built-in integration with RLS policies

## Backend Integration

### Install Supabase Client

```bash
cd apps/orchestrator
npm install @supabase/supabase-js
```

### Update Database Module

Create `apps/orchestrator/src/supabase/supabase.module.ts`:

```typescript
import { Module, Global } from '@nestjs/common';
import { ConfigModule, ConfigService } from '@nestjs/config';
import { createClient, SupabaseClient } from '@supabase/supabase-js';

@Global()
@Module({
  imports: [ConfigModule],
  providers: [
    {
      provide: 'SUPABASE_CLIENT',
      useFactory: (configService: ConfigService): SupabaseClient => {
        const supabaseUrl = configService.get<string>('SUPABASE_URL');
        const supabaseKey = configService.get<string>('SUPABASE_SERVICE_ROLE_KEY');
        return createClient(supabaseUrl, supabaseKey);
      },
      inject: [ConfigService],
    },
  ],
  exports: ['SUPABASE_CLIENT'],
})
export class SupabaseModule {}
```

## Frontend Integration

### Install Supabase Client

```bash
cd apps/web-platform
npm install @supabase/supabase-js
```

### Create Supabase Client

Create `apps/web-platform/src/lib/supabase.ts`:

```typescript
import { createClient } from '@supabase/supabase-js'

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL!
const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!

export const supabase = createClient(supabaseUrl, supabaseAnonKey)
```

## Real-time Features

With Supabase, you can add real-time features:

```typescript
// Listen for new messages in a conversation
supabase
  .channel('messages')
  .on(
    'postgres_changes',
    {
      event: 'INSERT',
      schema: 'public',
      table: 'messages',
      filter: `conversation_id=eq.${conversationId}`,
    },
    (payload) => {
      console.log('New message:', payload.new)
      // Update UI with new message
    }
  )
  .subscribe()
```

## Deployment Benefits

### Supabase Advantages:
- **Zero database maintenance**
- **Automatic backups and point-in-time recovery**
- **Built-in connection pooling**
- **Global CDN for static assets**
- **Real-time subscriptions**
- **Built-in auth and user management**
- **SQL editor and dashboard**
- **Free tier: 500MB database, 50,000 monthly active users**

### Production Features:
- **Automatic SSL**
- **Database migrations via dashboard**
- **Monitoring and analytics**
- **Edge functions for serverless compute**
- **Storage for file uploads**

## Migration from Local PostgreSQL

If you have existing data:

1. **Export from local database:**
   ```bash
   pg_dump chatmcp > backup.sql
   ```

2. **Import to Supabase:**
   - Go to Supabase dashboard → SQL Editor
   - Paste your backup SQL (after running the schema above)

## Cost Estimation

**Free Tier (Perfect for development):**
- 500MB database storage
- 50,000 monthly active users
- 2GB bandwidth
- 500MB file storage

**Pro Tier ($25/month):**
- 8GB database storage
- 100,000 monthly active users
- 50GB bandwidth
- 100GB file storage

## Next Steps

1. **Create Supabase project** and run the SQL migration
2. **Update environment variables** with your Supabase credentials
3. **Test the connection** by starting your services
4. **Optional**: Migrate to Supabase Auth for simpler setup
5. **Optional**: Add real-time features for live chat updates

With Supabase, you get a production-ready database with zero maintenance and excellent developer experience! 🚀 