# Story 1.3: Todo CRUD API Endpoints

Status: ready-for-dev

<!-- Ultimate context engine analysis completed - comprehensive developer guide created -->

## Story

As a user,
I want API endpoints that create and retrieve todos,
So that my tasks are persisted and available across sessions.

## Acceptance Criteria

1. **POST create — success**
   Given the backend API is running, when `POST /api/todos` is sent with body `{ "description": "Buy groceries" }`, then a new row is inserted with `is_completed: false`, `created_at` set (DB default), `due_date: null`, and `user_id: null`. Response is **201** with body `{ id, description, isCompleted, createdAt, dueDate }` (camelCase JSON). `dueDate` is `null`. Do **not** include `userId` in the JSON (column exists for future use only). Extra/unknown fields in the request body are silently stripped (Zod default behavior).

2. **POST create — empty / whitespace description**
   When the body is `{ "description": "" }` or `{ "description": "   " }`, response is **400** with `{ statusCode: 400, error: "Bad Request", message: "Description is required" }` and **no** row is inserted. This exact message is required by the epic contract — the route handler must catch this validation case **before** it reaches the global error handler (which would prefix it with `"Validation error: "`). See Dev Notes for implementation approach.

3. **GET list — with data**
   When `GET /api/todos` is sent and todos exist, response is **200** with a JSON **array** of objects, each `{ id, description, isCompleted, createdAt, dueDate }` (same field set as single todo; no `userId`). Default ordering: `createdAt ASC` (oldest first — stable, deterministic).

4. **GET list — empty**
   When no todos exist, response is **200** with `[]`.

