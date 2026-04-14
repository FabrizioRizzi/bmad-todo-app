# Story 5.2: Docker Compose & Data Persistence

Status: done

## Story

As a user,
I want to start the entire application with a single command,
so that I can deploy and demonstrate the complete working product.

## Acceptance Criteria

1. **Three-service Docker Compose**
   **Given** the repository root
   **When** I run `docker compose up`
   **Then** three services start: `frontend` (nginx), `backend` (Fastify), and `db` (PostgreSQL 16-alpine)
   **And** the frontend is accessible at `http://localhost:8080`
   **And** the backend API is accessible through the nginx proxy at `/api/*`
   **And** the database accepts connections from the backend service

2. **PostgreSQL with named volume**
   **Given** the Docker Compose configuration
   **When** the `db` service is defined
   **Then** it uses `postgres:16-alpine` image
   **And** a named Docker volume (`pgdata`) is configured for PostgreSQL data persistence at `/var/lib/postgresql/data`
   **And** database credentials are read from Docker secrets files (`secrets/postgres_user.txt`, `secrets/postgres_password.txt`) (not hardcoded in `docker-compose.yml`)

3. **Environment configuration**
   **Given** the `.env.example` file
   **When** copied to `.env` and populated
   **Then** it contains all required non-secret environment variables: `DATABASE_URL`, `POSTGRES_DB`, `PORT` (backend), `FRONTEND_PORT`, `NODE_ENV`, `ALLOWED_ORIGINS`
   **And** the `.env` file is listed in `.gitignore` (already the case)
   **And** `secrets/README.md` documents local Docker secret file setup

4. **End-to-end operation**
   **Given** the application is running via Docker Compose
   **When** I create, complete, and delete todos through the frontend
   **Then** all operations succeed end-to-end (frontend → nginx → backend → PostgreSQL)

5. **Data persistence across restarts**
   **Given** the application is running with existing todos
   **When** I run `docker compose down` followed by `docker compose up`
   **Then** all previously created todos are still present (data persists via named volume)
   **And** no data is lost across container restarts

6. **Fresh clone workflow**
   **Given** a fresh clone of the repository
   **When** a developer runs `cp .env.example .env`, creates `secrets/postgres_user.txt` and `secrets/postgres_password.txt`, and runs `docker compose up --build`
   **Then** the entire application builds and starts successfully from a single command
   **And** the app is fully functional on the configured port

7. **Migrations on startup**
   **Given** the backend container starts
   **When** the entrypoint runs
   **Then** `drizzle-kit migrate` applies any pending migrations before the API accepts requests
   **And** if no migrations are pending, the startup proceeds without error

## Tasks / Subtasks

