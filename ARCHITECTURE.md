# JDMatch AI - 系统架构

## 🏗️ 整体架构

```
┌─────────────────────────────────────────────────────────────┐
│                        Client Layer                          │
│                                                              │
│  ┌──────────────┐    ┌──────────────┐    ┌──────────────┐  │
│  │   Web App    │    │ Mobile App   │    │   API SDK    │  │
│  │  (Next.js)   │    │  (Future)    │    │  (Future)    │  │
│  └──────┬───────┘    └──────────────┘    └──────────────┘  │
│         │                                                   │
└─────────┼───────────────────────────────────────────────────┘
          │ HTTPS / REST API
          ▼
┌─────────────────────────────────────────────────────────────┐
│                      Application Layer                       │
│                                                              │
│  ┌──────────────────────────────────────────────────────┐  │
│  │              Nest.js API Server                       │  │
│  │                    (Port 4000)                        │  │
│  │                                                       │  │
│  │  ┌──────────┐ ┌──────────┐ ┌──────────┐            │  │
│  │  │   Auth   │ │  Users   │ │ Matching │            │  │
│  │  │ Module   │ │  Module  │ │  Module  │            │  │
│  │  └──────────┘ └──────────┘ └──────────┘            │  │
│  │                                                       │  │
│  │  ┌──────────────────────────────────────────┐       │  │
│  │  │        Middleware & Guards               │       │  │
│  │  │  • JWT Auth  • Rate Limit  • Logging     │       │  │
│  │  └──────────────────────────────────────────┘       │  │
│  └──────────────────────────────────────────────────────┘  │
└─────────────────────────────────────────────────────────────┘
          │
          ▼
┌──────────────────┐
│   Data Layer     │
│                  │
│ ┌──────────────┐ │
│ │ PostgreSQL   │ │
│ │              │ │
│ │ • Users      │ │
│ │ • Matchings  │ │
│ │ • Messages   │ │
│ └──────────────┘ │
└──────────────────┘
          │
          ▼
┌─────────────────────────────────────────────────────────────┐
│                   External Services                          │
│                                                              │
│  ┌──────────────┐    ┌──────────────┐                       │
│  │   DeepSeek   │    │ Object Stor. │                       │
│  │              │    │   (Future)   │                       │
│  │ • Chat API   │    │              │                       │
│  │ • Streaming  │    │ • Resume     │                       │
│  └──────────────┘    └──────────────┘                       │
└─────────────────────────────────────────────────────────────┘
```

---

## 📦 Monorepo 结构

```
JDMatch AI/
│
├── apps/                           # 应用程序
│   ├── backend/                    # Nest.js 后端API
│   │   ├── src/
│   │   │   ├── modules/           # 业务模块
│   │   │   │   ├── auth/         # 认证模块
│   │   │   │   ├── users/        # 用户管理
│   │   │   │   └── matching/     # 简历-岗位匹配分析
│   │   │   ├── database/         # Prisma服务
│   │   │   ├── filters/          # 异常过滤器
│   │   │   ├── interceptors/     # 拦截器
│   │   │   └── main.ts           # 入口文件
│   │   └── uploads/              # 临时文件存储
│   │
│   └── frontend/                  # Next.js 前端
│       ├── app/                    # App Router页面
│       ├── components/             # React组件
│       └── ...
│
├── packages/                       # 共享库
│   ├── database/                   # 数据库层
│   │   ├── prisma/
│   │   │   ├── schema.prisma      # 数据模型定义
│   │   │   └── migrations/        # 数据库迁移
│   │   └── src/index.ts           # Prisma Client导出
│   │
│   ├── ai/                         # AI封装
│   │   └── src/
│   │       ├── embeddings.ts      # 向量嵌入
│   │       ├── llm.ts             # LLM调用
│   │       ├── rag-chain.ts       # RAG链路
│   │       └── index.ts
│   │
│   ├── document-parser/            # 文档解析
│   │   └── src/
│   │       ├── pdf.parser.ts      # PDF解析
│   │       ├── docx.parser.ts     # Word解析
│   │       ├── html.parser.ts     # HTML解析
│   │       ├── markdown.parser.ts # MD解析
│   │       ├── text-splitter.ts   # 文本分块
│   │       └── index.ts
│   │
│   ├── shared-types/               # 类型定义
│   │   └── src/index.ts           # TypeScript接口
│   │
│   └── config/                     # 配置管理
│       └── src/index.ts           # 环境变量验证
│
├── docker-compose.yml              # Docker编排
├── turbo.json                      # Turborepo配置
├── pnpm-workspace.yaml             # pnpm工作区
└── package.json                    # 根依赖
```

---

## 🔄 数据流

### 1. 文档上传流程

```
User Upload
    │
    ▼
┌─────────────┐
│  Multer     │ ← 接收文件
└──────┬──────┘
       │
       ▼
┌─────────────┐
│  Validate   │ ← 检查格式和大小
└──────┬──────┘
       │
       ▼
┌─────────────┐
│   Save to   │ ← 临时存储
│   Disk/S3   │
└──────┬──────┘
       │
       ▼
┌─────────────┐
│  Create DB  │ ← 创建文档记录
│   Record    │   (status: PENDING)
└──────┬──────┘
       │
       ▼
┌─────────────┐
│  Add to     │ ← 加入任务队列
│  BullMQ     │
└──────┬──────┘
       │
       ▼
┌─────────────┐
│  Processor  │ ← 异步处理
└──────┬──────┘
       │
       ├─→ Parse Document (PDF/DOCX/etc.)
       │
       ├─→ Split into Chunks
       │
       ├─→ Generate Embeddings
       │
       ├─→ Store in pgvector
       │
       └─→ Update Status (COMPLETED)
```

