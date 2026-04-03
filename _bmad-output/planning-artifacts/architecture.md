---
stepsCompleted: [1, 2, 3, 4, 5, 6, 7, 8]
lastStep: 8
status: 'complete'
completedAt: '2026-04-03'
inputDocuments:
  - _bmad-output/planning-artifacts/product-brief-bmad-todo-app.md
  - _bmad-output/planning-artifacts/prd.md
  - _bmad-output/planning-artifacts/prd-validation-report.md
  - _bmad-output/planning-artifacts/ux-design-specification.md
workflowType: 'architecture'
project_name: 'bmad-todo-app'
user_name: 'Fab'
date: '2026-04-03'
---

# Architecture Decision Document

_This document builds collaboratively through step-by-step discovery. Sections are appended as we work through each architectural decision together._

## Project Context Analysis

### Requirements Overview

**Functional Requirements:**

29 FRs across 8 categories. The core is a CRUD lifecycle for todo items (create, read, toggle completion, delete) with optional due dates, filtering (all/active/completed), and sorting (due date, status). Architecturally, this maps to a thin API layer with minimal business logic — the complexity lives in the frontend's UX polish, state management, and error handling patterns rather than in backend domain logic.

Key architectural implications from FRs:
- FR7-9 (Due Dates): Optional due date per todo, settable at creation or later, with overdue visual indicator for active past-due items.
- FR10-12 (Filtering & Sorting): Client-side filtering and sorting on a server-fetched dataset (sort by due date and status only — creation date is stored but not exposed in UI). No server-side pagination needed for V1 (single user, bounded list size).
- FR18-19 (Persistence): REST API + database; todos load on app open and survive refresh (TanStack Query cache reflects server truth after each successful mutation).
- FR20 (Data flow): Create, completion toggle, and due-date changes update the UI only after the server confirms success (pending/loading states per mutation). **Delete** is the exception: the card may leave the list immediately while an undo window runs; `DELETE` runs only after undo expires, with UI restore on failure — see undo-delete pattern below.
- FR21-25 (Accessibility): Pervasive — affects component selection, HTML semantics, focus management, and testing strategy. Not a bolt-on concern.
- FR28-29 (Deployment): Docker Compose with three services and data persistence across restarts.

**Non-Functional Requirements:**

20 NFRs that establish hard architectural constraints:
- **Performance**: API p95 < 200ms, UI feedback < 100ms, page load < 2s, bundle < 200KB gzipped — rules out heavy frameworks and demands lean dependency choices.
- **Security**: HTTPS, server-side validation/sanitization, no content logging, no internal details in errors — standard API hardening.
- **Reliability**: Zero data loss on refresh/restart/crash, durable writes, network failure handled without corruption — demands a proven relational database with transactional writes.
- **Maintainability**: Linter-enforced conventions, documented REST API contract, no shared runtime dependencies between frontend and backend, single-command Docker build — supports the monorepo-with-packages approach.

**UX-Driven Architectural Requirements:**

The UX specification is unusually detailed for a low-complexity app and drives several architectural decisions:
- **Animation system**: Design tokens for 6 timing durations, 3 easing curves, 13 specific animation specs — requires a structured CSS/animation approach.
- **Undo delete pattern**: Optimistic card removal + deferred API call + undo window — the one exception to synchronous data flow. Requires client-side timer management and conditional API calls.
- **Component strategy**: Shadcn/ui + Tailwind + Radix primitives locked as the design system. Components are owned code (copied, not installed as dependency).
- **Skeleton loading**: App shell renders immediately with skeleton placeholders that crossfade to real content — requires careful render orchestration.

### Scale & Complexity

- **Primary domain:** Full-stack web (SPA + REST API + relational database)
- **Complexity level:** Low — single-user CRUD with rich frontend polish
- **Estimated architectural components:** ~8-10 (frontend app, API server, database, shared types/contracts, test infrastructure, Docker config, CI pipeline)

### Technical Constraints & Dependencies

- **Monorepo structure**: `packages/frontend` and `packages/backend` in a single repository — requires a workspace manager (npm/pnpm/yarn workspaces) and clear dependency boundaries.
- **No shared runtime**: Frontend and backend communicate exclusively through the REST API contract. No shared code at runtime — though shared TypeScript types/interfaces for the API contract are architecturally appropriate.
- **Database must support future user FK**: Schema design must accommodate adding user association without migrating existing data.
- **QA from Day One**: Testing infrastructure (unit, integration, e2e) set up as part of the initial project scaffold, not added later.
- **Docker Compose as deployment target**: Three containers (frontend static serve, backend API, database). Built after the application works, not used as the development environment.

### Cross-Cutting Concerns Identified

