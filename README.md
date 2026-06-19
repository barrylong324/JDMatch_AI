# JDMatch AI — 简历岗位智能匹配平台

> AI 驱动的简历-岗位匹配分析平台 — 基于 Next.js + Nest.js + TypeScript Monorepo 架构

## 🎯 项目简介

JDMatch AI 是一个 AI 驱动的简历-岗位匹配分析平台。用户上传个人简历，粘贴目标岗位链接（如 Boss 直聘 JD），即可获得全方位的匹配度分析与专业简历优化建议。已接入 DeepSeek API 驱动 AI 分析引擎。

**核心特性**：

- ✅ 简历文件上传（支持 PDF / DOCX 格式）
- ✅ 岗位链接智能解析（Boss 直聘 / 拉勾等平台）
- ✅ AI 多维匹配度分析（技能、经验、学历、关键词）
- ✅ 即时优化建议与技能差距分析
- ✅ SSE 流式实时分析报告生成
- ✅ 匹配历史记录与回顾
- ✅ JWT 认证授权
- ✅ 中/英双语国际化
- ✅ Swagger API 文档
- ✅ 完整的 TypeScript 类型安全

---

## 🚀 技术栈

### 后端 (apps/backend)

- **Nest.js 10** — 企业级 Node.js 框架
- **TypeScript 5** — 类型安全
- **Prisma ORM** — 类型安全的数据库访问
- **PostgreSQL 15 + pgvector** — 关系型数据库 + 向量检索
- **Redis** — 缓存 & Bull 任务队列
- **LangChain.js** — LLM 调用编排
- **DeepSeek API** — AI 分析引擎
- **Passport + JWT** — 认证授权（JWT + GitHub OAuth）
- **SVG 验证码** — 自研图形验证码，防机器人攻击
- **bcryptjs** — 密码哈希存储
- **AWS S3 SDK** — 对象存储（兼容 S3 / MinIO / R2 / OSS）
- **Multer** — 文件上传处理
- **mammoth + pdfjs-dist** — DOCX / PDF 简历解析
- **Cheerio** — JD 网页内容抓取
- **Swagger/OpenAPI** — API 文档
- **NestJS Throttler** — 速率限制
- **Helmet** — HTTP 安全头
- **Winston** — 结构化日志
- **class-validator / class-transformer** — DTO 校验
- **Vitest** — 单元 & E2E 测试

### 前端 (apps/frontend)

- **Next.js 14** — App Router, SSR/SSG
- **React 18** — UI 框架
- **Tailwind CSS** — 原子化 CSS
- **shadcn/ui + Radix UI** — 组件库
- **next-themes** — 深色 / 浅色主题切换
- **Zustand** — 轻量级状态管理（含 persist 持久化）
- **TanStack Query (React Query v5)** — 服务端状态管理 & 缓存
- **Axios + SSE** — HTTP 客户端 + 流式通信
- **next-intl** — 中 / 英国际化
- **Lucide React** — 图标库
- **react-markdown + remark-gfm + react-syntax-highlighter** — Markdown 渲染 + 代码高亮
- **Recharts** — 可视化图表
- **date-fns** — 日期工具库
- **Sonner** — Toast 通知

### 基础设施

- **Turborepo** — Monorepo 构建系统
- **pnpm** — 高效的包管理器
- **Docker Compose** — 本地开发环境（PostgreSQL + Redis + MinIO）
- **Vercel** — 前端部署平台
- **Railway** — 后端容器化部署

---

## 📁 项目结构

```
JDMatch AI/
├── apps/
│   ├── backend/              # Nest.js 后端 API
│   │   ├── src/
│   │   │   ├── modules/      # 业务模块 (Auth, Users, Matching)
│   │   │   ├── database/     # Prisma 服务
│   │   │   └── main.ts       # 入口文件
│   │   └── uploads/          # 临时文件存储
│   │
│   └── frontend/             # Next.js 前端应用
│       ├── src/
│       │   ├── app/          # App Router 页面
│       │   │   ├── page.tsx              # 落地页（JDMatch AI 品牌展示）
│       │   │   ├── login/                # 登录页
│       │   │   ├── register/             # 注册页
│       │   │   └── dashboard/
│       │   │       ├── page.tsx          # 概览统计
│       │   │       ├── matching/         # 简历匹配分析
│       │   │       ├── history/          # 匹配历史
│       │   │       └── settings/         # 用户设置
│       │   ├── components/
│       │   │   ├── landing/   # 落地页组件
│       │   │   ├── layout/    # 布局组件 (Navbar, Sidebar)
│       │   │   └── ui/        # shadcn/ui 组件
│       │   ├── lib/           # 工具函数 & API 请求层
│       │   └── stores/        # Zustand 状态管理
│       └── messages/          # i18n 翻译文件 (zh/en)
│
├── packages/
│   ├── database/              # Prisma schema 和 client
│   ├── ai/                    # AI/LLM 封装（DeepSeek）
│   ├── shared-types/          # 共享 TypeScript 类型
│   └── config/                # 配置和环境变量验证
│
├── turbo.json                 # Turborepo 配置
├── pnpm-workspace.yaml        # pnpm 工作区配置
└── package.json               # 根 package.json
```

