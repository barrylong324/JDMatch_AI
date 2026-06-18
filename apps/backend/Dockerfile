FROM node:22-alpine

WORKDIR /app

# Install pnpm and OpenSSL
RUN corepack enable && corepack prepare pnpm@latest --activate && \
    apk add --no-cache openssl

# Copy all files
COPY . .

# Install all dependencies
RUN pnpm install --frozen-lockfile

# Generate Prisma client
RUN cd packages/database && pnpm exec prisma generate

# Build backend
RUN pnpm turbo run build --filter=@jd-match/backend...

EXPOSE 4000

ENV NODE_ENV=production
ENV PORT=4000

# 容器启动时先跑数据库迁移（用直连 URL 绕过连接池），再启动应用
# Prisma 的 directUrl 字段会自动读取 DIRECT_DATABASE_URL 环境变量进行迁移
CMD ["sh", "-c", "cd /app/packages/database && pnpm exec prisma migrate deploy && node /app/apps/backend/dist/main.js"]
