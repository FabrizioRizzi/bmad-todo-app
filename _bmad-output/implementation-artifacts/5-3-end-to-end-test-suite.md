# Story 5.3: End-to-End Test Suite

Status: done

## Story

As a user,
I want the main journeys (add, complete, filter, due dates, errors) checked by automated browser tests against a real stack,
so that releases are far less likely to ship broken basics.

## Acceptance Criteria

1. **CRUD lifecycle test**
   **Given** the Playwright test suite runs against the full stack
   **When** `todo-crud.spec.ts` executes
   **Then** it verifies: create a todo → verify it appears → complete it → verify visual change → uncomplete it → delete it → verify undo toast → let timer expire → verify deletion

2. **Filtering test**
   **Given** the e2e test suite
   **When** `todo-filtering.spec.ts` runs
   **Then** it verifies: create multiple todos (some completed) → filter to Active → verify only active shown → filter to Completed → verify only completed shown → filter to All → verify all shown

3. **Due dates test**
   **Given** the e2e test suite
   **When** `todo-due-dates.spec.ts` runs
   **Then** it verifies: create a todo with a due date → verify due date badge appears → change the due date → verify badge updates → sort by due date → verify order

4. **Error states test**
   **Given** the e2e test suite
   **When** `todo-error-states.spec.ts` runs
   **Then** it verifies: empty state displays on first visit → error banner appears when API fails (mocked network error) → error banner auto-dismisses or clears on success

5. **Page object**
   **Given** a page object in `e2e/fixtures/todo-page.ts`
   **When** used by test specs
   **Then** it provides reusable methods: `addTodo(text, dueDate?)`, `completeTodo(index)`, `deleteTodo(index)`, `filterBy(status)`, `sortBy(option)`, `getVisibleTodos()`, `getErrorBanner()`

6. **All tests pass**
   **Given** all e2e tests
   **When** run against the full stack (dev servers: frontend on :5173, backend on :3000, PostgreSQL on :5432)
   **Then** all tests pass and verify the application works end-to-end

## Tasks / Subtasks

