# Story 3.1: Due Date Support (API + TodoCard)

Status: done

## Story

As a user,
I want to set, change, or remove a due date on my todos,
So that I can track when tasks need to be completed.

## Acceptance Criteria

1. **Create todo with due date**
   **Given** the backend API is running
   **When** I send `POST /api/todos` with body `{ "description": "File taxes", "dueDate": "2026-04-15" }`
   **Then** the todo is created with `dueDate` set to `"2026-04-15"`
   **And** the response includes `dueDate: "2026-04-15"`

2. **Create todo without due date**
   **Given** the backend API is running
   **When** I send `POST /api/todos` with body `{ "description": "Buy milk" }` (no dueDate field)
   **Then** the todo is created with `dueDate: null`

3. **Update due date via PATCH**
   **Given** an existing todo
   **When** I send `PATCH /api/todos/:id` with body `{ "dueDate": "2026-05-01" }`
   **Then** the todo's due date is updated to `"2026-05-01"`
   **And** the response is `200` with the updated todo

4. **Clear due date via PATCH**
   **Given** an existing todo with a due date
   **When** I send `PATCH /api/todos/:id` with body `{ "dueDate": null }`
   **Then** the todo's due date is cleared (set to null)
   **And** the response is `200` with the updated todo

5. **AddInput date picker**
   **Given** the AddInput component
   **When** I click the calendar icon button
   **Then** a date picker popover opens (Shadcn Calendar + Popover)
   **And** I can select a date for the new todo
   **And** the calendar button shows the selected date label instead of the icon
   **And** submitting the form creates the todo with the selected due date

6. **AddInput reset after create**
   **Given** the AddInput component with a date selected
   **When** the todo is successfully created
   **Then** the input clears, the due date resets (calendar returns to icon), and the input refocuses

7. **TodoCard due date badge**
   **Given** a todo card with a due date
   **When** the card is displayed
   **Then** a due date badge appears below the task text in `--text-xs` (12px) secondary text
   **And** the badge shows a relative label: "Today", "Tomorrow", "Apr 5", etc.

8. **TodoCard inline date editing**
   **Given** a todo card with a due date
   **When** I click the due date badge
   **Then** a date picker popover opens anchored to the card
   **And** I can change or clear the due date
   **And** the change fires a `PATCH /api/todos/:id` with the new `dueDate` value (synchronous — waits for confirmation)
   **And** on success, the badge updates smoothly
   **And** on failure, the badge reverts to the previous date and an error banner appears

9. **TodoCard no-date calendar icon**
   **Given** a todo card without a due date
   **When** the card is displayed
   **Then** a small calendar icon is shown in the due date area for setting a date

10. **Overdue styling for active todos**
    **Given** an active todo whose due date is in the past
    **When** the card is displayed
    **Then** the card background shifts to `--overdue-bg`, the left bar becomes `--overdue-bar` (muted red), and the due date badge displays "Overdue" in `--overdue` color

11. **No overdue styling for completed todos**
    **Given** a completed todo whose due date is in the past
    **When** the card is displayed
    **Then** no overdue styling is applied — completed todos never show overdue indicators

12. **Tests**
    **Given** the due date functionality
    **When** tests are run
    **Then** backend tests verify PATCH with dueDate, POST with optional dueDate
    **And** frontend tests verify: date picker opens, due date badge renders with relative labels, overdue styling applies for active past-due items, overdue styling does not apply for completed items

## Tasks / Subtasks