5. **Zod schema validation — malformed body**
   When the body has wrong types or is missing `description` entirely (not empty-string — that's AC #2), the global error handler produces **400** with `{ statusCode: 400, error: "Bad Request", message: "Validation error: ..." }`. No internal details leak.

6. **Tests**
   Co-located integration tests in `todo-routes.test.ts` cover all behaviors above against a real database (same pattern as `db.integration.test.ts`: `buildApp` + `dbPlugin` + route plugin, `DATABASE_URL`). Use `app.inject()` — no real HTTP server.

## Tasks / Subtasks

- [ ] Task 1: Zod schemas (AC: #1–#5)
  - [ ] Create `packages/backend/src/validation/todo-schemas.ts`:
    - `createTodoBodySchema`: `z.object({ description: z.string() })` — Zod default strips unknown fields.
    - `todoResponseSchema`: `z.object({ id: z.string().uuid(), description: z.string(), isCompleted: z.boolean(), createdAt: z.string().datetime(), dueDate: z.string().nullable() })` — matches the serialized DTO, not the Drizzle row. Used for Swagger docs and response serialization.
    - `todoListResponseSchema`: `z.array(todoResponseSchema)`.
  - [ ] Export inferred TypeScript types (`CreateTodoBody`, `TodoResponse`).
- [ ] Task 2: DTO mapper (AC: #1, #3)
  - [ ] In the route file (or a small helper), create a `toTodoDto(row)` function that:
    - Destructures the Drizzle row, **omitting `userId`**.
    - Converts `createdAt` (JS `Date` from Drizzle `timestamp`) → `.toISOString()` string.
    - Passes `dueDate` through as-is (Drizzle `date()` already returns `YYYY-MM-DD` string or `null`).
    - Returns `{ id, description, isCompleted, createdAt, dueDate }`.
- [ ] Task 3: Todo route plugin (AC: #1–#5)
  - [ ] Create `packages/backend/src/routes/todo-routes.ts` as a `fastify-plugin` (default export, `fp()` wrapper with `{ name: 'todo-routes' }`) that registers:
    - `POST /api/todos`:
      - Attach `schema: { body: createTodoBodySchema, response: { 201: todoResponseSchema } }` for Swagger + type provider.
      - In the handler: trim `description`, check non-empty — if empty after trim, return `reply.status(400).send({ statusCode: 400, error: 'Bad Request', message: 'Description is required' })` **directly** (do not let Zod/global handler prefix it).
      - Otherwise: `db.insert(todos).values({ description: trimmed }).returning()`, map via `toTodoDto`, reply **201**.
    - `GET /api/todos`:
      - Attach `schema: { response: { 200: todoListResponseSchema } }`.
      - `db.select().from(todos).orderBy(asc(todos.createdAt))`, map each row via `toTodoDto`, reply **200**.
  - [ ] Use `fp()` so routes register at root scope (flat structure, matching architecture).
- [ ] Task 4: Wire registration (AC: #1–#4)
  - [ ] In `packages/backend/src/server.ts`, register the todo routes plugin **after** `dbPlugin` (routes need `fastify.db`).
- [ ] Task 5: Integration tests (AC: #6)
  - [ ] Create `packages/backend/src/routes/todo-routes.test.ts`:
    - Setup: `buildApp({ logger: false })` → `register(dbPlugin)` → `register(todoRoutes)` → `ready()`. Teardown: `close()`.
    - Data isolation: `beforeEach` or `afterEach` runs `DELETE FROM todos` via `app.db.delete(todos)` to prevent cross-test pollution.
    - Test cases: POST happy path (assert 201, UUID id, camelCase keys, `createdAt` is ISO string, `dueDate` is null, no `userId` key), GET with data (assert 200, array, correct shape), GET empty (assert 200, `[]`), POST empty string (assert 400, exact message `"Description is required"`), POST whitespace-only (assert 400, same message), POST missing description / wrong type (assert 400, message starts with `"Validation error:"`).
- [ ] Task 6: Quality gate
  - [ ] `pnpm --filter backend test` and `pnpm lint` pass.

## Dev Notes

### Scope boundary (do not implement in this story)

- **No** `PATCH /api/todos/:id`, **no** `DELETE /api/todos/:id` — Epic 2 stories.
- **No** optional `dueDate` on `POST` body — description-only create for now; due-date-on-create is Story 3.1.
- **No** frontend or `packages/frontend` changes.

### Validation message strategy (AC #2 vs global handler)

The global error handler in `plugins/error-handler.ts` prefixes all Zod validation errors with `"Validation error: "`. The epic contract requires the **exact** message `"Description is required"` for empty/whitespace — no prefix. Two approaches:

**Recommended:** Handle the trim + empty check in the route handler **before** Drizzle insert. Use Zod only for structural validation (is `description` a string?). In the handler, trim the value and if empty, send the 400 directly with the exact message. This keeps the Zod schema simple and the exact message guaranteed.

**Alternative:** Use a Zod `.transform(trim).refine(nonEmpty)` pipeline, but then the global handler would produce `"Validation error: Description is required"`. You'd need to intercept the error in the route or modify the handler — more complex, more fragile.

### Drizzle column type behavior (critical)

| Column | Drizzle type | JS return type from `select`/`returning` | Serialization needed |
|--------|-------------|------------------------------------------|---------------------|
| `id` | `uuid()` | `string` | None |
| `description` | `text()` | `string` | None |
| `isCompleted` | `boolean()` | `boolean` | None |
| `createdAt` | `timestamp()` | **`Date`** (JS Date object) | **`.toISOString()`** → `"2026-04-07T10:30:00.000Z"` |
| `dueDate` | `date()` | **`string`** (`"YYYY-MM-DD"`) or `null` | None — already a string |
| `userId` | `uuid()` | `string` or `null` | **Omit from response** |

Getting `createdAt` wrong (sending a raw Date object) will cause the response serializer to fail if a Zod response schema is attached, or produce `{}` in JSON.

### Response schema and Swagger

With `serializerCompiler` active (set in `app.ts`), Fastify validates **outgoing** responses against the response schema. Define response schemas using `z.string()` types (matching the serialized DTO), not `z.date()`. The `todoResponseSchema` must match the output of `toTodoDto()` exactly. The `jsonSchemaTransform` in the swagger plugin will auto-generate OpenAPI docs from these schemas.

### Developer context

Reuse: `buildApp()`, Zod type provider, `error-handler.ts`, `db` decorator (`fastify.db`), `todos` table in `schema/todos.ts`. No repository layer — routes call Drizzle directly per architecture.

### Technical requirements

- **Imports:** ESM + `NodeNext` — use `.js` extensions in all relative imports.
- **Error shape:** All errors `{ statusCode, error, message }` per `plugins/error-handler.ts`.
- **POST success:** Return the object directly (not wrapped). **GET collection:** Return the array directly (not `{ todos: [...] }`).
- **Plugin pattern:** Default export via `fp(handler, { name: 'todo-routes' })` — matches `db.ts`, `cors.ts`, etc.
- **Code style:** Tabs, single quotes (Biome enforced). Run `pnpm lint` before committing.

### Architecture compliance

- [Source: architecture.md — API & Communication Patterns] REST, prefix `/api/todos`, manual route registration, Swagger from schemas, global error handler.
- [Source: architecture.md — Structure Patterns] `routes/todo-routes.ts`, `validation/todo-schemas.ts`, co-located `todo-routes.test.ts`.
- [Source: architecture.md — Format Patterns] Collection = array directly; single = object directly; DELETE = 204 (not this story); validation error = `{ 400, "Bad Request", message }`; dates = ISO 8601.

### File structure requirements

| Path | Action |
|------|--------|
| `packages/backend/src/validation/todo-schemas.ts` | Create |
| `packages/backend/src/routes/todo-routes.ts` | Create |
| `packages/backend/src/routes/todo-routes.test.ts` | Create |
| `packages/backend/src/server.ts` | Modify — register todo routes after `dbPlugin` |

Do not rename or relocate existing Story 1.2 files.

### Testing requirements

- **Co-located** `*.test.ts`, Vitest 4.x.
- **Real DB** via `DATABASE_URL` (same as `db.integration.test.ts`). Use `app.inject()` for requests — no HTTP server, no port conflicts.
- **Data isolation:** `DELETE FROM todos` between tests via `app.db.delete(todos)`.
- Assert **status codes**, **JSON shapes**, **camelCase keys**, string types for dates, absence of `userId` key.

### Previous story intelligence (Story 1.2)

- `buildApp()` does **not** register `db` — `server.ts` does. Route plugin must run **after** `db`.
- `db.integration.test.ts` pattern: `buildApp({ logger: false })`, `register(dbPlugin)`, `ready()`, `close()`.
- Zod v4 (`^4.3.6`) is installed; `fastify-type-provider-zod` v6 is compatible.
- Story 1.2 explicitly deferred `validation/todo-schemas.ts` and `routes/` to this story.
- Biome enforces tabs + single quotes; run `pnpm lint` to verify.

### Forward compatibility notes

- Story 2.1 (PATCH) and 2.2 (DELETE) will extend `todo-routes.ts` with new endpoints using the same `todoResponseSchema` and `toTodoDto()`.
- Story 3.1 will add optional `dueDate` to the POST body schema. Keep the schema extensible (adding a field to `createTodoBodySchema` later should be straightforward).
- The `todoResponseSchema` field set `{ id, description, isCompleted, createdAt, dueDate }` is the stable API contract across all stories.

### References

- [Source: `_bmad-output/planning-artifacts/epics.md` — Story 1.3]
- [Source: `_bmad-output/planning-artifacts/architecture.md` — API & Communication Patterns, Structure Patterns, Format Patterns]
- [Source: `_bmad-output/planning-artifacts/prd.md` — FR1, FR2, FR13, FR18–FR20]
- [Source: `_bmad-output/implementation-artifacts/1-2-backend-api-and-database-foundation.md` — patterns, file list, library versions]

## Dev Agent Record

### Agent Model Used

claude-4.6-opus-high

### Debug Log References

### Completion Notes List

### File List

## Story completion status

- **Status:** ready-for-dev
- **Note:** Ultimate context engine analysis completed — comprehensive developer guide created.
