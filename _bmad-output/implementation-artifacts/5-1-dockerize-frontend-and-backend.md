# Story 5.1: Dockerize Frontend & Backend

Status: done

## Story

As a user,
I want the frontend and backend built into lean, production-ready container images,
so that whoever runs the app gets the same artifacts every time — no drift between laptops or servers.

## Acceptance Criteria

1. **Frontend Dockerfile (multi-stage → nginx:alpine)**
   **Given** the frontend package
   **When** a Docker image is built from `packages/frontend/Dockerfile`
   **Then** Stage 1 (build) uses a Node image with pnpm to run `pnpm build` and produce static files in `dist/`
   **And** Stage 2 (serve) uses `nginx:alpine` to serve the static files
   **And** the final image contains no Node runtime, no source files, no `node_modules`

2. **nginx.conf with static serving + API proxy**
   **Given** the frontend Docker image
   **When** nginx starts
   **Then** it serves static assets from `/usr/share/nginx/html` with gzip compression and caching headers
   **And** requests to `/api/*` are proxied to the backend service (upstream `http://backend:3000`)
   **And** SPA fallback returns `index.html` for non-file routes (`try_files $uri $uri/ /index.html`)

3. **Backend Dockerfile (multi-stage → node:alpine)**
   **Given** the backend package
   **When** a Docker image is built from `packages/backend/Dockerfile`
   **Then** Stage 1 (build) compiles TypeScript to JavaScript via `tsc`
   **And** Stage 2 (run) uses `node:alpine` with only production dependencies and compiled output in `dist/`
   **And** the final image contains no TypeScript source, no devDependencies, no build tooling

4. **Build verification**
   **Given** either Dockerfile
   **When** `docker build` completes
   **Then** the build succeeds without errors
   **And** the resulting image can be inspected to verify it contains only production artifacts

## Tasks / Subtasks

