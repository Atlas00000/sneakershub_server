# 🚀 SneakersHub Server

<div align="center">

**Express.js API server for managing materials and assets from Cloudflare R2**

[![Express](https://img.shields.io/badge/Express-4.18-green?style=for-the-badge&logo=express)](https://expressjs.com/)
[![TypeScript](https://img.shields.io/badge/TypeScript-5.2-blue?style=for-the-badge&logo=typescript)](https://www.typescriptlang.org/)
[![AWS SDK](https://img.shields.io/badge/AWS_SDK-3.958-orange?style=for-the-badge&logo=amazon-aws)](https://aws.amazon.com/sdk-for-javascript/)

[API](#-api-endpoints) • [Setup](#-setup) • [Testing](#-testing) • [Deployment](#-deployment)

</div>

---

## 📋 Table of Contents

- [Overview](#-overview)
- [Features](#-features)
- [API Endpoints](#-api-endpoints)
- [Architecture](#-architecture)
- [Setup](#-setup)
- [Configuration](#-configuration)
- [Testing](#-testing)
- [Development](#-development)
- [Deployment](#-deployment)

---

## 🎯 Overview

The SneakersHub Server is a lightweight Express.js API that provides endpoints for:

- **Material Management** - Automatically discover and generate material definitions from Cloudflare R2
- **Asset Listing** - List and inspect files stored in R2 buckets
- **Material Generation** - Parse texture files and create material JSON configurations
- **Health Monitoring** - Health check endpoints for monitoring and load balancing

This server acts as a bridge between the frontend configurator and Cloudflare R2 object storage, enabling automated material ingestion without manual configuration.

### Key Capabilities

- 🔍 **Automated Discovery** - Recursively scan R2 buckets for texture files
- 📦 **Material Generation** - Create material definitions from file patterns
- 🔄 **CORS Support** - Cross-origin requests with configurable origins
- 📊 **Logging** - Comprehensive logging with structured output
- 🚀 **Performance** - Efficient file listing with pagination support
- 🔒 **Secure** - Environment-based configuration for credentials

---

## ✨ Features

### 🔍 Automated Material Discovery

- **Recursive File Scanning** - Searches R2 buckets for texture files
- **Pattern Recognition** - Automatically identifies material sets from file names
- **Category Detection** - Categorizes materials (leather, rubber, fabric, metal, premium)
- **Texture Mapping** - Maps albedo, normal, roughness, and metallic textures
- **File Validation** - Validates file extensions and naming conventions

### 📦 Material Generation

- **JSON Output** - Generates material definitions in configurator format
- **PBR Properties** - Sets up physically-based rendering properties
- **Color Optimization** - Automatically sets appropriate colors for materials
- **Category Assignment** - Assigns categories based on material type
- **Price Modifiers** - Configurable pricing based on material category

### 📊 Logging & Monitoring

- **Structured Logging** - JSON-formatted logs with log levels
- **Request Logging** - HTTP request/response logging
- **Error Tracking** - Comprehensive error logging with stack traces
- **Scoped Loggers** - Contextual logging with scope identifiers
- **Environment Awareness** - Different log levels for development/production

### 🔄 API Features

- **RESTful Design** - Clean REST API with proper HTTP methods
- **CORS Support** - Configurable CORS origins for client access
- **Error Handling** - Centralized error handling middleware
- **Health Checks** - Health check endpoints for monitoring
- **Type Safety** - Full TypeScript coverage

---

## 📡 API Endpoints

### Health Check

#### `GET /health`

Returns server health status.

**Response:**
```json
{
  "status": "ok",
  "message": "Server is running"
}
```

### Materials

#### `GET /api/materials/list`

Lists all materials discovered from R2 bucket.

**Response:**
```json
{
  "success": true,
  "count": 150,
  "materials": [
    {
      "name": "material_name",
      "category": "leather",
      "textures": {
        "albedo": "https://...",
        "normal": "https://...",
        "roughness": "https://...",
        "metallic": "https://..."
      }
    }
  ],
  "files": 150
}
```

#### `GET /api/materials/generate`

Generates material definitions from R2 bucket files.

**Response:**
```json
{
  "success": true,
  "count": 150,
  "materials": [
    {
      "id": "material_id",
      "name": "Material Name",
      "category": "leather",
      "description": "Material description",
      "properties": {
        "color": "#FFFFFF",
        "textures": {
          "albedo": "https://...",
          "normal": "https://...",
          "roughness": "https://...",
          "metallic": "https://..."
        }
      },
      "priceModifier": 1.0,
      "premium": false
    }
  ]
}
```

#### `GET /api/materials/debug`

Debug endpoint to inspect R2 bucket contents and configuration.

**Response:**
```json
{
  "success": true,
  "bucket": "threejs-assets",
  "endpoint": "https://...",
  "filesFound": 500,
  "files": [
    "threejs-assets/textures/leather/albedo.jpg",
    "threejs-assets/textures/leather/normal.jpg"
  ],
  "prefix": "threejs-assets/textures/"
}
```

---

## 🏗️ Architecture

```
┌─────────────────────────────────────────────────────────┐
│                  Express Server                         │
│                                                         │
│  ┌──────────────┐  ┌──────────────┐  ┌──────────────┐ │
│  │  Middleware  │  │    Routes    │  │   Services   │ │
│  │              │  │              │  │              │ │
│  │  • CORS      │  │  • Materials │  │  • R2 Client │ │
│  │  • Logger    │  │  • Health    │  │  • File List │ │
│  │  • JSON      │  │              │  │  • Parsing   │ │
│  └──────────────┘  └──────────────┘  └──────────────┘ │
└─────────────────────────────────────────────────────────┘
                          ↕
┌─────────────────────────────────────────────────────────┐
│              Cloudflare R2 (S3-Compatible)              │
│                                                         │
│  ┌──────────────┐  ┌──────────────┐                   │
│  │   Textures   │  │   Materials  │                   │
│  │              │  │              │                   │
│  │  • Albedo    │  │  • JSON      │                   │
│  │  • Normal    │  │  • Config    │                   │
│  │  • Roughness │  │              │                   │
│  │  • Metallic  │  │              │                   │
│  └──────────────┘  └──────────────┘                   │
└─────────────────────────────────────────────────────────┘
```

### Request Flow

```
Client Request
      ↓
CORS Middleware
      ↓
Request Logger
      ↓
Route Handler
      ↓
R2 Service (List/Parse Files)
      ↓
Response Formatter
      ↓
Error Handler (if error)
      ↓
Client Response
```

---

## 🚀 Setup

### Prerequisites

- **Node.js** 18+
- **pnpm** (recommended) or npm/yarn
- **Cloudflare R2 Account** with bucket and credentials

### Installation

1. **Navigate to server directory**
   ```bash
   cd server
   ```

2. **Install dependencies**
   ```bash
   pnpm install
   ```

3. **Set up environment variables**

   Create `.env`:
   ```env
   PORT=3001
   NODE_ENV=development
   CORS_ORIGIN=http://localhost:3000,http://localhost:3001
   
   # Cloudflare R2 Configuration
   CLOUDFLARE_R2_BUCKET_NAME=threejs-assets
   CLOUDFLARE_R2_ENDPOINT=https://your-endpoint.r2.cloudflarestorage.com
   CLOUDFLARE_R2_ACCESS_KEY_ID=your-access-key-id
   CLOUDFLARE_R2_SECRET_ACCESS_KEY=your-secret-access-key
   R2_PUBLIC_URL=https://pub-your-bucket.r2.dev
   ```

4. **Build TypeScript**
   ```bash
   pnpm build
   ```

5. **Start development server**
   ```bash
   pnpm dev
   # → http://localhost:3001
   ```

6. **Start production server**
   ```bash
   pnpm start
   # → http://localhost:3001
   ```

---

## ⚙️ Configuration

### Environment Variables

| Variable | Description | Required | Default |
|----------|-------------|----------|---------|
| `PORT` | Server port | No | `3001` |
| `NODE_ENV` | Environment (development/production) | No | `development` |
| `CORS_ORIGIN` | Allowed CORS origins (comma-separated) | No | `*` |
| `CLOUDFLARE_R2_BUCKET_NAME` | R2 bucket name | Yes | - |
| `CLOUDFLARE_R2_ENDPOINT` | R2 endpoint URL | Yes | - |
| `CLOUDFLARE_R2_ACCESS_KEY_ID` | R2 access key ID | Yes | - |
| `CLOUDFLARE_R2_SECRET_ACCESS_KEY` | R2 secret access key | Yes | - |
| `R2_PUBLIC_URL` | Public R2 bucket URL | Yes | - |

### CORS Configuration

CORS origins can be configured via `CORS_ORIGIN` environment variable:

```env
# Single origin
CORS_ORIGIN=http://localhost:3000

# Multiple origins (comma-separated)
CORS_ORIGIN=http://localhost:3000,https://yourdomain.com
```

### Logging Configuration

Logging behavior is controlled by `NODE_ENV`:

- **Development**: All log levels (DEBUG, INFO, WARN, ERROR)
- **Production**: INFO, WARN, ERROR only

---

## 📁 Project Structure

```
server/
├── 📂 src/
│   ├── 📂 routes/
│   │   └── materials.ts      # Material API routes
│   ├── 📂 utils/
│   │   └── logger.ts         # Logging utility
│   └── server.ts             # Express server setup
│
├── 📂 dist/                  # Compiled JavaScript (generated)
│   ├── routes/
│   ├── utils/
│   └── server.js
│
├── .env                      # Environment variables
├── .env.example              # Example environment variables
├── package.json
├── tsconfig.json
└── README.md
```

---

## 🧪 Testing

### Testing Philosophy

We follow industry best practices for backend testing:

- **Unit Tests** - Test individual functions and utilities
- **Integration Tests** - Test API endpoints and R2 interactions
- **Mocking** - Mock external services (R2) for isolated testing
- **Coverage** - Aim for >80% code coverage
- **API Testing** - Test HTTP endpoints with proper status codes

### Testing Tools

| Tool | Purpose | Usage |
|------|---------|-------|
| **Jest** | Test runner and assertion library | Unit and integration tests |
| **Supertest** | HTTP assertion library | API endpoint testing |
| **@aws-sdk/client-s3 (Mocked)** | Mock R2/S3 client | R2 service mocking |

### Test Structure

```
tests/
├── unit/                    # Unit tests
│   ├── utils/
│   └── services/
├── integration/             # Integration tests
│   └── routes/
├── fixtures/                # Test fixtures and mock data
│   └── r2-responses.json
└── utils/                   # Test utilities
    └── test-helpers.ts
```

### Running Tests

```bash
# Run all tests
pnpm test

# Run tests in watch mode
pnpm test:watch

# Run tests with coverage
pnpm test:coverage

# Run specific test file
pnpm test materials.test.ts
```

### Test Examples

#### Unit Test

```typescript
import { parseMaterialFiles } from '@/routes/materials';

describe('parseMaterialFiles', () => {
  it('should parse material files correctly', () => {
    const files = [
      'textures/leather/albedo.jpg',
      'textures/leather/normal.jpg',
      'textures/leather/roughness.jpg'
    ];
    
    const result = parseMaterialFiles(files);
    
    expect(result).toHaveLength(1);
    expect(result[0].name).toBe('leather');
    expect(result[0].textures.albedo).toContain('albedo.jpg');
  });
});
```

#### Integration Test

```typescript
import request from 'supertest';
import app from '@/server';

describe('GET /api/materials/list', () => {
  it('should return list of materials', async () => {
    const response = await request(app)
      .get('/api/materials/list')
      .expect(200);
    
    expect(response.body.success).toBe(true);
    expect(response.body.materials).toBeInstanceOf(Array);
  });
  
  it('should handle R2 errors gracefully', async () => {
    // Mock R2 error
    const response = await request(app)
      .get('/api/materials/list')
      .expect(500);
    
    expect(response.body.error).toBeDefined();
  });
});
```

#### Mock R2 Service

```typescript
import { S3Client } from '@aws-sdk/client-s3';
import { mockClient } from 'aws-sdk-client-mock';

const s3Mock = mockClient(S3Client);

describe('R2 Service', () => {
  beforeEach(() => {
    s3Mock.reset();
  });
  
  it('should list R2 files', async () => {
    s3Mock.on(ListObjectsV2Command).resolves({
      Contents: [
        { Key: 'textures/leather/albedo.jpg' },
        { Key: 'textures/leather/normal.jpg' }
      ]
    });
    
    // Test implementation
  });
});
```

### Test Coverage Goals

| Category | Target Coverage |
|----------|----------------|
| **Routes** | >85% |
| **Utils** | >90% |
| **Services** | >80% |
| **Overall** | >80% |

---

## 💻 Development

### Available Scripts

```bash
pnpm dev      # Start development server with hot reload (tsx watch)
pnpm build    # Compile TypeScript to JavaScript
pnpm start    # Start production server (runs compiled JS)
pnpm test     # Run tests
pnpm test:watch  # Run tests in watch mode
pnpm test:coverage  # Run tests with coverage
```

### Development Workflow

1. **Create feature branch**
   ```bash
   git checkout -b feature/new-endpoint
   ```

2. **Make changes**
   - Write type-safe TypeScript code
   - Follow Express.js best practices
   - Add proper error handling
   - Add tests for new features

3. **Test locally**
   ```bash
   pnpm test
   pnpm build
   pnpm dev
   ```

4. **Test API endpoints**
   ```bash
   curl http://localhost:3001/health
   curl http://localhost:3001/api/materials/list
   ```

5. **Commit and push**
   ```bash
   git commit -m "feat: add new endpoint"
   git push origin feature/new-endpoint
   ```

### Code Style

- Use TypeScript for all files
- Follow Express.js best practices
- Use async/await for asynchronous code
- Implement proper error handling
- Use structured logging
- Keep functions small and focused

### Debugging

- **Console Logs** - Check server console for logs
- **Logger Utility** - Use structured logging with scoped loggers
- **API Testing** - Use curl or Postman to test endpoints
- **Error Stack Traces** - Check error logs for stack traces
- **Network Monitoring** - Monitor network requests in browser

---

## 🚀 Deployment

### Build for Production

```bash
pnpm build
```

This compiles TypeScript to JavaScript in the `dist/` directory.

### Environment Variables

Ensure all required environment variables are set in your deployment platform:

```env
PORT=3001
NODE_ENV=production
CORS_ORIGIN=https://your-client-domain.com
CLOUDFLARE_R2_BUCKET_NAME=threejs-assets
CLOUDFLARE_R2_ENDPOINT=https://your-endpoint.r2.cloudflarestorage.com
CLOUDFLARE_R2_ACCESS_KEY_ID=your-access-key-id
CLOUDFLARE_R2_SECRET_ACCESS_KEY=your-secret-access-key
R2_PUBLIC_URL=https://pub-your-bucket.r2.dev
```

### Deployment Platforms

- **Railway** (Recommended)
  - Automatic deployments on push
  - Environment variable management
  - Health check monitoring

- **Render**
  - Free tier available
  - Automatic SSL
  - Health checks

- **Heroku**
  - Easy deployment
  - Add-ons support

- **Self-hosted**
  - Docker container
  - Node.js server
  - PM2 process manager

### Docker Deployment

```dockerfile
FROM node:18-alpine
WORKDIR /app
COPY package*.json ./
RUN npm install --production
COPY dist ./dist
EXPOSE 3001
CMD ["node", "dist/server.js"]
```

### Health Checks

The server provides a health check endpoint:

```bash
GET /health
```

Use this endpoint for:
- Load balancer health checks
- Monitoring and alerting
- Container orchestration (Kubernetes, Docker Swarm)

📖 For detailed deployment instructions, see the main [README.md](../README.md#-deployment)

---

## 📚 Additional Resources

- [Express.js Documentation](https://expressjs.com/)
- [AWS SDK for JavaScript v3](https://docs.aws.amazon.com/sdk-for-javascript/v3/)
- [Cloudflare R2 Documentation](https://developers.cloudflare.com/r2/)
- [TypeScript Documentation](https://www.typescriptlang.org/docs/)
- [Jest Documentation](https://jestjs.io/docs/getting-started)

---

<div align="center">

**Built with ❤️ using Express.js and TypeScript**

[Main README](../README.md) · [Client README](../client/README.md)

</div>
