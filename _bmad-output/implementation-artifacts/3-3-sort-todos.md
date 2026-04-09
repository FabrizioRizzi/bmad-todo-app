# Story 3.3: Sort Todos

Status: done

## Story

As a user,
I want to sort my todos by due date or completion status,
So that I can prioritize what needs attention first.

## Acceptance Criteria

1. **SortRow renders with sort options**
   **Given** the app is loaded with todos
   **When** the SortRow component renders
   **Then** it appears below the filter tabs with a subtle background strip
   **And** it shows "Sort by" label in uppercase small secondary text
   **And** the **Due** control is always visible; its visible label reflects state: **"Due ↑"** when due sort is active and ascending (default — soonest due first), **"Due ↓"** when due sort is active and descending (latest due first among items that have a due date), **"Due ↕"** when status sort is active (due is inactive)
   **And** when the filter is **All**, **Status** is shown with a vertical divider between Due and Status: **"Status ↕"** when inactive, **"Status ↑"** when status sort is active and active-first, **"Status ↓"** when status sort is active and completed-first
   **And** the default sort is **due ascending** (**"Due ↑"** highlighted)
   **And** when sort is non-default (status sort active, or due descending), a **"Reset sort"** action is available that restores due ascending and status active-first

2. **Sort by due date (ascending, default)**
   **Given** the due sort is active and ascending (**"Due ↑"**)
   **When** todos are displayed
   **Then** todos are sorted by due date, soonest first
   **And** todos without a due date appear last in the list

3. **Sort by due date (descending)**
   **Given** the due sort is active and descending (**"Due ↓"**)
   **When** todos are displayed
   **Then** among todos that have a due date, order is latest due first
   **And** todos without a due date still appear last in the list

4. **Due sort direction toggle**
   **Given** the due sort is active
   **When** I click the Due control again
   **Then** ascending and descending due order alternate (labels switch between **"Due ↑"** and **"Due ↓"**)

5. **Sort by status (active first)**
   **Given** due or status sort may be active
   **When** I activate status sort from inactive (click **"Status ↕"** while on due sort)
   **Then** **"Status ↑"** is shown as the active sort (highlighted styling) and active-first ordering applies
   **And** the list reorders with smooth animation (250ms ease-out): active items group first, completed items group below

6. **Sort by status toggle**
   **Given** status sort is active (**"Status ↑"** or **"Status ↓"**)
   **When** I click the Status control again
   **Then** the order toggles: **"Status ↓"** (completed first) vs **"Status ↑"** (active first)

7. **Status sort hidden when filtered**
   **Given** the filter is set to "Active" or "Completed"
   **When** the SortRow renders
   **Then** the Status control is hidden (only Due is shown — status sort is redundant when already filtered)

8. **Status sort visible when All filter**
   **Given** the filter is set to "All"
   **When** the SortRow renders
   **Then** both Due and Status controls are shown (with the vertical divider between them)

9. **ARIA toolbar semantics**
   **Given** the SortRow component
   **When** rendered
   **Then** the container has `role="toolbar"` with `aria-label="Sort options"`
   **And** each sort button has `role="button"` with `aria-pressed="true/false"`

10. **Client-side sorting**
   **Given** the sort state
   **When** sorting is applied client-side
   **Then** the sort state is managed via React `useState` in the app component — no API calls for sorting

11. **Tests**
   **Given** the sort functionality
   **When** tests are run
   **Then** co-located tests verify: sort row renders, active sort styling, due date sort order (nulls last, ascending default), due direction toggle, status sort toggle, status sort hidden when filtered, filter resets sort to due when applicable; e2e covers toolbar, order, and filter interaction as needed

## Tasks / Subtasks