---

## 🏃 快速开始

### 前置要求

- Node.js 18+
- pnpm 8+
- DeepSeek API Key（或其他 OpenAI 兼容 API）

### 1. 安装依赖

```bash
pnpm install
```

### 2. 配置环境变量

```bash
cp .env.example .env
```

编辑 `.env` 文件：

```env
DATABASE_URL=postgresql://...
OPENAI_API_KEY=sk-your-deepseek-api-key
OPENAI_MODEL=deepseek-chat
OPENAI_BASE_URL=https://api.deepseek.com/v1
NEXTAUTH_SECRET=your-secret-at-least-32-chars
NEXTAUTH_URL=http://localhost:3000
```

### 3. 初始化数据库

```bash
cd packages/database
npx prisma db push
npx prisma generate
cd ../..
```

### 4. 启动开发环境

终端 1 — 后端：

```bash
cd apps/backend
pnpm start:dev
```

终端 2 — 前端：

```bash
cd apps/frontend
pnpm dev
```

访问应用：

- 🌐 前端: http://localhost:3000
- 🔧 后端 API: http://localhost:4000
- 📚 Swagger 文档: http://localhost:4000/api/docs

---

## 📖 使用指南

### 1. 浏览落地页

访问首页了解 JDMatch AI 功能，无需登录。

### 2. 注册 / 登录

点击「免费开始匹配」进入登录页，或注册新账户。

### 3. 开始匹配分析

进入「简历匹配」→ 上传简历（PDF/DOCX）→ 粘贴目标岗位链接 → 点击开始分析。

### 4. 查看匹配报告

AI 即时生成多维匹配度报告：综合评分、关键词/技能/经验/学历匹配、优势与差距分析、简历优化建议。

### 5. 查看历史记录

进入「匹配历史」→ 查看所有匹配记录 → 回顾对比不同岗位的匹配情况。

---

## 🔧 常用命令

```bash
# 开发模式
pnpm dev

# 构建
pnpm build

# 数据库操作
cd packages/database
npx prisma db push       # 同步 schema 到数据库
npx prisma generate      # 生成 Prisma Client
npx prisma studio        # 打开数据库 GUI

# 代码规范
pnpm lint
pnpm format
```

---

## 🚢 部署

**推荐方案**：

- 前端: Vercel
- 后端: Railway
- 数据库: Neon (PostgreSQL)

---

## 🛠️ 开发说明

### 添加新的分析维度

1. 在 `packages/ai/src/general-qa.ts` 的 `buildMatchingPrompt` 中添加新维度
2. 在 `apps/frontend/messages/zh.json` 和 `en.json` 的 `matching` 命名空间添加翻译

### 添加新 API 端点

```bash
cd apps/backend
nest g controller modules/matching
```

---

## � 后端难点亮点

### 1. Monorepo 重命名与 Turbo 构建一致性

**问题**：项目从 `@rag-ai` 重命名为 `@jd-match` 后，Dockerfile 中 Turborepo 的 `--filter=@rag-ai/backend` 找不到匹配的包（包名已变更为 `@jd-match/backend`），Turbo 静默跳过构建，`dist/main.js` 从未生成。Railway 容器启动时直接报 `Cannot find module` 崩溃，所有健康检查失败。

**解决**：同步更新所有 Dockerfile、`next.config.mjs`、`docker-compose.yml` 及环境变量中的旧包名引用，确保 Monorepo 内命名完全一致。关键在于理解 Turborepo 的 filter 机制——它依赖 `package.json` 中的 `name` 字段精确匹配，命名不一致不会报错，而是直接跳过，极易被忽视。

### 2. Prisma 查询引擎跨平台兼容