### 2. RAG聊天流程

```
User Question
    │
    ▼
┌─────────────┐
│  Receive    │
│  Message    │
└──────┬──────┘
       │
       ▼
┌─────────────┐
│  Generate   │ ← text-embedding-ada-002
│  Query      │
│  Embedding  │
└──────┬──────┘
       │
       ▼
┌─────────────┐
│  Vector     │ ← pgvector相似度搜索
│  Search     │   (cosine similarity)
└──────┬──────┘
       │
       ▼
┌─────────────┐
│  Retrieve   │ ← Top-K chunks
│  Top-K      │   (K=5 default)
│  Chunks     │
└──────┬──────┘
       │
       ▼
┌─────────────┐
│  Build      │ ← System prompt +
│  Prompt     │   Context + Question
└──────┬──────┘
       │
       ▼
┌─────────────┐
│  Call GPT   │ ← gpt-4 or gpt-3.5-turbo
│  API        │
└──────┬──────┘
       │
       ▼
┌─────────────┐
│  Return     │ ← Answer + Sources
│  Response   │
└─────────────┘
```

---

## 🔐 安全架构

```
┌─────────────────────────────────────────┐
│          Security Layers                 │
│                                          │
│  1. Network Level                        │
│     • HTTPS/TLS                          │
│     • CORS Policy                        │
│     • Rate Limiting                      │
│                                          │
│  2. Authentication                       │
│     • JWT Tokens                         │
│     • bcrypt Password Hashing            │
│     • Token Expiration                   │
│     • Refresh Token Rotation             │
│                                          │
│  3. Authorization                        │
│     • Role-Based Access Control (RBAC)   │
│     • Resource Ownership Checks          │
│     • Collaboration Permissions          │
│                                          │
│  4. Data Protection                      │
│     • Input Validation (Zod)             │
│     • SQL Injection Prevention (Prisma)  │
│     • XSS Protection                     │
│     • File Type Validation               │
│                                          │
│  5. Audit & Monitoring                   │
│     • Request Logging                    │
│     • Error Tracking (Sentry)            │
│     • Audit Trail                        │
└─────────────────────────────────────────┘
```

---

## 🚀 部署架构

### 开发环境

```
Local Machine
├── Docker Compose
│   ├── PostgreSQL (5432)
│   ├── Redis (6379)
│   └── pgvector Extension
├── Nest.js API (4000)
└── Next.js Frontend (3000)
```

### 生产环境（推荐方案A：云托管）

```
┌─────────────┐
│   Vercel    │ ← Frontend (Next.js)
│             │   • SSR/SSG
│             │   • Edge Functions
│             │   • CDN
└──────┬──────┘
       │
       ▼
┌─────────────┐
│   Railway   │ ← Backend API (Nest.js)
│   / Render  │   • Auto-scaling
│             │   • Health Checks
└──────┬──────┘
       │
       ├─→ Neon/Supabase (PostgreSQL + pgvector)
       ├─→ Upstash (Redis)
       └─→ Cloudflare R2 / AWS S3 (Object Storage)
```

### 生产环境（方案B：自托管）

```
┌─────────────────────────────────────┐
│         Kubernetes Cluster           │
│                                      │
│  ┌──────────┐ ┌──────────┐         │
│  │ Traefik  │ │  Nginx   │         │
│  │ Ingress  │ │ Reverse  │         │
│  └────┬─────┘ │  Proxy   │         │
│       │       └──────────┘         │
│       ▼                             │
│  ┌──────────┐                      │
│  │ Nest.js  │ ← Multiple Replicas  │
│  │   API    │   Load Balanced      │
│  └────┬─────┘                      │
│       │                             │
│  ┌────┴─────┐                      │
│  │PostgreSQL│ ← StatefulSet        │
│  │+ pgvector│   Persistent Volume  │
│  └──────────┘                      │
│                                      │
│  ┌──────────┐                      │
│  │  Redis   │ ← Sentinel Mode      │
│  └──────────┘                      │
└─────────────────────────────────────┘
```

---

## 📊 技术栈总结

| 层级             | 技术                  | 用途            |
| ---------------- | --------------------- | --------------- |
| **Monorepo**     | Turborepo + pnpm      | 项目管理        |
| **Frontend**     | Next.js 14            | React框架       |
| **Backend**      | Nest.js 10            | Node.js框架     |
| **Language**     | TypeScript            | 类型安全        |
| **Database**     | PostgreSQL 15         | 关系型数据库    |
| **Vector DB**    | pgvector              | 向量相似度搜索  |
| **ORM**          | Prisma                | 数据库访问      |
| **Cache**        | Redis 7               | 缓存和队列      |
| **Queue**        | BullMQ                | 异步任务        |
| **AI**           | OpenAI API            | LLM和Embeddings |
| **AI Framework** | LangChain.js          | RAG编排         |
| **Auth**         | JWT + Passport        | 认证授权        |
| **Validation**   | Zod + class-validator | 数据验证        |
| **Docs**         | Swagger/OpenAPI       | API文档         |
| **Logging**      | Winston               | 结构化日志      |
| **Testing**      | Vitest + Playwright   | 测试框架        |
| **Deployment**   | Vercel + Railway      | 云平台          |
| **Container**    | Docker                | 容器化          |

---

_Architecture Diagram Last Updated: 2026-04-10_
