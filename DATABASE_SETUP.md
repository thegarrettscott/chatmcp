# Database Setup Guide

## Overview

The ChatMCP platform now uses a **PostgreSQL database** to store conversations and messages, replacing the previous localStorage-based approach. This provides:

- ✅ **Persistent data** across sessions and devices
- ✅ **Multi-user support** with proper isolation
- ✅ **Real-time conversation management**
- ✅ **No more timestamp serialization errors**
- ✅ **Scalable architecture** ready for production

## Database Schema

### Tables

1. **conversations**
   - `id` (UUID, Primary Key)
   - `title` (VARCHAR)
   - `userId` (VARCHAR) - Auth0 user ID
   - `createdAt` (TIMESTAMP)
   - `updatedAt` (TIMESTAMP)

2. **messages**
   - `id` (UUID, Primary Key)
   - `conversationId` (UUID, Foreign Key)
   - `role` ('user' | 'assistant' | 'system')
   - `content` (TEXT)
   - `reasoning` (JSONB) - For o3 model reasoning
   - `functionCalls` (JSONB) - MCP tool calls
   - `functionOutputs` (JSONB) - Tool outputs
   - `createdAt` (TIMESTAMP)

## Setup Instructions

### 1. Database Setup

**Option A: Using Docker (Recommended)**
```bash
# Start PostgreSQL with pgvector extension
docker run -d \
  --name chatmcp-postgres \
  -e POSTGRES_DB=chatmcp \
  -e POSTGRES_USER=chatmcp \
  -e POSTGRES_PASSWORD=your_secure_password \
  -p 5432:5432 \
  pgvector/pgvector:pg16
```

**Option B: Local PostgreSQL**
```bash
# Install PostgreSQL and create database
createdb chatmcp
psql chatmcp -c "CREATE EXTENSION IF NOT EXISTS vector;"
```

### 2. Run Migration

```bash
# Apply the initial schema
psql -d chatmcp -f apps/orchestrator/src/database/migrations/001-initial-schema.sql
```

### 3. Environment Variables

Update your `.env` files:

**apps/orchestrator/.env**
```env
# Database
DATABASE_URL=postgresql://chatmcp:your_secure_password@localhost:5432/chatmcp

# Auth0 (for user identification)
AUTH0_DOMAIN=your-auth0-domain.auth0.com
AUTH0_AUDIENCE=your-api-identifier

# OpenAI
OPENAI_API_KEY=your-openai-key

# Redis (optional, for caching)
REDIS_URL=redis://localhost:6379
```

**apps/web-platform/.env.local**
```env
# Auth0
AUTH0_SECRET=your-32-character-secret
AUTH0_BASE_URL=http://localhost:3000
AUTH0_ISSUER_BASE_URL=https://your-auth0-domain.auth0.com
AUTH0_CLIENT_ID=your-client-id
AUTH0_CLIENT_SECRET=your-client-secret

# API
NEXT_PUBLIC_ORCHESTRATOR_URL=http://localhost:4000
```

### 4. Start the Services

```bash
# Start the orchestrator (backend)
cd apps/orchestrator
npm run start:dev

# Start the web platform (frontend)
cd apps/web-platform
npm run dev
```

## API Endpoints

The orchestrator now provides these conversation endpoints:

- `GET /conversations` - List user's conversations
- `POST /conversations` - Create new conversation
- `GET /conversations/:id` - Get conversation details
- `PUT /conversations/:id` - Update conversation
- `DELETE /conversations/:id` - Delete conversation
- `GET /conversations/:id/messages` - Get conversation messages
- `POST /conversations/:id/messages` - Add message to conversation

## Frontend Changes

### Store Architecture

The frontend now uses:
- **Real API calls** instead of localStorage
- **Async operations** for all data management
- **Proper error handling** and loading states
- **Database-backed persistence**

### Key Features

1. **Automatic conversation creation** when sending the first message
2. **Real-time message loading** from the database  
3. **Proper user isolation** using Auth0 user IDs
4. **Error recovery** with retry mechanisms
5. **Loading states** for better UX

## Benefits

### Solved Issues

✅ **Timestamp errors**: No more serialization issues  
✅ **Data persistence**: Conversations survive browser refreshes  
✅ **Multi-device sync**: Access conversations from any device  
✅ **User isolation**: Each user sees only their conversations  
✅ **Scalability**: Ready for multiple users and production deployment  

### Performance

- **Indexed queries** for fast conversation retrieval
- **Optimized joins** for message loading
- **Automatic timestamp updates** via database triggers
- **Efficient pagination** support (ready for future implementation)

## Troubleshooting

### Common Issues

1. **Connection errors**: Check DATABASE_URL and ensure PostgreSQL is running
2. **Auth errors**: Verify Auth0 configuration and user authentication
3. **Migration errors**: Ensure database exists and user has proper permissions

### Debug Commands

```bash
# Check database connection
psql $DATABASE_URL -c "SELECT version();"

# Verify tables exist
psql $DATABASE_URL -c "\dt"

# Check sample data
psql $DATABASE_URL -c "SELECT COUNT(*) FROM conversations;"
```

## Next Steps

With the database foundation in place, you can now:

1. **Deploy to production** with confidence
2. **Add advanced features** like conversation sharing
3. **Implement search** across message history
4. **Add analytics** and usage tracking
5. **Scale horizontally** with multiple backend instances

The architecture is now production-ready and eliminates all the previous localStorage limitations! 