**问题**：`copy-prisma-engine.js` 构建脚本写死了优先复制 Windows 平台的 Prisma 查询引擎（`.dll.node`）到 `dist/` 目录。Railway 使用 Linux 容器，PE 格式的 `.dll` 文件无法被 Linux 内核执行，启动时报 `Exec format error`，进程直接退出，健康检查持续失败。

**解决**：重构引擎选择逻辑，使用 `process.platform` 运行时检测当前操作系统，按优先级匹配引擎扩展名：

| 平台               | 优先引擎       | 降级兜底                     |
| ------------------ | -------------- | ---------------------------- |
| `linux` (Railway)  | `.so.node`     | `.dll.node` → `.darwin.node` |
| `win32` (本地开发) | `.dll.node`    | `.so.node` → `.darwin.node`  |
| `darwin` (macOS)   | `.darwin.node` | `.so.node` → `.dll.node`     |

这样本机构建与 CI/CD 容器构建各取所需，互不干扰，从根本上杜绝跨平台引擎错配问题。

### 3. 线上数据库迁移缺失导致全面报错

**问题**：本地开发一切正常，部署到 Railway + Neon 后大量接口报错。排查发现两个根本原因：

- **`generate_big_id()` 函数缺失**：Prisma schema 中所有表的主键默认值依赖 `@default(dbgenerated("generate_big_id()"))`，但初始迁移 SQL 只创建了表结构，从未定义此函数。本地数据库因早期手动执行过所以正常，Neon 空库上完全不存在。
- **`pgvector` 扩展未启用**：向量嵌入字段使用 `vector(1536)` 类型，依赖 PostgreSQL 扩展，Neon 默认未开启。
- **Dockerfile 无迁移步骤**：原 Dockerfile 的 `CMD` 直接 `node main.js` 启动应用，`prisma migrate deploy` 从未在容器启动时执行。即使后续补了迁移文件，线上数据库也不会自动应用。

**解决**：

1. 新增迁移 `20260617000000_add_big_id_function`，使用幂等 SQL 补齐缺失的数据库函数、序列和扩展：
    - `CREATE EXTENSION IF NOT EXISTS vector` — pgvector 向量扩展
    - `CREATE SEQUENCE IF NOT EXISTS global_id_seq` — 全局 ID 序列
    - `CREATE OR REPLACE FUNCTION generate_big_id()` — Snowflake 风格分布式 ID 生成器（41 位时间戳 + 5 位分片 + 10 位序列号）

2. 更新 `Dockerfile` CMD，确保每次容器启动先执行迁移再启动应用：
    ```dockerfile
    CMD ["sh", "-c", "cd /app/packages/database && pnpm exec prisma migrate deploy && node /app/apps/backend/dist/main.js"]
    ```

**启示**：`dbgenerated()` 引用的自定义数据库函数需要手动迁移，Prisma 不会自动创建。线上部署必须确保 CI/CD 流程中包含 `prisma migrate deploy` 步骤，否则本地验证通过不等于线上可用。

### 4. S3 对象存储多云兼容方案

**问题**：本地开发使用 MinIO（Docker），线上最初计划使用 Cloudflare R2，但 R2 免费套餐仍需绑国外银行卡激活，国内支付受阻。阿里云 OSS 支持支付宝付款，但与 R2 的 endpoint 格式完全不同，代码中 endpoint 逻辑硬编码了 R2 的特殊格式（`${ACCOUNT_ID}.r2.cloudflarestorage.com`）。

**解决**：抽象出通用 S3 端点配置层，通过环境变量 `AWS_S3_ENDPOINT` 支持任意 S3 兼容存储服务。优先级链：

```
开发环境 (NODE_ENV=development)
  → MinIO (localhost:9000, minioadmin, forcePathStyle=true)

生产环境 + AWS_S3_ENDPOINT 已设置
  → 阿里云 OSS / 腾讯云 COS / 自建 MinIO 等

生产环境 + AWS_S3_REGION=auto
  → Cloudflare R2（兼容旧配置）

以上都不是
  → 标准 AWS S3
```

`forcePathStyle` 也通过独立环境变量控制，不再与开发环境硬绑定。一套代码零改动对接 MinIO、R2、OSS、COS 四个平台，只需改环境变量。

### 5. PDF 简历解析在生产环境连环失败

**问题**：开发环境 PDF 解析正常，Railway 部署后持续报错，日志显示两层错误：

| 层次   | 日志                                                 | 根因                                              |
| ------ | ---------------------------------------------------- | ------------------------------------------------- |
| 第一轮 | `TypeError: Promise.withResolvers is not a function` | Docker 镜像 `node:20-alpine` 不含 ES2024 API      |
| 第二轮 | `require('pdfjs-dist')` 失败                         | `pdfjs-dist` v4.x 是 ESM-only，`require()` 不可用 |

