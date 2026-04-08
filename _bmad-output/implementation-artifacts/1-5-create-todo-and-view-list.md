# Story 1.5: Create Todo & View List

Status: done

<!-- Ultimate context engine analysis completed - comprehensive developer guide created -->

## Story

As a user,
I want to type a task and press Enter to add it to my list,
So that I can capture tasks the moment I think of them.

## Acceptance Criteria

1. **Create via Enter (server-first UI)**  
   **Given** the app is loaded and the input field is visible  
   **When** I type "Buy groceries" and press Enter  
   **Then** a loading indicator appears within 100ms (e.g. `isPending` on the create mutation, and/or disabled input/button — must be perceptible quickly)  
   **And** the API call `POST /api/todos` fires with JSON body `{ "description": "Buy groceries" }`  
   **And** on success, the new todo card appears in the list with **active** styling: warm white background (`--active-bg`), terracotta left accent bar (`--active-bar`), task text in `--text-primary`  
   **And** the input field clears and regains focus for the next entry  

2. **Create via add button**  
   **Given** the app is loaded and the input field is visible  
   **When** I click the terracotta "+" add button  
   **Then** the form submits the same way as pressing Enter (same validation, same mutation, same success behavior)  

3. **Client-side empty / whitespace guard**  
   **Given** the input field is empty or contains only whitespace  
   **When** I press Enter or click "+"  
   **Then** nothing happens — **no** `fetch` to the API, **no** error UI (server never sees empty descriptions in the happy path)  

4. **Load and list all todos**  
   **Given** the app is loaded  
   **When** todos exist in the database  
   **Then** all todos are fetched via `GET /api/todos` and displayed in the list as cards  
   **And** each card shows the task description text  
   **And** list order matches the API (backend orders by `createdAt` ascending — preserve that order in the UI)  

5. **Empty state (no todos)**  
   **Given** the app is loaded  
   **When** no todos exist (successful fetch returned `[]`)  
   **Then** the empty state is shown: ☑ icon, **"No tasks yet"**, **"Type above and press Enter (or tap +) to add your first task."**  
   **And** container uses `role="status"` and `aria-live="polite"` per UX-DR6  

6. **Skeleton loading → crossfade**  
   **Given** the app is loading data from the API  
   **When** the initial fetch is in progress  
   **Then** skeleton card placeholders are displayed in the list area (card-shaped, dimensions consistent with real cards, warm border color)  
   **And** skeletons use a pulsing opacity animation per UX-DR9 (loop duration via `--duration-*` / token-aligned timing — **no raw `1500ms` in TSX**)  
   **And** when `prefers-reduced-motion: reduce`, show **static** skeleton placeholders (no pulse loop)  
   **And** on success, skeletons **crossfade** to real cards using `--duration-smooth` (250ms) easing per UX  

7. **Data layer & dev proxy**  
   **Given** the frontend data layer  
   **When** todo data is fetched or created  
   **Then** **TanStack Query** manages server state: `useQuery` with query key `['todos']` (or equivalent stable key) for listing, `useMutation` for create — **no** raw `useEffect` + `fetch` for server state  
   **And** the typed API client in `lib/api.ts` wraps **native `fetch`** with `getTodos()` and `createTodo({ description })` (and shared `Todo` / DTO types aligned with backend)  
   **And** the Vite dev server proxies `/api/*` to the backend (default backend dev URL `http://localhost:3000` unless configured via env)  

8. **Tests**  
   **Given** components and hooks from this story  
   **When** `pnpm --filter frontend test` runs  
   **Then** co-located tests verify at minimum: **AddInput** (or equivalent) renders and submits with user-event; **TodoList** displays items from mocked/success data; **EmptyState** renders correct copy; skeleton/loading state appears while fetch is pending (e.g. mock delayed `getTodos` or QueryClient test utilities)  

## Tasks / Subtasks

