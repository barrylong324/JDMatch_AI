-- ============================================
-- JDMatch AI - 完整建表语句（Neon PostgreSQL）
-- 对照 schema.prisma 生成，日期：2026-06-18
-- ============================================

-- ============================================
-- 1. 扩展 & 函数
-- ============================================
CREATE EXTENSION IF NOT EXISTS vector;
CREATE SEQUENCE IF NOT EXISTS global_id_seq;

CREATE OR REPLACE FUNCTION generate_big_id()
RETURNS TEXT AS $$
DECLARE
    epoch_ms   BIGINT := 1700000000000;
    shard_id   INT    := 1;
    seq        BIGINT;
    now_ms     BIGINT;
    result     BIGINT;
BEGIN
    SELECT nextval('global_id_seq') INTO seq;
    SELECT FLOOR(EXTRACT(EPOCH FROM clock_timestamp()) * 1000)::BIGINT INTO now_ms;
    result := (now_ms - epoch_ms) << 22;
    result := result | (shard_id << 10);
    result := result | (seq % 1024);
    RETURN result::TEXT;
END;
$$ LANGUAGE plpgsql;

-- ============================================
-- 2. 枚举类型
-- ============================================
CREATE TYPE "Role" AS ENUM ('ADMIN', 'USER', 'GUEST');
CREATE TYPE "MessageRole" AS ENUM ('USER', 'ASSISTANT', 'SYSTEM');
CREATE TYPE "MessageRating" AS ENUM ('UPVOTE', 'DOWNVOTE');
CREATE TYPE "InterviewStatus" AS ENUM ('IN_PROGRESS', 'COMPLETED');

-- ============================================
-- 3. 用户 & 认证
-- ============================================
CREATE TABLE "users" (
    "id"            TEXT NOT NULL DEFAULT generate_big_id(),
    "email"         TEXT NOT NULL,
    "emailVerified" TIMESTAMP(3),
    "password"      TEXT,
    "name"          TEXT,
    "image"         TEXT,
    "role"          "Role" NOT NULL DEFAULT 'USER',
    "createdAt"     TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt"     TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "deletedAt"     TIMESTAMP(3),
    CONSTRAINT "users_pkey" PRIMARY KEY ("id")
);
CREATE UNIQUE INDEX "users_email_key" ON "users"("email");
CREATE INDEX "users_email_idx" ON "users"("email");

CREATE TABLE "accounts" (
    "id"                TEXT NOT NULL DEFAULT generate_big_id(),
    "userId"            TEXT NOT NULL,
    "type"              TEXT NOT NULL,
    "provider"          TEXT NOT NULL,
    "providerAccountId" TEXT NOT NULL,
    "refresh_token"     TEXT,
    "access_token"      TEXT,
    "expires_at"        INTEGER,
    "token_type"        TEXT,
    "scope"             TEXT,
    "id_token"          TEXT,
    "session_state"     TEXT,
    CONSTRAINT "accounts_pkey" PRIMARY KEY ("id")
);
CREATE UNIQUE INDEX "accounts_provider_providerAccountId_key" ON "accounts"("provider", "providerAccountId");

CREATE TABLE "sessions" (
    "id"           TEXT NOT NULL DEFAULT gen_random_uuid(),
    "sessionToken" TEXT NOT NULL,
    "userId"       TEXT NOT NULL,
    "expires"      TIMESTAMP(3) NOT NULL,
    CONSTRAINT "sessions_pkey" PRIMARY KEY ("id")
);
CREATE UNIQUE INDEX "sessions_sessionToken_key" ON "sessions"("sessionToken");

-- ============================================
-- 4. 匹配对话（conversations + messages）
-- ============================================
CREATE TABLE "conversations" (
    "id"         TEXT NOT NULL DEFAULT generate_big_id(),
    "title"      TEXT,
    "userId"     TEXT NOT NULL,
    "resumeKey"  TEXT,
    "resumeName" TEXT,
    "createdAt"  TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt"  TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "deletedAt"  TIMESTAMP(3),
    CONSTRAINT "conversations_pkey" PRIMARY KEY ("id")
);
CREATE INDEX "conversations_userId_idx" ON "conversations"("userId");

CREATE TABLE "messages" (
    "id"             TEXT NOT NULL DEFAULT generate_big_id(),
    "conversationId" TEXT NOT NULL,
    "role"           "MessageRole" NOT NULL,
    "content"        TEXT NOT NULL,
    "sources"        JSONB,
    "rating"         "MessageRating",
    "feedback"       TEXT,
    "createdAt"      TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT "messages_pkey" PRIMARY KEY ("id")
);
CREATE INDEX "messages_conversationId_idx" ON "messages"("conversationId");

-- ============================================
-- 5. AI 聊天（ai_chat_conversations + ai_chat_messages）
-- ============================================
CREATE TABLE "ai_chat_conversations" (
    "id"        TEXT NOT NULL DEFAULT generate_big_id(),
    "title"     TEXT,
    "userId"    TEXT NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "deletedAt" TIMESTAMP(3),
    CONSTRAINT "ai_chat_conversations_pkey" PRIMARY KEY ("id")
);
CREATE INDEX "ai_chat_conversations_userId_idx" ON "ai_chat_conversations"("userId");

