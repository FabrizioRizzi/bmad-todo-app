# Test Automation Summary

Generated: 2026-04-09 (Epic 3 complete: 3.2 / 3.3 + counts refresh)

## Bug Fix

### Redundant inline error in AddInput (Story 2.3 regression)

The Story 2.3 implementation centralized error handling into the `ErrorBanner` component but left a redundant inline error state in `AddInput`. When a create mutation failed, two error messages appeared simultaneously:

1. `AddInput` inline `<p role="alert">` — "Couldn't add that task — try again."
2. `ErrorBanner` component — "Couldn't add that task — check your connection and try again."

This caused Playwright strict mode violations in 2 existing e2e tests (`e2e/story-1.5-todos.spec.ts`) because `text=Couldn't add that task` matched both elements.

**Fix applied:**
- Removed redundant `error` state and inline error rendering from `packages/frontend/src/components/add-input.tsx`
- Updated `e2e/story-1.5-todos.spec.ts` to use `[data-testid="error-banner"]` locator instead of broad text match

## Generated Tests

### E2E Tests
- [x] `e2e/story-2.3-error-banner.spec.ts` — Story 2.3 Error Banner Component (10 tests)
  - Shows create error banner with correct message when create fails
  - Shows toggle error banner with correct message when toggle fails
  - Shows delete error banner with correct message when delete fails
  - Error banner has `role="alert"` and `aria-live="assertive"`
  - Error banner contains warning icon (⚠)
  - Error banner is positioned between input and todo list
  - Auto-dismisses after 8 seconds
  - Dismisses on successful action
  - New error replaces previous error (no stacking)
  - Error banner preserves input value on create failure

### Existing E2E Tests (fixed)
- [x] `e2e/story-1.5-todos.spec.ts` — Updated 2 tests to use specific ErrorBanner locators

### E2E Tests — Story 3.1 Due date support
- [x] `e2e/story-3.1-due-date-support.spec.ts` — 7 Playwright tests
  - Opens AddInput date picker, creates todo with **Today** badge, resets calendar control to icon
  - Todo without due date shows **Set due date for …** control on card
  - Inline change due date updates badge (calendar on card)
  - **Clear due date** from card popover restores icon control
  - Active todo with past due (seeded via API): **Overdue** label and `todo-card-overdue` styling
  - Completed todo with past due (API): no overdue styling
  - Due date **PATCH** failure: error banner shows due-date message; only `dueDate` PATCH is aborted (toggle PATCH still allowed)

**Note:** AddInput calendar trigger must use `getByRole('button', { name: 'Set due date', exact: true })` so Playwright does not match card buttons whose accessible name starts with the same substring.

### E2E Tests — Story 3.2 Filter todos by status
- [x] `e2e/story-3.2-filter-todos-by-status.spec.ts` — 8 Playwright tests (serial + API cleanup before each test)
  - Three filter tabs; **All** selected by default (`aria-selected`)
  - Tabs use `aria-controls="todo-list"`; `#todo-list` is present
  - **Active** / **Completed** filters hide non-matching todos after transition; **All** restores full list
  - Empty states: **No active tasks** / **No completed tasks** with expected hints
  - Filter change announces count in the screen-reader live region (`[aria-live="polite"].sr-only`), matching `app.test.tsx` pattern

**Note:** Filter tab accessible names are `"{label}, {count} tasks"` (from `aria-label`). This file runs **`describe.configure({ mode: 'serial' })`** and clears todos via `DELETE /api/todos/:id` in `beforeEach` so empty-state and count assertions stay stable when the dev DB is shared.

### E2E Tests — Story 3.3 Sort todos
- [x] `e2e/story-3-3-sort-todos.spec.ts` — 6 Playwright tests (serial + API cleanup in `beforeEach`, same pattern as Story 3.2)
  - Sort toolbar: `role="toolbar"` / `aria-label="Sort options"`, **Sort by** label, **Due** default `aria-pressed="true"`, **Status** visible on **All** with `aria-pressed="false"`
  - **Due** sort: soonest due first, no due date last (todos seeded via `POST /api/todos`); list-order assertions use **`orderSubset`** so other specs’ todos in a shared dev DB do not break ordering checks
  - **Due** control toggles ascending/descending when already active (`Due ↑` / `Due ↓` labels)
  - **Status** sort: active-first then second click completed-first, stable within groups (three todos via Add Input)
  - **Active** / **Completed** filters hide the Status sort control; **All** shows it again
  - Switching filter to **Active** after Status sort resets to **Due** pressed (Status hidden)