- [x] Task 1: Dependencies & app wiring (AC: #7)  
  - [x] Add `@tanstack/react-query` to `packages/frontend`; wrap the tree in `QueryClientProvider` (e.g. in `main.tsx` or a thin `providers.tsx`).  
  - [x] Add Vite `server.proxy` for `/api` → backend origin; confirm `pnpm dev` (root) can load todos from running backend.  

- [x] Task 2: Typed API client (AC: #7)  
  - [x] Add `packages/frontend/src/lib/api.ts` with `Todo` type matching backend `TodoResponse`: `{ id, description, isCompleted, createdAt, dueDate }` (camelCase, `dueDate` string | null, `createdAt` ISO string).  
  - [x] Implement `getTodos(): Promise<Todo[]>` → `GET /api/todos`.  
  - [x] Implement `createTodo(body: { description: string }): Promise<Todo>` → `POST /api/todos` with JSON body; throw or return discriminated errors using `{ statusCode, error, message }` shape for non-OK responses.  

- [x] Task 3: Query/mutation hooks (AC: #1, #4, #7)  
  - [x] Add `packages/frontend/src/hooks/use-todos.ts` (name may vary — keep **kebab-case** file): `useTodosQuery`, `useCreateTodoMutation` that call `api.ts` only from hooks (components do not import `api.ts` directly).  
  - [x] On successful create: invalidate or append so list updates; ensure cache reflects server response (FR20 sync path for create).  

- [x] Task 4: UI components (AC: #1–#6)  
  - [x] **AddInput** (`components/add-input.tsx`): `<form>` with Shadcn `Input` + terracotta **add** `Button` (icon "+" e.g. `lucide-react`), placeholder **"Add a new task..."**, `onSubmit` prevents default, trims description, submits mutation. **No** calendar/due-date UI (Epic 3).  
  - [x] **TodoCard** (`components/todo-card.tsx`): minimal row/card for Epic 1 — description + active visual treatment (left bar, backgrounds per AC); **no** checkbox or delete yet (Epic 2).  
  - [x] **TodoList** (`components/todo-list.tsx`): maps todos to cards; handles loading / empty via props or hook state from parent.  
  - [x] **EmptyState** (`components/empty-state.tsx`): variant for “no todos” with exact strings from AC #5.  
  - [x] **TodoListSkeleton** (or inline in list): placeholder cards + pulse/reduced-motion per AC #6.  

- [x] Task 5: Compose `App` + header count (AC: #4)  
  - [x] Replace placeholder sections in `app.tsx` with real AddInput + list region; wire `AppHeader` **count** to loaded todos length (`todos.length`), still using tokens and `role="status"` on the badge.  

- [x] Task 6: Tests + quality gate (AC: #8)  
  - [x] Co-located `*.test.tsx` for AddInput, TodoList, EmptyState, skeleton behavior; use `@testing-library/user-event` and either `vi.stubGlobal('fetch', …)` or Vitest network mocking — keep tests deterministic.  
  - [x] Run `pnpm lint` and `pnpm --filter frontend test` and `pnpm --filter frontend build`.  

## Dev Notes

### Scope boundaries (do not implement here)

- **No** `PATCH` / `DELETE`, checkbox toggle, delete, undo toast, or **ErrorBanner** (Epic 2).  
- **No** due date picker, filter tabs, sort row, or overdue styling (Epic 3).  
- **No** shared runtime types package — duplicate DTO interfaces in `api.ts` only; keep in sync with `packages/backend/src/validation/todo-schemas.ts` (`TodoResponse`).  
- **No** backend or database migrations unless a bug is discovered (API already implemented in Story 1.3).  

### Technical requirements

- **Architecture:** TanStack Query for all server state; **`hooks/`** own queries/mutations; **`lib/api.ts`** is the only module that performs `fetch` to `/api/*`. [Source: `_bmad-output/planning-artifacts/architecture.md` — API & State Management, Enforcement Guidelines]  
- **Styling:** Continue Story 1.4 rule — colors, spacing, motion from **CSS variables** / theme-mapped utilities; no raw hex or hardcoded `ms` in component code.  
- **Files:** Flat `components/`, kebab-case filenames, co-located tests. [Source: architecture.md — Structure Patterns]  
- **Accessibility:** Semantic `<form>`, labels for controls, `aria-busy` or clear disabled state during mutation where appropriate; empty state `role="status"` + `aria-live="polite"`. Full keyboard polish and live-region catalog arrive in Epic 4 — do not block 1.5 on FR21–FR23.  
- **NFR:** UI feedback under 100ms — bind loading UI to mutation `isPending` / `isLoading` immediately.  

### API contract (must match backend)

- `GET /api/todos` → `200` + `Todo[]` (empty array if none).  
- `POST /api/todos` → `201` + full todo; body `{ "description": string }` for this story.  
- `400` empty/whitespace description: `{ statusCode: 400, error: "Bad Request", message: "Description is required" }` — should not occur if client trim guard is correct.  
- [Source: `packages/backend/src/validation/todo-schemas.ts` — `todoResponseSchema`, `createTodoBodySchema`]  
- [Source: `packages/backend/src/routes/todo-routes.test.ts` — ordering and DTO shape]  

### UX references (subset for 1.5)

- Add field layout, placeholder, terracotta add control: UX-DR3 (ignore calendar/popover until Epic 3).  
- Empty state copy and semantics: UX-DR6 variant 1.  
- Skeleton pulse + crossfade + reduced motion: UX-DR9, UX-DR11.  
- [Source: `_bmad-output/planning-artifacts/ux-design-specification.md`]  

### File structure (expected new/changed)

| Path | Action |
|------|--------|
| `packages/frontend/package.json` | Add `@tanstack/react-query` |
| `packages/frontend/vite.config.ts` | Add `server.proxy` for `/api` |
| `packages/frontend/src/main.tsx` | QueryClientProvider (or providers) |
| `packages/frontend/src/lib/api.ts` | **Create** |
| `packages/frontend/src/hooks/use-todos.ts` | **Create** |
| `packages/frontend/src/components/add-input.tsx` | **Create** |
| `packages/frontend/src/components/todo-card.tsx` | **Create** |
| `packages/frontend/src/components/todo-list.tsx` | **Create** |
| `packages/frontend/src/components/empty-state.tsx` | **Create** |
| `packages/frontend/src/components/todo-list-skeleton.tsx` | **Create** (or merge into todo-list) |
| `packages/frontend/src/components/app-header.tsx` | **Modify** — accept `count` prop |
| `packages/frontend/src/app.tsx` | **Modify** — compose real features |
| `packages/frontend/src/app.test.tsx` | **Update** for new behavior |
| `packages/frontend/src/components/*.test.tsx` | **Create** per AC #8 |

### Testing requirements

- Vitest + RTL + user-event; prefer mocking `fetch` at the test boundary or mocking `api.ts` functions so tests do not require a live backend.  
- Cover: submit with Enter and with button click; whitespace-only no-op; empty list copy; list renders descriptions; loading skeleton visible when query is pending.  

### Previous story intelligence (Story 1.4)

- Shell, tokens, Shadcn `Button`/`Input`, `AppHeader`, centered `max-w-[40rem]` column already exist — **extend** rather than replace.  
- Story 1.4 explicitly deferred: `lib/api.ts`, TanStack Query, Vite proxy — **all in scope for 1.5**.  
- Optional follow-up from 1.4 dev notes: verify `tsconfig` path alias for `@/*` in tests — fix if imports fail in Vitest.  

### Git intelligence summary

- Recent work: frontend foundation (Tailwind v4, tokens, app shell) in `743cbea`; backend todo routes and Zod schemas in prior commits — frontend should align types with `todo-schemas.ts`.  

### Latest technical notes (April 2026)

- Use **TanStack Query v5** with React 19; configure `QueryClient` with sensible defaults (e.g. `retry` for queries on transient failures — keep conservative for local dev).  
- Vite 8 proxy: use `server.proxy` object; target port **3000** for Fastify per root `pnpm dev` convention.  

### Project context reference

- No `project-context.md` in repo; use architecture + epics + this file.  

### References

- [Source: `_bmad-output/planning-artifacts/epics.md` — Epic 1, Story 1.5]  
- [Source: `_bmad-output/planning-artifacts/architecture.md` — Frontend structure, TanStack Query, api.ts, dev proxy]  
- [Source: `_bmad-output/implementation-artifacts/1-4-frontend-foundation-with-design-tokens.md` — shell and deferred items]  
- [Source: `_bmad-output/implementation-artifacts/1-3-todo-crud-api-endpoints.md` — endpoint behavior]  

## Dev Agent Record

### Agent Model Used

Cursor (auto model selection)

### Debug Log References  

### Completion Notes List  

- Implemented TanStack Query (`QueryClientProvider` in `providers.tsx`), Vite `/api` proxy (`VITE_DEV_API_TARGET` optional, default `http://localhost:3000`), typed `fetch` client in `lib/api.ts`, and `useTodosQuery` / `useCreateTodoMutation` in `hooks/use-todos.ts` (components use hooks only).
- Add flow: `AddInput` form with trim guard, Enter + icon submit, `isPending` disables controls and `aria-busy` on form; new todo highlighted with `--active-bg` / `--active-bar` via `highlightedId` state.
- List: `TodoList` skeleton pulse via `.todo-skeleton-pulse` + `--duration-skeleton-pulse` in CSS; crossfade to content with `--duration-smooth`; empty state matches AC copy + `role="status"` / `aria-live="polite"` / `aria-labelledby` on the heading text for accessible name.
- `Input` updated with `forwardRef` for post-create focus restore.
- Tests: co-located RTL + user-event + mocked `fetch`; `pnpm lint`, `pnpm test` (repo), `pnpm --filter frontend build` passed.

### File List  

- `packages/frontend/package.json`
- `pnpm-lock.yaml`
- `packages/frontend/vite.config.ts`
- `packages/frontend/src/styles/globals.css`
- `packages/frontend/src/main.tsx`
- `packages/frontend/src/providers.tsx`
- `packages/frontend/src/lib/api.ts`
- `packages/frontend/src/hooks/use-todos.ts`
- `packages/frontend/src/components/add-input.tsx`
- `packages/frontend/src/components/add-input.test.tsx`
- `packages/frontend/src/components/todo-card.tsx`
- `packages/frontend/src/components/todo-list.tsx`
- `packages/frontend/src/components/todo-list.test.tsx`
- `packages/frontend/src/components/todo-list-skeleton.tsx`
- `packages/frontend/src/components/empty-state.tsx`
- `packages/frontend/src/components/empty-state.test.tsx`
- `packages/frontend/src/components/app-header.tsx`
- `packages/frontend/src/components/app-header.test.tsx`
- `packages/frontend/src/components/ui/input.tsx`
- `packages/frontend/src/app.tsx`
- `packages/frontend/src/app.test.tsx`
- `packages/frontend/src/test-utils.tsx`
- `_bmad-output/implementation-artifacts/sprint-status.yaml`
- `_bmad-output/implementation-artifacts/1-5-create-todo-and-view-list.md`

### Change Log  

- 2026-04-08: Story 1.5 implemented — todo create/list UI, TanStack Query, API client, Vite proxy, tests, quality gates green.

### Review Findings

- [x] [Review][Patch] **Active styling should apply to ALL non-completed todos, not just the highlighted one** — Fixed: all cards now use `--active-bg` + `--active-bar` by default. [todo-card.tsx]
- [x] [Review][Patch] **`highlightedId` is never cleared — stale highlight persists indefinitely** — Fixed: added 2s timeout via `useEffect`. [app.tsx]
- [x] [Review][Patch] **No `onError` handler on create mutation — silent failure** — Fixed: added `onError` with inline error message and focus restoration. [add-input.tsx]
- [x] [Review][Patch] **Module-level `QueryClient` in `providers.tsx` shared across HMR and test boundaries** — Fixed: moved to `useState(createQueryClient)`. [providers.tsx]
- [x] [Review][Patch] **No error state handling in `App` — failed query shows empty list** — Fixed: added `isError` branch with alert message. [app.tsx]
- [x] [Review][Patch] **API functions use unsafe `as` casts with no runtime validation on success responses** — Fixed: added `isTodo` type guard and runtime validation. [api.ts]
- [x] [Review][Patch] **Network errors (offline, DNS) from `fetch` throw `TypeError` instead of `ApiRequestError`** — Fixed: added `safeFetch` wrapper with try/catch. [api.ts]
- [x] [Review][Patch] **`loadEnv` with empty prefix exposes all env vars, not just `VITE_`-prefixed** — Fixed: changed to `DEV_` prefix and renamed env var to `DEV_API_TARGET`. [vite.config.ts]
- [x] [Review][Defer] **No input length validation** — `AddInput` trims whitespace but imposes no max length. A user could submit an extremely long description. This is a backend validation concern and not in scope for this story. [add-input.tsx] — deferred, pre-existing
- [x] [Review][Defer] **`React.forwardRef` deprecation in React 19** — The `Input` component uses `React.forwardRef` which is deprecated in React 19 (ref is a regular prop). Functional but will emit warnings in future. [ui/input.tsx] — deferred, pre-existing
- [x] [Review][Defer] **No test for API error responses** — Neither `app.test.tsx` nor `add-input.test.tsx` test non-200 responses. The entire error path is untested. Error handling UI is Epic 2 scope. [tests] — deferred, pre-existing

## Story completion status

- **Status:** done  
- **Note:** Code review complete. All patch findings resolved. Tests pass (14/14). Deferred items logged.
