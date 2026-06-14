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
ENV DATABASE_URL=postgresql://postgres:postgres@postgres:5432/jd_match_db
ENV REDIS_URL=redis://redis:6379

CMD ["node", "apps/backend/dist/main.js"]
