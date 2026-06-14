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
- **PostgreSQL 15** — 关系型数据库
- **LangChain.js** — LLM 调用编排
- **DeepSeek API** — AI 分析引擎
- **Passport + JWT** — 认证授权
- **Multer** — 文件上传处理
- **Swagger/OpenAPI** — API 文档

### 前端 (apps/frontend)

- **Next.js 14** — App Router, SSR/SSG
- **React 18** — UI 框架
- **Tailwind CSS** — 原子化 CSS
- **shadcn/ui + Radix UI** — 组件库
- **Zustand** — 轻量级状态管理
- **TanStack Query** — 服务端状态管理
- **Axios + SSE** — HTTP 客户端 + 流式通信
- **next-intl** — 国际化
- **Lucide React** — 图标库
- **react-markdown + Prism** — Markdown 渲染 + 代码高亮

### 基础设施

- **Turborepo** — Monorepo 构建系统
- **pnpm** — 高效的包管理器

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
- 后端: Railway / Render
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

## 📄 许可证

MIT License