- [x] Task 1: Create `packages/frontend/Dockerfile` (AC: #1)
  - [x] Stage 1: `node:22-alpine` base, enable corepack + pnpm, copy workspace root `pnpm-lock.yaml` + `pnpm-workspace.yaml` + `package.json`, copy `packages/frontend/package.json`, run `pnpm install --frozen-lockfile --filter frontend`, copy frontend source, run `pnpm --filter frontend build`
  - [x] Stage 2: `nginx:alpine` base, copy `dist/` to `/usr/share/nginx/html`, copy `nginx.conf`, expose port 80
- [x] Task 2: Create `packages/frontend/nginx.conf` (AC: #2)
  - [x] Configure gzip for text/html, text/css, application/javascript, application/json, image/svg+xml
  - [x] Configure caching headers for static assets (`/assets/*` with long cache, `index.html` with no-cache)
  - [x] Configure `/api/` proxy_pass to `http://backend:3000`
  - [x] Configure SPA fallback with `try_files`
- [x] Task 3: Create `packages/backend/Dockerfile` (AC: #3)
  - [x] Stage 1: `node:22-alpine` base, enable corepack + pnpm, copy workspace root lock + workspace yaml + package.json, copy `packages/backend/package.json`, run `pnpm install --frozen-lockfile --filter backend`, copy backend source + `drizzle.config.ts` + `tsconfig.json`, run `pnpm --filter backend build`
  - [x] Stage 2: `node:22-alpine` base, copy compiled `dist/` from build stage, copy `node_modules` production deps, copy `drizzle.config.ts` and migration files for runtime migration, set `NODE_ENV=production`, expose port 3000, CMD `node dist/server.js`
- [x] Task 4: Verify both images build (AC: #4)
  - [x] `docker build -f packages/frontend/Dockerfile .` from repo root succeeds
  - [x] `docker build -f packages/backend/Dockerfile .` from repo root succeeds

### Review Findings

- [x] [Review][Decision] Keep `drizzle.config.ts` in runtime image or enforce "no TypeScript source" literally — resolved: keep `drizzle.config.ts` for Story 5.2 migration flow; treat AC #3 wording as a documented exception for now.
- [x] [Review][Patch] Remove package-manager/build tooling from backend runtime image (`corepack`/`pnpm`) to align with AC #3 strict "no build tooling" requirement [packages/backend/Dockerfile:18]

## Dev Notes

### Critical: pnpm monorepo Docker context

Both Dockerfiles MUST use the **repository root** as the Docker build context (not the package directory). This is because pnpm requires `pnpm-lock.yaml` and `pnpm-workspace.yaml` at the workspace root for `--frozen-lockfile` installs. Docker Compose will set `context: .` and `dockerfile: packages/frontend/Dockerfile` etc.

The `COPY` paths in each Dockerfile are relative to the repo root context:
```dockerfile
COPY pnpm-lock.yaml pnpm-workspace.yaml package.json ./
COPY packages/frontend/package.json packages/frontend/
```

### Critical: Backend production deps

The backend stage 2 needs production-only dependencies. Use pnpm's `--prod` flag or `pnpm deploy` to get a clean production `node_modules`. The key runtime deps are: `fastify`, `drizzle-orm`, `postgres`, `zod`, `@fastify/cors`, `@fastify/helmet`, `@fastify/swagger`, `@fastify/swagger-ui`, `fastify-plugin`, `fastify-type-provider-zod`, `dotenv`.

### Critical: Backend migration files

The backend image must include Drizzle migration files (`packages/backend/src/schema/migrations/`) and `drizzle.config.ts` so that `drizzle-kit migrate` can run at container startup (handled in Story 5.2's entrypoint). The `drizzle.config.ts` loads `.env` via `dotenv` using a relative path — the entrypoint script will set `DATABASE_URL` as an environment variable, which `process.env` picks up.

### Critical: Backend .env loading

`packages/backend/src/config/env.ts` loads `.env` from `../../.env` relative to its own directory. In the Docker container, `process.env` variables are set by Docker Compose `environment:` or `env_file:`, so `dotenv` will simply read what's already there. **Do not** bake a `.env` file into the image — it must come from the runtime environment.

### Critical: Backend host binding

`server.ts` already listens on `host: '0.0.0.0'` — required for Docker networking. No changes needed.

### Architecture compliance

- Frontend serving: nginx:alpine (~7MB) per architecture decision [Source: architecture.md — Infrastructure & Deployment]
- Backend runtime: node:alpine per architecture decision [Source: architecture.md — Infrastructure & Deployment]
- Build artifacts only, no source in production images [Source: epics.md — Story 5.1 AC]

### Existing project structure (files that matter)

| Path | Relevance |
|------|-----------|
| `pnpm-lock.yaml` | Must be copied into Docker build context for `--frozen-lockfile` |
| `pnpm-workspace.yaml` | Required for pnpm workspace resolution |
| `package.json` (root) | Root workspace config, `packageManager` field |
| `packages/frontend/package.json` | Frontend deps (react, tanstack-query, tailwind, shadcn, etc.) |
| `packages/frontend/vite.config.ts` | Build config — `pnpm build` runs `tsc -b && vite build` |
| `packages/frontend/index.html` | Vite entry point |
| `packages/frontend/src/` | All frontend source |
| `packages/backend/package.json` | Backend deps (fastify, drizzle-orm, postgres, zod) |
| `packages/backend/tsconfig.json` | TypeScript config — `pnpm build` runs `tsc` |
| `packages/backend/src/` | All backend source |
| `packages/backend/drizzle.config.ts` | Drizzle Kit config (needed for migration) |
| `packages/backend/src/schema/migrations/` | SQL migration files |

### Library/framework specifics

- **pnpm 10.33.0**: The `packageManager` field in root `package.json` pins the version. Use `corepack enable && corepack prepare` in Dockerfile to install matching pnpm.
- **Node 22 LTS**: Use `node:22-alpine` for consistency with the TypeScript 6.x and pnpm 10.x versions in the project.
- **nginx:alpine**: Latest stable nginx on Alpine — ~7MB image. Default worker processes (auto = CPU count).
- **Vite build output**: Static files land in `packages/frontend/dist/` including `index.html` and `assets/` with hashed filenames.
- **TypeScript compilation**: Backend `tsc` outputs to `packages/backend/dist/` with `.js` and `.d.ts` files. Entry point is `dist/server.js`.

### Testing guidance

No automated tests for Dockerfiles. Verification is manual: `docker build` succeeds, `docker images` shows reasonable sizes, `docker run` + `docker exec ls` confirms no source files in production images. Full integration testing happens in Story 5.2 (Docker Compose).

### Previous story intelligence

**From Epic 4 Retro:**
- Opus 4.6 recommended for implementation — zero deferrals in Epic 4 stories.
- No architectural discoveries from Epic 4 that invalidate Epic 5's plan.

### .dockerignore

Create a `.dockerignore` at the repo root to exclude unnecessary files from the build context:
```
node_modules
dist
.git
.env
.env.*
!.env.example
*.md
_bmad*
.cursor
e2e
coverage
*.log
```

### References

- [Source: `_bmad-output/planning-artifacts/epics.md` — Epic 5, Story 5.1]
- [Source: `_bmad-output/planning-artifacts/architecture.md` — Infrastructure & Deployment, Project Structure]
- [Source: `packages/backend/src/server.ts` — host: '0.0.0.0' already set]
- [Source: `packages/backend/src/config/env.ts` — dotenv loading pattern]
- [Source: `packages/backend/drizzle.config.ts` — migration config]

## Dev Agent Record

### Agent Model Used

Claude Opus 4.6 (Cursor)

### Debug Log References

- Frontend Dockerfile initially failed: `tsconfig.base.json` not copied into build context (both frontend tsconfigs extend `../../tsconfig.base.json`). Fixed by adding `tsconfig.base.json` to COPY.
- Frontend `tsc -b` failed on test files (`animation-no-raw-durations.test.ts`) importing `node:fs`/`node:path` — test files were included in `tsconfig.app.json` via `"include": ["src"]`. Fixed by adding exclude for test files in `tsconfig.app.json`.
- Backend production install (`--prod`) failed because root `prepare` script runs `simple-git-hooks` (a devDependency). Fixed by adding `--ignore-scripts` to the production install.

### Completion Notes List

- Created multi-stage frontend Dockerfile: node:22-alpine build → nginx:alpine serve (92.5MB final image)
- Created nginx.conf with gzip, hashed-asset caching (1y immutable), index.html no-cache, /api/ proxy to backend:3000, SPA fallback
- Created multi-stage backend Dockerfile: node:22-alpine build → node:22-alpine production (320MB final image with prod deps only)
- Backend image includes compiled dist/, production node_modules, drizzle.config.ts, and migration files for runtime migration
- Created .dockerignore to keep build context clean (excludes node_modules, dist, .git, .env, docs, etc.)
- Fixed pre-existing issue: tsconfig.app.json now excludes test files from production type checking
- All 220 existing tests pass (194 frontend + 26 backend), zero regressions
- Linter passes clean (83 files checked)

### Change Log

- 2026-04-13: Story 5.1 implemented — Dockerized frontend and backend with multi-stage builds

### File List

- `packages/frontend/Dockerfile` (new)
- `packages/frontend/nginx.conf` (new)
- `packages/backend/Dockerfile` (new)
- `.dockerignore` (new)
- `packages/frontend/tsconfig.app.json` (modified — added test file exclusions for production build)
