# 🚀 ChatMCP Setup Guide

## Step 1: Set Up Database Schema

### Option A: Using Supabase Dashboard (Recommended)
1. Go to: https://supabase.com/dashboard/project/desyagvwhkpjnauadwpk
2. Click **"SQL Editor"** in the left sidebar
3. Copy the entire content from `supabase-migration.sql` and paste it
4. Click **"Run"** to execute

### Option B: Using Supabase CLI
```bash
# Link your project
supabase link --project-ref desyagvwhkpjnauadwpk

# Push the migration
supabase db push
```

## Step 2: Get Database Password
1. In Supabase Dashboard, go to **Settings** → **Database**
2. Copy your **Database Password**
3. Update the `DATABASE_URL` in `apps/orchestrator/.env`

## Step 3: Start Services

### Terminal 1 - Backend
```bash
cd apps/orchestrator
pnpm dev
```

### Terminal 2 - Frontend
```bash
cd apps/web-platform
pnpm dev
```

## Step 4: Test the Application
1. Open http://localhost:3000
2. Sign in with Auth0
3. Start chatting!

## Troubleshooting

### If you get database connection errors:
1. Check your database password in Supabase Dashboard
2. Verify the `DATABASE_URL` format in `.env`
3. Make sure the migration ran successfully

### If you get build errors:
1. Run `pnpm install` in the root directory
2. Clear node_modules and reinstall: `rm -rf node_modules && pnpm install`

### If Auth0 doesn't work:
1. Check your Auth0 configuration in `.env.local`
2. Verify callback URLs in Auth0 dashboard 