- [x] Task 1: Extend PATCH endpoint to accept `dueDate` (AC: #3, #4)
  - [x] Update `patchTodoBodySchema` in `packages/backend/src/validation/todo-schemas.ts` to accept optional `dueDate: z.union([z.iso.date(), z.null()])` alongside `isCompleted`
  - [x] Make `isCompleted` optional in `patchTodoBodySchema` (currently required) — PATCH should accept any subset of updatable fields
  - [x] Add `.refine()` or `.superRefine()` to ensure at least one field is provided (reject empty `{}` body)
  - [x] Update PATCH handler in `packages/backend/src/routes/todo-routes.ts` to build a dynamic `set` object from provided fields
  - [x] Add backend tests: PATCH with `{ dueDate: "2026-05-01" }`, PATCH with `{ dueDate: null }`, PATCH with `{ isCompleted: true, dueDate: "2026-05-01" }` (both fields), PATCH with `{}` → 400

- [x] Task 2: Extend frontend API client (AC: #3, #4, #5)
  - [x] Update `createTodo` in `packages/frontend/src/lib/api.ts` to accept optional `dueDate?: string` in the body parameter
  - [x] Add `updateTodoDueDate(id: string, dueDate: string | null): Promise<Todo>` function (or a general `patchTodo` function) to `api.ts`
  - [x] Validate `isTodo` guard includes `dueDate` check (currently missing — add `(typeof o.dueDate === 'string' || o.dueDate === null)`)

- [x] Task 3: Add Shadcn Calendar + Popover components (AC: #5, #8)
  - [x] Run `npx shadcn@latest add calendar popover` in `packages/frontend/` to install Shadcn Calendar and Popover primitives
  - [x] Verify components appear in `packages/frontend/src/components/ui/`
  - [x] Ensure `react-day-picker` dependency is added (Calendar depends on it)

- [x] Task 4: Add date utility functions (AC: #7, #10)
  - [x] Add to `packages/frontend/src/lib/utils.ts`:
    - `formatDueDate(dueDate: string): string` — returns "Today", "Tomorrow", "Yesterday", "Overdue", or formatted date like "Apr 5"
    - `isOverdue(dueDate: string | null, isCompleted: boolean): boolean` — returns true only for active todos with past due dates
  - [x] Use date-only string comparison (no timezone issues — `dueDate` is ISO date `"YYYY-MM-DD"`, compare against local date)
  - [x] Add unit tests for `formatDueDate` and `isOverdue` in `packages/frontend/src/lib/utils.test.ts`

- [x] Task 5: Update AddInput with date picker (AC: #5, #6)
  - [x] Add calendar icon button (ghost variant) to `packages/frontend/src/components/add-input.tsx` between input and add button
  - [x] Wire Popover + Calendar: clicking calendar icon opens popover, selecting a date sets local state, button label changes to selected date
  - [x] Update form submit to pass `{ description, dueDate }` to `createTodo` mutation
  - [x] On success: clear description input AND reset date state (calendar returns to icon)
  - [x] On error: retain both description text and selected date
  - [x] Add `aria-label="Set due date"` to calendar button

- [x] Task 6: Add `useUpdateDueDateMutation` hook (AC: #8)
  - [x] Add to `packages/frontend/src/hooks/use-todos.ts`:
    - `useUpdateDueDateMutation` — calls `patchTodo(id, { dueDate })`, on success invalidates `['todos']` cache, on error triggers error callback
  - [x] Update `useCreateTodoMutation` to pass `dueDate` through to `createTodo`

- [x] Task 7: Update TodoCard with due date badge + overdue styling (AC: #7, #8, #9, #10, #11)
  - [x] In `packages/frontend/src/components/todo-card.tsx`:
    - Add due date badge below description text using `formatDueDate()`
    - Add overdue conditional styling using `isOverdue()`: swap card classes to use `--overdue-bg`, `--overdue-bar`
    - Add small calendar icon for todos without a due date
    - Wire Popover + Calendar for inline date editing (click badge → popover → select/clear → PATCH)
    - Add `aria-label` for due date control: "Set due date for [task text]" or "Change due date for [task text]"
  - [x] In `packages/frontend/src/styles/globals.css`:
    - Add `.todo-card-overdue` class with `--overdue-bg` background and `--overdue-bar` left bar
    - Add transitions for overdue state changes (use `--duration-normal`)

- [x] Task 8: Frontend tests (AC: #12)
  - [x] Update `packages/frontend/src/components/add-input.test.tsx`: test calendar button opens popover, date selection, form submits with dueDate, reset after success
  - [x] Update `packages/frontend/src/components/todo-card.test.tsx`: test due date badge renders with relative label, overdue styling applies for active past-due, no overdue for completed, calendar icon for no-date cards, inline date editing
  - [x] Add `packages/frontend/src/lib/utils.test.ts`: test `formatDueDate` and `isOverdue` functions

- [x] Task 9: Backend tests (AC: #12)
  - [x] Update `packages/backend/src/routes/todo-routes.test.ts`:
    - POST with `dueDate` → verify response includes dueDate
    - POST without `dueDate` → verify response has `dueDate: null`
    - PATCH with `{ dueDate: "2026-05-01" }` → verify update
    - PATCH with `{ dueDate: null }` → verify cleared
    - PATCH with `{}` → verify 400 (at least one field required)

- [x] Task 10: Quality gates
  - [x] `pnpm --filter frontend test` — all tests pass
  - [x] `pnpm --filter backend test` — all tests pass
  - [x] `pnpm lint` — zero errors
  - [x] `pnpm build` — both packages build successfully

## Dev Notes

### Scope boundaries (do not implement here)

- **No** FilterTabs or SortRow components (Story 3.2 and 3.3)
- **No** keyboard navigation for date picker beyond what Radix provides (Epic 4)
- **No** animation for card enter/exit (already exists or deferred to Epic 4)
- **No** ErrorBanner component — use existing inline error pattern from TodoList until Story 2.3 ships the dedicated component. If 2.3 is already done when this story starts, integrate with the central ErrorBanner.

### Critical: What already exists (DO NOT recreate)

- **Database `due_date` column** — already exists in `packages/backend/src/schema/todos.ts` as `date('due_date')` nullable. No migration needed.
- **`createTodoBodySchema`** — already accepts optional `dueDate: z.union([z.iso.date(), z.null()])` in `packages/backend/src/validation/todo-schemas.ts`
- **POST route** — already reads `dueDate` from body and inserts it: `dueDate: dueDate ?? null` in `packages/backend/src/routes/todo-routes.ts`
- **`toTodoDto`** — already maps `dueDate` in response: `dueDate: rest.dueDate ?? null`
- **`Todo` type** — already includes `dueDate: string | null` in `packages/frontend/src/lib/api.ts`
- **`todoResponseSchema`** — already includes `dueDate: z.string().nullable()`
- **CSS tokens** — `--overdue`, `--overdue-bg`, `--overdue-bar` already defined in `packages/frontend/src/styles/globals.css`
- **DELETE endpoint** — already exists in `todo-routes.ts` (added for Story 2.2)

### What needs to be EXTENDED (not created from scratch)

- **`patchTodoBodySchema`** — currently only `{ isCompleted: z.boolean() }`. Must add optional `dueDate` and make `isCompleted` optional too (PATCH should accept partial updates).
- **PATCH route handler** — currently only updates `isCompleted`. Must build dynamic `set` object from provided fields.
- **`createTodo` in `api.ts`** — body type currently `{ description: string }`. Must add optional `dueDate`.
- **`isTodo` guard in `api.ts`** — currently does not validate `dueDate` field. Add check.
- **`add-input.tsx`** — add calendar button + Popover + Calendar for optional due date selection at creation time.
- **`todo-card.tsx`** — add due date badge, overdue styling, inline date editing via Popover.
- **`use-todos.ts`** — add `useUpdateDueDateMutation` hook; update `useCreateTodoMutation` to accept `dueDate`.

### API contract

**Existing (no changes):**
- `POST /api/todos` — body: `{ description: string, dueDate?: string | null }` → `201` + todo
- `GET /api/todos` — → `200` + todo array (each includes `dueDate`)

**Modified:**
- `PATCH /api/todos/:id` — body: `{ isCompleted?: boolean, dueDate?: string | null }` (at least one field required) → `200` + updated todo, `400` if empty body, `404` if not found

### Date format contract

- API sends/receives dates as ISO date strings: `"2026-04-15"` (date only, no time, no timezone)
- Frontend displays relative labels: "Today", "Tomorrow", "Yesterday", "Overdue", or formatted like "Apr 5"
- Overdue determination: compare `dueDate` string against local date (`new Date().toISOString().slice(0, 10)`)
- Completed todos NEVER show overdue styling regardless of due date

### UX references

- **TodoCard due date badge:** UX-DR2 — due date badge with relative labels, 11px secondary text below task text
- **AddInput calendar:** UX-DR3 — calendar icon button (ghost style) for optional due date with Shadcn Calendar+Popover
- **Overdue styling:** UX-DR2 — active+overdue state: `--overdue-bg` background + `--overdue-bar` left bar + "Overdue" badge
- **Date picker:** Shadcn Calendar + Popover (Radix primitives, accessible by default)

### File structure (expected new/changed)

| Path | Action |
|------|--------|
| `packages/backend/src/validation/todo-schemas.ts` | Modify — extend `patchTodoBodySchema` |
| `packages/backend/src/routes/todo-routes.ts` | Modify — extend PATCH handler for dueDate |
| `packages/backend/src/routes/todo-routes.test.ts` | Modify — add PATCH dueDate tests |
| `packages/frontend/src/lib/api.ts` | Modify — extend `createTodo` signature, add `patchTodo`/`updateDueDate`, fix `isTodo` |
| `packages/frontend/src/lib/utils.ts` | Modify — add `formatDueDate`, `isOverdue` |
| `packages/frontend/src/lib/utils.test.ts` | New — unit tests for date utilities |
| `packages/frontend/src/hooks/use-todos.ts` | Modify — add `useUpdateDueDateMutation`, update create mutation |
| `packages/frontend/src/components/add-input.tsx` | Modify — add calendar button + Popover + Calendar |
| `packages/frontend/src/components/add-input.test.tsx` | Modify — add date picker tests |
| `packages/frontend/src/components/todo-card.tsx` | Modify — add due date badge, overdue styling, inline editing |
| `packages/frontend/src/components/todo-card.test.tsx` | Modify — add due date and overdue tests |
| `packages/frontend/src/components/ui/calendar.tsx` | New — Shadcn Calendar component (via CLI) |
| `packages/frontend/src/components/ui/popover.tsx` | New — Shadcn Popover component (via CLI) |
| `packages/frontend/src/styles/globals.css` | Modify — add `.todo-card-overdue` class |

### Testing requirements

**Backend (Vitest):**
- POST with `dueDate` → 201, response includes dueDate
- POST without `dueDate` → 201, response has `dueDate: null`
- PATCH `{ dueDate: "2026-05-01" }` → 200, dueDate updated
- PATCH `{ dueDate: null }` → 200, dueDate cleared
- PATCH `{ isCompleted: true, dueDate: "2026-05-01" }` → 200, both updated
- PATCH `{}` → 400 (at least one field required)
- Existing PATCH `{ isCompleted }` tests must still pass

**Frontend (Vitest + RTL):**
- `utils.test.ts`: `formatDueDate` returns correct labels for today, tomorrow, yesterday, past dates, future dates; `isOverdue` returns true for active past-due, false for completed past-due, false for no due date
- `add-input.test.tsx`: calendar button renders, popover opens on click, date selection updates button label, form submits with dueDate, reset after success
- `todo-card.test.tsx`: due date badge renders with correct label, overdue styling applied for active past-due, no overdue for completed, calendar icon for no-date, inline date editing triggers mutation

### Previous story intelligence

**From Story 2.1 (Toggle Todo Completion):**
- Optimistic update pattern established: `queryClient.setQueryData` for immediate UI, revert on error
- PATCH endpoint pattern: Zod schema validation, UUID params schema, 404 handling
- CSS transition pattern: use `--duration-normal` token, `ease-out`, multi-property transitions
- Error handling: mutation `onError` triggers error display (currently inline in TodoList)
- Test patterns: QueryClient mocking, `@testing-library/user-event` for interactions

**From Story 2.1 deferred items:**
- Overdue styling explicitly deferred to this story (3.1)
- `isTodo` guard in `api.ts` does not validate `dueDate` — fix in this story

**From deferred-work.md:**
- No max length on description — not this story's concern
- `React.forwardRef` deprecation — be aware when creating new components

### Git intelligence

- Latest code commit: `9dbf8e9` — Story 2.1 toggle completion implementation
- PATCH endpoint exists at `todo-routes.ts:84-125` — extend, don't recreate
- `patchTodoBodySchema` at `todo-schemas.ts:9-11` — extend with optional fields
- `useToggleTodoMutation` in `use-todos.ts` — follow same pattern for due date mutation
- DELETE endpoint already exists at `todo-routes.ts:127-160` (for Story 2.2)

### Shadcn component installation

Run from `packages/frontend/`:
```bash
npx shadcn@latest add calendar popover
```

This will install `react-day-picker` as a dependency and create `calendar.tsx` and `popover.tsx` in `components/ui/`. The Calendar component uses Radix Popover for positioning and provides keyboard navigation out of the box.

### Architecture compliance

- All date values use ISO date strings (`"YYYY-MM-DD"`) — no Date objects in API layer
- TanStack Query for all server state — no raw fetch in components
- CSS variable tokens for all visual properties — no hardcoded colors or timing
- Co-located tests next to source files
- kebab-case file names, PascalCase components, camelCase functions
- Fastify error shape: `{ statusCode, error, message }`

### Dependencies

- **Epic 2 dependency:** This story can proceed independently of Stories 2.2 (Delete) and 2.3 (ErrorBanner). If ErrorBanner exists when this story starts, use it; otherwise use the existing inline error pattern from TodoList.
- **No new npm dependencies** beyond what Shadcn CLI installs (`react-day-picker` for Calendar)

## Dev Agent Record

### Agent Model Used

Composer (Cursor agent)

### Completion Notes List

- Extended PATCH with optional `isCompleted` and `dueDate`, `superRefine` for non-empty body, dynamic Drizzle `set` object; backend tests cover POST/PATCH due date cases and `{}` → 400.
- Frontend: `patchTodo`, `createTodo` with optional `dueDate`, `isTodo` validates `dueDate`; `formatDueDate` / `isOverdue` / `localDateToIsoDate` / `isoDateToLocalDate` with unit tests; "Overdue" label is composed in `TodoCard` when `isOverdue` (not inside `formatDueDate`).
- Calendar + Popover: hand-written `calendar.tsx` (react-day-picker v9 + design tokens) and `popover.tsx` (@base-ui/react/popover); `react-day-picker` and `date-fns` added via pnpm (Shadcn CLI hit pnpm store / overwrite prompts).
- AddInput: controlled popover, optional due date on create, reset on success; TodoCard: badge or icon, inline edit with optimistic `useUpdateDueDateMutation`, error banner via new `dueDate` error action in `App`/`TodoList`.
- `.todo-card-overdue` uses token colors; existing `.todo-card-bar` transitions cover background/border changes.

### File List

- `packages/backend/src/validation/todo-schemas.ts`
- `packages/backend/src/routes/todo-routes.ts`
- `packages/backend/src/routes/todo-routes.test.ts`
- `packages/frontend/package.json` (dependencies: `react-day-picker`, `date-fns`)
- `packages/frontend/src/lib/api.ts`
- `packages/frontend/src/lib/utils.ts`
- `packages/frontend/src/lib/utils.test.ts`
- `packages/frontend/src/hooks/use-todos.ts`
- `packages/frontend/src/components/add-input.tsx`
- `packages/frontend/src/components/add-input.test.tsx`
- `packages/frontend/src/components/todo-card.tsx`
- `packages/frontend/src/components/todo-card.test.tsx`
- `packages/frontend/src/components/todo-list.tsx`
- `packages/frontend/src/components/ui/calendar.tsx`
- `packages/frontend/src/components/ui/popover.tsx`
- `packages/frontend/src/app.tsx`
- `packages/frontend/src/styles/globals.css`
- `_bmad-output/implementation-artifacts/sprint-status.yaml`

### Review Findings

- [x] [Review][Patch] Disable due-date Calendar and Clear actions while a due-date PATCH is in flight — `PopoverTrigger` is disabled when `isPending`, but with the popover already open the inner `Calendar` and "Clear due date" remain clickable, so users can queue overlapping `PATCH` requests. [`packages/frontend/src/components/todo-card.tsx`] — fixed 2026-04-09 (`disabled` on Calendar + Clear, guard in `applyDueDate`)

- [x] [Review][Patch] Harden `isoDateToLocalDate` / `formatDueDate` against malformed `dueDate` strings — corrupt or non–`YYYY-MM-DD` values yield `Invalid Date` and odd `toLocaleDateString` output instead of a safe fallback. [`packages/frontend/src/lib/utils.ts`] — fixed 2026-04-09 (`localDateFromValidIso`, `formatDueDate` → `'Invalid date'`, `isOverdue` false for bad strings)

- [x] [Review][Patch] Expose the selected due date to assistive tech on AddInput — when a date is chosen the trigger still uses `aria-label="Set due date"` only; the visible truncated label is not reflected for screen readers. [`packages/frontend/src/components/add-input.tsx`] — fixed 2026-04-09 (dynamic `aria-label` with formatted date)

- [x] [Review][Defer] React DayPicker often omits `onSelect` when the user clicks the already-selected day — no second PATCH; acceptable unless product requires "re-apply same date". [`packages/frontend/src/components/todo-card.tsx`] — deferred, pre-existing library behavior

### Change Log

- 2026-04-09: Story 3.1 implemented — PATCH due date, AddInput/TodoCard date pickers, overdue styling, tests, quality gates green.
- 2026-04-09: Code review patch batch — pending PATCH guard for due-date popover, strict ISO date parsing + safe labels, AddInput `aria-label` includes selected date; story marked done.
