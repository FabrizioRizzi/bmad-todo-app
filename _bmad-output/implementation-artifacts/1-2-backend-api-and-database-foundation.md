# Story 1.2: Backend API & Database Foundation

Status: done

## Story

As a user,
I want my todos stored in a proper database behind a secure, documented HTTP API,
So that my list survives refreshes and the system can grow (e.g. accounts later) without rebuilding storage from scratch.

## Acceptance Criteria

1. Fastify 5.x listens on the configured port (default 3000).
2. `@fastify/cors`, `@fastify/helmet`, and `@fastify/swagger` + `@fastify/swagger-ui` plugins are registered.
3. Swagger UI is accessible at `/documentation`.
4. A global error handler normalizes errors to `{ statusCode, error, message }` format.
5. Environment variables are validated on startup via Zod schema (`DATABASE_URL` required).
6. The `todos` table has columns: `id` (UUID, PK, default generated), `description` (text, not null), `is_completed` (boolean, default false), `created_at` (timestamp, default now), `due_date` (date, nullable), `user_id` (UUID, nullable).
7. Drizzle Kit can generate a migration from the schema.
8. `drizzle-kit migrate` applies the migration to the database.
9. Given a running PostgreSQL container, the backend starts with a valid `DATABASE_URL` and the Drizzle connection pool is established and queries execute successfully.

## Tasks / Subtasks

