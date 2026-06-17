#!/bin/sh
set -e

echo "==> Running Prisma migrations..."
cd /app/packages/database
pnpm exec prisma migrate deploy

echo "==> Starting application..."
exec node /app/apps/backend/dist/main.js
