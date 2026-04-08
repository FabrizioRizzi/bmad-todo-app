# Epic 2 E2E Test Strategy & QA Roadmap

**Status:** Ready for QA automation  
**Date Created:** 2026-04-08  
**Epic:** Epic 2 — Complete Task Lifecycle  
**Stories Covered:** 2.1 (Toggle), 2.2 (Delete + Undo), 2.3 (Error Banner)

---

## Overview

This document outlines the E2E test strategy for Epic 2, providing the QA agent with complete requirements for Playwright automation. All tests will run against the full stack (frontend + backend + database) to verify the complete task lifecycle: toggle completion, delete with undo, and error handling.

---

## User Journeys to Test

### Journey 1: Toggle Completion
**Prerequisite:** One or more todos exist in the list  
**Goal:** Verify checkbox functionality and visual state transitions

**Test Case 1.1: Complete an Active Todo**
1. Navigate to app with existing active todos
2. Click checkbox on an active todo
3. Verify: Checkbox shows pending state within 100ms
4. Verify: API `PATCH /api/todos/:id` sent with `{ "isCompleted": true }`
5. Verify: On success, card transitions:
   - Background: `--active-bg` → `--completed-bg`
   - Left bar: `--active-bar` → `--completed-bar`
   - Text: `--text-primary` → `--text-completed` + strikethrough
   - Checkbox: empty → filled with sage green checkmark
6. Verify: Transition animation duration ~200ms (ease-out)
7. Verify: Checkbox remains enabled after transition

**Test Case 1.2: Uncomplete a Completed Todo**
1. Navigate to app with completed todos
2. Click checkbox on a completed todo
3. Verify: Checkbox shows pending state
4. Verify: API `PATCH /api/todos/:id` sent with `{ "isCompleted": false }`
5. Verify: Card transitions back to active state:
   - Background: `--completed-bg` → `--active-bg`
   - Left bar: `--completed-bar` → `--active-bar`
   - Text: strikethrough removed, `--text-completed` → `--text-primary`
   - Checkbox: filled checkmark → empty

**Test Case 1.3: Toggle Error Handling**
1. Create todo in list
2. Simulate API failure (mock PATCH response 500 or network error)
3. Click checkbox to toggle
4. Verify: Checkbox reverts to previous state (no optimistic update visible on error)
5. Verify: Error banner appears with message: "Couldn't update that task — try again."
6. Verify: Error banner auto-dismisses after 8 seconds

---

### Journey 2: Delete with Undo
**Prerequisite:** One or more todos exist in the list  
**Goal:** Verify delete flow with undo capability and timer-based permanent deletion

**Test Case 2.1: Delete Todo - Optimistic Removal & Undo Toast**
1. Navigate to app with existing todos
2. Click delete button (✕) on a todo
3. Verify: Card animates out (slide right + fade, ~200ms ease-in)
4. Verify: Todo removed from visible list immediately (optimistic)
5. Verify: Undo toast appears at bottom-center:
   - Background: `--toast-bg` (dark warm gray)
   - Text: `--toast-text` (warm white) + "Task deleted"
   - Undo link: terracotta color
   - Border-radius: 12px
   - Slide-up animation: ~200ms ease-out
6. Verify: Toast shows 5-second auto-dismiss timer
7. Verify: No `DELETE` API call sent yet

**Test Case 2.2: Undo Before Timer Expires**
1. From Test Case 2.1 state: toast visible, timer counting down
2. Click "Undo" link on toast within 5 seconds
3. Verify: Deleted card animates back into list (slide + fade, ~300ms ease-out)
4. Verify: Card appears with same data and state as before delete
5. Verify: Toast dismisses immediately
6. Verify: `DELETE` API call is **NOT** sent
7. Verify: Card is fully interactive again

**Test Case 2.3: Timer Expires - DELETE API Call Fires**
1. From Test Case 2.1 state: toast visible with countdown
2. Wait 5 seconds without clicking Undo
3. Verify: Toast auto-dismisses (fade animation, ~200ms ease-out)
4. Verify: `DELETE /api/todos/:id` API call fires
5. Verify: API response is `204 No Content`
6. Verify: Todo remains removed from list (no restoration)

**Test Case 2.4: DELETE API Failure - Card Restored**
1. Mock `DELETE` endpoint to return 500 or network error
2. Delete a todo → wait 5 seconds for timer to expire
3. Verify: `DELETE` API call fires and fails
4. Verify: Deleted card reappears in list with slide-in animation (~300ms ease-out)
5. Verify: Error banner appears: "Couldn't delete that task — try again."
6. Verify: Card is fully interactive again

**Test Case 2.5: Multiple Deletes - Toast Replacement**
1. Delete first todo → undo toast appears (5s timer)
2. Without waiting, delete a second todo
3. Verify: First todo's undo toast is replaced by second todo's toast
4. Verify: First todo's timer expires → `DELETE` API call fires for first todo
5. Verify: Second todo's timer is running independently
6. Wait 5 seconds more
7. Verify: Second todo's timer expires → `DELETE` API call fires for second todo

**Test Case 2.6: Desktop Delete Button Visibility**
1. On desktop (1024px+), navigate to app with todos
2. Verify: Delete button is hidden by default on todo cards
3. Hover over a todo card
4. Verify: Delete button appears (opacity-100)
5. Move mouse away
6. Verify: Delete button hides again (opacity-0)

**Test Case 2.7: Mobile Delete Button Visibility**
1. On mobile device or mobile viewport (< 768px), navigate to app with todos
2. Verify: Delete button is always visible at 50% opacity
3. Click delete button → verify flow proceeds (delete + undo)

---

