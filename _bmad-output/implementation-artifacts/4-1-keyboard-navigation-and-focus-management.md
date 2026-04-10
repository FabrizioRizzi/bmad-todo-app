# Story 4.1: Keyboard Navigation & Focus Management

Status: done

<!-- Note: Validation is optional. Run validate-create-story for quality check before dev-story. -->

## Story

As a user who navigates with a keyboard,
I want to perform all actions without a mouse,
so that the app is fully usable with keyboard alone.

## Acceptance Criteria

1. **Tab order (desktop)**  
   **Given** the app is loaded on desktop  
   **When** Tab is pressed repeatedly  
   **Then** focus moves: text input → calendar (due date) trigger → add (+) button → filter tabs (All / Active / Completed) → sort toolbar controls → **Reset sort** button when visible → each todo row in order (per-item: checkbox → due date control → delete).  
   **And** Shift+Tab reverses the order.

2. **Focus-visible ring (keyboard only)**  
   **Given** any interactive element receives focus via keyboard (`:focus-visible`)  
   **Then** a 2px terracotta outline with subtle glow appears (use `--border-focus` / ring token alignment).  
   **And** the ring uses `outline` (not `border`) to avoid layout shift.  
   **Given** focus from mouse click  
   **Then** no focus ring (`:focus-visible` only, not plain `:focus`).

3. **Form submit**  
   **Given** the text input is focused  
   **When** Enter is pressed  
   **Then** the form submits (create todo) per existing `AddInput` behavior.

4. **Checkbox**  
   **Given** a todo checkbox is focused  
   **When** Space is pressed  
   **Then** completion toggles.

5. **Delete**  
   **Given** a delete control is focused  
   **When** Enter or Space is pressed  
   **Then** delete runs (undo toast path unchanged).

6. **Filter tabs — arrow keys**  
   **Given** a filter tab has focus  
   **When** Left/Right arrows are pressed  
   **Then** focus moves between tabs (roving tabindex or equivalent).  
   **And** Enter or Space activates the focused tab (`onFilterChange`).

7. **Sort toolbar — arrow keys**  
   **Given** the sort toolbar has focus (container or a sort button)  
   **When** Left/Right arrows are pressed  
   **Then** focus moves between visible sort buttons (Due; Status when filter is All).  
   **And** Enter or Space activates the focused option.

8. **Focus after delete**  
   **Given** a todo is deleted  
   **When** the card leaves the list  
   **Then** focus moves to the next item’s checkbox (or logical successor if list semantics differ).  
   **And** if the deleted item was last and the list is empty, focus moves to the add input.

9. **Focus after toggle**  
   **Given** completion is toggled  
   **When** the transition completes  
   **Then** focus stays on the same checkbox.

10. **Undo toast — Escape**  
    **Given** the undo toast is visible  
    **When** Escape is pressed  
    **Then** the toast dismisses and deferred delete behavior matches `useDeleteTodo` / `dismissToast` (API fires if undo window expired per existing rules).

11. **Tests**  
    **Given** keyboard behavior is implemented  
    **When** tests run  
    **Then** coverage includes: tab order (including Reset sort when shown), focus ring only on keyboard focus, arrow navigation in tablist and sort toolbar, focus after delete / empty list, Escape on toast.

## Tasks / Subtasks

