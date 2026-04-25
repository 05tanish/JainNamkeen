# Jain Namkeen E-commerce Platform

[![Node.js](https://img.shields.io/badge/Node.js-18+-339933?logo=node.js&logoColor=white)](https://nodejs.org/)
[![React](https://img.shields.io/badge/React-19-61DAFB?logo=react&logoColor=black)](https://reactjs.org/)
[![PostgreSQL](https://img.shields.io/badge/PostgreSQL-15-4169E1?logo=postgresql&logoColor=white)](https://www.postgresql.org/)
[![MongoDB](https://img.shields.io/badge/MongoDB-7-47A248?logo=mongodb&logoColor=white)](https://www.mongodb.com/)
[![Redis](https://img.shields.io/badge/Redis-7-DC382D?logo=redis&logoColor=white)](https://redis.io/)
[![Docker](https://img.shields.io/badge/Docker-Ready-2496ED?logo=docker&logoColor=white)](https://www.docker.com/)

Production-ready e-commerce platform with enterprise-grade architecture, comprehensive monitoring, and scalability features. Built with modern technologies and designed for cloud-native deployment.

## 🏗️ Architecture Overview

### Current Implementation ✅

```
┌─────────────────────────────────────────────────────────────────┐
│                         Load Balancer (Nginx)                    │
└────────────────────────────┬────────────────────────────────────┘
                             │
        ┌────────────────────┼────────────────────┐
        │                    │                    │
   ┌────▼─────┐        ┌────▼─────┐        ┌────▼─────┐
   │ Backend  │        │ Backend  │        │ Backend  │
   │ Instance │        │ Instance │        │ Instance │
   └────┬─────┘        └────┬─────┘        └────┬─────┘
        │                   │                    │
        └───────────────────┼────────────────────┘
                            │
        ┌───────────────────┼───────────────────┐
        │                   │                   │
   ┌────▼─────┐      ┌─────▼──────┐     ┌─────▼──────┐
   │PostgreSQL│      │  MongoDB   │     │   Redis    │
   │  (ACID)  │      │(Logs/Audit)│     │  (Cache)   │
   └──────────┘      └────────────┘     └────────────┘
        │                   │                   │
        └───────────────────┼───────────────────┘
                            │
                ┌───────────┼───────────┐
                │           │           │
         ┌──────▼─────┐ ┌──▼────────┐ ┌▼──────────┐
         │ Prometheus │ │  Grafana  │ │   Loki    │
         │  (Metrics) │ │(Dashboard)│ │  (Logs)   │
         └────────────┘ └───────────┘ └───────────┘
```

### Future Roadmap 🚀

```
┌──────────────────────────────────────────────────────────────────┐
│                    Cloudflare CDN + WAF + DDoS                    │
└────────────────────────────┬─────────────────────────────────────┘
                             │
┌────────────────────────────▼─────────────────────────────────────┐
│                  Cloud Load Balancer (AWS ALB/NLB)                │
└────────────────────────────┬─────────────────────────────────────┘
                             │
        ┌────────────────────┼────────────────────┐
        │                    │                    │
   ┌────▼─────────────┐ ┌───▼──────────────┐ ┌──▼──────────────┐
   │  Kubernetes Pod  │ │  Kubernetes Pod  │ │ Kubernetes Pod  │
   │  (Auto-scaling)  │ │  (Auto-scaling)  │ │ (Auto-scaling)  │
   └────┬─────────────┘ └───┬──────────────┘ └──┬──────────────┘
        │                   │                    │
        └───────────────────┼────────────────────┘
                            │
        ┌───────────────────┼───────────────────┐
        │                   │                   │
   ┌────▼─────────┐  ┌─────▼──────────┐  ┌────▼─────────┐
   │  PostgreSQL  │  │    MongoDB     │  │Redis Cluster │
   │  (Sharded)   │  │   (Replica)    │  │ (Sentinel)   │
   │  + Read      │  │                │  │              │
   │  Replicas    │  │                │  │              │
   └──────────────┘  └────────────────┘  └──────────────┘
        │                   │                   │
        └───────────────────┼───────────────────┘
                            │
                ┌───────────┼───────────┐
                │           │           │
         ┌──────▼─────┐ ┌──▼────────┐ ┌▼──────────┐
         │   Kafka    │ │ SonarQube │ │  Trivy    │
         │  (Events)  │ │(Code Qual)│ │(Security) │
         └────────────┘ └───────────┘ └───────────┘
```

## 🎯 Technology Stack

### ✅ Currently Implemented

| Layer | Technology | Purpose |
|-------|-----------|---------|
| **Frontend** | React 19, Vite, HeroUI | Modern UI with fast builds |
| **Backend** | Node.js 18+, Express 5 | RESTful API server |
| **ORM/ODM** | Prisma, Mongoose | Type-safe database access |
| **Databases** | PostgreSQL 15, MongoDB 7 | Transactional + Document store |
| **Cache** | Redis 7 | Session, cart, rate limiting |
| **Queue** | BullMQ | Async job processing |
| **Monitoring** | Prometheus, Grafana, Loki | Metrics, dashboards, logs |
| **Logging** | Winston | Structured logging |
| **Auth** | JWT, bcrypt | Secure authentication |
| **Validation** | Zod | Schema validation |
| **File Storage** | Cloudinary | Image optimization |
| **Email** | Resend | Transactional emails |
| **Payment** | Razorpay | Payment gateway |
| **Containerization** | Docker, Docker Compose | Local development |
| **Reverse Proxy** | Nginx | Load balancing, SSL termination |

### 🚀 Planned Enhancements

| Category | Technology | Purpose | Status |
|----------|-----------|---------|--------|
| **Orchestration** | Kubernetes (K8s) | Container orchestration, auto-scaling | 📋 Planned |
| **IaC** | Terraform | Infrastructure as Code | 📋 Planned |
| **CI/CD** | Jenkins, GitHub Actions | Automated pipelines | 📋 Planned |
| **Message Broker** | Apache Kafka | Event streaming, microservices | 📋 Planned |
| **CDN** | Cloudflare | Global content delivery | 📋 Planned |
| **Load Balancer** | AWS ALB/NLB, Nginx Plus | Advanced load balancing | 📋 Planned |
| **Code Quality** | SonarQube | Static code analysis | 📋 Planned |
| **Security Scan** | Trivy, Snyk | Vulnerability scanning | 📋 Planned |
| **API Gateway** | Kong, AWS API Gateway | Rate limiting, auth | 📋 Planned |
| **Service Mesh** | Istio | Microservices communication | 📋 Planned |
| **Secrets** | HashiCorp Vault | Secrets management | 📋 Planned |
| **Tracing** | Jaeger, OpenTelemetry | Distributed tracing | 📋 Planned |
| **Database** | PostgreSQL Sharding | Horizontal scaling | 📋 Planned |
| **Search** | Elasticsearch | Full-text search | 📋 Planned |

## ✨ Features

### Current Features ✅

**E-commerce Core:**
- Product catalog with categories and weight-based variants
- Shopping cart with price snapshot mechanism
- Order management with status tracking and fulfillment
- Payment processing (Razorpay integration)
- Coupon and discount system
- Product reviews and ratings
- User notifications
- CMS for pages and banners

**Security & Authentication:**
- JWT authentication with httpOnly cookies
- Email verification with OTP (Resend)
- Role-based access control (Admin, Staff, Customer)
- Disposable email blocking (100+ domains)
- Rate limiting (100 requests/15 minutes)
- CSRF protection
- Helmet security headers
- Comprehensive audit logging
- Input validation with Zod schemas
- SQL/NoSQL injection prevention

**Admin Dashboard:**
- User management (CRUD, role assignment, suspension)
- Product and inventory management
- Order processing and fulfillment
- Staff attendance tracking
- Business analytics and reporting
- Banner and promotional content management
- Coupon management

**Monitoring & Observability:**
- Prometheus metrics (HTTP, business, system)
- Grafana dashboards (4 pre-configured)
- Loki log aggregation
- Winston structured logging
- Request ID tracking
- Health check endpoints
- Performance monitoring

**Performance:**
- Redis caching (sessions, cart, product catalog)
- BullMQ async job processing
- Database connection pooling
- Cloudinary image optimization
- Nginx reverse proxy

### Planned Features 🚀

**Scalability:**
- Kubernetes deployment with horizontal pod autoscaling (HPA)
- PostgreSQL read replicas and sharding
- Redis Cluster with Sentinel for high availability
- Multi-region deployment
- Database connection pooling optimization
- CDN integration for static assets

**Security Enhancements:**
- Web Application Firewall (WAF) with Cloudflare
- DDoS protection
- Secrets management with HashiCorp Vault
- Container security scanning with Trivy
- SAST/DAST with SonarQube
- OAuth2/OpenID Connect integration
- Two-factor authentication (2FA)
- API rate limiting per user/endpoint

**DevOps & CI/CD:**
- Jenkins pipeline for automated builds
- Terraform for infrastructure provisioning
- Kubernetes manifests and Helm charts
- Blue-green and canary deployments
- Automated database migrations
- Integration and E2E testing in pipeline
- Container registry (AWS ECR, Docker Hub)

**Architecture Improvements:**
- Microservices architecture with API Gateway
- Event-driven architecture with Kafka
- Service mesh with Istio
- Distributed tracing with Jaeger
- GraphQL API layer
- WebSocket for real-time features
- Elasticsearch for advanced search

**Performance & Reliability:**
- Multi-level caching strategy (L1: Redis, L2: CDN)
- Database query optimization and indexing
- Connection pooling and circuit breakers
- Graceful degradation and fallback mechanisms
- Chaos engineering with Chaos Monkey
- Load testing with k6/JMeter

## 🚀 Quick Start

### Prerequisites

- Node.js 18+ and npm 9+
- Docker 20.10+ and Docker Compose v2
- Git

### Installation

```bash
# 1. Clone repository
git clone https://github.com/yourusername/ecommerce2.git
cd ecommerce2

# 2. Configure environment variables
cp .env.example .env
# Edit .env with your credentials (see Environment Variables section)

# 3. Start all services with Docker Compose
docker-compose up -d

# 4. Initialize database
cd apps/backend
npm install
npm run prisma:generate
npm run prisma:migrate
node prisma/seed.js

# 5. Verify installation
npm run db:verify
```

### Access Services

| Service | URL | Credentials |
|---------|-----|-------------|
| **Frontend** | http://localhost:3000 | - |
| **Backend API** | http://localhost:5000 | - |
| **API Health** | http://localhost:5000/api/health | - |
| **Prometheus** | http://localhost:9090 | - |
| **Grafana** | http://localhost:3001 | admin / admin |
| **Prisma Studio** | http://localhost:5555 | `npm run prisma:studio` |

## 🔧 Development

### Backend Development

```bash
cd apps/backend

# Start development server with hot reload
npm run dev

# Start background job worker
npm run dev:worker

# Database operations
npm run prisma:studio      # Open database GUI
npm run prisma:migrate     # Run migrations
npm run prisma:generate    # Generate Prisma Client
npm run db:verify          # Verify database integrity

# Maintenance
npm run logs:clean         # Clean old log files
```

### Frontend Development

```bash
cd apps/frontend

# Start development server
npm run dev

# Build for production
npm run build

# Preview production build
npm run preview

# Run linter
npm run lint
```

### Testing

```bash
# Unit tests
npm test

# Integration tests
npm run test:integration

# End-to-end tests
npm run test:e2e

# Code coverage
npm run test:coverage

# Security audit
npm audit
```

## 📡 API Documentation

### Base URL
```
Development: http://localhost:5000/api
Production: https://api.jainnamkeen.com/api
```

### Authentication Endpoints

| Method | Endpoint | Description | Auth |
|--------|----------|-------------|------|
| `POST` | `/auth/register` | Register new user | ❌ |
| `POST` | `/auth/login` | Login user | ❌ |
| `POST` | `/auth/logout` | Logout user | ✅ |
| `GET` | `/auth/me` | Get current user | ✅ |
| `PUT` | `/auth/profile` | Update profile | ✅ |
| `PUT` | `/auth/password` | Change password | ✅ |
| `POST` | `/auth/verify-email` | Verify email with OTP | ❌ |
| `POST` | `/auth/forgot-password` | Request password reset | ❌ |
| `POST` | `/auth/reset-password` | Reset password | ❌ |

### Product Endpoints

| Method | Endpoint | Description | Auth |
|--------|----------|-------------|------|
| `GET` | `/products` | List products (filters, pagination) | ❌ |
| `GET` | `/products/:id` | Get product details | ❌ |
| `GET` | `/products/trending` | Get trending products | ❌ |
| `GET` | `/products/suggest` | Auto-suggest search | ❌ |
| `POST` | `/products` | Create product | 👤 Admin/Staff |
| `PUT` | `/products/:id` | Update product | 👤 Admin/Staff |
| `DELETE` | `/products/:id` | Delete product | 👤 Admin |

### Order Endpoints

| Method | Endpoint | Description | Auth |
|--------|----------|-------------|------|
| `POST` | `/orders` | Create order | ✅ |
| `GET` | `/orders` | List user orders | ✅ |
| `GET` | `/orders/:id` | Get order details | ✅ |
| `PUT` | `/orders/:id/status` | Update order status | 👤 Admin/Staff |
| `PUT` | `/orders/:id/tracking` | Update tracking info | 👤 Admin/Staff |
| `POST` | `/orders/:id/request-return` | Request return | ✅ |
| `POST` | `/orders/:id/refund` | Process refund | 👤 Admin |

### Cart Endpoints

| Method | Endpoint | Description | Auth |
|--------|----------|-------------|------|
| `GET` | `/cart` | Get user cart | ✅ |
| `POST` | `/cart` | Add item to cart | ✅ |
| `PUT` | `/cart/:productId` | Update item quantity | ✅ |
| `DELETE` | `/cart/:productId` | Remove item | ✅ |
| `DELETE` | `/cart/clear` | Clear cart | ✅ |

### Payment Endpoints

| Method | Endpoint | Description | Auth |
|--------|----------|-------------|------|
| `POST` | `/payments/create-order` | Create Razorpay order | ✅ |
| `POST` | `/payments/verify` | Verify payment signature | ✅ |

### System Endpoints

| Method | Endpoint | Description | Auth |
|--------|----------|-------------|------|
| `GET` | `/health` | Health check | ❌ |
| `GET` | `/metrics` | Prometheus metrics | ❌ |

**Full API Documentation:** [Backend README](apps/backend/README.md)

## 🔐 Environment Variables

```bash
# ── Application ──────────────────────────────────────────────
NODE_ENV=development
PORT=5000

# ── Database Connections ─────────────────────────────────────
DATABASE_URL=postgresql://postgres:password@localhost:5432/ecommerce
MONGODB_URI=mongodb://localhost:27017/ecommerce
REDIS_URL=redis://localhost:6379

# ── Authentication ───────────────────────────────────────────
# Generate: openssl rand -base64 64
JWT_SECRET=your-cryptographically-secure-secret-minimum-64-characters
JWT_EXPIRE=7d
JWT_COOKIE_EXPIRE=7

# ── Email Service (Resend) ───────────────────────────────────
RESEND_API_KEY=re_your_api_key_here
EMAIL_FROM=Jain Namkeen <noreply@jainnamkeen.com>

# ── File Storage (Cloudinary) ────────────────────────────────
CLOUDINARY_CLOUD_NAME=your_cloud_name
CLOUDINARY_API_KEY=your_api_key
CLOUDINARY_API_SECRET=your_api_secret

# ── Payment Gateway (Razorpay) ───────────────────────────────
RAZORPAY_KEY_ID=rzp_test_your_key_id
RAZORPAY_KEY_SECRET=your_key_secret

# ── CORS Configuration ───────────────────────────────────────
FRONTEND_URL=http://localhost:3000

# ── Monitoring (Optional) ────────────────────────────────────
LOKI_HOST=http://localhost:3100
ENABLE_FILE_LOGGING=true
```

## 📊 Monitoring & Observability

### Current Implementation ✅

**Prometheus Metrics:**
- HTTP metrics: `http_requests_total`, `http_request_duration_seconds`, `http_requests_in_progress`
- Business metrics: `orders_total`, `revenue_total`, `cart_operations_total`, `products_total`
- System metrics: `nodejs_heap_size_used_bytes`, `nodejs_eventloop_lag_seconds`

**Grafana Dashboards:**
1. HTTP Performance (latency, throughput, error rate)
2. Business Metrics (orders, revenue, conversions)
3. System Health (CPU, memory, event loop)
4. Error Tracking (error rates, failed requests)

**Logging:**
- Winston structured logging (JSON format)
- Log files: `combined.log`, `error.log`, `http.log`, `audit.log`
- Loki integration for centralized log aggregation
- Request ID correlation across services

**Health Checks:**
- Liveness probe: `/api/health`
- Readiness probe: Database + Redis connectivity

### Planned Enhancements 🚀

- Distributed tracing with Jaeger/OpenTelemetry
- APM with Datadog/New Relic
- Real-time alerting with PagerDuty/Opsgenie
- Custom business dashboards
- Log retention policies and archival
- Anomaly detection with ML

## 🚀 Deployment

### Current Deployment ✅

**Docker Compose (Development/Staging):**
```bash
# Start all services
docker-compose up -d

# With monitoring stack
docker-compose -f docker-compose.yml \
               -f monitoring/docker-compose.monitoring.yml up -d

# View logs
docker-compose logs -f backend

# Stop services
docker-compose down
```

### Planned Deployment Strategies 🚀

#### 1. Kubernetes (Production)

```bash
# Apply Kubernetes manifests
kubectl apply -f k8s/

# Deploy with Helm
helm install jain-namkeen ./helm-chart

# Auto-scaling configuration
kubectl autoscale deployment backend --cpu-percent=70 --min=3 --max=10
```

**Features:**
- Horizontal Pod Autoscaling (HPA)
- Rolling updates with zero downtime
- Health checks and self-healing
- ConfigMaps and Secrets management
- Ingress with SSL/TLS termination

#### 2. Terraform (Infrastructure as Code)

```bash
# Initialize Terraform
terraform init

# Plan infrastructure changes
terraform plan

# Apply infrastructure
terraform apply

# Destroy infrastructure
terraform destroy
```

**Provisions:**
- AWS EKS/ECS cluster
- RDS PostgreSQL with Multi-AZ
- ElastiCache Redis cluster
- S3 buckets for static assets
- CloudFront CDN distribution
- Route53 DNS configuration
- VPC, subnets, security groups

#### 3. CI/CD Pipeline (Jenkins/GitHub Actions)

```yaml
# Pipeline stages
1. Code checkout
2. Dependency installation
3. Linting and code quality (SonarQube)
4. Unit and integration tests
5. Security scanning (Trivy, Snyk)
6. Docker image build
7. Push to container registry
8. Deploy to staging
9. E2E tests
10. Deploy to production (approval required)
11. Smoke tests
12. Rollback on failure
```

#### 4. Cloud Deployment Options

| Provider | Services | Use Case |
|----------|----------|----------|
| **AWS** | EKS, ECS, RDS, ElastiCache, S3, CloudFront | Enterprise production |
| **GCP** | GKE, Cloud SQL, Memorystore, Cloud Storage | Global scale |
| **Azure** | AKS, Azure Database, Redis Cache | Enterprise integration |
| **DigitalOcean** | Kubernetes, Managed Databases | Cost-effective |
| **Railway** | Platform deployment | Rapid prototyping |

## 🔒 Security

### Current Implementation ✅

- JWT authentication with httpOnly cookies
- bcrypt password hashing (cost factor: 12)
- Rate limiting (100 requests/15 minutes per IP)
- CORS whitelist configuration
- Helmet security headers (XSS, clickjacking, MIME-sniffing)
- Input validation with Zod schemas
- SQL injection prevention (Prisma parameterized queries)
- NoSQL injection prevention (Mongoose sanitization)
- CSRF protection (double-submit cookie)
- Disposable email blocking (100+ domains)
- Comprehensive audit logging
- Email verification with OTP

### Planned Enhancements 🚀

- **WAF**: Cloudflare Web Application Firewall
- **DDoS Protection**: Cloudflare, AWS Shield
- **Secrets Management**: HashiCorp Vault, AWS Secrets Manager
- **Container Security**: Trivy vulnerability scanning
- **Code Analysis**: SonarQube SAST, Snyk dependency scanning
- **OAuth2/OIDC**: Social login integration
- **2FA**: Two-factor authentication with TOTP
- **API Security**: Kong API Gateway with rate limiting
- **Network Security**: VPC, private subnets, security groups
- **Compliance**: GDPR, PCI-DSS compliance measures
- **Penetration Testing**: Regular security audits

## 📈 Performance & Scalability

### Current Implementation ✅

**Caching:**
- Redis for sessions, cart state, product catalog
- Cache TTL: Sessions (7 days), Cart (30 days), Products (1 hour)

**Async Processing:**
- BullMQ job queues for email sending, order processing
- Background workers for non-blocking operations

**Database:**
- Prisma connection pooling
- Mongoose connection management
- Indexed queries for performance

**Optimization:**
- Cloudinary image optimization (WebP, auto-format)
- Nginx reverse proxy with gzip compression

### Planned Enhancements 🚀

**Horizontal Scaling:**
- Kubernetes HPA based on CPU/memory/custom metrics
- PostgreSQL read replicas for read-heavy workloads
- Database sharding for horizontal partitioning
- Redis Cluster for distributed caching
- Multi-region deployment for global users

**Performance:**
- CDN integration (Cloudflare, CloudFront) for static assets
- Database query optimization and materialized views
- Connection pooling optimization
- GraphQL for efficient data fetching
- Server-side rendering (SSR) for SEO
- Code splitting and lazy loading

**Reliability:**
- Circuit breakers for external services
- Retry mechanisms with exponential backoff
- Graceful degradation and fallback strategies
- Health checks and auto-recovery
- Database backup and point-in-time recovery

**Event-Driven Architecture:**
- Apache Kafka for event streaming
- Microservices communication via message broker
- Event sourcing for audit trails
- CQRS pattern for read/write separation

## 🧪 Testing Strategy

### Current Testing ✅

```bash
# Unit tests
npm test

# Linting
npm run lint

# Security audit
npm audit
```

### Planned Testing 🚀

```bash
# Integration tests
npm run test:integration

# End-to-end tests (Playwright/Cypress)
npm run test:e2e

# Load testing (k6, JMeter)
npm run test:load

# Security testing
npm run test:security

# Code coverage
npm run test:coverage

# Mutation testing
npm run test:mutation
```

**CI/CD Integration:**
- Automated testing in Jenkins pipeline
- Code coverage reports (Codecov, Coveralls)
- Performance regression testing
- Visual regression testing
- Accessibility testing (axe-core)

## 📁 Project Structure

```
ecommerce2/
├── apps/
│   ├── backend/                 # Node.js Express API
│   │   ├── src/
│   │   │   ├── config/          # Database, Redis, Cloudinary configs
│   │   │   ├── middleware/      # Auth, validation, metrics, logging
│   │   │   ├── modules/         # Feature modules
│   │   │   │   ├── auth/        # Authentication & authorization
│   │   │   │   ├── products/    # Product management
│   │   │   │   ├── orders/      # Order processing
│   │   │   │   ├── cart/        # Shopping cart
│   │   │   │   ├── users/       # User management
│   │   │   │   ├── payments/    # Payment processing
│   │   │   │   ├── coupons/     # Discount coupons
│   │   │   │   ├── reviews/     # Product reviews
│   │   │   │   └── ...
│   │   │   ├── queues/          # BullMQ job workers
│   │   │   ├── utils/           # Helpers, logger, email service
│   │   │   ├── App.js           # Express app configuration
│   │   │   └── server.js        # Application entry point
│   │   ├── prisma/              # PostgreSQL schema & migrations
│   │   ├── logs/                # Application logs
│   │   └── dockerfile           # Backend container image
│   └── frontend/                # React application
│       ├── src/
│       │   ├── components/      # Reusable UI components
│       │   ├── pages/           # Page components
│       │   ├── context/         # React Context providers
│       │   ├── hooks/           # Custom React hooks
│       │   ├── utils/           # Helper functions
│       │   └── App.jsx          # Root component
│       └── dockerfile           # Frontend container image
├── monitoring/                  # Monitoring stack
│   ├── docker-compose.monitoring.yml
│   ├── prometheus/
│   │   └── prometheus.yml       # Prometheus configuration
│   └── grafana/
│       └── dashboards/          # Pre-configured dashboards
├── k8s/                         # 🚀 Kubernetes manifests (planned)
│   ├── backend/
│   ├── frontend/
│   ├── databases/
│   └── monitoring/
├── terraform/                   # 🚀 Infrastructure as Code (planned)
│   ├── aws/
│   ├── gcp/
│   └── modules/
├── .github/                     # 🚀 GitHub Actions workflows (planned)
│   └── workflows/
├── jenkins/                     # 🚀 Jenkins pipeline (planned)
│   └── Jenkinsfile
├── docs/                        # Documentation
├── docker-compose.yml           # Local development setup
├── nginx.conf                   # Nginx configuration
└── README.md
```

## 🤝 Contributing

We welcome contributions! Please follow these guidelines:

1. Fork the repository
2. Create a feature branch: `git checkout -b feature/amazing-feature`
3. Commit your changes: `git commit -m "feat: add amazing feature"`
4. Push to the branch: `git push origin feature/amazing-feature`
5. Open a Pull Request

**Commit Convention:**
- `feat:` New feature
- `fix:` Bug fix
- `docs:` Documentation changes
- `style:` Code formatting
- `refactor:` Code refactoring
- `test:` Adding tests
- `chore:` Maintenance tasks

## 📄 License

ISC License - Copyright (c) 2026 Jain Namkeen

## 📞 Support

- **Documentation**: [Backend API](apps/backend/README.md)
- **Issues**: [GitHub Issues](https://github.com/05tanish/jainnamkeen/issues)
- **Security**: tanishjain626@gmail.com
- **Email**: tanishjain626@gmail.com

---

**Built with ❤️ by the TanishJain**

*Current Version: 1.0.0 | Production-Ready with Planned Enterprise Features*