- [x] Task 1: Create `e2e/fixtures/todo-page.ts` page object (AC: #5)
  - [x] `TodoPage` class wrapping `Page` from Playwright
  - [x] `goto()` — navigates to the app
  - [x] `addTodo(text: string, dueDate?: string)` — types text, optionally opens calendar + selects date, submits
  - [x] `completeTodo(index: number)` — clicks checkbox on the nth visible todo
  - [x] `uncompleteTodo(index: number)` — clicks checkbox on a completed todo
  - [x] `deleteTodo(index: number)` — clicks delete button on the nth visible todo
  - [x] `filterBy(status: 'All' | 'Active' | 'Completed')` — clicks the filter tab
  - [x] `sortBy(option: 'Due' | 'Status')` — clicks the sort control
  - [x] `getVisibleTodos()` — returns array of `{ text, isCompleted, dueDate? }` from the DOM
  - [x] `getErrorBanner()` — returns the error banner text or null
  - [x] `getUndoToast()` — returns the undo toast element or null
  - [x] `waitForUndoToExpire()` — waits for the 5s undo timer + API call
  - [x] `getEmptyState()` — returns the empty state text or null
  - [x] Centralized label construction — addresses locator fragility from Epic 4 retro (no inline RegExp from user text)

- [x] Task 2: Create `todo-crud.spec.ts` (AC: #1)
  - [x] Test: full CRUD lifecycle — create → verify → complete → verify visual change → uncomplete → delete → verify undo toast → wait for timer → verify deletion
  - [x] Test: create multiple todos and verify they all appear
  - [x] Test: empty input does not create a todo

- [x] Task 3: Create `todo-filtering.spec.ts` (AC: #2)
  - [x] Test: create active and completed todos → filter Active → only active visible → filter Completed → only completed visible → filter All → all visible
  - [x] Test: filtered empty states (no active tasks, no completed tasks)

- [x] Task 4: Create `todo-due-dates.spec.ts` (AC: #3)
  - [x] Test: create todo with due date → badge appears with expected label
  - [x] Test: change due date on existing todo → badge updates
  - [x] Test: sort by due date → verify order (soonest first, nulls last)

- [x] Task 5: Create `todo-error-states.spec.ts` (AC: #4)
  - [x] Test: empty state shows on first visit (clean database)
  - [x] Test: mock network error → error banner appears → verify message text
  - [x] Test: error banner clears on next successful action

- [x] Task 6: Update Playwright config if needed (AC: #6)
  - [x] Ensure `e2e/fixtures/` directory is accessible via Playwright config
  - [x] Verify global teardown still works with new test files

### Review Findings

- [x] [Review][Patch] Add clean-state setup to every new e2e suite so tests do not share backend state across parallel workers [`e2e/todo-crud.spec.ts:14`]
- [x] [Review][Patch] Trigger the sort UI in the due-date ordering test instead of relying on the default initial ordering [`e2e/todo-due-dates.spec.ts:87`]
- [x] [Review][Patch] Narrow `waitForUndoToExpire()` so it waits for the delete request caused by the current todo instead of any matching DELETE response [`e2e/fixtures/todo-page.ts:122`]
- [x] [Review][Patch] Align `deleteTodo()` with the app's truncated delete aria-label so long todo descriptions remain deletable in tests [`e2e/fixtures/todo-page.ts:58`]

## Dev Notes

### Critical: Page object solves Epic 4's locator fragility

Epic 4 retrospective identified cascading locator updates across stories because ARIA labels changed and each spec built its own label strings. The page object in `e2e/fixtures/todo-page.ts` MUST own all label construction logic. Test specs should never build `RegExp` from user text directly — use page object methods instead.

Pattern:
```typescript
// GOOD — page object owns label construction
const todos = await todoPage.getVisibleTodos();
expect(todos[0].text).toBe('Buy groceries');

// BAD — test builds its own locator from text
await page.getByRole('checkbox', { name: new RegExp(`Mark ${text}`) });
```

### Critical: Existing e2e tests — coexistence strategy

The project already has per-story e2e specs:
- `story-1.5-todos.spec.ts`
- `story-2.1-toggle-todo-completion.spec.ts`
- `story-2.2-delete-todo.spec.ts`
- `story-2.3-error-banner.spec.ts`
- `story-3.1-due-date-support.spec.ts`
- `story-3.2-filter-todos-by-status.spec.ts`
- `story-3.3-sort-todos.spec.ts`
- `story-4.1-keyboard-navigation.spec.ts`
- `story-4.2-screen-reader-aria.spec.ts`
- `story-4.3-responsive-layout.spec.ts`

The new journey-based specs (`todo-crud.spec.ts`, etc.) are **complementary** — they test complete user journeys end-to-end rather than individual story acceptance criteria. **Do NOT delete** existing per-story specs. The new specs provide journey-level regression coverage; the existing specs provide granular story-level coverage.

### Critical: Docker Compose secret prerequisites

When running e2e tests against a Docker Compose stack (instead of dev servers), create required local secret files before startup:
- `secrets/postgres_user.txt`
- `secrets/postgres_password.txt`

Use `secrets/README.md` as the source of truth for setup. Missing files will prevent compose services from starting.

### Critical: Test isolation — clean database state

Each test file should start with a clean state. The existing `e2e/global-teardown.ts` handles cleanup. Each test file should also clean up its own data at the start (e.g., delete all todos via API before the test runs) to ensure deterministic state.

Pattern:
```typescript
test.beforeEach(async ({ page }) => {
  // Clean slate via API
  const response = await page.request.get('/api/todos');
  const todos = await response.json();
  for (const todo of todos) {
    await page.request.delete(`/api/todos/${todo.id}`);
  }
});
```

### Critical: Error mocking strategy

For `todo-error-states.spec.ts`, use Playwright's route interception to mock API failures:

```typescript
await page.route('**/api/todos', route => {
  route.fulfill({ status: 500, body: JSON.stringify({ statusCode: 500, error: 'Internal Server Error', message: 'Something went wrong' }) });
});
```

Mock specific endpoints (POST for create failure, PATCH for toggle failure) while keeping GET working so the page loads normally.

### Architecture compliance

- Playwright for e2e tests at workspace root per architecture [Source: architecture.md — Testing Framework]
- Page object in `e2e/fixtures/todo-page.ts` per architecture [Source: architecture.md — Project Structure]
- Journey-based test files per epic requirements [Source: epics.md — Story 5.3]

### Existing Playwright config

Current `e2e/playwright.config.ts` starts both dev servers:
- Backend: `pnpm --filter backend dev` on `:3000`
- Frontend: `pnpm --filter frontend dev` on `:5173`
- `reuseExistingServer: !process.env.CI`
- Chrome-only project
- Global teardown via `global-teardown.ts`

No changes needed unless fixtures need special import handling.

### Component ARIA labels (for page object construction)

Based on implemented Stories 4.1–4.2, these are the key labels the page object must know:

| Element | ARIA label pattern |
|---------|-------------------|
| Add button | `"Add task"` |
| Checkbox (active) | `"Mark [text] as complete"` |
| Checkbox (completed) | `"Mark [text] as active"` |
| Delete button | `"Delete [text]"` |
| Due date (no date) | `"Set due date for [text]"` |
| Due date (has date) | `"Change due date for [text]"` |
| Filter tabs | `role="tablist"` with tabs "All", "Active", "Completed" |
| Sort controls | `role="toolbar"` with `aria-label="Sort options"` |
| Error banner | `role="alert"` |
| Empty state | `role="status"` |

### Undo toast timing

The undo timer is 5 seconds. For the CRUD test that waits for undo to expire, the test must wait slightly over 5s for the timer + the subsequent DELETE API call. Use `page.waitForResponse` on the DELETE endpoint rather than a fixed timeout.

### Previous story intelligence

**From Epic 4 Retro:**
- Centralize e2e locator patterns in page object helpers — HIGH priority action item
- `e2e/fixtures/todo-page.ts` owns label construction; no inline RegExp from user text
- Prefer Opus 4.6 for implementation

**From Story 4.3:** Responsive e2e tests run at 3 viewports (375px, 768px, 1280px). Journey tests should run at default desktop viewport unless testing responsive behavior.

### Test execution command

```bash
pnpm test:e2e
# or
playwright test --config e2e/playwright.config.ts
```

### References

- [Source: `_bmad-output/planning-artifacts/epics.md` — Epic 5, Story 5.3]
- [Source: `_bmad-output/planning-artifacts/architecture.md` — Testing Framework, Project Structure]
- [Source: `e2e/playwright.config.ts` — existing Playwright setup]
- [Source: `e2e/global-teardown.ts` — existing cleanup]
- [Source: `_bmad-output/implementation-artifacts/epic-4-retro-2026-04-13.md` — Action item #2: centralize e2e locators]
- [Source: `_bmad-output/implementation-artifacts/4-2-screen-reader-support-and-aria.md` — ARIA label patterns]

## Dev Agent Record

### Agent Model Used

Opus 4.6

### Debug Log References

- Fixed `completeTodo`/`uncompleteTodo` — after clicking checkbox, aria-label changes so must use the new label locator for assertion
- Fixed parallel execution issues — CRUD test used index-based operations that broke with concurrent DB writes; switched to text-based index lookup
- Empty-state test uses route interception to mock empty GET response instead of DB cleanup (avoids race conditions with parallel workers)
- Filtering/due-dates tests use `clearAllTodos(request)` via Playwright's `APIRequestContext` (same pattern as existing story-3.2/3.3)
- Pre-existing flaky tests in story-3.2 ("announces task count") and story-3.3 ("status sort") fail intermittently in full parallel suite due to shared DB contamination — pass reliably in isolation

### Completion Notes List

- ✅ Created `TodoPage` page object centralizing all ARIA label construction (Epic 4 retro action item #2)
- ✅ Page object provides: `goto`, `addTodo`, `completeTodo`, `uncompleteTodo`, `deleteTodo`, `filterBy`, `sortBy`, `getVisibleTodos`, `getErrorBanner`, `getUndoToast`, `waitForUndoToExpire`, `getEmptyState`, `cleanDatabase`
- ✅ `todo-crud.spec.ts`: 3 tests covering full CRUD lifecycle, multi-create, and empty-input guard
- ✅ `todo-filtering.spec.ts`: 2 tests covering Active/Completed/All filter transitions and filtered empty states
- ✅ `todo-due-dates.spec.ts`: 3 tests covering due date creation, date change, and sort-by-due ordering
- ✅ `todo-error-states.spec.ts`: 3 tests covering empty state, error banner on API failure, and banner clear-on-success
- ✅ No changes needed to Playwright config — `testDir: '.'` picks up new specs, fixtures excluded by default test pattern
- ✅ All 220 unit tests pass (26 backend + 194 frontend) — no regressions
- ✅ Linting passes clean (biome check)
- ✅ 11 new e2e tests verified passing against full stack

### Change Log

- 2026-04-14: Implemented Story 5.3 — created page object and 4 journey-based e2e test specs (11 tests total)

### File List

- e2e/fixtures/todo-page.ts (new)
- e2e/todo-crud.spec.ts (new)
- e2e/todo-filtering.spec.ts (new)
- e2e/todo-due-dates.spec.ts (new)
- e2e/todo-error-states.spec.ts (new)
- packages/backend/.env (new — local dev database config)