- [x] Task 1: Install backend dependencies (AC: #1, #2, #5)
  - [x] Install Fastify 5.x and its plugins: `fastify`, `@fastify/cors`, `@fastify/helmet`, `@fastify/swagger`, `@fastify/swagger-ui`
  - [x] Install Drizzle ORM and PostgreSQL driver: `drizzle-orm`, `postgres` (postgres.js driver)
  - [x] Install Drizzle Kit as dev dependency: `drizzle-kit`
  - [x] Install Zod: `zod`
  - [x] Install `fastify-type-provider-zod` for Zod ↔ Fastify type integration
  - [x] Install `@types/node` if not already present (already in devDependencies from Story 1.1)
- [x] Task 2: Create environment config with Zod validation (AC: #5)
  - [x] Create `packages/backend/src/config/env.ts`
  - [x] Define Zod schema: `DATABASE_URL` (string, required), `PORT` (coerced number, default 3000), `NODE_ENV` (enum: development/production/test, default development)
  - [x] Parse and export validated env object; throw descriptive error on startup if validation fails
  - [x] Update `.env.example` if any new variables are needed (current file is sufficient)
- [x] Task 3: Create Fastify app factory (AC: #1, #2, #3, #4)
  - [x] Create `packages/backend/src/app.ts` with a `buildApp()` async factory function
  - [x] Register `@fastify/cors` plugin (via `plugins/cors.ts`)
  - [x] Register `@fastify/helmet` plugin (via `plugins/helmet.ts`)
  - [x] Register `@fastify/swagger` + `@fastify/swagger-ui` plugin (via `plugins/swagger.ts`)
  - [x] Register global error handler (via `plugins/error-handler.ts`)
  - [x] Set up Zod type provider with `fastify-type-provider-zod` (set validator/serializer compilers)
  - [x] Return the configured Fastify instance
- [x] Task 4: Create Fastify plugins (AC: #2, #3, #4)
  - [x] Create `packages/backend/src/plugins/cors.ts` — register `@fastify/cors` with permissive dev defaults
  - [x] Create `packages/backend/src/plugins/helmet.ts` — register `@fastify/helmet`
  - [x] Create `packages/backend/src/plugins/swagger.ts` — register `@fastify/swagger` with API info and `@fastify/swagger-ui` at `/documentation`
  - [x] Create `packages/backend/src/plugins/error-handler.ts` — global error handler that normalizes all errors to `{ statusCode, error, message }`, strips stack traces in production, handles Zod validation errors with descriptive messages
- [x] Task 5: Create Drizzle schema and database plugin (AC: #6, #9)
  - [x] Create `packages/backend/src/schema/todos.ts` — define `todos` table with Drizzle `pgTable`:
    - `id`: UUID, primary key, `defaultRandom()`
    - `description`: text, not null
    - `is_completed`: boolean, default false
    - `created_at`: timestamp, default now
    - `due_date`: date, nullable
    - `user_id`: UUID, nullable (future multi-tenancy)
  - [x] Create `packages/backend/src/plugins/db.ts` — Fastify plugin that:
    - Creates a `postgres` (postgres.js) connection using `DATABASE_URL`
    - Wraps it with `drizzle()` from `drizzle-orm/postgres-js`
    - Decorates the Fastify instance with `db` for route access
    - Handles graceful shutdown (close connection on app close)
- [x] Task 6: Configure Drizzle Kit and generate migration (AC: #7, #8)
  - [x] Create `packages/backend/drizzle.config.ts` pointing to the schema file and migrations output directory
  - [x] Run `drizzle-kit generate` to produce the initial migration in `packages/backend/src/schema/migrations/`
  - [x] Verify migration SQL creates the `todos` table with all columns and correct types
- [x] Task 7: Update server entry point (AC: #1)
  - [x] Replace placeholder `console.log` in `packages/backend/src/server.ts` with:
    - Import env config (triggers Zod validation)
    - Import and call `buildApp()`
    - Register the db plugin
    - Start listening on configured port
    - Log startup message with Pino (Fastify built-in)
- [x] Task 8: Write integration tests (AC: #1–#5, #9)
  - [x] Create `packages/backend/src/app.test.ts` — test that:
    - App builds without error
    - Swagger UI route `/documentation` responds with 200
    - Unknown routes return 404 in correct error shape
  - [x] Update or replace `packages/backend/src/server.test.ts` with meaningful tests if needed
- [x] Task 9: Verify full setup
  - [x] Start a PostgreSQL container: `docker run --name bmad-pg -e POSTGRES_USER=postgres -e POSTGRES_PASSWORD=postgres -e POSTGRES_DB=bmad_todo -p 5432:5432 -d postgres:16-alpine`
  - [x] Run `drizzle-kit migrate` to apply migration
  - [x] Start the backend with `pnpm dev` (from backend package)
  - [x] Verify Fastify starts, connects to DB, and Swagger UI loads at `http://localhost:3000/documentation`
  - [x] Run `pnpm test` — all tests pass
  - [x] Run `pnpm lint` — zero Biome errors

### Review Findings

- [x] [Review][Decision] AC9 automated DB proof — **Resolved:** Added `packages/backend/src/db.integration.test.ts` (Drizzle `SELECT 1` through the pool). Vitest `DATABASE_URL` aligned with default dev DB name `bmad_todo`; requires Postgres reachable at that URL for CI/local.

- [x] [Review][Decision] CORS in non-development environments — **Resolved:** `ALLOWED_ORIGINS` (comma-separated) validated as required when `NODE_ENV=production`; `cors.ts` uses an allowlist in production and permissive `origin: true` behavior in development/test.

- [x] [Review][Patch] Hollow `server.test.ts` — **Resolved:** Removed stub file; `app.test.ts` and DB integration test cover entry behavior without importing the listening entrypoint.

- [x] [Review][Patch] Drizzle Kit empty `DATABASE_URL` — **Resolved:** `drizzle.config.ts` throws if `DATABASE_URL` is missing or whitespace-only before Kit runs.

- [x] [Review][Patch] Normalized `error` field for 4xx — **Resolved:** `error-handler.ts` maps common client status codes to conventional HTTP reason phrases (e.g. 404 → `Not Found`).

- [x] [Review][Defer] Listen on `0.0.0.0` — `packages/backend/src/server.ts` binds all interfaces; common for containers but worth revisiting with deployment hardening later — deferred, pre-existing deployment choice

## Dev Notes

### Critical Architecture Compliance

This story builds the entire backend foundation. Every subsequent backend story (1.3 CRUD routes, 2.1 toggle, 2.2 delete, 3.1 due dates) depends on the patterns established here. Get the structure right.

### Backend Directory Structure (Must Match)

```
packages/backend/src/
├── server.ts           # Entry point (starts Fastify)
├── app.ts              # Fastify app factory (plugin registration)
├── app.test.ts         # App-level integration tests
├── config/
│   └── env.ts          # Zod-validated environment variables
├── plugins/
│   ├── db.ts           # Drizzle + PostgreSQL connection plugin
│   ├── cors.ts         # @fastify/cors configuration
│   ├── helmet.ts       # @fastify/helmet configuration
│   ├── swagger.ts      # @fastify/swagger + swagger-ui setup
│   └── error-handler.ts # Global error normalization
├── schema/
│   ├── todos.ts        # Drizzle table definition
│   └── migrations/     # Drizzle Kit generated migrations
└── validation/
    └── todo-schemas.ts  # Zod schemas (created in Story 1.3, not this story)
```

### Library Versions (Verified April 2026)

| Library | Version | Notes |
|---------|---------|-------|
| fastify | ^5.8.4 (latest 5.8.4) | Use `npm:fastify@^5` — do NOT install v4 |
| @fastify/cors | Latest compatible with Fastify 5 | Check peer deps |
| @fastify/helmet | Latest compatible with Fastify 5 | Check peer deps |
| @fastify/swagger | Latest compatible with Fastify 5 | Generates OpenAPI spec |
| @fastify/swagger-ui | Latest compatible with Fastify 5 | Serves interactive docs |
| drizzle-orm | ^0.45.2 (latest) | Architecture doc says 1.0.0-beta.19 but that version does not exist — use latest stable 0.45.x |
| drizzle-kit | Latest | Dev dependency for migrations |
| postgres | Latest (postgres.js driver) | NOT `pg` — use the `postgres` package (postgres.js) |
| zod | ^3.x (latest 3.x stable) | Zod 4 exists but `fastify-type-provider-zod` may not yet support it — check compatibility; if v4 works, use it; otherwise stick with v3 |
| fastify-type-provider-zod | ^6.x (latest) | Provides Zod ↔ Fastify type integration, validator/serializer compilers |

**CRITICAL:** The architecture doc references `drizzle-orm 1.0.0-beta.19` — this version does not exist on npm. The latest stable is `0.45.x`. Install `drizzle-orm` without pinning to a beta version. Use `drizzle-orm` (latest) and `drizzle-kit` (latest).

**CRITICAL:** Use `postgres` (postgres.js) as the PostgreSQL driver, NOT `pg` (node-postgres). The architecture doc doesn't specify the driver explicitly, but postgres.js is the recommended driver for Drizzle ORM with better TypeScript support and performance.

### Drizzle Schema Definition

The `todos` table schema in `packages/backend/src/schema/todos.ts`:

```typescript
import { boolean, pgTable, text, timestamp, uuid, date } from 'drizzle-orm/pg-core';

export const todos = pgTable('todos', {
  id: uuid('id').primaryKey().defaultRandom(),
  description: text('description').notNull(),
  isCompleted: boolean('is_completed').default(false).notNull(),
  createdAt: timestamp('created_at').defaultNow().notNull(),
  dueDate: date('due_date'),
  userId: uuid('user_id'),
});
```

Key points:
- Column names are snake_case in the DB (`is_completed`, `created_at`, `due_date`, `user_id`)
- Drizzle automatically maps to camelCase TypeScript properties (`isCompleted`, `createdAt`, `dueDate`, `userId`)
- `id` uses `defaultRandom()` for UUID v4 generation
- `isCompleted` has both `.default(false)` and `.notNull()` — the DB column is NOT NULL with a default
- `dueDate` is `date` type (date-only, no time component) and nullable
- `userId` is nullable UUID — for future multi-tenancy (Phase 2)

### Drizzle Kit Configuration

`packages/backend/drizzle.config.ts`:

```typescript
import { defineConfig } from 'drizzle-kit';

export default defineConfig({
  schema: './src/schema/todos.ts',
  out: './src/schema/migrations',
  dialect: 'postgresql',
  dbCredentials: {
    url: process.env.DATABASE_URL!,
  },
});
```

### Environment Validation Pattern

`packages/backend/src/config/env.ts`:

```typescript
import { z } from 'zod';

const envSchema = z.object({
  DATABASE_URL: z.string().min(1, 'DATABASE_URL is required'),
  PORT: z.coerce.number().default(3000),
  NODE_ENV: z.enum(['development', 'production', 'test']).default('development'),
});

export const env = envSchema.parse(process.env);
```

This runs at import time — if `DATABASE_URL` is missing, the process crashes immediately with a clear Zod error message. This is intentional (fail fast).

### App Factory Pattern

`packages/backend/src/app.ts` should export a `buildApp()` function:

```typescript
import Fastify from 'fastify';
import { serializerCompiler, validatorCompiler, ZodTypeProvider } from 'fastify-type-provider-zod';

export async function buildApp() {
  const app = Fastify({ logger: true }).withTypeProvider<ZodTypeProvider>();
  app.setValidatorCompiler(validatorCompiler);
  app.setSerializerCompiler(serializerCompiler);

  // Register plugins
  await app.register(import('./plugins/cors.js'));
  await app.register(import('./plugins/helmet.js'));
  await app.register(import('./plugins/swagger.js'));
  await app.register(import('./plugins/error-handler.js'));

  return app;
}
```

**IMPORTANT:** Use `.js` extensions in imports — the backend uses `NodeNext` module resolution, which requires explicit file extensions for ESM.

### Error Handler Pattern

The global error handler in `plugins/error-handler.ts` must:
- Catch all unhandled errors
- Normalize to `{ statusCode, error, message }` shape (Fastify's native format)
- Handle Zod validation errors specifically — extract readable messages from `ZodError`
- Handle `fastify-type-provider-zod` validation errors using `hasZodFastifySchemaValidationErrors`
- Strip stack traces in production (`NODE_ENV !== 'development'`)
- Log the full error via Pino (Fastify built-in logger) for debugging

### Database Plugin Pattern

The db plugin in `plugins/db.ts` must:
- Create a `postgres` connection using `DATABASE_URL` from env config
- Wrap with `drizzle()` from `drizzle-orm/postgres-js`
- Decorate Fastify instance: `fastify.decorate('db', db)` so routes access it via `fastify.db`
- Add TypeScript type augmentation for the decorator
- Handle graceful shutdown: close the postgres connection on Fastify `onClose` hook

### Server Entry Point

`packages/backend/src/server.ts` should:
1. Import `env` from `./config/env.js` (triggers validation)
2. Import and call `buildApp()`
3. Register the db plugin
4. Call `app.listen({ port: env.PORT, host: '0.0.0.0' })`
5. Handle startup errors (log and exit)

### Testing Strategy

Tests in this story verify infrastructure, not business logic:
- `app.test.ts`: Build the app, test that Swagger UI responds, test error shape on 404
- For DB-dependent tests: either mock the db decorator or use a test database
- Tests should NOT require a running PostgreSQL instance (use mocks or skip DB tests with a guard)
- Co-located test files: `app.test.ts` next to `app.ts`

### What This Story Does NOT Include

Do NOT implement:
- API route handlers (Story 1.3)
- Zod validation schemas for request bodies (Story 1.3)
- Any frontend changes (Stories 1.4, 1.5)
- Docker configuration (Stories 5.1, 5.2)
- The `routes/` directory or `todo-routes.ts` (Story 1.3)
- The `validation/` directory or `todo-schemas.ts` (Story 1.3)

### Previous Story Intelligence (Story 1.1)

Key learnings from Story 1.1 scaffold:
- **TypeScript 6.0.2** is installed (not 5.4+ as architecture doc says) — this is fine, use what's installed
- Backend tsconfig uses `module: "NodeNext"` and `moduleResolution: "NodeNext"` — all imports MUST use `.js` extensions
- Backend uses `"type": "module"` in package.json — ESM throughout
- `vitest` is already in backend devDependencies (^4.1.3)
- `@types/node` is already in backend devDependencies (^25.5.2)
- Backend vitest config excludes `dist/**` — keep this exclusion
- Root `pnpm dev` runs `pnpm --parallel -r run dev` — backend dev script is `tsx watch src/server.ts`
- Biome 2.4.10 is configured at root — run `pnpm lint` to verify no errors after changes
- Pre-commit hook runs `pnpm biome check --staged --no-errors-on-unmatched`

### Git Intelligence

Recent commits show Story 1.1 is complete with two commits:
1. Initial scaffold (monorepo, packages, configs)
2. Follow-up fixes (Playwright webServer, vitest in packages, backend NodeNext tsconfig)

The codebase is clean — no pending changes beyond planning docs.

### PostgreSQL Dev Container

For local development, start PostgreSQL with:
```bash
docker run --name bmad-pg \
  -e POSTGRES_USER=postgres \
  -e POSTGRES_PASSWORD=postgres \
  -e POSTGRES_DB=bmad_todo \
  -p 5432:5432 \
  -d postgres:16-alpine
```

This matches the `DATABASE_URL` in `.env.example`: `postgresql://postgres:postgres@localhost:5432/bmad_todo`

### Naming Conventions Reminder

| Element | Convention | Example |
|---------|-----------|---------|
| Files | kebab-case | `error-handler.ts`, `todo-schemas.ts` |
| Functions | camelCase | `buildApp()`, `registerRoutes()` |
| Types/interfaces | PascalCase | `Todo`, `EnvConfig` |
| DB columns | snake_case | `is_completed`, `created_at` |
| TS properties | camelCase (auto-mapped by Drizzle) | `isCompleted`, `createdAt` |

### Project Structure Notes

- All new files go under `packages/backend/src/` in the directories specified above
- The `schema/migrations/` directory will be auto-generated by `drizzle-kit generate`
- No files outside `packages/backend/` should be modified (except possibly `.env.example` if new vars needed)
- Test files are co-located: `app.test.ts` next to `app.ts`

### References

- [Source: _bmad-output/planning-artifacts/architecture.md#Data Architecture] — Drizzle ORM, PostgreSQL, schema design, Zod validation
- [Source: _bmad-output/planning-artifacts/architecture.md#Authentication & Security] — CORS, Helmet, error responses, input sanitization
- [Source: _bmad-output/planning-artifacts/architecture.md#API & Communication Patterns] — Route structure, Swagger, error handling
- [Source: _bmad-output/planning-artifacts/architecture.md#Structure Patterns] — Backend directory organization
- [Source: _bmad-output/planning-artifacts/architecture.md#Format Patterns] — API response formats, error shapes, HTTP status codes
- [Source: _bmad-output/planning-artifacts/architecture.md#Infrastructure & Deployment] — Dev database Docker container, env config
- [Source: _bmad-output/planning-artifacts/epics.md#Story 1.2] — Acceptance criteria and user story
- [Source: _bmad-output/planning-artifacts/prd.md#Data Persistence] — FR18-20, data flow decision
- [Source: _bmad-output/implementation-artifacts/1-1-monorepo-scaffold-and-tooling-setup.md] — Previous story learnings, file list, debug log

## Change Log

- 2026-04-07: Implemented full backend API & database foundation — Fastify 5.x app factory with CORS, Helmet, Swagger, error handler plugins; Drizzle ORM schema with todos table; PostgreSQL connection plugin; Zod env validation; integration tests (6 passing); zero Biome lint errors.

## Dev Agent Record

### Agent Model Used

Claude claude-4.6-opus-high (Cursor)

### Debug Log References

- Zod v4 (4.3.6) installed and confirmed compatible with fastify-type-provider-zod v6.1.0
- Added `fastify-plugin` as additional dependency (needed for proper Fastify plugin encapsulation)
- Biome formatter requires single quotes — ran `pnpm lint:fix` to auto-format all files
- `drizzle.config.ts` validates `DATABASE_URL` before Kit runs (throws if missing) instead of passing an empty string
- Docker Desktop needed to be started manually before PostgreSQL container could be created
- Migration generated successfully: `0000_stale_white_queen.sql` creates todos table with all required columns

### Completion Notes List

- ✅ Task 1: Installed fastify@5.8.4, @fastify/cors@11.2.0, @fastify/helmet@13.0.2, @fastify/swagger@9.7.0, @fastify/swagger-ui@5.2.5, drizzle-orm@0.45.2, postgres@3.4.9, zod@4.3.6, fastify-type-provider-zod@6.1.0, fastify-plugin (runtime); drizzle-kit@0.31.10 (dev)
- ✅ Task 2: Created env.ts with Zod schema validating DATABASE_URL (required), PORT (default 3000), NODE_ENV (default development), ALLOWED_ORIGINS (required when NODE_ENV=production). Fails fast at import time.
- ✅ Task 3: Created app.ts with buildApp() factory — registers all plugins, sets Zod type provider with validator/serializer compilers
- ✅ Task 4: Created 4 Fastify plugins using fastify-plugin: cors (permissive dev/test; production allowlist from ALLOWED_ORIGINS), helmet (CSP disabled for Swagger UI), swagger (OpenAPI 3.0.3 spec + UI at /documentation), error-handler (normalizes to {statusCode, error, message}, handles Zod validation errors, strips messages in production for 5xx)
- ✅ Task 5: Created todos schema with all 6 columns (id UUID PK, description text, is_completed boolean, created_at timestamp, due_date date nullable, user_id UUID nullable). Created db plugin with postgres.js connection, Drizzle ORM wrapper, Fastify decorator, and graceful shutdown hook.
- ✅ Task 6: Created drizzle.config.ts, generated migration 0000_stale_white_queen.sql — verified SQL creates todos table with correct column types and constraints
- ✅ Task 7: Replaced placeholder server.ts with proper entry point: imports env (triggers validation), builds app, registers db plugin, listens on configured port
- ✅ Task 8: Created app.test.ts with 5 tests (build, swagger 200, 404 error shape, CORS headers, helmet security headers). Added db.integration.test.ts (Drizzle SELECT 1 against DATABASE_URL). All backend tests pass when Postgres is available.
- ✅ Task 9: Verified full setup — PostgreSQL container started, migration applied, server starts and connects to DB, Swagger UI loads at /documentation (200), 404 returns normalized error shape, tests and lint pass

### File List

- packages/backend/package.json (modified — added dependencies and db scripts)
- packages/backend/drizzle.config.ts (new — Drizzle Kit configuration)
- packages/backend/vitest.config.ts (modified — added test env vars)
- packages/backend/src/app.ts (new — Fastify app factory)
- packages/backend/src/app.test.ts (new — integration tests)
- packages/backend/src/server.ts (modified — replaced placeholder with real entry point)
- packages/backend/src/db.integration.test.ts (new — AC9 pool/query smoke test)
- packages/backend/src/config/env.ts (new — Zod environment validation)
- packages/backend/src/plugins/cors.ts (new — CORS plugin)
- packages/backend/src/plugins/helmet.ts (new — Helmet security plugin)
- packages/backend/src/plugins/swagger.ts (new — Swagger/OpenAPI plugin)
- packages/backend/src/plugins/error-handler.ts (new — global error handler)
- packages/backend/src/plugins/db.ts (new — Drizzle + PostgreSQL plugin)
- packages/backend/src/schema/todos.ts (new — Drizzle table definition)
- packages/backend/src/schema/migrations/0000_stale_white_queen.sql (new — generated migration)
- packages/backend/src/schema/migrations/meta/_journal.json (new — Drizzle migration journal)
- packages/backend/src/schema/migrations/meta/0000_snapshot.json (new — Drizzle migration snapshot)
- pnpm-lock.yaml (modified — updated lockfile)
