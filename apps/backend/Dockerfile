FROM node:20-alpine

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

# 容器启动时先运行数据库迁移，再启动应用
CMD ["sh", "-c", "cd /app/packages/database && pnpm exec prisma migrate deploy && node /app/apps/backend/dist/main.js"]