- [x] Task 1: Create `docker-compose.yml` at repo root (AC: #1, #2)
  - [x] Define `db` service: `postgres:16-alpine`, named volume `pgdata`, health check (`pg_isready`), credentials from Docker secrets files
  - [x] Define `backend` service: build from `packages/backend/Dockerfile`, context `.`, depends_on `db` (healthy), DB connection env + Docker secrets files, expose port 3000 internally
  - [x] Define `frontend` service: build from `packages/frontend/Dockerfile`, context `.`, depends_on `backend`, port mapping `${FRONTEND_PORT:-8080}:80`
  - [x] Define named volume `pgdata`
- [x] Task 2: Create backend entrypoint script for migration (AC: #7)
  - [x] Create `packages/backend/docker-entrypoint.sh`: runs `npx drizzle-kit migrate` then `exec node dist/server.js`
  - [x] Update backend Dockerfile to copy entrypoint, set as ENTRYPOINT
- [x] Task 3: Update `.env.example` with Docker Compose variables (AC: #3)
  - [x] Keep local `DATABASE_URL` for non-Docker development
  - [x] Keep non-secret Docker Compose variables (`POSTGRES_DB`, `FRONTEND_PORT`, `ALLOWED_ORIGINS`) and document Docker secrets usage
  - [x] Add `ALLOWED_ORIGINS` with Docker frontend URL
  - [x] Add comments distinguishing local dev vs Docker Compose usage
- [x] Task 4: Configure backend `DATABASE_URL` for Docker networking and secret credentials (AC: #1)
  - [x] In backend entrypoint, read user/password from `POSTGRES_USER_FILE`/`POSTGRES_PASSWORD_FILE`, URL-encode them, and export runtime `DATABASE_URL` pointing to `db:5432`
  - [x] Keep `env.ts` Zod validation on `DATABASE_URL`; entrypoint guarantees it exists before migrations/server start
- [x] Task 5: Verify full workflow (AC: #4, #5, #6)
  - [x] `docker compose build` succeeds
  - [x] `docker compose up` starts all three services and frontend is accessible
  - [x] Create/complete/delete todos works end-to-end
  - [x] `docker compose down && docker compose up` preserves data
  - [x] `docker compose down -v && docker compose up --build` starts fresh

### Review Findings

- [x] [Review][Patch] Document URL-safe `POSTGRES_*` credentials for compose-built `DATABASE_URL` to avoid URI parsing failures with reserved characters (`@`, `:`, `/`, `%`) [.env.example:10]
- [x] [Review][Patch] Gate frontend startup on backend readiness to avoid transient `/api` failures during migration startup [docker-compose.yml:38]
- [x] [Review][Defer] Existing `pgdata` volume + changed `POSTGRES_*` values can cause auth/database mismatch on restart [docker-compose.yml:6] — deferred, pre-existing

## Dev Notes

### Critical: Docker Compose service names and networking

Docker Compose creates a default network where services are addressable by their service name. The `backend` service connects to `db:5432`, and the nginx `proxy_pass` in the frontend targets `backend:3000`. These hostnames MUST match the service names in `docker-compose.yml`.

The nginx.conf created in Story 5.1 uses `proxy_pass http://backend:3000` — confirm the backend service is named `backend` in the compose file.

### Critical: DATABASE_URL construction

For Docker Compose, `DATABASE_URL` must use the `db` service hostname and secret-backed credentials. The backend entrypoint reads `POSTGRES_USER_FILE` and `POSTGRES_PASSWORD_FILE`, URL-encodes values, and exports runtime `DATABASE_URL=postgresql://<encoded-user>:<encoded-password>@db:5432/${POSTGRES_DB}` before running migrations.

Keep `.env.example` `DATABASE_URL` as the local dev default (`localhost`) for non-Docker workflows.

### Critical: Migration entrypoint

The backend container must run migrations before starting the API server. Create a shell script entrypoint:

```sh
#!/bin/sh
set -e
npx drizzle-kit migrate
exec node dist/server.js
```

Key points:
- `npx drizzle-kit migrate` uses `DATABASE_URL` from the environment (already validated by drizzle.config.ts via `process.env`)
- `exec` replaces the shell with the node process (proper signal handling, PID 1)
- `set -e` ensures migration failure stops the container
- The `drizzle-kit` binary is in `node_modules/.bin/` — must be included in the production image (add `drizzle-kit` to production dependencies OR keep it in the image via a separate install step)

**Important**: `drizzle-kit` is currently a devDependency. For the migration entrypoint to work, either:
- Move `drizzle-kit` to `dependencies` in backend `package.json`, OR
- Install it separately in the Dockerfile build stage and copy the binary, OR
- Use a dedicated migration stage/step before the app starts

The simplest approach: move `drizzle-kit` to `dependencies` since it's needed at runtime for migrations.

### Critical: Backend env.ts dotenv path

`config/env.ts` calls `config({ path: fileURLToPath(new URL('../../.env', import.meta.url)) })` which resolves relative to the compiled `dist/config/env.js`. In the Docker container, this path may not exist — but that's fine because `dotenv` won't throw if the file is missing, and `process.env` variables are already set by Docker Compose. Verify this works correctly.

### Critical: PostgreSQL health check

The backend must wait for PostgreSQL to be ready before attempting to run migrations. Use `depends_on` with a health check that reads the configured DB user from the mounted Docker secret:

```yaml
db:
  image: postgres:16-alpine
  healthcheck:
    test: ["CMD-SHELL", "pg_isready -U \"$$(cat /run/secrets/postgres_user)\" -d ${POSTGRES_DB:-bmad_todo}"]
    interval: 5s
    timeout: 5s
    retries: 5
```

### Architecture compliance

- Docker Compose with 3 services: nginx, Fastify, PostgreSQL per architecture [Source: architecture.md — Infrastructure & Deployment]
- Named Docker volume for persistence [Source: architecture.md — Infrastructure & Deployment]
- `.env` for non-secret config + Docker secrets files for credentials [Source: architecture.md — Infrastructure & Deployment]
- Drizzle-kit migrate before API startup [Source: architecture.md — Data Architecture, Migrations]

### .env.example update plan

Current `.env.example`:
```
DATABASE_URL=postgresql://postgres:postgres@localhost:5432/bmad_todo
PORT=3000
NODE_ENV=development
# ALLOWED_ORIGINS=http://localhost:5173,https://app.example.com
```

After update:
```
# === Local Development ===
DATABASE_URL=postgresql://postgres:postgres@localhost:5432/bmad_todo
PORT=3000
NODE_ENV=development

# === Docker Compose ===
# DATABASE_URL is built at container startup using Docker secrets and db hostname
# Create secrets/postgres_user.txt and secrets/postgres_password.txt per secrets/README.md
POSTGRES_DB=bmad_todo
FRONTEND_PORT=8080
NODE_ENV=production
ALLOWED_ORIGINS=http://localhost:8080
```

### Service dependency chain

```
db (postgres:16-alpine)
  ↓ depends_on (healthy)
backend (node:alpine + compiled app)
  ↓ depends_on
frontend (nginx:alpine + static files)
```

### Port mapping

| Service | Internal Port | External Port |
|---------|--------------|---------------|
| db | 5432 | not exposed (internal only) |
| backend | 3000 | not exposed (nginx proxies) |
| frontend | 80 | `${FRONTEND_PORT:-8080}` |

The database port should NOT be exposed to the host in production. For debugging, a developer can add `ports: ["5432:5432"]` temporarily.

### Previous story intelligence

**Story 5.1 creates**: `packages/frontend/Dockerfile`, `packages/frontend/nginx.conf`, `packages/backend/Dockerfile`. This story builds on those artifacts.

**From Epic 4 Retro**: Model selection — prefer Opus 4.6 for implementation.

### Testing guidance

No automated tests for Docker Compose. Verification is a manual smoke test:
1. `docker compose up --build` → all services start
2. Open `http://localhost:8080` → app loads
3. Create a todo → appears in list
4. `docker compose down && docker compose up` → todo persists
5. `docker compose down -v` → cleans volume (fresh start)

### References

- [Source: `_bmad-output/planning-artifacts/epics.md` — Epic 5, Story 5.2]
- [Source: `_bmad-output/planning-artifacts/architecture.md` — Infrastructure & Deployment, Data Architecture]
- [Source: `packages/backend/src/config/env.ts` — Zod env validation + dotenv loading]
- [Source: `packages/backend/drizzle.config.ts` — uses DATABASE_URL from process.env]
- [Source: `.env.example` — current env template]
- [Source: `.gitignore` — already ignores .env files]

## Dev Agent Record

### Agent Model Used

Claude Opus 4.6

### Debug Log References

None — no debug issues encountered.

### Completion Notes List

- Created `docker-compose.yml` with three services (db, backend, frontend) and named volume `pgdata`
- PostgreSQL uses `pg_isready` health check with Docker secret user; backend `depends_on` db with `condition: service_healthy`
- Backend and db credentials are provided via Docker secrets (`secrets/postgres_user.txt`, `secrets/postgres_password.txt`) instead of plain env vars
- `docker-entrypoint.sh` builds runtime `DATABASE_URL` from secret files (URL-encoded) before running migrations
- Created `docker-entrypoint.sh` that runs `drizzle-kit migrate` before starting the Node server with `exec` for proper PID 1 signal handling
- Moved `drizzle-kit` from devDependencies to dependencies in backend `package.json` (required for production migration entrypoint)
- Updated `.env.example` with non-secret Docker Compose variables and documented secret-file workflow
- Added `secrets/README.md` and `.gitignore` rules to keep secret files out of git
- Updated backend Dockerfile to copy and use entrypoint script (ENTRYPOINT replaces CMD)
- Verified full workflow: build, up, CRUD operations, data persistence across restarts, fresh clone workflow
- All 220 existing tests pass (26 backend, 194 frontend) — no regressions

### File List

- docker-compose.yml (new)
- packages/backend/docker-entrypoint.sh (new)
- packages/backend/Dockerfile (modified — added entrypoint copy + ENTRYPOINT directive)
- packages/backend/package.json (modified — moved drizzle-kit from devDependencies to dependencies)
- .env.example (modified — Docker Compose non-secret variables + secrets guidance)
- .gitignore (modified — ignore `secrets/*` except `secrets/README.md`)
- secrets/README.md (new)
- pnpm-lock.yaml (modified — updated after dependency move)

### Change Log

- 2026-04-13: Implemented Docker Compose with 3 services (PostgreSQL, Fastify backend, nginx frontend), migration entrypoint, environment configuration, and named volume for data persistence. All ACs verified via manual smoke tests.
