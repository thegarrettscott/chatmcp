# ChatMCP Platform

A ChatGPT-style web platform with Auth0-GenAI-secured MCP agent integration, built with Next.js, NestJS, and Express.

## 🏗️ Architecture

The platform consists of three main components:

### 1. Web Platform (`apps/web-platform`)
- **Next.js 14** with React and TypeScript
- **Auth0 GenAI SDK** for authentication
- **Tailwind CSS** + **shadcn/ui** for modern UI
- **Zustand** for state management
- **Dexie** for IndexedDB storage
- ChatGPT-like interface with conversation management

### 2. Orchestrator (`apps/orchestrator`)
- **NestJS** backend with TypeScript
- **OpenAI /responses** API integration
- **PostgreSQL** with pgvector for conversation storage
- **Redis** for caching and tool management
- **OpenTelemetry** + **Jaeger** for tracing
- MCP tool execution and streaming

### 3. Example Tool (`services/example-tool`)
- **Express.js** MCP server
- **Auth0 JWT** verification
- **OpenAPI** schema generation
- Weather data API example

## 🚀 Quick Start

### Prerequisites
- Node.js 18+
- pnpm 8+
- Docker & Docker Compose
- PostgreSQL with pgvector extension
- Redis

### 1. Clone and Install
```bash
git clone <repository-url>
cd ChatMCP
pnpm install
```

### 2. Environment Setup
```bash
cp env.example .env
```

Edit `.env` with your configuration:
```env
# Auth0 Configuration
AUTH0_DOMAIN=your-domain.auth0.com
AUTH0_CLIENT_ID=your-client-id
AUTH0_CLIENT_SECRET=your-client-secret
AUTH0_AUDIENCE=https://api.chatmcp.com

# OpenAI Configuration
OPENAI_API_KEY=sk-your-openai-api-key

# Database Configuration
DATABASE_URL=postgresql://postgres:password@localhost:5432/chatmcp

# Redis Configuration
REDIS_URL=redis://localhost:6379
```

### 3. Start Services
```bash
# Start infrastructure services
pnpm docker:up

# Start development servers
pnpm dev
```

### 4. Access the Platform
- **Web Platform**: http://localhost:3000
- **Orchestrator API**: http://localhost:4000
- **API Documentation**: http://localhost:4000/api
- **Example Tool**: http://localhost:5001
- **Tool Documentation**: http://localhost:5001/api-docs
- **Jaeger Tracing**: http://localhost:16686

## 📁 Project Structure

```
ChatMCP/
├── apps/
│   ├── web-platform/          # Next.js frontend
│   │   ├── src/
│   │   │   ├── app/          # App router pages
│   │   │   ├── components/   # React components
│   │   │   ├── stores/       # Zustand stores
│   │   │   ├── types/        # TypeScript types
│   │   │   └── lib/          # Utilities
│   │   └── package.json
│   └── orchestrator/         # NestJS backend
│       ├── src/
│       │   ├── agent/        # Agent controller/service
│       │   ├── auth/         # Auth0 integration
│       │   ├── database/     # Database entities
│       │   └── redis/        # Redis service
│       └── package.json
├── services/
│   └── example-tool/         # Express MCP tool
│       ├── src/
│       │   ├── routes/       # API routes
│       │   └── index.ts      # Server entry
│       └── package.json
├── infra/
│   ├── postgres/             # Database schema
│   └── k8s/                  # Kubernetes manifests
├── docker-compose.yml        # Development services
├── turbo.json               # Turbo configuration
└── package.json             # Root package.json
```

## 🔧 Development

### Available Scripts

```bash
# Root level
pnpm dev              # Start all services in development
pnpm build            # Build all packages
pnpm lint             # Lint all packages
pnpm test             # Run tests
pnpm docker:up        # Start Docker services
pnpm docker:down      # Stop Docker services

# Individual services
pnpm --filter web-platform dev
pnpm --filter orchestrator dev
pnpm --filter example-tool dev
```

### Adding New MCP Tools

1. Create a new service in `services/`
2. Implement Auth0 JWT verification
3. Expose OpenAPI schema at `/schema`
4. Register the tool URL in the web platform

Example tool structure:
```typescript
// services/my-tool/src/index.ts
import express from 'express';
import { authenticateJWT } from './auth';

const app = express();
app.use(authenticateJWT);

app.post('/my-function', async (req, res) => {
  // Tool implementation
  res.json({ result: 'success' });
});

app.get('/schema', (req, res) => {
  // Return OpenAPI schema
  res.json(schema);
});
```

## 🔒 Security

- **Auth0 GenAI SDK** for secure authentication
- **JWT verification** on all MCP tools
- **CORS** configuration for cross-origin requests
- **Rate limiting** on API endpoints
- **SPIFFE/SPIRE** for mTLS in production
- **Environment-based** configuration

## 📊 Monitoring & Observability

- **OpenTelemetry** instrumentation
- **Jaeger** for distributed tracing
- **Health checks** on all services
- **Structured logging** with correlation IDs

## 🚀 Production Deployment

### Kubernetes Deployment

```bash
# Apply Kubernetes manifests
kubectl apply -f infra/k8s/

# Set up secrets
kubectl create secret generic auth0-secrets \
  --from-literal=domain=your-domain.auth0.com \
  --from-literal=client-id=your-client-id \
  --from-literal=client-secret=your-client-secret
```

### Environment Variables

Ensure all required environment variables are set in your production environment:

- `AUTH0_DOMAIN`
- `AUTH0_CLIENT_ID`
- `AUTH0_CLIENT_SECRET`
- `AUTH0_AUDIENCE`
- `OPENAI_API_KEY`
- `DATABASE_URL`
- `REDIS_URL`

## 🧪 Testing

```bash
# Run all tests
pnpm test

# Run tests for specific package
pnpm --filter web-platform test
pnpm --filter orchestrator test
pnpm --filter example-tool test

# Run E2E tests
pnpm --filter web-platform test:e2e
```

## 📝 API Documentation

- **Orchestrator API**: http://localhost:4000/api
- **Example Tool API**: http://localhost:5001/api-docs

## 🤝 Contributing

1. Fork the repository
2. Create a feature branch
3. Make your changes
4. Add tests
5. Submit a pull request

## 📄 License

MIT License - see LICENSE file for details.

## 🆘 Support

For issues and questions:
1. Check the documentation
2. Search existing issues
3. Create a new issue with detailed information

---

Built with ❤️ using Next.js, NestJS, and Express # Trigger deployment
# Environment variable updated