**Note:** Default **Due** label in the UI is **Due ↑** (ascending / soonest first), not “Due ↓” as in the original story text. Sort buttons are targeted with **`getByRole('button', { name: /Sort by due date/ })`** and **`/Sort by status/`** (accessible names from `SortRow`).

## Coverage

### E2E Tests by Story
| Story | File | Tests | Status |
|-------|------|-------|--------|
| 1.5 - Create Todo & View List | `e2e/story-1.5-todos.spec.ts` | 14 | ✅ Pass |
| 2.1 - Toggle Todo Completion | `e2e/story-2.1-toggle-todo-completion.spec.ts` | 7 | ✅ Pass |
| 2.2 - Delete Todo with Undo | `e2e/story-2.2-delete-todo.spec.ts` | 9 | ✅ Pass |
| 2.3 - Error Banner Component | `e2e/story-2.3-error-banner.spec.ts` | 10 | ✅ Pass |
| 3.1 - Due date support | `e2e/story-3.1-due-date-support.spec.ts` | 7 | ✅ Pass |
| 3.2 - Filter by status | `e2e/story-3.2-filter-todos-by-status.spec.ts` | 8 | ✅ Pass |
| 3.3 - Sort todos | `e2e/story-3-3-sort-todos.spec.ts` | 6 | ✅ Pass |
| Smoke | `e2e/example.spec.ts` | 1 | ✅ Pass |
| **Total** | | **62** | **✅ Pass** |

### Story 2.3 Acceptance Criteria Coverage
| AC# | Description | E2E Test |
|-----|-------------|----------|
| 1 | Error banner positioning | `error banner is positioned between input and todo list` |
| 2 | Error banner animations | Covered by enter/exit class presence (unit tests) |
| 3 | Auto-dismiss after 8 seconds | `auto-dismisses after 8 seconds` |
| 4 | Dismiss on success | `dismisses on successful action` |
| 5 | Error replacement (no stacking) | `new error replaces previous error (no stacking)` |
| 6 | Create error message | `shows create error banner with correct message when create fails` |
| 7 | Toggle error message | `shows toggle error banner with correct message when toggle fails` |
| 8 | Delete error message | `shows delete error banner with correct message when delete fails` |
| 9 | Accessibility (aria live alert) | `error banner has role="alert" and aria-live="assertive"` |
| 10 | Component tests | 13 unit tests in `error-banner.test.tsx` + 5 in `app.test.tsx` |

### Full Test Suite
| Suite | Tests | Status |
|-------|-------|--------|
| Backend (Vitest) | 26 | ✅ Pass |
| Frontend (Vitest) | 108 | ✅ Pass |
| E2E (Playwright) | 62 | ✅ Pass |
| Lint (Biome) | — | ✅ 0 errors |
| **Total** | **196** | **✅ All pass** |

### Story 3.3 Sort todos (unit / integration + E2E)
- **Unit / RTL:** `packages/frontend/src/components/sort-row.test.tsx`, `lib/utils.test.ts` (sort helpers), `app.test.tsx` (sort + filter + reset).
- **E2E:** `e2e/story-3-3-sort-todos.spec.ts` (6 tests).

## Next Steps
- Run tests in CI
- Epic 3 is **done** in `sprint-status.yaml`; optional: run **Epic 3 retrospective** (`epic-3-retrospective`)
- Story 3.1 E2E: `e2e/story-3.1-due-date-support.spec.ts` (API-level due date cases: `packages/backend/src/routes/todo-routes.test.ts`)
- Story 3.2 / 3.3 E2E: `e2e/story-3.2-filter-todos-by-status.spec.ts`, `e2e/story-3-3-sort-todos.spec.ts` — for full Playwright locally with multiple workers, use **`pnpm test:e2e --workers=1`** if specs interfere (shared dev DB; some clear all todos in `beforeEach`)
