FROM node:24-alpine AS base
RUN npm i -g pnpm@11.1.2
WORKDIR /app

FROM base AS deps
COPY package.json pnpm-workspace.yaml ./
COPY apps/control-plane/package.json ./apps/control-plane/
COPY packages/shared/package.json ./packages/shared/
RUN pnpm install --frozen-lockfile

FROM base AS development
COPY --from=deps /app/node_modules ./node_modules
COPY . .
WORKDIR /app/apps/control-plane
EXPOSE 4000
CMD ["pnpm", "dev"]

FROM deps AS builder
COPY . .
RUN pnpm --filter @simforge/shared build
RUN pnpm --filter control-plane build

FROM node:24-alpine AS production
RUN npm i -g pnpm@11.1.2
RUN addgroup -g 1001 -S nodejs && adduser -S nestjs -u 1001
WORKDIR /app
COPY --from=builder /app/apps/control-plane/dist ./dist
COPY --from=deps /app/node_modules ./node_modules
USER nestjs
EXPOSE 4000
CMD ["node", "dist/main.js"]