- [x] Task 1: Create SortRow component (AC: #1, #7, #8, #9)
  - [x] Create `packages/frontend/src/components/sort-row.tsx`
  - [x] Props: `activeSort`, `dueDirection` (`'ascending' | 'descending'`), `statusDirection`, `onSortChange`, `filter`
  - [x] Layout: flex row with subtle background strip (`--surface` or slightly different from page bg)
  - [x] "Sort by" label: uppercase, `--text-xs` (12px), `--text-secondary`, medium weight
  - [x] Due control: always visible; labels **Due ↑** / **Due ↓** when due active (asc/desc), **Due ↕** when status active; highlighted when due sort active
  - [x] Status control: labels **Status ↕** / **Status ↑** / **Status ↓** per state; hidden when `filter !== 'all'`, highlighted when status sort active
  - [x] Vertical divider between options (1px `--border` color, only when both visible)
  - [x] Container: `role="toolbar"`, `aria-label="Sort options"`
  - [x] Each button: `aria-pressed="true/false"`

- [x] Task 2: Add sort logic functions (AC: #2, #3, #5, #6)
  - [x] Add to `packages/frontend/src/lib/utils.ts`:
    - `sortByDueDate(todos, direction?: 'ascending' | 'descending')` — ascending: soonest first; descending: latest first among dated items; `null` due dates always last; stable within ties
    - `sortByStatus(todos: Todo[], direction: 'active-first' | 'completed-first'): Todo[]` — groups by `isCompleted`, direction controls which group comes first. Within each group, preserve existing order.
  - [x] Add unit tests in `packages/frontend/src/lib/utils.test.ts`

- [x] Task 3: Add sort state to App component (AC: #1, #4, #7, #10)
  - [x] In `packages/frontend/src/app.tsx`:
    - Add `sort`, `statusDirection`, `dueDirection` state (`useState`)
    - Handle sort change: clicking Due when already on due toggles `dueDirection`; switching to Status resets to active-first; repeated Status clicks toggle status direction
    - Optional **Reset sort** when state is non-default (status active or due descending)
    - When filter changes to 'active' or 'completed', auto-reset sort to due ascending (status sort is hidden)
    - Apply sort AFTER filter: `filteredTodos → sortedTodos → pass to TodoList`
    - Pass sort state and handler to SortRow

- [x] Task 4: Integrate SortRow into layout (AC: #1)
  - [x] Position SortRow between FilterTabs and the todo list in `app.tsx`
  - [x] Subtle background strip: use `--surface` bg or a slightly tinted background to visually separate from filter tabs
  - [x] Appropriate spacing: `--space-2` padding vertical, `--space-4` padding horizontal

- [x] Task 5: Sort transition animations (AC: #5)
  - [x] When sort changes, list items should animate to new positions (250ms ease-out)
  - [x] Use `key` prop on TodoCard items to help React identify moved items
  - [x] CSS approach: add `transition: transform var(--duration-smooth) ease-out` to todo cards for position changes
  - [x] Respect `prefers-reduced-motion` — instant reorder when active

- [x] Task 6: Frontend tests (AC: #11)
  - [x] Create `packages/frontend/src/components/sort-row.test.tsx`:
    - Renders "Sort by" label and sort options
    - Active sort has `aria-pressed="true"`, inactive has `"false"`
    - Click fires `onSortChange` with correct value
    - "Status ↕" hidden when filter is 'active' or 'completed'
    - Both options visible when filter is 'all'
    - `role="toolbar"` on container, `aria-label="Sort options"`
  - [x] Update `packages/frontend/src/lib/utils.test.ts`:
    - `sortByDueDate`: soonest first, nulls last, stable sort
    - `sortByStatus`: active-first groups correctly, completed-first groups correctly, stable within groups
  - [x] Update `packages/frontend/src/app.test.tsx`:
    - Sort state changes update todo order
    - Filter change resets sort to 'due' when applicable

- [x] Task 7: Quality gates
  - [x] `pnpm --filter frontend test` — all tests pass
  - [x] `pnpm lint` — zero errors
  - [x] `pnpm build` — both packages build successfully

## Dev Notes

### Scope boundaries (do not implement here)

- **No** keyboard arrow navigation within toolbar (Epic 4, Story 4.1 — Left/Right arrow keys)
- **No** API or schema changes for sorting — sorting is entirely client-side
- **No** URL persistence of sort state
- **No** sort by creation date (not in requirements — creation date is stored but not exposed as a sort option)

### Critical: What already exists (DO NOT recreate)

- **`app.tsx`** — owns layout, data fetching, and (after Story 3.2) filter state. Sort state lives here alongside filter.
- **`TodoList`** — receives sorted/filtered `todos` array. No sort logic inside TodoList.
- **Design tokens** — `--text-xs`, `--text-secondary`, `--text-primary`, `--surface`, `--border`, `--duration-smooth` (250ms) already defined in `globals.css`.
- **`utils.ts`** — already has `cn()` helper. After Story 3.1, will also have `formatDueDate` and `isOverdue`. Sort functions go here.
- **`Todo` type** — includes `dueDate: string | null` and `isCompleted: boolean` — the two fields used for sorting.

### Sort algorithm details

**Due date sort (`sortByDueDate`):**
1. Ascending (default): todos with due dates sorted soonest first; descending: latest due first among dated items
2. Todos without due dates (`dueDate === null`) always grouped at the end (both directions)
3. Within same-date group or null group, preserve original order (stable sort)
4. String comparison works for ISO dates: `"2026-04-01" < "2026-04-15"` is correct

**Status sort (`sortByStatus`):**
1. `active-first`: `!isCompleted` items first, then `isCompleted` items
2. `completed-first`: `isCompleted` items first, then `!isCompleted` items
3. Within each group, preserve original order (stable sort)
4. Toggle: clicking Status when already active flips direction (**Status ↑** ↔ **Status ↓**)

**Sort + Filter interaction:**
- Sort applies AFTER filter: `allTodos → filter → sort → render`
- When filter is "Active" or "Completed", status sort is hidden and sort auto-resets to "due"
- When filter returns to "All", status sort option reappears, sort remains "due" (user must explicitly choose status)

### Component design: SortRow

```
┌──────────────────────────────────────────────────┐
│ SORT BY    Due ↑  │  Status ↕    [Reset sort]   │
└──────────────────────────────────────────────────┘
         subtle background strip (Reset when non-default)
```

- Flex row, items centered vertically
- "SORT BY" label: uppercase, `--text-xs`, `--text-secondary`, `font-weight: 500`
- Sort buttons: `--text-sm` (14px), padding for touch targets
- Active button: `--text-primary`, `font-weight: 600`, subtle `--surface` background
- Inactive button: `--text-secondary`, `font-weight: 400`
- Vertical divider: 1px wide, `--border` color, height ~16px
- Background strip: slightly different from page bg (e.g., `--surface` with reduced opacity or a very subtle tint)

### UX references

- **SortRow:** UX-DR5 — "Sort by" label + Due/Status controls (dynamic ↑/↓/↕ labels), vertical divider when both visible, subtle background strip, `role="toolbar"`, `aria-pressed`; optional reset when sort is non-default
- **Sort animation:** UX-DR10 — list reorder/sort: position 250ms ease-out
- **Status sort visibility:** UX-DR5 — hidden when filter is Active or Completed
- **Reduced motion:** UX-DR11 — all durations → 0ms

### File structure (expected new/changed)

| Path | Action |
|------|--------|
| `packages/frontend/src/components/sort-row.tsx` | New — SortRow component |
| `packages/frontend/src/components/sort-row.test.tsx` | New — SortRow tests |
| `packages/frontend/src/lib/utils.ts` | Modify — add `sortByDueDate`, `sortByStatus` |
| `packages/frontend/src/lib/utils.test.ts` | Modify — add sort function tests |
| `packages/frontend/src/app.tsx` | Modify — add sort state, SortRow, apply sort to filtered todos |
| `packages/frontend/src/app.test.tsx` | Modify — add sort integration tests |
| `packages/frontend/src/styles/globals.css` | Modify — add sort row styling if needed |
| `packages/backend/src/scripts/seed-demo-todos.ts` | Optional — dev-only demo seed (`pnpm --filter backend db:seed:demo`) |
| `packages/backend/package.json` | Optional — script entry for demo seed |

### Testing requirements

**Frontend (Vitest + RTL):**
- `sort-row.test.tsx`: renders label and options, active sort styling, click handler, status hidden when filtered, ARIA attributes (`role="toolbar"`, `aria-label`, `aria-pressed`)
- `utils.test.ts`: `sortByDueDate` (ascending soonest first, descending latest first among dated, nulls last, stable), `sortByStatus` (active-first, completed-first, stable within groups)
- `app.test.tsx`: sort state changes, due-direction toggle, reset sort, filter-sort interaction (reset to due ascending when filtered), sorted todos passed to list

### Previous story intelligence

**From Story 3.1 (Due Date Support):**
- `dueDate` field available on all todos — drives due-date sort
- `formatDueDate` and `isOverdue` utilities in `utils.ts` — sort functions go in the same file
- Date comparison: ISO date strings compare correctly with `<` / `>` operators

**From Story 3.2 (Filter Todos):**
- Filter state (`filter`, `setFilter`) already in `app.tsx`
- Filtered todos computed before passing to TodoList
- Sort applies AFTER filter in the pipeline: `allTodos → filter → sort → render`
- FilterTabs component positioned above SortRow in layout
- When filter changes to active/completed, sort must reset to 'due'

**From Story 2.1 (Toggle Todo Completion):**
- `isCompleted` field drives status sort grouping
- CSS transitions on cards already use `--duration-normal` — sort reorder uses `--duration-smooth` (250ms)

### Git intelligence

- After Stories 3.1 and 3.2, `app.tsx` will have filter state and filtered todo computation
- Sort state adds alongside filter state in the same component
- `utils.ts` will have date utilities from 3.1 — sort functions extend the same file

### Architecture compliance

- Client-side sorting only — no API changes for sort behavior
- Optional **dev-only** backend script to seed demo todos (`db:seed:demo`) does not affect product APIs or sort semantics
- `useState` for sort state in `app.tsx`
- CSS variable tokens for all visual properties
- Co-located tests
- kebab-case files, PascalCase components
- Stable sort preserves user's mental model of list order within groups

### Dependencies

- **Depends on:** Story 3.1 (due dates must exist for due-date sort to be meaningful) and Story 3.2 (filter state and FilterTabs must exist for sort-filter interaction)
- **No new npm dependencies** required for the sort feature
- **Backend:** no product/API changes; optional dev seed script only

## Dev Agent Record

### Agent Model Used

Composer (Cursor agent)

### Implementation Plan

- Added `sortByDueDate` / `sortByStatus` in `utils.ts` with stable ordering via `Array.prototype.sort` on copies.
- `App` computes `filteredTodos` with exported `todoMatchesFilter`, then `sortedMatchingTodos`, passes `orderedMatchingTodos` into `TodoList`.
- `TodoList` merges sorted matching rows with filter-exit-only rows; FLIP animation runs on `.todo-sort-flip-target` inside each card (transform-only) so filter height/opacity transitions on `li` stay intact; `matchMedia` guarded for jsdom.
- `SortRow` below `FilterTabs` with toolbar ARIA and conditional Status control.

### Completion Notes List

- Story 3.3 implemented: SortRow UI, client-side sort pipeline, status toggle, filter reset to due, FLIP reorder with reduced-motion skip, Vitest coverage for row/utils/app.
- **Due sort direction:** Second click on Due toggles ascending (soonest first, **Due ↑**) vs descending (**Due ↓**); inactive Due shows **Due ↕**. Status active shows **Status ↑** (active-first) or **Status ↓** (completed-first); inactive **Status ↕**.
- **Reset sort:** When sort is non-default, UI offers reset to default due ascending (not a filter “show all” action).
- **TodoList:** `sortLayoutKey` limits FLIP to sort changes; filter changes skip sort FLIP briefly (`FILTER_FLIP_SUPPRESS_MS`) so tab switches do not fight filter height animations. Strict-mode-safe status toggle via ref where needed.
- **Delete animation:** CSS merges `li` motion transition with delete-exit so transform eases correctly.

### File List

- `packages/frontend/src/components/sort-row.tsx` (new)
- `packages/frontend/src/components/sort-row.test.tsx` (new)
- `packages/frontend/src/lib/utils.ts`
- `packages/frontend/src/lib/utils.test.ts`
- `packages/frontend/src/app.tsx`
- `packages/frontend/src/app.test.tsx`
- `packages/frontend/src/components/todo-list.tsx`
- `packages/frontend/src/components/todo-card.tsx`
- `packages/frontend/src/styles/globals.css`
- `packages/backend/src/scripts/seed-demo-todos.ts` (optional dev seed)
- `packages/backend/package.json` (demo seed script)
- `e2e/story-3.3-sort-todos.spec.ts`
- `_bmad-output/implementation-artifacts/sprint-status.yaml`
- `_bmad-output/implementation-artifacts/3-3-sort-todos.md`

### Review Findings

- [x] [Review][Decision] Default Due label, direction toggle, and Reset sort — **Resolved (2026-04-09):** Product choice **D1:1** — updated Acceptance Criteria, Tasks, Dev Notes, and UX references in this story to match shipped behavior (**Due ↑** default soonest-first, second click toggles **Due ↓**, **Due ↕** when status active, **Reset sort** when non-default; Status **↑/↓/↕** labels).

- [x] [Review][Decision] Demo seed vs backend scope — **Resolved (2026-04-09):** Product choice **D2:1** — story scope now allows optional **dev-only** `seed-demo-todos.ts` / `db:seed:demo`; clarified that there are no API or schema changes for sorting.

- [x] [Review][Defer] `sortByDueDate` relies on string `localeCompare` for any non-null `dueDate` — if malformed ISO strings were ever stored, ordering vs valid dates would be arbitrary. [packages/frontend/src/lib/utils.ts:77-84] — deferred, pre-existing assumption that API/data only yields valid ISO dates or null.

- [x] [Review][Defer] TodoList FLIP uses inline `transform`/`transition`, double `requestAnimationFrame`, and per-element `transitionend` handlers — works for the current card DOM but is sensitive to structural or animation changes. [packages/frontend/src/components/todo-list.tsx:127-220] — deferred, acceptable tradeoff for sort animation scope.

### Change Log

- 2026-04-09: Implemented sort row, sort utilities, app state + FLIP list animation, tests; sprint status → review.
- 2026-04-09: Due-direction toggle, reset-sort control, sortLayoutKey + filter FLIP suppression, delete/transition CSS tweaks; coordinated with Story 3.2 filter layout fix; sprint status → done.
- 2026-04-09: Code review — decisions **D1:1** (spec aligned to UI labels + reset + due toggle) and **D2:1** (dev seed allowed); AC/tasks/architecture text updated; story remains **done**.
