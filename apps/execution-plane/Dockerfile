FROM node:24-alpine AS base
RUN npm i -g pnpm@11.1.2
WORKDIR /app

FROM base AS deps
COPY package.json pnpm-workspace.yaml ./
COPY apps/execution-plane/package.json ./apps/execution-plane/
COPY packages/shared/package.json ./packages/shared/
RUN pnpm install --frozen-lockfile

FROM base AS development
COPY --from=deps /app/node_modules ./node_modules
COPY . .
WORKDIR /app/apps/execution-plane
CMD ["pnpm", "dev"]

FROM deps AS builder
COPY . .
RUN pnpm --filter @simforge/shared build
RUN pnpm --filter execution-plane build

FROM node:24-alpine AS production
RUN npm i -g pnpm@11.1.2
RUN addgroup -g 1001 -S nodejs && adduser -S worker -u 1001
WORKDIR /app
COPY --from=builder /app/apps/execution-plane/dist ./dist
COPY --from=deps /app/node_modules ./node_modules
USER worker
CMD ["node", "--max-old-space-size=4096", "dist/worker/worker.main.js"]
