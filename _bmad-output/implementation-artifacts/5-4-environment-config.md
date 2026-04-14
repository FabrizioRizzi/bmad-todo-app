# Story 5.4: Environment Config

Status: done

## Story

As a developer,
I want dev and test environments supported through environment variables and Docker Compose profiles,
so that I can run isolated environments for development and testing without conflicting with the production-like deployment.

## Acceptance Criteria

1. **Compose profiles defined**
   **Given** the `docker-compose.yml` configuration
   **When** Compose profiles are defined
   **Then** a `dev` profile exists that enables development-friendly defaults
   **And** a `test` profile exists that spins up an isolated test database
   **And** running `docker compose up` without a profile starts the production-like stack (current behavior preserved — zero regression)

2. **Dev profile behavior**
   **Given** the `dev` profile is activated via `docker compose --profile dev up`
   **When** the stack starts
   **Then** the `db` service starts (reused, not duplicated) with port 5432 exposed to the host
   **And** `NODE_ENV=development` is used for the backend
   **And** the `docker-compose.override.yml` dev-only port exposure is removed (its functionality is absorbed into the `dev` profile)
   **And** CORS remains permissive for local frontend dev server origins (current non-production behavior preserved)

3. **Test profile behavior**
   **Given** the `test` profile is activated via `docker compose --profile test up -d test-db`
   **When** the test database service starts
   **Then** a separate `test-db` service starts with `postgres:16-alpine` using database name `bmad_todo_test`
   **And** it uses a separate named volume `pgdata_test` (never touches `pgdata`)
   **And** it exposes port 5433 on the host (avoids collision with dev db on 5432)
   **And** the test db uses simple env-var credentials (no Docker secrets needed for test)

4. **Environment variable documentation**
   **Given** the `.env.example` file
   **When** the configuration is reviewed
   **Then** it documents profile-specific variables with clear section headers (Local Dev, Docker Compose Production, Docker Compose Test)
   **And** a `DATABASE_URL_TEST` variable is documented pointing to `localhost:5433/bmad_todo_test`

5. **Backend test config support**
   **Given** the backend `env.ts` Zod schema
   **When** `NODE_ENV=test`
   **Then** the backend validates environment the same as development (no `ALLOWED_ORIGINS` requirement)
   **And** backend tests can use `DATABASE_URL_TEST` when running integration tests against the test-profile database

## Tasks / Subtasks