1. **Error handling strategy** — Consistent pattern across all mutations: loading state → success transition / failure revert + error banner. Must be implemented as a reusable pattern, not per-component.
2. **Accessibility** — Affects every interactive component: semantic HTML, ARIA attributes, focus management, keyboard navigation, screen reader announcements. Must be built-in from component creation, not retrofitted.
3. **Animation/transition system** — Design tokens (timing, easing) referenced by all components. `prefers-reduced-motion` support is a global concern. Requires centralized token definition.
4. **API contract** — The interface between frontend and backend. Must be explicitly defined and serve as the single source of truth for both sides. Shared TypeScript types are the natural mechanism.
5. **Data validation** — Duplicated across client (prevent empty submissions) and server (sanitize inputs, prevent injection). Validation rules should be consistent; shared type definitions help but runtime validation is independent.
6. **Future multi-tenancy readiness** — Data model includes a nullable user FK from V1. API route structure should anticipate user-scoped endpoints without requiring rewrites.

## Starter Template Evaluation

### Primary Technology Domain

Full-stack web application (SPA + REST API + relational database) in a pnpm workspace monorepo.

### Starter Options Considered

| Option | Approach | Verdict |
|---|---|---|
| create-turbo | Turborepo + pnpm scaffold | Overkill for 2 packages — adds build orchestration complexity without payoff |
| T3 Stack | Next.js + tRPC + Prisma | Wrong framework, wrong ORM, wrong backend — too many conflicts with stated preferences |
| fastify-ts-starter | Fastify 5 + TS + Vitest + Biome | Good reference for backend patterns but standalone, not monorepo-ready |
| Manual scaffold | pnpm workspace + Vite + Fastify | Maximum control, minimal bloat, exact match for preferences |

### Selected Starter: Manual Scaffold (pnpm Workspace)

**Rationale for Selection:**

No maintained full-stack starter combines Vite + React + Fastify + Drizzle + PostgreSQL in a pnpm workspace monorepo. Full-stack starters (T3, RedwoodJS, create-turbo) each impose opinionated choices that conflict with the stated preferences. A manual scaffold gives exact control over every dependency and avoids inheriting unwanted patterns. The project complexity is low — the setup effort is minimal for an intermediate developer.

**Initialization Sequence:**

```bash
# 1. Root workspace setup (already in bmad-todo-app/)
pnpm init
# Create pnpm-workspace.yaml with packages: ['packages/*']

# 2. Frontend package
pnpm create vite@latest packages/frontend --template react-ts

# 3. Backend package
mkdir -p packages/backend && cd packages/backend
pnpm init

# 4. Root tooling
pnpm add -Dw @biomejs/biome typescript
```

**Architectural Decisions Provided by Starter:**

**Language & Runtime:**
- TypeScript 5.4+ in strict mode across both packages
- Shared base `tsconfig.json` at root with per-package overrides
- Path aliases (`@/*`) configured in both packages

**Styling Solution:**
- Tailwind CSS v4 with `@tailwindcss/vite` plugin
- shadcn/ui components (copied into codebase, not installed as dependency)
- CSS variables for design tokens (color, spacing, animation timing)

**Build Tooling:**
- Vite (frontend dev server + production build)
- tsx (backend dev server with hot reload)
- pnpm workspace scripts for orchestrated dev/build/test commands

**Testing Framework:**
- Vitest 4.1.x for unit and integration tests (both packages)
- @testing-library/react + @testing-library/user-event for frontend component tests
- Playwright for end-to-end tests (root-level, tests against running frontend + backend)
- QA infrastructure set up as part of initial scaffold (Day One)

**Linting & Formatting:**
- Biome 2.4.x (single tool for linting + formatting + import sorting)
- Shared `biome.json` at workspace root
- Pre-commit hook via simple-git-hooks or lefthook

**Code Organization:**
- `packages/frontend/` — Vite + React SPA (components, hooks, API client, tests)
- `packages/backend/` — Fastify REST API (routes, plugins, schema, tests)
- Root — workspace config, shared tsconfig, Biome config, Playwright e2e, Docker Compose

**Database:**
- PostgreSQL 16.x (Docker container for dev, Docker Compose service for deployment)
- Drizzle ORM for type-safe queries and schema definition
- Drizzle Kit for migration generation and management

**Development Experience:**
- Vite HMR for frontend (instant reload)
- tsx watch for backend (fast TypeScript execution, no compile step)
- Biome VS Code extension for real-time lint/format
- Single `pnpm dev` command to start both packages concurrently

**Note:** Project initialization using this scaffold should be the first implementation story.

## Core Architectural Decisions

### Decision Priority Analysis

**Critical Decisions (Block Implementation):**
- Data model with nullable userId for future multi-tenancy
- Zod for server-side validation, shared type inference
- Drizzle ORM schema-first with separate migration step
- TanStack Query for server state management
- REST API at `/api/todos` with Fastify JSON Schema + Swagger docs
- Native fetch wrapped in typed API client module

**Important Decisions (Shape Architecture):**
- @fastify/cors + @fastify/helmet from Day One
- Consistent error response shape (`{ statusCode, error, message }`)
- Manual route registration (no autoload)
- No client-side router (single-view app)
- Nginx for frontend static serving in Docker
- Named Docker volume for PostgreSQL persistence
- `.env` file for environment configuration
- Docker container for dev database

**Deferred Decisions (Post-MVP):**
- Rate limiting (Phase 2 — no need for single-user local demo)
- API versioning (Phase 2+ — `/api/todos` is sufficient for V1)
- APM / monitoring / external logging (Phase 2 — Pino built-in is enough)
- Authentication and authorization (Phase 2)

