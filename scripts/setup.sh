#!/bin/bash

# ChatMCP Platform Setup Script
set -e

echo "🚀 Setting up ChatMCP Platform..."

# Check if Node.js is installed
if ! command -v node &> /dev/null; then
    echo "❌ Node.js is not installed. Please install Node.js 18+ first."
    exit 1
fi

# Check Node.js version
NODE_VERSION=$(node -v | cut -d'v' -f2 | cut -d'.' -f1)
if [ "$NODE_VERSION" -lt 18 ]; then
    echo "❌ Node.js version 18+ is required. Current version: $(node -v)"
    exit 1
fi

# Check if pnpm is installed
if ! command -v pnpm &> /dev/null; then
    echo "📦 Installing pnpm..."
    npm install -g pnpm
fi

# Check if Docker is installed
if ! command -v docker &> /dev/null; then
    echo "❌ Docker is not installed. Please install Docker first."
    exit 1
fi

# Check if Docker Compose is available
if ! docker compose version &> /dev/null; then
    echo "❌ Docker Compose is not available. Please install Docker Compose first."
    exit 1
fi

echo "✅ Prerequisites check passed"

# Install dependencies
echo "📦 Installing dependencies..."
pnpm install

# Create environment file if it doesn't exist
if [ ! -f .env ]; then
    echo "📝 Creating .env file from template..."
    cp env.example .env
    echo "⚠️  Please edit .env file with your configuration before starting services"
else
    echo "✅ .env file already exists"
fi

# Create necessary directories
echo "📁 Creating necessary directories..."
mkdir -p apps/web-platform/src/components/ui
mkdir -p apps/web-platform/src/stores
mkdir -p apps/web-platform/src/hooks
mkdir -p apps/web-platform/src/lib
mkdir -p apps/web-platform/src/types

# Build packages
echo "🔨 Building packages..."
pnpm build

echo ""
echo "🎉 Setup completed successfully!"
echo ""
echo "Next steps:"
echo "1. Edit .env file with your configuration"
echo "2. Run 'pnpm docker:up' to start infrastructure services"
echo "3. Run 'pnpm dev' to start development servers"
echo ""
echo "Access points:"
echo "- Web Platform: http://localhost:3000"
echo "- Orchestrator API: http://localhost:4000"
echo "- API Documentation: http://localhost:4000/api"
echo "- Example Tool: http://localhost:5001"
echo "- Tool Documentation: http://localhost:5001/api-docs"
echo "- Jaeger Tracing: http://localhost:16686"
echo ""
echo "For more information, see README.md" 