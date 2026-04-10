# Story 4.2: Screen Reader Support & ARIA

Status: done

<!-- Note: Validation is optional. Run validate-create-story for quality check before dev-story. -->

## Story

As a user who relies on a screen reader,
I want all content and state changes announced properly,
so that I can use the app with full context and confidence.

## Acceptance Criteria

1. **Semantic structure**  
   **Given** the app is loaded  
   **When** the document is traversed  
   **Then** structure matches: `<form>` for add flow, list as `<ul>` with `<li>` per item, clickable controls as `<button>`, text field as `<input>` (or equivalent native semantics).

2. **Add button (icon-only)**  
   **Given** the add control is icon-only  
   **Then** it exposes `aria-label="Add task"` (or equivalent consistent copy).

3. **Delete button (icon-only)**  
   **Given** each todo’s delete control  
   **Then** `aria-label` includes task text, e.g. `Delete [task text]` (truncate safely if very long).

4. **Checkbox labels**  
   **Given** an active todo’s checkbox  
   **Then** accessible name reflects “Mark [task] as complete”.  
   **Given** a completed todo  
   **Then** “Mark [task] as active” (or equivalent).

5. **Due date control**  
   **Given** due date trigger on a card  
   **Then** label distinguishes no date vs existing date: “Set due date for [task]” / “Change due date for [task]”.

6. **Filter tabs**  
   **Given** filter region  
   **Then** container is announced as tablist (already `role="tablist"`).  
   **And** each tab exposes selected state via `aria-selected` (present today — verify).

7. **Filter change announcement**  
   **Given** filter changes  
   **When** the list updates  
   **Then** an `aria-live="polite"` region announces `[N] tasks shown` (partially implemented via `filterAnnouncement` in `app.tsx` — verify text and timing).

8. **Task created**  
   **Given** create succeeds  
   **When** the new item appears  
   **Then** `aria-live="polite"` announces **“Task added”** (or equivalent; currently **not** in codebase — add).

9. **Errors**  
   **Given** an error banner appears  
   **Then** it uses `role="alert"` and `aria-live="assertive"` (verify `error-banner.tsx`).

10. **Sort toolbar**  
    **Given** SortRow  
    **Then** toolbar `aria-label="Sort options"` and sort buttons `aria-pressed` true/false (verify against spec).

11. **Tests**  
    **Given** ARIA work is complete  
    **When** tests run  
    **Then** assertions cover: icon-only labels, tab `aria-selected`, sort `aria-pressed`, live regions for filter + create, alert on error banner.

## Tasks / Subtasks

