# Stage 1: Build
FROM node:22-alpine AS build
RUN corepack enable && corepack prepare pnpm@10.33.0 --activate
WORKDIR /app

COPY pnpm-lock.yaml pnpm-workspace.yaml package.json tsconfig.base.json ./
COPY packages/frontend/package.json packages/frontend/

RUN pnpm install --frozen-lockfile --filter frontend

COPY packages/frontend/ packages/frontend/

RUN pnpm --filter frontend build

# Stage 2: Serve
FROM nginxinc/nginx-unprivileged:stable-alpine
COPY --from=build /app/packages/frontend/dist/ /usr/share/nginx/html/
COPY packages/frontend/nginx.conf /etc/nginx/conf.d/default.conf
EXPOSE 8080
