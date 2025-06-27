#!/bin/bash

echo "🚀 ChatMCP Database Setup"
echo "=========================="

# Check if we have the migration file
if [ ! -f "supabase-migration.sql" ]; then
    echo "❌ Migration file not found!"
    exit 1
fi

echo "✅ Migration file found"

# Display the migration content
echo ""
echo "📋 Migration Content:"
echo "===================="
cat supabase-migration.sql

echo ""
echo "🔧 Next Steps:"
echo "=============="
echo "1. Go to: https://supabase.com/dashboard/project/desyagvwhkpjnauadwpk"
echo "2. Click 'SQL Editor' in the left sidebar"
echo "3. Copy the migration content above and paste it"
echo "4. Click 'Run' to execute"
echo ""
echo "5. Get your database password:"
echo "   - Go to Settings → Database"
echo "   - Copy the Database Password"
echo "   - Provide it to me to update the environment files"
echo ""

# Check if we can start the services
echo "🔍 Checking environment files..."
if [ -f "apps/orchestrator/.env" ] && [ -f "apps/web-platform/.env.local" ]; then
    echo "✅ Environment files found"
    
    # Check if database URL is still placeholder
    if grep -q "your-db-password" apps/orchestrator/.env; then
        echo "⚠️  Database password still needs to be set"
        echo "   Please provide your database password to complete setup"
    else
        echo "✅ Database URL appears to be configured"
    fi
else
    echo "❌ Environment files missing"
fi

echo ""
echo "🎯 Ready to start services once database is set up!" 