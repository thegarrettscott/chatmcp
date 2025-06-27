#!/bin/bash

# ChatMCP Supabase Setup Script
# This script helps you set up Supabase for the ChatMCP platform

set -e

echo "🚀 ChatMCP Supabase Setup"
echo "========================"
echo ""

# Colors for output
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
NC='\033[0m' # No Color

# Function to print colored output
print_status() {
    echo -e "${BLUE}[INFO]${NC} $1"
}

print_success() {
    echo -e "${GREEN}[SUCCESS]${NC} $1"
}

print_warning() {
    echo -e "${YELLOW}[WARNING]${NC} $1"
}

print_error() {
    echo -e "${RED}[ERROR]${NC} $1"
}

# Check if we're in the right directory
if [ ! -f "package.json" ] || [ ! -d "apps/orchestrator" ] || [ ! -d "apps/web-platform" ]; then
    print_error "Please run this script from the ChatMCP root directory"
    exit 1
fi

print_status "Setting up Supabase for ChatMCP platform..."
echo ""

# Step 1: Check if Supabase CLI is installed
print_status "Checking Supabase CLI..."
if ! command -v supabase &> /dev/null; then
    print_warning "Supabase CLI not found. Installing..."
    if command -v npm &> /dev/null; then
        npm install -g supabase
        print_success "Supabase CLI installed via npm"
    elif command -v brew &> /dev/null; then
        brew install supabase/tap/supabase
        print_success "Supabase CLI installed via Homebrew"
    else
        print_error "Please install Supabase CLI manually: https://supabase.com/docs/guides/cli"
        exit 1
    fi
else
    print_success "Supabase CLI found"
fi

echo ""

# Step 2: Prompt for Supabase project details
print_status "Please provide your Supabase project details:"
echo "You can find these in your Supabase dashboard under Settings > API"
echo ""

read -p "Supabase Project URL (e.g., https://your-project.supabase.co): " SUPABASE_URL
read -p "Supabase Anon Key: " SUPABASE_ANON_KEY
read -s -p "Supabase Service Role Key: " SUPABASE_SERVICE_ROLE_KEY
echo ""
read -s -p "Database Password: " DB_PASSWORD
echo ""

# Validate inputs
if [ -z "$SUPABASE_URL" ] || [ -z "$SUPABASE_ANON_KEY" ] || [ -z "$SUPABASE_SERVICE_ROLE_KEY" ] || [ -z "$DB_PASSWORD" ]; then
    print_error "All fields are required. Please run the script again."
    exit 1
fi

# Extract project reference from URL
PROJECT_REF=$(echo $SUPABASE_URL | sed 's/https:\/\///' | sed 's/\.supabase\.co//')

# Step 3: Create environment files
print_status "Creating environment files..."

# Backend .env
cat > apps/orchestrator/.env << EOF
# Supabase Configuration
SUPABASE_URL=$SUPABASE_URL
SUPABASE_SERVICE_ROLE_KEY=$SUPABASE_SERVICE_ROLE_KEY
SUPABASE_ANON_KEY=$SUPABASE_ANON_KEY

# Database URL for TypeORM
DATABASE_URL=postgresql://postgres:$DB_PASSWORD@db.$PROJECT_REF.supabase.co:5432/postgres

# Auth0 (optional - can use Supabase Auth instead)
# AUTH0_DOMAIN=your-auth0-domain.auth0.com
# AUTH0_AUDIENCE=your-api-identifier

# OpenAI
# OPENAI_API_KEY=your-openai-key

# Redis (optional)
# REDIS_URL=redis://localhost:6379

# Server Configuration
PORT=4000
NODE_ENV=development
EOF

print_success "Created apps/orchestrator/.env"

# Frontend .env.local
cat > apps/web-platform/.env.local << EOF
# Supabase Configuration
NEXT_PUBLIC_SUPABASE_URL=$SUPABASE_URL
NEXT_PUBLIC_SUPABASE_ANON_KEY=$SUPABASE_ANON_KEY

# Auth0 (if using Auth0 instead of Supabase Auth)
# AUTH0_SECRET=your-32-character-secret
# AUTH0_BASE_URL=http://localhost:3000
# AUTH0_ISSUER_BASE_URL=https://your-auth0-domain.auth0.com
# AUTH0_CLIENT_ID=your-client-id
# AUTH0_CLIENT_SECRET=your-client-secret

# API Configuration
NEXT_PUBLIC_ORCHESTRATOR_URL=http://localhost:4000
EOF

print_success "Created apps/web-platform/.env.local"

echo ""

# Step 4: Display next steps
print_status "Environment files created successfully!"
echo ""
print_warning "NEXT STEPS:"
echo ""
echo "1. 📋 Run the database migration:"
echo "   - Go to your Supabase dashboard"
echo "   - Open the SQL Editor"
echo "   - Copy and paste the contents of 'supabase-migration.sql'"
echo "   - Click 'Run' to create the schema"
echo ""
echo "2. 🔑 Add your OpenAI API key:"
echo "   - Edit apps/orchestrator/.env"
echo "   - Uncomment and set OPENAI_API_KEY=your-actual-key"
echo ""
echo "3. 🔐 Configure authentication:"
echo "   Option A: Keep Auth0 (recommended for existing setup)"
echo "   - Uncomment and configure Auth0 variables in both .env files"
echo ""
echo "   Option B: Use Supabase Auth (simpler)"
echo "   - No additional configuration needed"
echo "   - Users will be authenticated via Supabase"
echo ""
echo "4. 🚀 Start the services:"
echo "   cd apps/orchestrator && npm run start:dev"
echo "   cd apps/web-platform && npm run dev"
echo ""
echo "5. 🌐 Open your browser:"
echo "   http://localhost:3000"
echo ""

print_success "Setup complete! 🎉"
echo ""
print_status "For detailed documentation, see SUPABASE_SETUP.md"
echo ""

# Optional: Ask if user wants to open Supabase dashboard
read -p "Would you like to open your Supabase dashboard now? (y/n): " open_dashboard
if [[ $open_dashboard =~ ^[Yy]$ ]]; then
    if command -v open &> /dev/null; then
        open "$SUPABASE_URL"
    elif command -v xdg-open &> /dev/null; then
        xdg-open "$SUPABASE_URL"
    else
        echo "Please open $SUPABASE_URL in your browser"
    fi
fi

echo ""
print_success "Happy coding! 🚀" 