- [x] Task 1: Audit `AddInput` + `TodoCard` labels (AC: #2–#5)  
  - [x] Align add, delete, checkbox, and due-date trigger strings with AC wording.  
  - [x] Ensure truncated visible text does not break screen reader names (use full description in `aria-label` where needed).

- [x] Task 2: List semantics (AC: #1)  
  - [x] Confirm `TodoList` renders `<ul id="todo-list">` (or id matching `aria-controls`) and `<li>` per row.  
  - [x] Confirm add section uses `<form>` if required; wire `onSubmit` + Enter.

- [x] Task 3: Live region — task added (AC: #8)  
  - [x] Add dedicated polite live text state in `app.tsx` (or `AddInput` callback) set on successful create; clear after announcement if needed to allow repeats.

- [x] Task 4: Verify filter live region (AC: #7)  
  - [x] Confirm `filterAnnouncement` content and that it updates only on filter change, not first mount noise.

- [x] Task 5: Error + sort ARIA audit (AC: #9, #10)  
  - [x] Snapshot `error-banner.tsx`, `sort-row.tsx`, `filter-tabs.tsx` vs AC.

- [x] Task 6: Tests (AC: #11)  
  - [x] Unit/integration tests for labels and live regions.  
  - [x] e2e with accessibility assertions (12 tests).

### Review Findings

- [x] [Review][Patch] Repeated creates can skip "Task added" live announcement when the same message is already present [`packages/frontend/src/app.tsx:174`]
- [x] [Review][Patch] Checkbox e2e locators use broad `aria-label*` matching that can select the wrong task and break on special characters [`e2e/story-2.1-toggle-todo-completion.spec.ts:11`]
- [x] [Review][Patch] AC #3 long-label handling is incomplete: delete control does not safely truncate very long task text in accessible name [`packages/frontend/src/components/todo-card.tsx:149`]
- [x] [Review][Patch] Story 4.2 e2e sort coverage checks only one `aria-pressed` true state and misses true/false transition behavior across sort buttons [`e2e/story-4.2-screen-reader-aria.spec.ts:84`]

## Dev Notes

### Scope boundaries

- **No** keyboard roving implementation (Story 4.1) except where labels must match activated control.  
- **No** new color contrast or touch-target work (Story 4.3).  
- **No** animation token audit (Story 4.4).

### Critical: What already exists

- **`app.tsx`**: `aria-live="polite"` + `filterAnnouncement` for filter counts.  
- **`error-banner.tsx`**: `role="alert"`, `aria-live="assertive"`.  
- **`empty-state.tsx`**: polite live region.  
- **`filter-tabs`**: `role="tablist"`, `role="tab"`, `aria-selected`, `aria-label` with counts.  
- **`sort-row`**: toolbar + `aria-pressed`.  
- **Gap:** explicit **“Task added”** announcement not found in frontend grep — implement for AC #8.

### File structure (expected)

| Path | Action |
|------|--------|
| `packages/frontend/src/components/add-input.tsx` | Form semantics, add `aria-label` |
| `packages/frontend/src/components/todo-card.tsx` | Delete/checkbox/due labels |
| `packages/frontend/src/components/todo-list.tsx` | `ul`/`li`, id for `aria-controls` |
| `packages/frontend/src/app.tsx` | Live region for “Task added” |
| `packages/frontend/src/components/error-banner.tsx` | Verify only |
| `*.test.tsx` | New assertions |

### Testing requirements

- RTL: `getByRole` with `name:` options for accessible names.  
- Live regions: assert text content after actions (may need `waitFor`).

### Previous story intelligence

**From Story 4.1 (when done):** Tab order and roving tabindex must stay consistent with `aria-selected` updates on filter change.

**From Story 3.3:** Sort buttons use dynamic visible text (↑/↓/↕); ensure `aria-label` or visible name is still comprehensible (optional short static `aria-label` + `aria-pressed`).

### Architecture compliance

- FR22 — screen reader markup; architecture maps FR21–25 to all components.  
- [Source: `_bmad-output/planning-artifacts/architecture.md`]

### References

- [Source: `_bmad-output/planning-artifacts/epics.md` — Epic 4, Story 4.2]  
- [Source: `_bmad-output/planning-artifacts/ux-design-specification.md` — accessibility / motion sections if needed]  
- [Source: `packages/frontend/src/app.tsx` — `filterAnnouncement`]

## Dev Agent Record

### Agent Model Used

Claude claude-4.6-opus-high

### Debug Log References

- Verified all ARIA attributes via Chrome DevTools MCP accessibility snapshot
- Confirmed checkbox label changes dynamically: "Mark X as complete" → "Mark X as active"
- Confirmed "Task added" polite live region appears after successful create

### Completion Notes List

- **Task 1 (AC #2–#5):** Updated checkbox `aria-label` from "Toggle completion for: X" to "Mark X as complete" / "Mark X as active" per AC #4. Add button already had "Add task" (AC #2). Delete button already had "Delete: X" (AC #3). Due date triggers already had "Set due date for X" / "Change due date for X" (AC #5). Changed checkmark SVG from `aria-label="Completed"` to `aria-hidden="true"` to avoid redundant announcement.
- **Task 2 (AC #1):** Verified existing structure: `<form>` wraps AddInput, `<ul>` with `<li>` per todo, all controls are `<button>`, text field is `<input>`. No changes needed.
- **Task 3 (AC #8):** Added `createAnnouncement` state in `app.tsx` with `aria-live="polite"` region. Set to "Task added" on successful create, cleared after 1s to allow repeat announcements.
- **Task 4 (AC #7):** Verified existing `filterAnnouncement` correctly announces "[N] tasks shown" only on filter change, skips initial mount.
- **Task 5 (AC #9, #10):** Verified `error-banner.tsx` has `role="alert"` + `aria-live="assertive"`. Verified `sort-row.tsx` has `role="toolbar"` + `aria-label="Sort options"` + `aria-pressed`. Verified `filter-tabs.tsx` has `role="tablist"` + `role="tab"` + `aria-selected` + `aria-controls`.
- **Task 6 (AC #11):** Added 11 new unit/integration tests and 12 new e2e tests covering all ARIA requirements. Updated 5 existing e2e test files to use new checkbox label pattern.

### Change Log

- 2026-04-10: Implemented Story 4.2 — Screen Reader Support & ARIA. Updated checkbox labels to match AC wording, added "Task added" live region, added data-testid attributes for live regions, added comprehensive unit and e2e test coverage.

### File List

- `packages/frontend/src/app.tsx` — Added createAnnouncement state, live region, data-testid on live regions
- `packages/frontend/src/components/todo-card.tsx` — Updated checkbox aria-label, changed checkmark SVG to aria-hidden
- `packages/frontend/src/app.test.tsx` — Added 7 ARIA tests, updated checkbox label references
- `packages/frontend/src/components/todo-card.test.tsx` — Added 6 ARIA tests, updated checkbox label test
- `e2e/story-4.2-screen-reader-aria.spec.ts` — New: 12 e2e accessibility tests
- `e2e/story-2.1-toggle-todo-completion.spec.ts` — Updated checkbox locator for new label
- `e2e/story-2.3-error-banner.spec.ts` — Updated checkbox locator for new label
- `e2e/story-3.2-filter-todos-by-status.spec.ts` — Updated checkbox locator and filter live region locator
- `e2e/story-3.3-sort-todos.spec.ts` — Updated checkbox locator and description parser for new label
- `e2e/story-4.1-keyboard-navigation.spec.ts` — Updated checkbox locator for new label
- `_bmad-output/implementation-artifacts/sprint-status.yaml` — Status: in-progress → review
- `_bmad-output/implementation-artifacts/4-2-screen-reader-support-and-aria.md` — Story file updates