CREATE TABLE "ai_chat_messages" (
    "id"             TEXT NOT NULL DEFAULT generate_big_id(),
    "conversationId" TEXT NOT NULL,
    "role"           "MessageRole" NOT NULL,
    "content"        TEXT NOT NULL,
    "sources"        JSONB,
    "rating"         "MessageRating",
    "feedback"       TEXT,
    "createdAt"      TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT "ai_chat_messages_pkey" PRIMARY KEY ("id")
);
CREATE INDEX "ai_chat_messages_conversationId_idx" ON "ai_chat_messages"("conversationId");

-- ============================================
-- 6. API Keys
-- ============================================
CREATE TABLE "api_keys" (
    "id"         TEXT NOT NULL DEFAULT generate_big_id(),
    "name"       TEXT NOT NULL,
    "key"        TEXT NOT NULL,
    "userId"     TEXT NOT NULL,
    "permissions" JSONB,
    "lastUsedAt" TIMESTAMP(3),
    "isActive"   BOOLEAN NOT NULL DEFAULT true,
    "expiresAt"  TIMESTAMP(3),
    "createdAt"  TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt"  TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT "api_keys_pkey" PRIMARY KEY ("id")
);
CREATE UNIQUE INDEX "api_keys_key_key" ON "api_keys"("key");
CREATE INDEX "api_keys_userId_idx" ON "api_keys"("userId");
CREATE INDEX "api_keys_key_idx" ON "api_keys"("key");

-- ============================================
-- 7. Audit Logs
-- ============================================
CREATE TABLE "audit_logs" (
    "id"         TEXT NOT NULL DEFAULT generate_big_id(),
    "userId"     TEXT,
    "action"     TEXT NOT NULL,
    "resource"   TEXT,
    "resourceId" TEXT,
    "ipAddress"  TEXT,
    "userAgent"  TEXT,
    "metadata"   JSONB,
    "createdAt"  TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT "audit_logs_pkey" PRIMARY KEY ("id")
);
CREATE INDEX "audit_logs_userId_idx" ON "audit_logs"("userId");
CREATE INDEX "audit_logs_createdAt_idx" ON "audit_logs"("createdAt");

-- ============================================
-- 8. Model Usage（模型用量追踪）
-- ============================================
CREATE TABLE "model_usage" (
    "id"     TEXT NOT NULL DEFAULT generate_big_id(),
    "userId" TEXT NOT NULL,
    "model"  TEXT NOT NULL,
    "count"  INTEGER NOT NULL DEFAULT 0,
    CONSTRAINT "model_usage_pkey" PRIMARY KEY ("id")
);
CREATE UNIQUE INDEX "model_usage_userId_model_key" ON "model_usage"("userId", "model");

-- ============================================
-- 9. 外键约束
-- ============================================
ALTER TABLE "accounts" ADD CONSTRAINT "accounts_userId_fkey" FOREIGN KEY ("userId") REFERENCES "users"("id") ON DELETE CASCADE ON UPDATE CASCADE;
ALTER TABLE "sessions" ADD CONSTRAINT "sessions_userId_fkey" FOREIGN KEY ("userId") REFERENCES "users"("id") ON DELETE CASCADE ON UPDATE CASCADE;
ALTER TABLE "conversations" ADD CONSTRAINT "conversations_userId_fkey" FOREIGN KEY ("userId") REFERENCES "users"("id") ON DELETE CASCADE ON UPDATE CASCADE;
ALTER TABLE "messages" ADD CONSTRAINT "messages_conversationId_fkey" FOREIGN KEY ("conversationId") REFERENCES "conversations"("id") ON DELETE CASCADE ON UPDATE CASCADE;
ALTER TABLE "ai_chat_conversations" ADD CONSTRAINT "ai_chat_conversations_userId_fkey" FOREIGN KEY ("userId") REFERENCES "users"("id") ON DELETE CASCADE ON UPDATE CASCADE;
ALTER TABLE "ai_chat_messages" ADD CONSTRAINT "ai_chat_messages_conversationId_fkey" FOREIGN KEY ("conversationId") REFERENCES "ai_chat_conversations"("id") ON DELETE CASCADE ON UPDATE CASCADE;
ALTER TABLE "api_keys" ADD CONSTRAINT "api_keys_userId_fkey" FOREIGN KEY ("userId") REFERENCES "users"("id") ON DELETE CASCADE ON UPDATE CASCADE;
ALTER TABLE "model_usage" ADD CONSTRAINT "model_usage_userId_fkey" FOREIGN KEY ("userId") REFERENCES "users"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- ============================================
-- 10. Prisma 迁移记录表 & 标记已应用
-- ============================================
CREATE TABLE "_prisma_migrations" (
    "id"                  TEXT NOT NULL,
    "checksum"            TEXT NOT NULL,
    "finished_at"         TIMESTAMPTZ,
    "migration_name"      TEXT NOT NULL,
    "logs"                TEXT,
    "rolled_back_at"      TIMESTAMPTZ,
    "started_at"          TIMESTAMPTZ,
    "applied_steps_count" INTEGER NOT NULL DEFAULT 0,
    CONSTRAINT "_prisma_migrations_pkey" PRIMARY KEY ("id")
);

INSERT INTO "_prisma_migrations" (id, checksum, finished_at, migration_name, logs, rolled_back_at, started_at, applied_steps_count)
VALUES
  ('20260410083032_initial_setup', 'manual_init', NOW(), '20260410083032_initial_setup', NULL, NULL, NOW(), 0),
  ('20260617000000_add_big_id_function', 'manual_init', NOW(), '20260617000000_add_big_id_function', NULL, NULL, NOW(), 0);