### Journey 3: Error Handling & Recovery
**Goal:** Verify error states and recovery paths

**Test Case 3.1: Create Error Recovery**
1. Mock `POST /api/todos` to fail with network error
2. Type "New task" and press Enter
3. Verify: Error banner appears: "Couldn't add that task — check your connection and try again."
4. Verify: Input field retains text (no clear on error)
5. Verify: Auto-dismiss after 8 seconds
6. Recover: Unmock API, type another task, press Enter
7. Verify: Error banner disappears on success
8. Verify: New task appears in list

**Test Case 3.2: Toggle Error & Recovery**
1. Mock `PATCH /api/todos/:id` to fail
2. Click checkbox to toggle
3. Verify: Error banner appears: "Couldn't update that task — try again."
4. Verify: Checkbox reverts to previous state
5. Recover: Unmock API, click checkbox again
6. Verify: Error banner dismisses, toggle succeeds

**Test Case 3.3: Delete API Error (After Timer)**
1. From delete scenario: todo deleted, undo toast visible, wait 5 seconds
2. Mock `DELETE` to fail
3. Verify: DELETE call fires and fails
4. Verify: Card restores with animation
5. Verify: Error banner appears: "Couldn't delete that task — try again."
6. Recover: Unmock, delete again, wait for success

**Test Case 3.4: Error Banner Auto-Dismiss**
1. Trigger any error (e.g., create error)
2. Verify: Error banner visible
3. Wait 8 seconds
4. Verify: Banner auto-dismisses with fade animation (~200ms ease-out)

**Test Case 3.5: Error Banner Replaced by New Error**
1. Trigger error #1 (e.g., create fails)
2. Verify: Error banner #1 visible
3. Trigger error #2 (e.g., toggle fails) before banner #1 auto-dismisses
4. Verify: Banner #1 is replaced by banner #2
5. Verify: Only one banner visible (no stacking)

---

## Test Data Setup

### Pre-Test Database State
- Clear all todos via API or database
- Populate with 3–5 test todos:
  - 2–3 active todos
  - 2–3 completed todos
  - Variety of descriptions (short + long text)

### Test Teardown
- Clean up test todos from database
- Reset any mocked API responses

---

## Page Object / Fixtures

**Create `e2e/fixtures/epic-2-page.ts`** with helper methods:

```typescript
// Navigation & state
- navigateToApp(): void
- getVisibleTodos(): { id, description, isCompleted }[]
- getTodoByDescription(text: string): TodoElement

// Toggle interaction
- toggleTodoCheckbox(todoId: string): Promise<void>
- verifyTodoState(todoId: string, isCompleted: boolean): Promise<void>

// Delete interaction
- deleteTodo(todoId: string): Promise<void>
- clickUndoInToast(): Promise<void>
- getUndoToastText(): Promise<string>
- waitForToastToDismiss(timeoutMs: number): Promise<void>

// Error handling
- getErrorBannerText(): Promise<string | null>
- verifyErrorBannerVisible(message: string): Promise<void>
- waitForErrorBannerToDisappear(timeoutMs: number): Promise<void>

// Network mocking
- mockApiFailure(endpoint: string, method: string): Promise<void>
- unmockApi(): Promise<void>

// Animations & visual
- verifyAnimationApplied(element, animationClass): Promise<void>
- takeScreenshot(name: string): Promise<void>
```

---

## Test File Structure

Create the following test spec files in `e2e/`:

1. **`epic-2-toggle.spec.ts`** — All journey 1 test cases (toggle completion)
2. **`epic-2-delete.spec.ts`** — All journey 2 test cases (delete + undo)
3. **`epic-2-errors.spec.ts`** — All journey 3 test cases (error handling + recovery)

---

## Execution Prerequisites

- Backend running and accessible at `http://localhost:3000` (or env var `VITE_DEV_API_TARGET`)
- Frontend running and accessible at `http://localhost:5173` (or configured Playwright base URL)
- Database seeded with test todos
- All Stories 2.1, 2.2, 2.3 implemented and merged

---

## Success Criteria

- [ ] All 16 test cases pass (100% pass rate)
- [ ] Coverage includes: toggle, delete, undo, error handling, responsive behavior
- [ ] Tests run in < 5 minutes total
- [ ] No flaky tests (all assertions are deterministic; use `page.waitFor()` where needed)
- [ ] Screenshots captured for visual regression (optional but recommended)

---

## Notes for QA Agent

- **MCP Server Recommendations:** Use `cursor-ide-browser` for snapshot-based assertions during automation; use `browser_network_requests` to verify API calls match expectations.
- **Timing Considerations:** 
  - Animations (200–300ms): use `page.waitForTimeout(400)` after actions to ensure transitions complete
  - Undo timer (5s): use `page.waitForTimeout(5500)` to let timer expire
  - Auto-dismiss (8s): use `page.waitForTimeout(8500)` for error banner
- **Error Injection:** Mock API responses using Playwright's `page.route()` for network failure scenarios
- **Accessibility:** Verify ARIA attributes (`role="alert"`, `aria-live="assertive"`) in error banner tests
- **Responsive:** Run tests at multiple viewport sizes (mobile 375px, tablet 768px, desktop 1920px)

---

## Next Steps

1. Read this document to understand Epic 2 test scope
2. Create page object helpers in `e2e/fixtures/epic-2-page.ts`
3. Implement test specs for journey 1 (toggle), journey 2 (delete), journey 3 (errors)
4. Execute tests and document results
5. Provide test report with pass/fail breakdown and any issues discovered

---

**Prepared by:** Story Creation Workflow  
**For:** QA Agent (bmad-qa-generate-e2e-tests)  
**Ready for:** E2E Automation Implementation
