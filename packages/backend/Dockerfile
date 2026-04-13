# Stage 1: Build
FROM node:22-alpine AS build
RUN corepack enable && corepack prepare pnpm@10.33.0 --activate
WORKDIR /app

COPY pnpm-lock.yaml pnpm-workspace.yaml package.json tsconfig.base.json ./
COPY packages/backend/package.json packages/backend/

RUN pnpm install --frozen-lockfile --filter backend

COPY packages/backend/src/ packages/backend/src/
COPY packages/backend/tsconfig.json packages/backend/
COPY packages/backend/drizzle.config.ts packages/backend/

RUN pnpm --filter backend build

# Stage 2: Production dependencies
FROM node:22-alpine AS prod-deps
RUN corepack enable && corepack prepare pnpm@10.33.0 --activate
WORKDIR /app

COPY pnpm-lock.yaml pnpm-workspace.yaml package.json ./
COPY packages/backend/package.json packages/backend/

RUN pnpm install --frozen-lockfile --filter backend --prod --ignore-scripts

# Stage 3: Run
FROM node:22-alpine
WORKDIR /app

COPY --from=prod-deps /app/node_modules/ node_modules/
COPY --from=prod-deps /app/packages/backend/node_modules/ packages/backend/node_modules/
COPY --from=build /app/packages/backend/dist/ packages/backend/dist/
COPY packages/backend/drizzle.config.ts packages/backend/
COPY packages/backend/src/schema/migrations/ packages/backend/src/schema/migrations/

ENV NODE_ENV=production
EXPOSE 3000

CMD ["node", "packages/backend/dist/server.js"]