### Data Architecture

| Decision | Choice | Rationale |
|---|---|---|
| Database | PostgreSQL 16.x | Proven relational DB, transactional writes, durable. Docker image available. |
| ORM | Drizzle ORM (1.0.0-beta.19) | TypeScript-first, SQL-like syntax, ~7.4KB, zero runtime overhead. Schema defined in TypeScript. |
| Schema design | Nullable `userId` column from V1 | Defaults to null for implicit single user. Phase 2 adds NOT NULL constraint + user FK without migrating existing rows. |
| Due date | Nullable `dueDate` column (date, no time) | Optional per todo. Used for sort-by-due-date and overdue visual indicator. Overdue determined client-side. |
| Validation | Zod | Define schemas once, infer TypeScript types, validate on server. Integrates with Fastify schema validation. |
| Migrations | Drizzle Kit, separate step | `drizzle-kit migrate` runs before API startup in deployment. No runtime migration on app boot. |
| Caching | None (V1) | Single user, bounded dataset, API p95 < 200ms is achievable without caching. |

### Authentication & Security

| Decision | Choice | Rationale |
|---|---|---|
| Authentication | None (V1) | Single implicit user, no accounts. Architecture supports adding auth in Phase 2. |
| CORS | @fastify/cors from Day One | Frontend and backend on different ports during dev. Trivial Fastify plugin. |
| Security headers | @fastify/helmet from Day One | Sets standard security headers (X-Content-Type-Options, X-Frame-Options, etc.). Zero config. |
| Input sanitization | Zod validation + Drizzle parameterized queries | Zod validates input shape/content. Drizzle's parameterized queries prevent SQL injection by default. |
| Rate limiting | Deferred to Phase 2 | Single-user local demo doesn't need it. @fastify/rate-limit is trivial to add later. |
| Error responses | Consistent shape: `{ statusCode, error, message }` | Fastify's default format. Global error handler normalizes unexpected errors. No internal details exposed. |

### API & Communication Patterns

| Decision | Choice | Rationale |
|---|---|---|
| API style | REST | Specified by PRD. Simple CRUD resource, no complex querying needs. |
| Route structure | Manual registration | One resource (todos), 4-5 endpoints. Autoload adds indirection without payoff. |
| Route prefix | `/api/todos` (no versioning) | V1 is a solo demo. Versioning prefix is premature complexity. Refactorable in Phase 2. |
| API documentation | @fastify/swagger + @fastify/swagger-ui | Auto-generates interactive docs from route schemas. Serves as the living API contract. Helpful for backend learning. |
| Error handling | Global Fastify error handler | Normalizes all errors to consistent `{ statusCode, error, message }` shape. Strips stack traces in production. |

**Endpoint Design:**

| Method | Path | Description |
|---|---|---|
| GET | `/api/todos` | Fetch all todos |
| POST | `/api/todos` | Create a new todo (with optional due date) |
| PATCH | `/api/todos/:id` | Update a todo (toggle completion, set/change/clear due date) |
| DELETE | `/api/todos/:id` | Delete a todo |

### Frontend Architecture

| Decision | Choice | Rationale |
|---|---|---|
| Server state | TanStack Query | Purpose-built for the synchronous data flow pattern. useQuery for fetching, useMutation for CRUD with loading/error/success states per-mutation. ~13KB gzipped. |
| Client state | React useState (no library) | Only client state is filter/sort selection — trivially managed with useState. No store needed. |
| Routing | None (no router) | Single-view app. React Router adds bundle size and complexity for zero benefit. Add in Phase 2 if pages are needed. |
| API client | Native fetch in typed `api.ts` module | TanStack Query wraps any async function. Typed functions (`getTodos()`, `createTodo()`, etc.) keep it clean. Zero bundle cost. |
| Undo delete | TanStack Query useMutation + client-side timer | Optimistic card removal, deferred API call during undo window (5-8s), revert on failure. The one exception to synchronous data flow. |
| Date picker | Shadcn Calendar + Popover | For setting due dates at creation (in AddInput) and on existing todos (in TodoCard). Radix popover handles positioning and accessibility. |
| Component architecture | Presentational components + container hooks | Components receive props and render. Hooks (useQuery, useMutation) handle data fetching. Clean separation for testing. |

### Infrastructure & Deployment

