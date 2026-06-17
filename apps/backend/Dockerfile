FROM node:20-alpine

WORKDIR /app

# Cache bust: change this value to force a clean rebuild
ARG CACHE_BUST=1
RUN echo "Build cache bust: ${CACHE_BUST}"

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

# 确保启动脚本可执行
RUN chmod +x apps/backend/start.sh

EXPOSE 4000

ENV NODE_ENV=production
ENV PORT=4000

# 容器启动时先跑数据库迁移（用直连 URL 绕过连接池），再启动应用
CMD ["/app/apps/backend/start.sh"]
