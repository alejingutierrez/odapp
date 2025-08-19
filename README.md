# Oda Fashion Platform

A comprehensive ERP/CRM/CDP platform specifically designed for the fashion industry, featuring real-time Shopify integration and modern web technologies.

## 🏗️ Architecture

This project uses a monorepo structure with the following packages:

- **apps/frontend** - React + Ant Design frontend application
- **apps/backend** - Node.js + Express API server
- **packages/shared** - Shared utilities and constants
- **packages/types** - TypeScript type definitions
- **packages/ui** - Reusable UI components
- **packages/utils** - Utility functions

## 🚀 Quick Start

### Prerequisites

- **Docker** and **Docker Compose** (v2.0+)
- **Git**
- **Node.js 18+** and **pnpm** (for local development)

### Docker Setup (Recommended)

#### 1. Clone the Repository

```bash
git clone <repository-url>
cd oda-platform
```

#### 2. Environment Configuration

```bash
# For development
cp .env.development.example .env.development

# For production
cp .env.production.example .env.production
```

Edit the environment files with your specific configuration values.

#### 3. Development Environment

**Start all development services:**

```bash
# Start infrastructure services (databases, message queues, etc.)
docker-compose up -d

# Optional: Include backend in Docker (add --profile backend)
docker-compose --profile backend up -d

# Optional: Include Storybook in Docker
docker-compose --profile storybook up -d
```

**Run database migrations:**

```bash
# If backend is running in Docker
docker-compose exec backend-dev pnpm run db:migrate
docker-compose exec backend-dev pnpm run db:seed

# If running backend locally
pnpm run db:migrate
pnpm run db:seed
```

**Start local development servers (if not using Docker profiles):**

```bash
# Install dependencies
pnpm install

# Start all applications
pnpm run dev

# Or start individually
pnpm run dev:backend
pnpm run dev:frontend
pnpm run dev:storybook
```

#### 4. Production Environment

**Build and deploy:**

```bash
# Set production environment variables
cp .env.production.example .env.production
# Edit .env.production with your production values

# Start production services
docker-compose -f docker-compose.prod.yml up -d

# Optional: Include Storybook
docker-compose -f docker-compose.prod.yml --profile storybook up -d

# Run database migrations
docker-compose -f docker-compose.prod.yml exec backend pnpm run db:migrate
```

### Service Access

#### Development

- **Frontend**: http://localhost:3000
- **Backend API**: http://localhost:3001
- **API Documentation**: http://localhost:3001/docs
- **Storybook**: http://localhost:6006
- **PostgreSQL**: localhost:5433 (user: oda_user, db: oda_dev)
- **Redis**: localhost:6380
- **Elasticsearch**: http://localhost:9200
- **Kibana**: http://localhost:5601
- **RabbitMQ Management**: http://localhost:15672 (user: oda_user)
- **MinIO Console**: http://localhost:9001 (user: oda_minio_user)
- **MailHog**: http://localhost:8025

#### Production

- **Frontend**: http://localhost:80 (configure reverse proxy)
- **Backend API**: http://localhost:3001
- **Storybook**: http://localhost:6006 (if enabled)
- Services use standard ports (configure firewall/proxy accordingly)

## 🛠️ Development

### Available Scripts

- `pnpm dev` - Start all development servers
- `pnpm build` - Build all packages
- `pnpm test` - Run all tests
- `pnpm lint` - Lint all packages
- `pnpm format` - Format code with Prettier

### Docker Management Commands

```bash
# Development
docker-compose up -d                    # Start infrastructure services
docker-compose --profile backend up -d  # Include backend service
docker-compose down                     # Stop all services
docker-compose logs -f [service]        # View service logs
docker-compose restart [service]        # Restart specific service

# Production
docker-compose -f docker-compose.prod.yml up -d
docker-compose -f docker-compose.prod.yml down
docker-compose -f docker-compose.prod.yml logs -f [service]

# Cleanup
docker-compose down -v                  # Remove containers and volumes
docker system prune -a                  # Clean up unused Docker resources
```

### Troubleshooting

**Common Issues:**

1. **Port conflicts**: Ensure ports 3000, 3001, 5432, 6379, 9200, etc. are available
2. **Permission issues**: Run `docker-compose down -v` and restart
3. **Database connection**: Wait for health checks to pass before running migrations
4. **Memory issues**: Increase Docker memory allocation (4GB+ recommended)

**Reset everything:**

```bash
docker-compose down -v
docker system prune -a
docker-compose up -d
```

- `pnpm type-check` - Run TypeScript type checking

### Storybook

- `pnpm --filter @oda/frontend storybook` - Start Storybook development server
- `pnpm --filter @oda/frontend build-storybook` - Build Storybook for production
- `pnpm docker:storybook` - Start Storybook in Docker
- `pnpm docker:storybook:logs` - View Storybook Docker logs

### Docker Services

- `pnpm docker:dev` - Start development services
- `pnpm docker:down` - Stop development services
- `pnpm docker:logs` - View service logs

Development services include:

- PostgreSQL (port 5433)
- Redis (port 6380)
- Elasticsearch (port 9200)
- Kibana (port 5601)
- RabbitMQ (port 5672, management: 15672)
- MinIO (port 9000, console: 9001)
- Storybook (port 6006)

### Database

- `pnpm db:migrate` - Run database migrations
- `pnpm db:seed` - Seed database with sample data
- `pnpm db:reset` - Reset database
- `pnpm db:studio` - Open Prisma Studio

## 🏛️ Technology Stack

### Frontend

- React 18 + TypeScript
- Ant Design 5.x
- Redux Toolkit + RTK Query
- React Router v6
- Vite + SWC
- Vitest + React Testing Library

### Backend

- Node.js 18 + TypeScript
- Express.js
- Prisma ORM
- PostgreSQL
- Redis
- JWT Authentication
- Zod Validation

### Infrastructure

- Docker + Docker Compose
- PostgreSQL 15
- Redis 7
- Elasticsearch 8
- RabbitMQ 3.12
- MinIO (S3-compatible storage)

## 📁 Project Structure

```
├── apps/
│   ├── frontend/          # React frontend application
│   └── backend/           # Node.js API server
├── packages/
│   ├── shared/            # Shared utilities
│   ├── types/             # TypeScript definitions
│   ├── ui/                # UI component library
│   └── utils/             # Utility functions
├── docker/                # Docker configuration
├── .husky/                # Git hooks
└── docs/                  # Documentation
```

## 🧪 Testing

Run tests across all packages:

```bash
pnpm test
```

Run tests for specific package:

```bash
pnpm --filter @oda/frontend test
pnpm --filter @oda/backend test
```

## 📝 Code Quality

This project uses:

- ESLint for code linting
- Prettier for code formatting
- Husky for git hooks
- Conventional commits

Pre-commit hooks will automatically:

- Lint and format staged files
- Validate commit message format
- Run type checking

## 🚀 Deployment

### Production Build

```bash
pnpm build
```

### Docker Production

```bash
docker build -f Dockerfile.frontend -t oda-frontend .
docker build -f Dockerfile.backend -t oda-backend .
```

## 📚 Documentation

- [API Documentation](./docs/api.md)
- [Frontend Architecture](./docs/frontend.md)
- [Backend Architecture](./docs/backend.md)
- [Database Schema](./docs/database.md)
- [Deployment Guide](./docs/deployment.md)
- [Storybook Docker Setup](./STORYBOOK_DOCKER.md)

## 🤝 Contributing

1. Fork the repository
2. Create a feature branch
3. Make your changes
4. Run tests and linting
5. Submit a pull request

## 📄 License

This project is proprietary and confidential.
