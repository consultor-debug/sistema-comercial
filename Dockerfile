# Base image
FROM node:20-slim AS base

# Install openssl for Prisma
RUN apt-get update && apt-get install -y openssl && rm -rf /var/lib/apt/lists/*

WORKDIR /app

# Dependencies
COPY package*.json ./
COPY prisma ./prisma/
RUN npm ci

# Source code
COPY . .

# Generate Prisma Client
RUN npx prisma generate

# Build application
RUN npm run build

# Production image
FROM node:20-slim AS runner
RUN apt-get update && apt-get install -y openssl && rm -rf /var/lib/apt/lists/*
WORKDIR /app

ENV NODE_ENV=production

COPY --from=base /app/next.config.ts ./
COPY --from=base /app/next.config.js ./next.config.js 2>/dev/null || true
COPY --from=base /app/next.config.mjs ./next.config.mjs 2>/dev/null || true
COPY --from=base /app/package.json ./package.json
COPY --from=base /app/.next ./.next
COPY --from=base /app/public ./public
COPY --from=base /app/node_modules ./node_modules
COPY --from=base /app/prisma ./prisma

EXPOSE 3000

CMD ["npm", "start"]