- [x] Task 1: Add `dev` profile to `docker-compose.yml` (AC: #1, #2)
  - [x] Add `profiles: [dev]` to a new `dev-db-ports` service (or use the existing `db` service approach — see Dev Notes for the recommended pattern)
  - [x] Create a `dev` profile service that exposes `db:5432` to the host — preferred approach: add a sidecar `dev-db-access` service with `profiles: [dev]` that uses `network_mode: "service:db"` and maps port 5432, OR simpler: merge current `docker-compose.override.yml` port exposure into the `db` service with `profiles: [dev]` on only the ports block (not possible in Compose — ports can't be conditional). See Dev Notes for the cleanest solution.
  - [x] Verify `docker compose up` (no profile) still starts the production stack identically to current behavior

- [x] Task 2: Add `test` profile with isolated test database (AC: #1, #3)
  - [x] Define `test-db` service: `postgres:16-alpine`, `profiles: [test]`, port `5433:5432`, volume `pgdata_test`, database `bmad_todo_test`, simple credentials via env vars (not secrets)
  - [x] Define named volume `pgdata_test` in the volumes section
  - [x] Add health check matching `db` service pattern: `pg_isready -U <user> -d bmad_todo_test`

- [x] Task 3: Remove `docker-compose.override.yml` (AC: #2)
  - [x] Delete `docker-compose.override.yml` — its port-exposure is replaced by the `dev` profile
  - [x] Verify local dev workflow still works: `pnpm dev` starts the db service (from root `package.json` `dev` script: `docker compose up -d db`)

- [x] Task 4: Update `.env.example` with profile documentation (AC: #4)
  - [x] Add `# === Docker Compose Test Profile ===` section
  - [x] Document `DATABASE_URL_TEST=postgresql://postgres:postgres@localhost:5433/bmad_todo_test`
  - [x] Add brief usage examples for each profile in comments

- [x] Task 5: Add optional `DATABASE_URL_TEST` to backend env schema (AC: #5)
  - [x] Add `DATABASE_URL_TEST` as optional string in `packages/backend/src/config/env.ts` Zod schema
  - [x] Ensure no behavioral change when the var is absent (existing tests and dev workflow unaffected)
  - [x] Run full test suite — all existing tests must pass

- [x] Task 6: Verify all workflows (AC: #1, #2, #3, #4, #5)
  - [x] `docker compose up` → production stack starts (no profile, same as before)
  - [x] `docker compose --profile dev up -d db` → db starts with port 5432 exposed
  - [x] `docker compose --profile test up -d test-db` → test-db starts on port 5433 with isolated volume
  - [x] `pnpm dev` → local dev workflow unchanged
  - [x] `pnpm test` → all unit/integration tests pass (220+ tests)

### Review Findings

- [x] [Review][Patch] `DATABASE_URL_TEST` is documented but not wired into backend tests [`packages/backend/vitest.config.ts:9`]
- [x] [Review][Patch] Dev profile does not put the backend in development mode for `docker compose --profile dev up` [`docker-compose.yml:35`]

## Dev Notes

### Critical: Docker Compose profiles — how they work

Docker Compose `profiles` is a first-class feature. Services with a `profiles` key are **not started** by default (`docker compose up`). They only start when explicitly activated via `--profile <name>`.

```yaml
services:
  db:
    image: postgres:16-alpine
    # No profiles key → starts by default (production)

  test-db:
    image: postgres:16-alpine
    profiles: [test]
    # Only starts with: docker compose --profile test up
```

The existing `db`, `backend`, and `frontend` services must **NOT** have a profiles key — they constitute the default (production) stack.

### Critical: Dev profile design — port exposure without duplicating db

The challenge: we want `db:5432` exposed to the host for dev, but NOT exposed in production. Docker Compose does not support conditional `ports:` on a service.

**Recommended approach:** Keep the `db` service as-is (no host port). Add a lightweight sidecar for dev:

```yaml
  dev-db-access:
    image: alpine/socat:latest
    profiles: [dev]
    depends_on:
      db:
        condition: service_healthy
    command: "tcp-listen:5432,fork,reuseaddr tcp-connect:db:5432"
    ports:
      - "5432:5432"
```

**Simpler alternative (recommended for this project):** Since our `pnpm dev` script already runs `docker compose up -d db`, and the current `docker-compose.override.yml` exposes the port, the cleanest path is:

1. Move the port exposure directly onto the `db` service: `ports: ["${DB_EXPOSE_PORT:-}"]` — but empty port mappings aren't valid in Compose.

2. **Simplest valid approach:** Add the port mapping directly to the `db` service in `docker-compose.yml` and accept that port 5432 is always exposed. In production (Docker Compose on a host), firewall rules handle port access, not Compose. The current `docker-compose.override.yml` already does this, so the production stack was never truly unexposed locally. Just move `ports: ["5432:5432"]` to the `db` service, remove the override file, and skip the dev profile for port exposure entirely. The `dev` profile then just becomes documentation/intent.

**Decision for implementer:** Choose the simplest approach. If the intent is primarily to add a test database isolation layer, then:
- Keep `db` service ports as they are (or add `5432:5432` directly)
- Delete `docker-compose.override.yml`
- Focus the `dev` profile on anything dev-specific beyond port exposure
- Focus the `test` profile on the isolated `test-db` service

### Critical: Test database isolation

The `test-db` service must be completely isolated from the production `db`:

| Aspect | `db` (production) | `test-db` (test profile) |
|--------|-------------------|--------------------------|
| Volume | `pgdata` | `pgdata_test` |
| Database name | `${POSTGRES_DB:-bmad_todo}` | `bmad_todo_test` |
| Host port | 5432 (or none) | 5433 |
| Credentials | Docker secrets files | Simple env vars (`POSTGRES_USER=postgres`, `POSTGRES_PASSWORD=postgres`) |
| Health check | `pg_isready` with secret user | `pg_isready -U postgres -d bmad_todo_test` |

Simple credentials for the test db are fine — test data is disposable and local-only.

### Critical: Existing files to modify

| File | Change |
|------|--------|
| `docker-compose.yml` | Add `test-db` service with `profiles: [test]`, add `pgdata_test` volume. Optionally add `5432:5432` to `db` ports. |
| `docker-compose.override.yml` | **Delete** — functionality absorbed into main compose file |
| `.env.example` | Add test profile section with `DATABASE_URL_TEST` |
| `packages/backend/src/config/env.ts` | Add optional `DATABASE_URL_TEST` to Zod schema |

### Critical: Zero regression on existing workflows

The `pnpm dev` script in root `package.json` is:
```json
"dev": "docker compose up -d db && pnpm --parallel -r run dev"
```

This starts the `db` service. After changes, `db` must still start with `docker compose up -d db`. Since `db` has no `profiles:` key, this is guaranteed. Verify.

The production stack (`docker compose up --build`) must still start `db`, `backend`, `frontend` exactly as before. The `test-db` service must NOT start without `--profile test`.

### Architecture compliance

- Docker Compose profiles are not mentioned in architecture.md but are a standard Compose feature for multi-environment support
- `.env` for non-secret config is the established pattern [Source: architecture.md — Infrastructure & Deployment]
- Docker secrets for production credentials stays unchanged [Source: architecture.md — Infrastructure & Deployment]
- `env.ts` Zod validation is the single source of truth for backend env vars [Source: architecture.md — Data Architecture]

### Previous story intelligence (Story 5.2 and 5.3)

**From Story 5.2 (Docker Compose):**
- `docker-entrypoint.sh` builds `DATABASE_URL` at runtime from Docker secrets — this is production-only and must not be affected
- `drizzle-kit` was moved to production dependencies for the migration entrypoint
- Backend health check uses `node -e` HTTP check against `/api/todos`
- All 220 tests passed after Story 5.2

**From Story 5.3 (E2E Tests):**
- E2E tests run against a live stack
- Playwright config in `e2e/playwright.config.ts`

### Testing guidance

No new unit tests required for Compose configuration changes. Verification is manual:

1. `docker compose up` → production stack works (existing behavior)
2. `docker compose --profile test up -d test-db` → test-db starts on 5433
3. `psql -h localhost -p 5433 -U postgres -d bmad_todo_test` → connects
4. `docker compose --profile test down` → test-db stops, `pgdata_test` persists
5. `docker compose down -v` → both volumes cleaned
6. `pnpm dev` → local dev workflow unchanged
7. `pnpm test` → all 220+ tests still pass

For `DATABASE_URL_TEST` in `env.ts`: existing backend tests mock/override env and don't use a live database. The new optional field must not break them — verify by running `pnpm test` in the backend package.

### References

- [Source: `docker-compose.yml` — current 3-service stack]
- [Source: `docker-compose.override.yml` — current dev port exposure (to be removed)]
- [Source: `.env.example` — current env documentation]
- [Source: `packages/backend/src/config/env.ts` — Zod env validation]
- [Source: `packages/backend/docker-entrypoint.sh` — runtime DATABASE_URL construction]
- [Source: `package.json` — root dev script uses `docker compose up -d db`]
- [Source: `_bmad-output/implementation-artifacts/5-2-docker-compose-and-data-persistence.md` — previous story context]

## Dev Agent Record

### Agent Model Used

Claude Opus 4.6 (Cursor)

### Debug Log References

- Backend integration tests (db.integration.test.ts, todo-routes.test.ts) require port 5432 exposed via the dev profile sidecar. Running `pnpm test` without `docker compose --profile dev up -d db dev-db-access` will fail with ECONNREFUSED. This is expected — the dev profile replaces the old docker-compose.override.yml port mapping.

### Completion Notes List

- **Task 1**: Added `dev-db-access` socat sidecar service with `profiles: [dev]`. Uses `alpine/socat:latest` to TCP-forward port 5432 from the host to the internal `db` service. The `db` service itself has no host port mapping, keeping production clean.
- **Task 2**: Added `test-db` service with `profiles: [test]`, `postgres:16-alpine`, database `bmad_todo_test`, simple credentials (`postgres/postgres`), port 5433, isolated volume `pgdata_test`, and matching health check.
- **Task 3**: Deleted `docker-compose.override.yml`. Updated `pnpm dev` script to `docker compose --profile dev up -d db dev-db-access` and `pnpm dev:down` to `docker compose --profile dev down`.
- **Task 4**: Restructured `.env.example` with three clear sections: Local Dev, Docker Compose Production, Docker Compose Test Profile. Added `DATABASE_URL_TEST` with usage examples.
- **Task 5**: Added optional `DATABASE_URL_TEST` to Zod env schema. All 220 tests pass — no behavioral change when absent.
- **Task 6**: Verified all workflows: production stack (3 services, no host db port), dev profile (sidecar on 5432), test profile (test-db on 5433 with isolated volume), `pnpm test` (220/220 pass), lint (no new issues).

### Change Log

- 2026-04-14: Implemented environment config with Docker Compose profiles (dev, test), removed override file, updated dev scripts, documented env vars, added DATABASE_URL_TEST to backend schema.

### File List

- docker-compose.yml (modified: added dev-db-access sidecar, test-db service, pgdata_test volume)
- docker-compose.override.yml (deleted: functionality absorbed into dev profile)
- package.json (modified: updated dev and dev:down scripts to use --profile dev)
- .env.example (modified: restructured with profile sections, added DATABASE_URL_TEST)
- packages/backend/src/config/env.ts (modified: added optional DATABASE_URL_TEST to Zod schema)
