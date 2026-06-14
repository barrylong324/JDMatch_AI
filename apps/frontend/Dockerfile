FROM node:20-alpine

WORKDIR /app

# Install pnpm
RUN corepack enable && corepack prepare pnpm@latest --activate

# Copy all files
COPY . .

# Install dependencies
RUN pnpm install --frozen-lockfile

# Build frontend
RUN pnpm turbo run build --filter=@jd-match/frontend

EXPOSE 3000

ENV NODE_ENV=production
ENV PORT=3000
ENV NEXT_PUBLIC_API_URL=http://localhost:4000/api

CMD ["node", "apps/frontend/node_modules/next/dist/bin/next", "start"]
