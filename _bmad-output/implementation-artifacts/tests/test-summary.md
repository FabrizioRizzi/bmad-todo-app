# Test Automation Summary

Generated: 2026-04-09 (Story 3.1 E2E); prior sections: 2026-04-08

## Bug Fix

### Redundant inline error in AddInput (Story 2.3 regression)

The Story 2.3 implementation centralized error handling into the `ErrorBanner` component but left a redundant inline error state in `AddInput`. When a create mutation failed, two error messages appeared simultaneously:

1. `AddInput` inline `<p role="alert">` — "Couldn't add that task — try again."
2. `ErrorBanner` component — "Couldn't add that task — check your connection and try again."

This caused Playwright strict mode violations in 2 existing e2e tests (`todos.spec.ts` lines 177, 196) because `text=Couldn't add that task` matched both elements.

**Fix applied:**
- Removed redundant `error` state and inline error rendering from `packages/frontend/src/components/add-input.tsx`
- Updated `e2e/todos.spec.ts` to use `[data-testid="error-banner"]` locator instead of broad text match

## Generated Tests

### E2E Tests
- [x] `e2e/error-banner.spec.ts` — Story 2.3 Error Banner Component (10 tests)
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
- [x] `e2e/todos.spec.ts` — Updated 2 tests to use specific ErrorBanner locators

### E2E Tests — Story 3.1 Due date support
- [x] `e2e/due-date-support.spec.ts` — 7 Playwright tests
  - Opens AddInput date picker, creates todo with **Today** badge, resets calendar control to icon
  - Todo without due date shows **Set due date for …** control on card
  - Inline change due date updates badge (calendar on card)
  - **Clear due date** from card popover restores icon control
  - Active todo with past due (seeded via API): **Overdue** label and `todo-card-overdue` styling
  - Completed todo with past due (API): no overdue styling
  - Due date **PATCH** failure: error banner shows due-date message; only `dueDate` PATCH is aborted (toggle PATCH still allowed)

**Note:** AddInput calendar trigger must use `getByRole('button', { name: 'Set due date', exact: true })` so Playwright does not match card buttons whose accessible name starts with the same substring.

## Coverage

### E2E Tests by Story
| Story | File | Tests | Status |
|-------|------|-------|--------|
| 1.5 - Create Todo & View List | `e2e/todos.spec.ts` | 14 | ✅ Pass |
| 2.1 - Toggle Todo Completion | `e2e/toggle-todo-completion.spec.ts` | 7 | ✅ Pass |
| 2.2 - Delete Todo with Undo | `e2e/delete-todo.spec.ts` | 9 | ✅ Pass |
| 2.3 - Error Banner Component | `e2e/error-banner.spec.ts` | 10 | ✅ Pass |
| 3.1 - Due date support | `e2e/due-date-support.spec.ts` | 7 | ✅ Pass |
| Smoke | `e2e/example.spec.ts` | 1 | ✅ Pass |
| **Total** | | **48** | **✅ All pass** |

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
| Backend (Vitest) | 20 | ✅ Pass |
| Frontend (Vitest) | 53 | ✅ Pass |
| E2E (Playwright) | 48 | ✅ Pass |
| Lint (Biome) | — | ✅ 0 errors |
| **Total** | **121** | **✅ All pass** |

## Next Steps
- Run tests in CI
- Story 2.3 can proceed from `review` to `done`
- Story 3.1 E2E coverage is in `e2e/due-date-support.spec.ts` (API-level due date cases remain covered by `packages/backend/src/routes/todo-routes.test.ts`)