**解决**：

1. **升级 Dockerfile 到 `node:22-alpine`**（Promise.withResolvers 为 Node 22 原生 API）
2. **`require()` → `await import()`**：将 `require('pdfjs-dist')` 改为动态 `import('pdfjs-dist')`，适配 ESM-only 包
3. **Polyfill 兜底**：在 `document-parser.service.ts` 顶部注入 `Promise.withResolvers` polyfill，确保低版本 Node 也能运行

```typescript
// 低版本 Node 兜底
if (typeof (Promise as any).withResolvers !== 'function') {
    ;(Promise as any).withResolvers = function () { ... }
}
```

**启示**：本地 `node --version` 是 v24，Docker 镜像锁死在 v20。`package.json` 中的依赖是 ESM-only 的，但代码用了 CommonJS `require()`。本地 ts-node 能容错，生产 webpack 打包后原形毕露。

### 6. 生产环境 PDF 预览经历四轮方案迭代

**问题**：正式环境 OSS 存储的简历 PDF 无法在浏览器 iframe 中内联预览，展开简历卡片即触发浏览器下载，用户体验断裂。本地 MinIO 表现正常。

**第一轮** — 尝试 `ResponseContentDisposition: 'inline'`：在 OSS 预签名 URL 中附加 `response-content-disposition=inline` 参数，期望 OSS 覆盖响应头。但 OSS 对 AWS S3 的 response override 参数支持不完整，预签名 URL 中的参数被忽略。

**第二轮** — 尝试后端代理端点：后端新增 `/matching/conversations/:id/resume/preview` 端点，通过临时 JWT token 鉴权，从 OSS 下载文件后强制返回 `Content-Disposition: inline`。但全局 `LoggingInterceptor` 将所有响应自动包装为 `{ code: 0, message: '操作成功', result: <Buffer> }`，PDF 二进制被塞进 JSON，浏览器无法解析。

**第三轮** — 绕过拦截器 + 解决 X-Frame-Options：改用 `@Res()` 手动 `res.send(buffer)` 绕过拦截器管道。却又被 Helmet 默认的 `X-Frame-Options: SAMEORIGIN` 拦截，前端 Vercel 域名与后端 Railway 域名不同源，iframe 加载被浏览器拒绝。关闭 `frameguard` 后依然被 Railway 边缘代理拦截。

**最终方案** — 前端 `fetch()` + Blob URL：

```
生产环境: fetch(resumeUrl) → Blob → URL.createObjectURL(blob) → iframe src=blob:...
开发环境: iframe 直接加载 MinIO 预签名 URL
```

| 方案                         | 复杂度     | 结果                |
| ---------------------------- | ---------- | ------------------- |
| OSS 预签名 URL 参数          | 零代码     | ❌ OSS 不兼容       |
| 后端代理端点 + JWT           | +3 文件    | ❌ 拦截器破坏响应   |
| + 绕过拦截器 + 关 frameguard | +1 文件    | ❌ Railway 代理拒绝 |
| **前端 fetch + Blob URL**    | **仅前端** | ✅                  |

**核心洞察**：与 OSS 的兼容性博弈成本过高，将问题搬到前端用 `fetch()` 拿二进制 → Blob → `blob:` URL 彻底绕开了 Content-Disposition、X-Frame-Options、跨域 iframe 等所有服务端响应头问题。`blob:` URL 是浏览器本地资源，天然同源，不存在任何跨域限制。

**补充 — OSS 跨域配置**：`fetch()` 从浏览器直连 OSS 属于跨域请求，OSS Bucket 默认不返回 `Access-Control-Allow-Origin` 头，浏览器会拦截响应。需在 OSS 控制台配置 CORS 规则：

| 字段           | 值                                                                |
| -------------- | ----------------------------------------------------------------- |
| 来源           | `https://jdmatch-ai.vercel.app`（及本地 `http://localhost:3000`） |
| Allow-Methods  | `GET` `HEAD`                                                      |
| Allow-Headers  | `*`                                                               |
| Expose-Headers | `ETag` `Content-Length`                                           |

配置路径：**OSS 控制台 → Bucket → 数据安全 → 跨域设置 → 创建规则**。此规则仅影响浏览器端 `fetch()`，不影响服务端 SDK 直传。

---

## �📄 许可证

MIT License
