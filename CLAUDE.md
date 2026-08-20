# CLAUDE.md

## 项目概述

JDMatch AI —— AI 简历优化与岗位匹配平台。pnpm workspace + Turborepo 的 monorepo，TypeScript 全栈。

## 技术栈（以实际代码为准）

| 层 | 技术 |
|----|------|
| 前端 | Next.js 14 (App Router) + React 18，Tailwind + shadcn/ui + Radix，端口 **3000** |
| 后端 | NestJS 10，端口 **4000**，测试用 Vitest |
| 数据库 | PostgreSQL + pgvector，Prisma 5 |
| AI | **DeepSeek**（`deepseek-v4-flash` / `deepseek-v4-pro`），通过 `@langchain/deepseek` |
| 存储 | AWS S3 SDK 预签名上传（本地开发用 MinIO，生产用 OSS 预签名） |
| 认证 | JWT + Passport（github / local），**当前只开放 GitHub 认证，自由注册已关闭** |
| 队列 | 规划为 BullMQ，但实际依赖是 `@nestjs/bull` + `bull`，**尚未接入业务代码** |

## 目录结构

```
apps/
  backend/          # NestJS 后端
    src/modules/
      auth/         # 认证（JWT + GitHub OAuth + 验证码）
      users/        # 用户
      matching/     # 简历-岗位匹配分析
      ai-chat/      # AI 对话（普通 + SSE 流式）
  frontend/         # Next.js 前端（next-intl 国际化、zustand、react-query、recharts）
packages/
  ai/               # AI 封装（askDeepSeek / askDeepSeekStream，含拒绝无关话题的 tool guard）
  config/           # 环境变量 zod 校验（从根 .env 加载）
  database/         # Prisma schema + client 导出
  shared-types/     # 跨端共享类型
```

## 常用命令

在根目录：

- `pnpm dev` / `pnpm build` / `pnpm lint` / `pnpm format` / `pnpm test`
- `pnpm docker:up` / `docker:down` —— 起/停全部基础设施
- `pnpm db:start` —— 只起 postgres + redis
- `pnpm db:reset` —— 重建数据库（会清数据）

在 database 包（`pnpm --filter @jd-match/database <script>`）：

- `db:generate`（prisma generate）/ `db:migrate`（migrate dev）/ `db:migrate:prod`（migrate deploy）/ `db:studio` / `db:seed`

基础设施端口：PostgreSQL `5432`、Redis `6379`、MinIO `9000`/`9001`（见 `docker-compose.yml`）。

## 关键约定与陷阱

1. **环境变量命名是历史遗留**：`config` 包里的 `OPENAI_API_KEY` / `OPENAI_MODEL` 字段，实际喂给的是 **DeepSeek** 的 API（`@jd-match/ai` 里用 `ChatDeepSeek` + `baseURL: https://api.deepseek.com/v1`）。改配置时别被名字误导。
2. **`.env` 文件有三处**：根目录 `.env`（后端 config 读取）、`packages/database/.env`（Prisma 连接）、`apps/frontend/.env.local`（前端）。
3. **后端 build 会额外执行 `copy-prisma-engine.js`**：生产构建时复制 Prisma 引擎，不要删这个脚本。
4. **代码风格**（`.prettierrc`）：无分号、单引号、4 空格缩进、printWidth 100、尾逗号 all。
5. **`ARCHITECTURE.md` 已过时**：它写的 OpenAI / LangChain 编排 / BullMQ 队列是早期规划，与现状不符。以本文件和实际代码为准。
6. **Prisma 数据模型**：`User`、`Account`、`Session`、`AigcConversation`、`AigcMessage`、`AiChatConversation`、`AiChatMessage`、`ApiKey`、`AuditLog`、`ModelUsage`。

## AI 对话模块说明

- `ai-chat` 模块同时提供**普通非流式**（`POST /ai-chat/chat`）和 **SSE 流式**（`POST /ai-chat/chat/stream`）两种对话。
- 模型选择通过 body 传 `model: 'pro' | 'flash'`，默认 flash。
- 系统提示词在 `packages/ai/src/general-qa.ts`，含一个 `reject_unrelated_topic` 工具：遇到与简历/岗位无关的问题会礼貌拒绝并引导回主题。
