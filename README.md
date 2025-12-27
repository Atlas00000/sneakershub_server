# 🚀 Fashion Configurator Server

<div align="center">

**Express.js API server for managing materials and assets from Cloudflare R2**

[![Express](https://img.shields.io/badge/Express-4.18-green?style=for-the-badge&logo=express)](https://expressjs.com/)
[![TypeScript](https://img.shields.io/badge/TypeScript-5.2-blue?style=for-the-badge&logo=typescript)](https://www.typescriptlang.org/)
[![AWS SDK](https://img.shields.io/badge/AWS_SDK-3.958-orange?style=for-the-badge&logo=amazon-aws)](https://aws.amazon.com/sdk-for-javascript/)

</div>

---

## 📖 Table of Contents

- [Overview](#-overview)
- [Features](#-features)
- [API Endpoints](#-api-endpoints)
- [Setup](#-setup)
- [Configuration](#-configuration)
- [Architecture](#-architecture)
- [Development](#-development)
- [Deployment](#-deployment)

---

## 🎯 Overview

The Fashion Configurator Server is a lightweight Express.js API that provides endpoints for:
- **Material Management** - Automatically discover and generate material definitions from Cloudflare R2
- **Asset Listing** - List and inspect files stored in R2 buckets
- **Material Generation** - Parse texture files and create material JSON configurations

This server acts as a bridge between the frontend configurator and Cloudflare R2 object storage, enabling automated material ingestion without manual configuration.

---

## ✨ Features

### 🔍 Automated Material Discovery
- **Recursive File Scanning** - Searches R2 buckets for texture files
- **Pattern Recognition** - Automatically identifies material sets from file names
- **Category Detection** - Categorizes materials (leather, rubber, fabric, metal, premium)
- **Texture Mapping** - Maps albedo, normal, roughness, and metallic textures

### 📦 Material Generation
- **JSON Output** - Generates material definitions in configurator format
- **PBR Properties** - Sets up physically-based rendering properties
- **Color Optimization** - Automatically sets white color for textured materials
- **Price Modifiers** - Assigns price modifiers based on material category

### 🛠️ Developer Tools
- **Debug Endpoint** - Inspect R2 bucket contents
- **Health Check** - Server status monitoring
- **Error Handling** - Comprehensive error responses

---

## 🔌 API Endpoints

### Health Check

```http
GET /health
```

**Response:**
```json
{
  "status": "ok",
  "message": "Server is running"
}
```

---

### List Materials

```http
GET /api/materials/list
```

Lists all materials discovered in R2 and generates material definitions.

**Response:**
```json
{
  "success": true,
  "count": 25,
  "materials": [
    {
      "name": "Leather027",
      "id": "leather027",
      "category": "leather",
      "albedo": "https://pub-...r2.dev/threejs-assets/textures/Leather027_1K-JPG_Color.jpg",
      "normal": "https://pub-...r2.dev/threejs-assets/textures/Leather027_1K-JPG_NormalGL.jpg",
      "roughness": "https://pub-...r2.dev/threejs-assets/textures/Leather027_1K-JPG_Roughness.jpg"
    }
  ],
  "files": 75,
  "sampleFiles": [...]
}
```

**Error Response:**
```json
{
  "error": "R2 credentials not configured"
}
```

---

### Generate Materials JSON

```http
GET /api/materials/generate
```

Generates complete material definitions in the format used by the configurator.

**Response:**
```json
{
  "success": true,
  "materials": [
    {
      "id": "leather027",
      "name": "Leather027",
      "category": "leather",
      "description": "Leather027 material with realistic textures",
      "properties": {
        "color": "#ffffff",
        "map": "https://pub-...r2.dev/threejs-assets/textures/Leather027_1K-JPG_Color.jpg",
        "normalMap": "https://pub-...r2.dev/threejs-assets/textures/Leather027_1K-JPG_NormalGL.jpg",
        "roughnessMap": "https://pub-...r2.dev/threejs-assets/textures/Leather027_1K-JPG_Roughness.jpg",
        "roughness": 0.4,
        "metalness": 0.0
      },
      "priceModifier": 0,
      "premium": false
    }
  ],
  "count": 25
}
```

---

### Debug Endpoint

```http
GET /api/materials/debug
```

Lists files in R2 bucket for troubleshooting.

**Response:**
```json
{
  "success": true,
  "bucket": "threejs-assets",
  "endpoint": "https://...r2.cloudflarestorage.com",
  "filesFound": 20,
  "files": [
    "threejs-assets/textures/Leather027_1K-JPG_Color.jpg",
    "threejs-assets/textures/Leather027_1K-JPG_NormalGL.jpg",
    ...
  ],
  "prefix": "threejs-assets/textures/"
}
```

---

## ⚙️ Setup

### Prerequisites

- **Node.js** 18+
- **pnpm** (or npm/yarn)

### Installation

1. **Install dependencies**
   ```bash
   cd server
   pnpm install
   ```

2. **Configure environment variables**
   ```bash
   cp .env.example .env
   # Edit .env with your R2 credentials
   ```

3. **Start development server**
   ```bash
   pnpm dev
   # Server runs on http://localhost:3001
   ```

---

## 🔧 Configuration

### Environment Variables

Create a `.env` file in the `server/` directory:

```env
# Server Configuration
PORT=3001

# Cloudflare R2 Configuration
CLOUDFLARE_R2_BUCKET_NAME=threejs-assets
CLOUDFLARE_R2_ENDPOINT=https://your-account-id.r2.cloudflarestorage.com
CLOUDFLARE_R2_ACCESS_KEY_ID=your-access-key-id
CLOUDFLARE_R2_SECRET_ACCESS_KEY=your-secret-access-key
R2_PUBLIC_URL=https://pub-your-bucket-id.r2.dev
```

### Getting R2 Credentials

1. **Access Key ID & Secret Access Key**
   - Go to Cloudflare Dashboard → R2 → Manage R2 API Tokens
   - Create a new API token with read permissions
   - Copy the Access Key ID and Secret Access Key

2. **Endpoint URL**
   - Format: `https://{account-id}.r2.cloudflarestorage.com`
   - Find your account ID in Cloudflare Dashboard

3. **Public URL**
   - Format: `https://pub-{bucket-id}.r2.dev`
   - Set up a public R2 bucket or use custom domain

4. **Bucket Name**
   - The name of your R2 bucket (e.g., `threejs-assets`)

---

## 🏗️ Architecture

```
┌─────────────────────────────────────────────────────────┐
│                    Express Server                       │
│                                                         │
│  ┌──────────────────────────────────────────────────┐  │
│  │              Middleware Layer                    │  │
│  │  • CORS                                          │  │
│  │  • JSON Parser                                   │  │
│  │  • Error Handling                                │  │
│  └──────────────────────────────────────────────────┘  │
│                                                         │
│  ┌──────────────────────────────────────────────────┐  │
│  │              Route Handlers                      │  │
│  │  • /health                                       │  │
│  │  • /api/materials/list                          │  │
│  │  • /api/materials/generate                      │  │
│  │  • /api/materials/debug                         │  │
│  └──────────────────────────────────────────────────┘  │
│                                                         │
│  ┌──────────────────────────────────────────────────┐  │
│  │              R2 Client Service                   │  │
│  │  • S3Client (AWS SDK)                           │  │
│  │  • ListObjectsV2Command                         │  │
│  │  • File Parsing Logic                           │  │
│  └──────────────────────────────────────────────────┘  │
└─────────────────────────────────────────────────────────┘
                        ↕ S3 API
┌─────────────────────────────────────────────────────────┐
│            Cloudflare R2 Object Storage                 │
│  ┌──────────────────────────────────────────────────┐  │
│  │         threejs-assets/textures/                │  │
│  │  • Leather027_1K-JPG_Color.jpg                 │  │
│  │  • Leather027_1K-JPG_NormalGL.jpg               │  │
│  │  • Leather027_1K-JPG_Roughness.jpg              │  │
│  │  • Rubber004_1K-JPG_Color.jpg                   │  │
│  │  • ...                                          │  │
│  └──────────────────────────────────────────────────┘  │
└─────────────────────────────────────────────────────────┘
```

### File Structure

```
server/
├── src/
│   ├── server.ts          # Express app setup
│   └── routes/
│       └── materials.ts    # Material API routes
├── .env                   # Environment variables
├── .env.example           # Environment template
├── tsconfig.json          # TypeScript configuration
├── package.json           # Dependencies
└── README.md              # This file
```

---

## 💻 Development

### Available Scripts

```bash
pnpm dev      # Start development server with hot reload (tsx watch)
pnpm build    # Compile TypeScript to JavaScript
pnpm start    # Start production server (requires build first)
```

### Development Workflow

1. **Make changes** to TypeScript files
2. **Hot reload** automatically restarts the server
3. **Test endpoints** using curl, Postman, or browser
4. **Check logs** for errors and debugging info

### Testing Endpoints

**Health Check:**
```bash
curl http://localhost:3001/health
```

**List Materials:**
```bash
curl http://localhost:3001/api/materials/list
```

**Generate Materials:**
```bash
curl http://localhost:3001/api/materials/generate
```

**Debug:**
```bash
curl http://localhost:3001/api/materials/debug
```

### Material File Naming

The server automatically detects materials based on file naming patterns:

**Supported Patterns:**
- `MaterialName_Color.jpg` → Albedo map
- `MaterialName_NormalGL.jpg` → Normal map (OpenGL)
- `MaterialName_NormalDX.jpg` → Normal map (DirectX)
- `MaterialName_Roughness.jpg` → Roughness map
- `MaterialName_Metallic.jpg` → Metallic map

**Examples:**
- `Leather027_1K-JPG_Color.jpg`
- `Leather027_1K-JPG_NormalGL.jpg`
- `Leather027_1K-JPG_Roughness.jpg`
- `Rubber004_1K-JPG_Color.jpg`

**Resolution Suffixes:**
- Suffixes like `_1K`, `_2K` are automatically removed
- Material name is cleaned and formatted

**Category Detection:**
- `leather` → leather category
- `rubber` → rubber category
- `denim`, `cotton`, `fabric`, `wool` → fabric category
- `metal` → metal category
- `premium`, `alligator`, `snake` → premium category

---

## 🚀 Deployment

### Build for Production

```bash
pnpm build
```

This compiles TypeScript to JavaScript in the `dist/` directory.

### Start Production Server

```bash
pnpm start
```

### Environment Variables

Ensure all environment variables are set in your deployment platform:

- **Railways**: Add variables in project settings
- **Render**: Add variables in environment section
- **Docker**: Use `-e` flags or `.env` file

### Docker Deployment

A `Dockerfile` is included for containerized deployment:

```bash
docker build -t fashion-configurator-server .
docker run -p 3001:3001 --env-file .env fashion-configurator-server
```

---

## 🐛 Troubleshooting

### R2 Credentials Not Configured

**Error:** `"R2 credentials not configured"`

**Solution:**
- Check that `.env` file exists and contains all required variables
- Verify environment variables are loaded (check server logs)
- Ensure `dotenv` is properly configured in `server.ts`

### No Materials Found

**Error:** `"count": 0` in response

**Solution:**
- Check R2 bucket name is correct
- Verify texture files are in `threejs-assets/textures/` directory
- Ensure files follow naming conventions
- Use `/api/materials/debug` to inspect bucket contents

### Connection Errors

**Error:** `Failed to list materials`

**Solution:**
- Verify R2 endpoint URL is correct
- Check access key ID and secret access key
- Ensure bucket exists and is accessible
- Verify network connectivity

---

## 📚 Additional Resources

- [Express.js Documentation](https://expressjs.com/)
- [AWS SDK for JavaScript v3](https://docs.aws.amazon.com/sdk-for-javascript/v3/)
- [Cloudflare R2 Documentation](https://developers.cloudflare.com/r2/)
- [TypeScript Documentation](https://www.typescriptlang.org/docs/)

---

## 📝 License

This project is private and proprietary.

---

<div align="center">

**Built with ❤️ for automated material management**

</div>