| Decision | Choice | Rationale |
|---|---|---|
| Frontend serving (Docker) | Nginx (nginx:alpine) | ~7MB image, fast static serving, gzip, caching headers. Can proxy /api/* to backend. Standard. |
| Database persistence | Named Docker volume | Survives container restarts and rebuilds. Cleaner and more portable than bind mounts. |
| Environment config | `.env` file + `.env.example` | Docker Compose reads via `env_file`. Fastify validates required vars on startup with Zod schema. Secrets out of compose file. |
| Dev database | Docker container | `docker run postgres` for development. Consistent, isolated, no system-level install required. Documented in README. |
| Logging | Pino (Fastify built-in) | Structured JSON logging out of the box. No extra dependency. Monitoring deferred to Phase 2. |
| CI/CD | Deferred | V1 is local demo. GitHub Actions can be added when deployment target is decided. |

### Decision Impact Analysis

**Implementation Sequence:**
1. Monorepo scaffold (pnpm workspace, tsconfig, Biome)
2. Backend: Fastify server + Drizzle schema + PostgreSQL Docker + migrations
3. Backend: CRUD routes + Zod validation + Swagger docs + CORS/Helmet
4. Frontend: Vite + React + Tailwind + shadcn/ui setup
5. Frontend: TanStack Query + API client + todo components
6. Frontend: Filtering, sorting, animations, error handling, accessibility
7. E2E: Playwright tests against running stack
8. Docker Compose: Nginx + Fastify + PostgreSQL containers

**Cross-Component Dependencies:**
- Zod schemas on the backend define the API contract → frontend `api.ts` types must match
- Drizzle schema defines the database shape → Zod route schemas validate against it
- TanStack Query mutation patterns → must align with the synchronous data flow rule (and the undo-delete exception)
- Design tokens (CSS variables) → referenced by all frontend components, defined once in Tailwind config
- Biome config → shared at root, enforced across both packages

## Implementation Patterns & Consistency Rules

### Pattern Categories Defined

**Critical Conflict Points Identified:** 20+ areas where AI agents could make different choices, organized into 5 categories below.

### Naming Patterns

**Database Naming Conventions (PostgreSQL standard):**

| Element | Convention | Example |
|---|---|---|
| Tables | snake_case, plural | `todos` |
| Columns | snake_case | `user_id`, `created_at`, `is_completed`, `due_date` |
| Primary keys | `id` | `id` (UUID or serial) |
| Foreign keys | `{referenced_table_singular}_id` | `user_id` |
| Indexes | `idx_{table}_{column}` | `idx_todos_user_id` |

Drizzle ORM maps snake_case DB columns to camelCase TypeScript properties automatically.

**API Naming Conventions:**

| Element | Convention | Example |
|---|---|---|
| Endpoints | plural nouns, lowercase | `/api/todos`, `/api/todos/:id` |
| JSON fields | camelCase | `{ id, description, isCompleted, createdAt, dueDate }` |
| Query params | camelCase | `?sortBy=dueDate` |

**Code Naming Conventions:**

| Element | Convention | Example |
|---|---|---|
| Files | kebab-case | `todo-card.tsx`, `todo-routes.ts` |
| React components | PascalCase | `TodoCard`, `AddInput`, `FilterTabs` |
| Functions/variables | camelCase | `getTodos()`, `isCompleted` |
| Types/interfaces | PascalCase | `Todo`, `CreateTodoRequest` |
| Constants | UPPER_SNAKE_CASE | `API_BASE_URL` |
| CSS variables | kebab-case | `--text-primary`, `--duration-fast` |
| Test files | `{source-file}.test.{ext}` | `todo-card.test.tsx` |
| Hook files | `use-{name}.ts` | `use-todos.ts` |

### Structure Patterns

**Test Location: Co-located**

Tests live next to their source files:
- `todo-card.tsx` → `todo-card.test.tsx` (same directory)
- `todo-routes.ts` → `todo-routes.test.ts` (same directory)
- E2E tests: `e2e/` folder at workspace root (Playwright)

Vitest discovers tests by glob pattern (`**/*.test.{ts,tsx}`).

**Component Organization: Flat `components/` directory**

Single-view app with ~8 custom components — no feature folders needed.

```
packages/frontend/src/
├── components/       # All React components
├── hooks/            # Custom hooks (use-todos.ts, use-create-todo.ts)
├── lib/              # API client (api.ts), utilities
├── styles/           # Global CSS, design tokens
├── test-setup.ts     # Vitest global setup
├── app.tsx           # Root app component
└── main.tsx          # Entry point
```

**Backend Organization:**

```
packages/backend/src/
├── routes/           # Route handlers (todo-routes.ts)
├── plugins/          # Fastify plugins (db.ts, cors.ts, error-handler.ts)
├── schema/           # Drizzle schema definitions (todos.ts)
├── validation/       # Zod schemas (todo-schemas.ts)
├── config/           # Environment config, app config
├── app.ts            # Fastify app factory
└── server.ts         # Entry point (starts server)
```

### Format Patterns

**API Response Formats:**

| Scenario | Format | Example |
|---|---|---|
| GET collection | Array directly | `[{ id, description, isCompleted, createdAt, dueDate }, ...]` |
| GET/POST/PATCH single | Object directly | `{ id, description, isCompleted, createdAt, dueDate }` |
| DELETE | No body | Status `204 No Content` |
| Validation error | Fastify error shape | `{ statusCode: 400, error: "Bad Request", message: "Description is required" }` |
| Not found | Fastify error shape | `{ statusCode: 404, error: "Not Found", message: "Todo not found" }` |
| Server error | Fastify error shape | `{ statusCode: 500, error: "Internal Server Error", message: "Something went wrong" }` |

No wrapper objects — TanStack Query already provides `{ data, error, isLoading }`.

**HTTP Status Codes:**

| Code | Usage |
|---|---|
| `200` | GET success, PATCH success |
| `201` | POST success (resource created) |
| `204` | DELETE success (no content) |
| `400` | Validation error (empty description, invalid input) |
| `404` | Todo not found |
| `500` | Internal server error |

**Date Format:** ISO 8601 strings in JSON → `"2026-04-03T10:30:00.000Z"` for timestamps, `"2026-04-05"` (date-only string) for `dueDate`. Frontend formats for display using relative labels ("Today", "Tomorrow", "Apr 5") or "Overdue" for past-due active items.

### Communication Patterns

**State Management Pattern (TanStack Query):**

- `useQuery(['todos'])` — fetches and caches the todo list
- `useMutation` for create/toggle/delete/set-due-date — each with `onSuccess` (invalidate query cache) and `onError` (set error banner state)
- Cache invalidation on mutation success: `queryClient.invalidateQueries(['todos'])`
- Filter/sort state: `useState` in the app component, applied client-side to the cached todo list
- Sort options: "Due ↓" (by due date, soonest first, nulls last) and "Status ↕" (active-first / completed-first toggle)

**Undo Delete Pattern (the one optimistic exception):**

1. On delete click: remove card from UI immediately (optimistic update via `queryClient.setQueryData`)
2. Show undo toast with 5-8s timer
3. If undo tapped: restore card via `queryClient.setQueryData`, cancel timer, no API call
4. If timer expires: fire `DELETE /api/todos/:id`
5. If API fails after timer: restore card, show error banner

### Process Patterns

**Error Handling Pattern (Frontend):**

Every mutation follows the same structure:
1. `useMutation` with `onError` → sets shared error state
2. `ErrorBanner` component reads error state, renders inline between input and list
3. Error auto-dismisses after 8s or on next successful mutation (`onSuccess` clears error state)
4. On mutation error: UI reverts to pre-mutation state (TanStack Query cache unchanged for synchronous mutations)

**Loading State Pattern (Frontend):**

| Context | Mechanism | UI Feedback |
|---|---|---|
| Page load | `useQuery` `isLoading` | Skeleton cards |
| Create todo | `useMutation` `isPending` | Input field spinner/state change |
| Toggle completion | `useMutation` `isPending` | Checkbox pending state |
| Delete | Immediate (optimistic) | Card animates out instantly |

No global loading spinner — all loading is contextual and per-action.

**Import Ordering (enforced by Biome):**

1. React / external packages (`react`, `@tanstack/react-query`)
2. Internal aliases (`@/components/...`, `@/hooks/...`, `@/lib/...`)
3. Relative imports (`./`, `../`)
4. CSS / style imports

### Enforcement Guidelines

**All AI Agents MUST:**

- Follow the naming conventions above without exception — consistency prevents integration failures
- Place tests co-located with source files, not in a separate `__tests__/` directory
- Use the Fastify error response shape for all API errors — no custom error formats
- Return resources directly from API endpoints — no wrapper objects
- Use TanStack Query for all server communication — no raw `useEffect` + `fetch` patterns
- Reference CSS variable tokens — never hardcode color, spacing, or timing values
- Run `pnpm biome check` before considering any code complete

**Pattern Enforcement:**

- Biome config at workspace root enforces formatting, linting, and import ordering automatically
- TypeScript strict mode catches type mismatches between API contract and frontend usage
- Vitest tests verify API response shapes match expected formats
- Playwright e2e tests verify full-stack integration

### Pattern Examples

**Good:**

```typescript
// Backend route
fastify.post<{ Body: CreateTodoBody }>('/api/todos', {
  schema: { body: createTodoSchema },
  handler: async (request, reply) => {
    const todo = await db.insert(todos).values({
      description: request.body.description,
      dueDate: request.body.dueDate ?? null,
    }).returning();
    return reply.status(201).send(todo[0]);
  },
});
```

```typescript
// Frontend hook
export function useCreateTodo() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (data: { description: string; dueDate?: string }) =>
      api.createTodo(data),
    onSuccess: () => queryClient.invalidateQueries({ queryKey: ['todos'] }),
    onError: () => setError("Couldn't add that task — try again."),
  });
}
```

**Anti-Patterns:**

```typescript
// BAD: useEffect + fetch instead of TanStack Query
useEffect(() => {
  fetch('/api/todos').then(r => r.json()).then(setTodos);
}, []);