- [x] Task 1: Audit current tab order and fix DOM/focus order (AC: #1)  
  - [x] Ensure `FilterTabs` supports tabbing into each `role="tab"` in visual order.  
  - [x] Ensure `SortRow` buttons and optional Reset sort in `app.tsx` participate in order after filters.  
  - [x] Confirm `TodoList` / `TodoCard` order: checkbox → due → delete.

- [x] Task 2: Global `:focus-visible` styling (AC: #2)  
  - [x] Add or extend rules in `packages/frontend/src/styles/globals.css` using `outline` + `--border-focus`; avoid layout shift.  
  - [x] Verify mouse click does not show ring where `:focus-visible` applies.

- [x] Task 3: Roving tabindex + keyboard activation — `FilterTabs` (AC: #6)  
  - [x] Implement roving `tabIndex` (only selected or first tab tabbable, or full roving pattern).  
  - [x] `onKeyDown`: ArrowLeft/ArrowRight move focus; Home/End optional.  
  - [x] Enter/Space activate tab.

- [x] Task 4: Roving tabindex + keyboard activation — `SortRow` (AC: #7)  
  - [x] Same pattern for Due / Status buttons inside `role="toolbar"`.  
  - [x] Respect hidden Status when filter ≠ `all`.

- [x] Task 5: Focus management — delete & empty list (AC: #8)  
  - [x] Coordinate with `useDeleteTodo` / `TodoList`: after remove, `focus()` next checkbox or input ref.  
  - [x] Use refs or callback from list to avoid breaking FLIP / exit animations.

- [x] Task 6: Toggle focus stability (AC: #9)  
  - [x] Confirm no `focus()` calls steal focus on toggle; fix if any regression.

- [x] Task 7: Undo toast Escape (AC: #10)  
  - [x] Wire `keydown` listener (capture or component-level) when toast visible; call `onDismiss` / existing dismiss path.

- [x] Task 8: Tests (AC: #11)  
  - [x] Extend RTL/`userEvent` tests in `filter-tabs.test.tsx`, `sort-row.test.tsx`, `app.test.tsx`, `undo-toast.test.tsx`, and/or new focused spec.  
  - [x] Add e2e coverage in `e2e/` if needed for full tab chain.

## Dev Notes

### Scope boundaries

- **No** wholesale ARIA copy rewrites beyond what keyboard behavior requires (Story 4.2 owns labels, live regions, semantic audits).  
- **No** responsive breakpoint behavior (Story 4.3).  
- **No** animation timing inventory beyond what interacts with focus (Story 4.4).

### Critical: What already exists

- **`filter-tabs.tsx`**: `role="tablist"` / `role="tab"` / `aria-selected` / `aria-controls="todo-list"` — click-only today; arrow roving not implemented.  
- **`sort-row.tsx`**: `role="toolbar"`, `aria-label="Sort options"`, `aria-pressed` — no arrow navigation.  
- **`app.tsx`**: `UndoToast`, `filterAnnouncement` live region (polite), layout order for Reset sort.  
- **`AddInput`**: refocuses input after success/error; calendar + add button order must match AC #1.  
- **Epics 2–3** explicitly deferred arrow keys and Escape toast to this story.

### File structure (expected)

| Path | Action |
|------|--------|
| `packages/frontend/src/components/filter-tabs.tsx` | Roving tabindex + key handlers |
| `packages/frontend/src/components/sort-row.tsx` | Toolbar keyboard navigation |
| `packages/frontend/src/components/todo-list.tsx` / `todo-card.tsx` | Post-delete focus targets |
| `packages/frontend/src/components/undo-toast.tsx` or `app.tsx` | Escape handling |
| `packages/frontend/src/styles/globals.css` | `:focus-visible` ring |
| `e2e/*.spec.ts` | Optional e2e for tab order |

### Testing requirements

- Vitest + Testing Library: simulate Tab, Shift+Tab, ArrowLeft/Right, Enter, Space, Escape.  
- Prefer `userEvent.setup()` and `await user.keyboard(...)`.  
- `pnpm --filter frontend test`, `pnpm lint`, `pnpm build` must pass.

### Previous story intelligence

**From Story 3.3 (Sort Todos):** Sort row sits between `FilterTabs` and list; FLIP reorder and `sortLayoutKey` — programmatic focus must not fight animation frames; consider `requestAnimationFrame` after DOM update.

**From Stories 2.2 / 2.3:** Undo toast and error banner coexist; Escape on toast must not break error dismissal patterns.

### Architecture compliance

- FR21, FR23 — keyboard-only and focus management.  
- [Source: `_bmad-output/planning-artifacts/architecture.md` — FR21–25 mapping to all components; WCAG keyboard nav.]  
- Radix primitives: preserve built-in behavior where used (e.g. Popover); do not strip focus traps incorrectly.

### Git intelligence

- Recent work: sorting (`sort-row`, `app.tsx`, `todo-list` FLIP), filtering, due dates — touch the same files; keep changes cohesive and regression-test filter + sort + delete together.

### References

- [Source: `_bmad-output/planning-artifacts/epics.md` — Epic 4, Story 4.1]  
- [Source: `_bmad-output/planning-artifacts/architecture.md` — Accessibility / NFR WCAG 2.1 AA]  
- [Source: `packages/frontend/src/components/filter-tabs.tsx`]  
- [Source: `packages/frontend/src/components/sort-row.tsx`]

## Dev Agent Record

### Agent Model Used

Cursor agent (Claude)

### Debug Log References

- Playwright e2e initially failed in sandbox (browser launch); passed with full permissions. Tab-order spec tightened: calendar trigger locator uses exact name `Set due date` to avoid matching sort “due date” control.

### Completion Notes List

- **FilterTabs:** Roving `tabIndex` (one tab stop), ArrowLeft/Right/Home/End, Enter/Space to activate; sync focus index when `activeFilter` changes from parent.
- **SortRow:** Roving focus between Due and (when visible) Status; arrows and Home/End; Enter/Space calls `onSortChange`; click updates focus index.
- **globals.css:** Removed universal `outline-ring/50` on `*`; added `:focus` outline reset and `:focus-visible` 2px `var(--border-focus)` outline + soft glow (no border/layout shift).
- **AddInput:** `forwardRef` + merged ref so `App` can focus the add field after last todo is deleted.
- **App:** `requestDeleteWithFocusRestore` + `useLayoutEffect` on `todos`: after removed id leaves cache, `requestAnimationFrame` focuses next row’s checkbox or add input; `useDeleteTodo.requestDelete` returns `false` when todo missing so pending focus ref is cleared.
- **UndoToast:** Document `keydown` capture for Escape → clear timers and `onDismiss` (same path as manual dismiss).
- **Tests:** RTL updates in filter-tabs, sort-row, undo-toast, app (empty-after-delete, Tab to Reset sort), todo-card (delete Enter/Space); e2e `story-4.1-keyboard-navigation.spec.ts` for tab chain, tabs arrows, Escape toast, delete focus, Space on checkbox.

### File List

- `packages/frontend/src/components/filter-tabs.tsx`
- `packages/frontend/src/components/sort-row.tsx`
- `packages/frontend/src/components/add-input.tsx`
- `packages/frontend/src/app.tsx`
- `packages/frontend/src/hooks/use-todos.ts`
- `packages/frontend/src/components/undo-toast.tsx`
- `packages/frontend/src/styles/globals.css`
- `packages/frontend/src/components/filter-tabs.test.tsx`
- `packages/frontend/src/components/sort-row.test.tsx`
- `packages/frontend/src/components/undo-toast.test.tsx`
- `packages/frontend/src/app.test.tsx`
- `packages/frontend/src/components/todo-card.test.tsx`
- `e2e/story-4.1-keyboard-navigation.spec.ts`
- `_bmad-output/implementation-artifacts/sprint-status.yaml`
- `_bmad-output/implementation-artifacts/4-1-keyboard-navigation-and-focus-management.md`

## Change Log

- **2026-04-10:** Story 4.1 implemented — keyboard nav, focus-visible ring, delete/empty focus, undo Escape, RTL + Playwright coverage; status → review.
- **2026-04-10:** Code review — removed e2e fixed wait; story marked done.

### Review Findings

- [x] [Review][Patch] Replace fixed `waitForTimeout(350)` in Playwright delete-focus test with a condition tied to focus or network idle [`e2e/story-4.1-keyboard-navigation.spec.ts` ~85] — fixed: removed sleep; `toBeFocused` retries until focus settles (timeout 5s)
- [x] [Review][Defer] Post-delete focus restore uses `document.querySelector` on `li[data-todo-id]` — couples `App` to list item markup; consider a list-level focus API later [`packages/frontend/src/app.tsx` ~158] — deferred, pre-existing acceptable tradeoff for this story
- [x] [Review][Defer] Undo toast registers `keydown` on `document` in capture phase — if toast and another overlay (e.g. due date popover) are both open, Escape may hit the toast handler first; rare overlap [`packages/frontend/src/components/undo-toast.tsx` ~56] — deferred, revisit with stacking policy if reported