// BAD: Wrapper object around API response
return { success: true, data: todo, timestamp: Date.now() };

// BAD: Hardcoded color instead of CSS variable
<div style={{ color: '#C4654A' }}>  // Use var(--accent) instead

// BAD: PascalCase file name
TodoCard.tsx  // Use todo-card.tsx instead
```

## Project Structure & Boundaries

### Complete Project Directory Structure

```
bmad-todo-app/
├── .env.example                    # Environment variable template
├── .gitignore
├── biome.json                      # Shared Biome config (lint + format)
├── docker-compose.yml              # 3-service deployment (nginx, api, postgres)
├── package.json                    # Root workspace scripts (dev, build, test, lint)
├── pnpm-lock.yaml
├── pnpm-workspace.yaml             # packages: ['packages/*']
├── tsconfig.base.json              # Shared TypeScript base config
├── README.md
│
├── e2e/                            # Playwright end-to-end tests
│   ├── playwright.config.ts
│   ├── todo-crud.spec.ts           # Full CRUD lifecycle
│   ├── todo-filtering.spec.ts      # Filter + sort behavior
│   ├── todo-due-dates.spec.ts      # Due date setting, overdue display
│   ├── todo-error-states.spec.ts   # Network errors, validation
│   └── fixtures/                   # Test helpers, page objects
│       └── todo-page.ts
│
├── packages/
│   ├── frontend/
│   │   ├── package.json
│   │   ├── tsconfig.json           # Extends ../../tsconfig.base.json
│   │   ├── vite.config.ts
│   │   ├── index.html
│   │   ├── public/
│   │   │   └── favicon.svg
│   │   ├── Dockerfile              # Multi-stage: build → nginx:alpine
│   │   ├── nginx.conf              # Static serve + /api proxy
│   │   └── src/
│   │       ├── main.tsx            # Entry point (React root + QueryClientProvider)
│   │       ├── app.tsx             # Root component (layout, filter/sort state)
│   │       ├── app.test.tsx        # Root integration test
│   │       ├── test-setup.ts       # Vitest global setup (jsdom, RTL matchers)
│   │       ├── styles/
│   │       │   └── globals.css     # Tailwind directives + CSS variable tokens
│   │       ├── lib/
│   │       │   ├── api.ts          # Typed fetch wrapper (getTodos, createTodo, etc.)
│   │       │   ├── api.test.ts     # API client tests (mocked fetch)
│   │       │   └── utils.ts        # Date formatting helpers, overdue logic
│   │       ├── hooks/
│   │       │   ├── use-todos.ts           # useQuery(['todos']) hook
│   │       │   ├── use-todos.test.ts
│   │       │   ├── use-create-todo.ts     # useMutation for POST
│   │       │   ├── use-toggle-todo.ts     # useMutation for PATCH (completion)
│   │       │   ├── use-update-due-date.ts # useMutation for PATCH (due date)
│   │       │   └── use-delete-todo.ts     # useMutation for DELETE (with undo)
│   │       ├── components/
│   │       │   ├── ui/             # Shadcn/ui components (copied, not installed)
│   │       │   │   ├── button.tsx
│   │       │   │   ├── calendar.tsx
│   │       │   │   ├── popover.tsx
│   │       │   │   └── ...         # Other Shadcn primitives as needed
│   │       │   ├── app-header.tsx
│   │       │   ├── app-header.test.tsx
│   │       │   ├── add-input.tsx          # Text input + calendar button + add button
│   │       │   ├── add-input.test.tsx
│   │       │   ├── filter-tabs.tsx        # All / Active / Completed
│   │       │   ├── filter-tabs.test.tsx
│   │       │   ├── sort-row.tsx           # Due ↓ / Status ↕
│   │       │   ├── sort-row.test.tsx
│   │       │   ├── todo-list.tsx          # List container with empty/skeleton states
│   │       │   ├── todo-list.test.tsx
│   │       │   ├── todo-card.tsx          # Individual item (checkbox, text, due badge, delete)
│   │       │   ├── todo-card.test.tsx
│   │       │   ├── error-banner.tsx       # Inline error display
│   │       │   ├── error-banner.test.tsx
│   │       │   ├── undo-toast.tsx         # Delete undo toast
│   │       │   └── undo-toast.test.tsx
│   │       └── types/
│   │           └── todo.ts         # Todo interface, API request/response types
│   │
│   └── backend/
│       ├── package.json
│       ├── tsconfig.json           # Extends ../../tsconfig.base.json
│       ├── Dockerfile              # Multi-stage: build → node:alpine
│       ├── drizzle.config.ts       # Drizzle Kit config
│       └── src/
│           ├── server.ts           # Entry point (starts Fastify)
│           ├── app.ts              # Fastify app factory (plugin registration)
│           ├── app.test.ts         # App-level integration tests
│           ├── config/
│           │   └── env.ts          # Zod-validated environment variables
│           ├── plugins/
│           │   ├── db.ts           # Drizzle + PostgreSQL connection plugin
│           │   ├── cors.ts         # @fastify/cors configuration
│           │   ├── helmet.ts       # @fastify/helmet configuration
│           │   ├── swagger.ts      # @fastify/swagger + swagger-ui setup
│           │   └── error-handler.ts # Global error normalization
│           ├── schema/
│           │   ├── todos.ts        # Drizzle table definition (todos)
│           │   └── migrations/     # Drizzle Kit generated migrations
│           ├── validation/
│           │   ├── todo-schemas.ts         # Zod schemas (create, update)
│           │   └── todo-schemas.test.ts
│           └── routes/
│               ├── todo-routes.ts          # GET/POST/PATCH/DELETE handlers
│               └── todo-routes.test.ts     # Route handler tests
```

### Architectural Boundaries

**API Boundary:**

Single integration boundary: frontend ↔ backend via `GET/POST/PATCH/DELETE /api/todos`. Frontend's `lib/api.ts` is the sole consumer of the REST API. Backend never serves frontend assets in development (separate ports); Nginx proxies `/api/*` to the backend in production.

**Component Boundaries (Frontend):**

- `app.tsx` owns filter/sort state, passes to children via props
- `hooks/` encapsulate all TanStack Query logic — components never call `api.ts` directly
- `components/ui/` are presentation-only Shadcn primitives — no business logic
- Custom components call hooks, render UI, handle user interactions

**Data Boundaries (Backend):**

- `routes/` → `schema/` → database. Routes call Drizzle directly (no repository layer for single-resource CRUD)
- `validation/` Zod schemas validate request bodies before route handlers execute
- `plugins/db.ts` manages the connection pool; routes access `db` via Fastify decorator

### Requirements to Structure Mapping

| FR Category | Frontend Location | Backend Location |
|---|---|---|
| FR1-6 (CRUD) | `add-input`, `todo-card`, `todo-list`, `use-*` hooks | `todo-routes.ts`, `todo-schemas.ts`, `todos.ts` |
| FR7-9 (Due Dates) | `add-input` (calendar btn), `todo-card` (due badge), `use-update-due-date` | `todo-routes.ts` (PATCH), `todo-schemas.ts` |
| FR10-12 (Filter/Sort) | `filter-tabs`, `sort-row`, `app.tsx` (client-side logic) | — (client-side only) |
| FR13-17 (Validation/Errors) | `add-input` (empty check), `error-banner` | `todo-schemas.ts`, `error-handler.ts` |
| FR18-20 (Persistence / data flow) | `use-todos` (useQuery), `lib/api.ts`, mutations incl. delete+undo (`use-delete-todo`) | `db.ts`, `todo-routes.ts`, `todos.ts` |
| FR21-25 (Accessibility) | All components (semantic HTML, ARIA, focus management) | — |
| FR26-27 (Responsive) | `styles/globals.css`, all components (Tailwind responsive) | — |
| FR28-29 (Deployment) | `Dockerfile`, `nginx.conf` | `Dockerfile`, `docker-compose.yml` |

### Integration Points

**Internal Communication:**

Frontend → Backend: HTTP only, via `lib/api.ts` → `/api/todos` endpoints. No WebSockets, no SSE, no shared runtime.

**Data Flow:**

```
User interaction
    → Component event handler
    → Custom hook (useMutation / useQuery)
    → api.ts fetch wrapper
    → HTTP request to /api/todos
    → Fastify route handler
    → Zod validation
    → Drizzle query → PostgreSQL
    → Response back through the chain
    → TanStack Query cache update
    → React re-render
```

**External Integrations:** None for V1. All data is self-contained in PostgreSQL.

### Development Workflow Integration

**Development:**
- `pnpm dev` starts both frontend (Vite HMR on :5173) and backend (tsx watch on :3000) concurrently
- PostgreSQL via `docker run` container on :5432
- Frontend proxies `/api/*` to backend via Vite dev server proxy config

**Build:**
- `pnpm build` runs `vite build` (frontend) and `tsc` (backend) via workspace scripts
- Frontend outputs static files to `packages/frontend/dist/`
- Backend compiles to `packages/backend/dist/`

**Deployment (Docker Compose):**
- Frontend: multi-stage build → nginx:alpine serving static files, proxying `/api/*`
- Backend: multi-stage build → node:alpine running compiled Fastify server
- Database: postgres:16-alpine with named volume for persistence
- Single `docker compose up` starts all three services

## Architecture Validation Results

### Coherence Validation

**Decision Compatibility:** All technology choices are compatible. Vite + React + TypeScript + Tailwind v4 + shadcn/ui is a well-tested frontend stack. Fastify 5.6.x + Drizzle ORM 1.0.0-beta.19 + PostgreSQL 16.x are compatible on the backend. TanStack Query integrates cleanly with any fetch-based API client. Biome 2.4.x handles both packages from root config. Shadcn Calendar + Popover use Radix primitives already in the shadcn/ui dependency chain — no extra dependency family introduced.

**Pattern Consistency:** snake_case DB columns map to camelCase API/TypeScript via Drizzle automatically. Co-located test files match Vitest's glob discovery. kebab-case filenames with PascalCase component names follow standard React convention. The `{ statusCode, error, message }` error shape is Fastify's native format — no custom adaptation needed.

**Structure Alignment:** Flat `components/` directory matches the ~8 component scope. `hooks/` encapsulation enforces the TanStack Query pattern. `plugins/` in backend aligns with Fastify's plugin architecture. `e2e/` at workspace root can test both packages together via Playwright.

### Requirements Coverage Validation

**Functional Requirements (29 FRs):**

| FR Range | Category | Architectural Support |
|---|---|---|
| FR1-6 | CRUD | `todo-routes.ts` + `todo-card` + `add-input` + mutation hooks |
| FR7-9 | Due Dates | Nullable `dueDate` column + PATCH route + Calendar/Popover components + `todo-card` badge |
| FR10-12 | Filter/Sort | `filter-tabs` + `sort-row` + `app.tsx` client-side logic |
| FR13-17 | Validation/Errors | Zod schemas + `error-handler.ts` + `error-banner` + `add-input` client check + skeleton/empty states |
| FR18-20 | Persistence / data flow | Drizzle → PostgreSQL + TanStack Query; server-first UI for create/toggle/due date; undo-deferred DELETE per FR20 / PRD Data Flow Decision |
| FR21-25 | Accessibility | Radix primitives (ARIA built-in), semantic HTML, focus management, design tokens for contrast |
| FR26-27 | Responsive | Tailwind responsive utilities, 44px touch targets, `globals.css` |
| FR28-29 | Deployment | `docker-compose.yml` + named volume + multi-stage Dockerfiles |

All 29 FRs have explicit architectural support. No gaps.

**Non-Functional Requirements (20 NFRs):**

| Category | Architectural Support |
|---|---|
| Performance (p95 < 200ms, bundle < 200KB, load < 2s) | Lean stack, Vite tree-shaking, no heavy frameworks, Nginx gzip/caching |
| Security (HTTPS, validation, no detail leaks) | @fastify/cors + @fastify/helmet + Zod + Drizzle parameterized queries + global error normalization |
| Accessibility (WCAG 2.1 AA) | Radix primitives, design tokens for contrast ratios, keyboard nav per-component, focus management |
| Reliability (zero data loss, durable writes) | PostgreSQL transactional writes, named Docker volume, error-preserves-state pattern |
| Maintainability (conventions, documented API, extensibility) | Biome enforcement, @fastify/swagger, REST-only contract, nullable userId for Phase 2 |

All NFRs addressed. No gaps.

### Implementation Readiness Validation

**Decision Completeness:** All critical decisions documented with specific library versions. Implementation patterns cover naming, structure, format, communication, and process categories. Concrete code examples provided for both good patterns and anti-patterns. Enforcement is automated via Biome, TypeScript strict mode, and test assertions.

**Structure Completeness:** Every file and directory is defined in the project tree with annotations. Component boundaries are explicit (hooks encapsulate data, components render UI). Backend boundaries are clear (routes → validation → schema → database).

**Pattern Completeness:** All 20+ conflict points identified and resolved. Naming conventions cover database, API, code, files, and CSS. Process patterns (error handling, loading states, undo delete) are specified with concrete TanStack Query implementation guidance.

### Gap Analysis Results

**Critical Gaps:** None.

**Important Gaps (non-blocking):**

1. **`prefers-reduced-motion`** — referenced in cross-cutting concerns. Resolution: CSS media query in `styles/globals.css` disabling transitions. Implementation detail, not an architectural gap.
2. **Undo delete timer duration** — pattern specifies "5-8s" range. Resolution: pinned during implementation stories (recommended: 5s).
3. **TLS termination** — NFR requires HTTPS in production. Resolution: Nginx container can handle TLS, or a reverse proxy (Traefik/Caddy) in front. Not blocking for V1 local demo.

**Nice-to-Have (deferred):**
- GitHub Actions CI pipeline template
- Database seed script for dev/demo

### Architecture Completeness Checklist

**Requirements Analysis**

- [x] Project context thoroughly analyzed
- [x] Scale and complexity assessed
- [x] Technical constraints identified
- [x] Cross-cutting concerns mapped

**Architectural Decisions**

- [x] Critical decisions documented with versions
- [x] Technology stack fully specified
- [x] Integration patterns defined
- [x] Performance considerations addressed

**Implementation Patterns**

- [x] Naming conventions established
- [x] Structure patterns defined
- [x] Communication patterns specified
- [x] Process patterns documented

**Project Structure**

- [x] Complete directory structure defined
- [x] Component boundaries established
- [x] Integration points mapped
- [x] Requirements to structure mapping complete

### Architecture Readiness Assessment

**Overall Status:** READY FOR IMPLEMENTATION

**Confidence Level:** High — all 29 FRs and 20 NFRs are architecturally supported with no critical gaps.

**Key Strengths:**

- Lean, focused tech stack with no unnecessary complexity for a single-user CRUD app
- Comprehensive implementation patterns prevent AI agent conflicts
- Clear boundary between frontend and backend (HTTP only, no shared runtime)
- QA from Day One with co-located tests and Playwright e2e
- Due date feature cleanly integrated across all layers
- Future-proofed for Phase 2 (nullable userId, extensible route structure)

**Areas for Future Enhancement:**

- TLS termination strategy for production deployment beyond local demo
- CI/CD pipeline when deployment target is decided
- Rate limiting and authentication (Phase 2)
- Database seed script for development workflow

### Implementation Handoff

**AI Agent Guidelines:**

- Follow all architectural decisions exactly as documented
- Use implementation patterns consistently across all components
- Respect project structure and boundaries
- Refer to this document for all architectural questions
- When in doubt, check the Naming Patterns and Format Patterns tables

**First Implementation Priority:**

```bash
# 1. Root workspace setup (already in bmad-todo-app/)
pnpm init
# Create pnpm-workspace.yaml with packages: ['packages/*']

# 2. Frontend package
pnpm create vite@latest packages/frontend --template react-ts

# 3. Backend package
mkdir -p packages/backend && cd packages/backend
pnpm init

# 4. Root tooling
pnpm add -Dw @biomejs/biome typescript
```
