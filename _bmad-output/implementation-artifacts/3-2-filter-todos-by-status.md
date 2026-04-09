# Story 3.2: Filter Todos by Status

Status: review

## Story

As a user,
I want to filter my list to show all, only active, or only completed todos,
So that I can focus on what matters right now.

## Acceptance Criteria

1. **FilterTabs renders with three tabs**
   **Given** the app is loaded with a mix of active and completed todos
   **When** the FilterTabs component renders
   **Then** three equal-width tabs are displayed: "All", "Active", "Completed"
   **And** the "All" tab is active by default with a 2px terracotta underline
   **And** the tabs span the full width of the container

2. **Filter to Active**
   **Given** the "All" filter is active
   **When** I click the "Active" tab
   **Then** the underline animates to the "Active" tab position (200ms ease-out)
   **And** completed items animate out of the list (fade + height collapse, 250ms ease-out)
   **And** only active items remain visible

3. **Filter to Completed**
   **Given** the "All" filter is active
   **When** I click the "Completed" tab
   **Then** the underline animates to the "Completed" tab position
   **And** active items animate out of the list
   **And** only completed items remain visible

4. **Filter back to All**
   **Given** any filter is active
   **When** I click the "All" tab
   **Then** all items animate back into the list

5. **Empty state: no active todos**
   **Given** the "Active" filter is active
   **When** no active todos exist
   **Then** the filtered empty state appears: 🔍 icon, "No active tasks", "Add a task above to get started."

6. **Empty state: no completed todos**
   **Given** the "Completed" filter is active
   **When** no completed todos exist
   **Then** the filtered empty state appears: 🔍 icon, "No completed tasks", "Tasks you complete will appear here."

7. **ARIA tablist semantics**
   **Given** the FilterTabs component
   **When** rendered
   **Then** the container has `role="tablist"`
   **And** each tab has `role="tab"` with `aria-selected="true/false"` and `aria-controls="todo-list"`

8. **Client-side filtering**
   **Given** the filter state
   **When** filtering is applied client-side
   **Then** the filter state is managed via React `useState` in the app component — no API calls for filtering

9. **Tests**
   **Given** the filter functionality
   **When** tests are run
   **Then** co-located tests verify: tabs render, active tab styling, filter correctly shows/hides items, empty states display per filter

## Tasks / Subtasks

- [x] Task 1: Create FilterTabs component (AC: #1, #2, #3, #4, #7)
  - [x] Create `packages/frontend/src/components/filter-tabs.tsx`
  - [x] Props: `activeFilter: 'all' | 'active' | 'completed'`, `onFilterChange: (filter) => void`, `counts: { all: number, active: number, completed: number }`
  - [x] Render three equal-width buttons in a flex container with `role="tablist"`
  - [x] Each button: `role="tab"`, `aria-selected`, `aria-controls="todo-list"`
  - [x] Active tab: `--accent` text color + 2px `--accent` bottom border (underline)
  - [x] Inactive tab: `--text-secondary` color, hover → `--text-primary`
  - [x] Animate underline position between tabs using CSS `transform: translateX()` with `--duration-normal` (200ms) ease-out transition
  - [x] Tab labels: "All", "Active", "Completed"

- [x] Task 2: Update EmptyState for filtered variants (AC: #5, #6)
  - [x] Extend `packages/frontend/src/components/empty-state.tsx` to accept a `variant` prop: `'no-todos' | 'no-active' | 'no-completed' | 'load-error'`
  - [x] Variant content:
    - `no-todos`: ☑ icon, "No tasks yet", "Type above and press Enter (or tap +) to add your first task." (existing)
    - `no-active`: 🔍 icon, "No active tasks", "Add a task above to get started."
    - `no-completed`: 🔍 icon, "No completed tasks", "Tasks you complete will appear here."
    - `load-error`: ⚠ icon, "Couldn't load your tasks", "Check your connection and try again." (for future use)
  - [x] Container: `role="status"`, `aria-live="polite"`, centered with `--space-8` padding

- [x] Task 3: Add filter state to App component (AC: #8)
  - [x] In `packages/frontend/src/app.tsx`:
    - Add `const [filter, setFilter] = useState<'all' | 'active' | 'completed'>('all')`
    - Compute filtered todos: `all` → full list, `active` → `todos.filter(t => !t.isCompleted)`, `completed` → `todos.filter(t => t.isCompleted)`
    - Compute counts: `{ all: todos.length, active: activeCount, completed: completedCount }`
    - Pass `filter`, `onFilterChange`, and `counts` to `FilterTabs`
    - Pass filtered todos to `TodoList`
    - Add `aria-live="polite"` region that announces "[N] tasks shown" when filter changes

- [x] Task 4: Integrate FilterTabs into layout (AC: #1)
  - [x] Position FilterTabs between the AddInput section and the todo list in `app.tsx`
  - [x] Full-width within the container, with appropriate spacing (`--space-4` margin)

- [x] Task 5: Update TodoList for filtered empty states (AC: #5, #6)
  - [x] Pass `filter` prop to `TodoList` component
  - [x] When filtered list is empty, render the appropriate EmptyState variant based on current filter
  - [x] Add `id="todo-list"` to the list container (referenced by `aria-controls` on tabs)

- [x] Task 6: Filter transition animations (AC: #2, #3, #4)
  - [x] Add CSS classes in `packages/frontend/src/styles/globals.css` for filter exit animation:
    - `.todo-card-filter-exit`: opacity 0, height collapse, 250ms ease-out
  - [x] Use `key` prop or animation library approach to animate items in/out on filter change
  - [x] Items that match the new filter fade/slide in; items that don't match fade out with height collapse
  - [x] Respect `prefers-reduced-motion` — instant transitions when active

- [x] Task 7: Frontend tests (AC: #9)
  - [x] Create `packages/frontend/src/components/filter-tabs.test.tsx`:
    - Renders three tabs with correct labels
    - Active tab has `aria-selected="true"`, others `"false"`
    - Click fires `onFilterChange` with correct value
    - Active tab has underline styling
    - `role="tablist"` on container, `role="tab"` on each button
  - [x] Update `packages/frontend/src/components/empty-state.test.tsx`:
    - Test each variant renders correct icon, title, and hint text
  - [x] Update `packages/frontend/src/components/todo-list.test.tsx`:
    - Test filtered list shows only matching items
    - Test filtered empty state renders when no items match
  - [x] Update `packages/frontend/src/app.test.tsx`:
    - Test filter state changes update visible todos

- [x] Task 8: Quality gates
  - [x] `pnpm --filter frontend test` — all tests pass
  - [x] `pnpm lint` — zero errors
  - [x] `pnpm build` — both packages build successfully

## Dev Notes

### Scope boundaries (do not implement here)

- **No** SortRow component (Story 3.3)
- **No** keyboard arrow navigation between tabs (Epic 4, Story 4.1 — Left/Right arrow keys)
- **No** backend changes — filtering is entirely client-side
- **No** URL persistence of filter state (not in requirements)

### Critical: What already exists (DO NOT recreate)

- **`EmptyState` component** — exists at `packages/frontend/src/components/empty-state.tsx` with the "No tasks yet" variant. Extend it with new variants, don't create a separate component.
- **`TodoList` component** — exists at `packages/frontend/src/components/todo-list.tsx`. It receives `todos` array and renders cards. Pass filtered array from app.
- **`app.tsx`** — owns layout and data fetching via `useTodosQuery()`. Filter state lives here.
- **Design tokens** — all color tokens (`--accent`, `--text-secondary`, `--text-primary`) and animation tokens (`--duration-normal`, `--duration-smooth`) already defined in `globals.css`.
- **`AppHeader`** — shows count badge. May need updating if count should reflect filtered vs total. Architecture says count shows "remaining" (active count), which is independent of filter.

### Architecture compliance

- Filter state is **client-side only** — `useState` in `app.tsx`, no API calls
- Filtering applies to the cached TanStack Query data — `useTodosQuery` returns all todos, app filters before passing to TodoList
- The `AppHeader` count badge shows **active (remaining) count** regardless of filter — this is the "remaining items" concept from UX spec
- `aria-live="polite"` region announces count on filter change: "[N] tasks shown"

### Component design: FilterTabs

```
┌─────────────────────────────────────────┐
│   All    │   Active   │  Completed      │
│          │ __________ │                  │  ← 2px terracotta underline on active
└─────────────────────────────────────────┘
```

- Three equal-width flex children
- Underline is an absolutely positioned pseudo-element or separate div that translates horizontally
- Underline animation: `transform: translateX()` with `transition: transform var(--duration-normal) ease-out`
- Tab text: `--text-sm` (14px), uppercase not required (epics don't specify uppercase for tabs)

### UX references

- **FilterTabs:** UX-DR4 — full-width segmented tab bar, equal-width buttons, 2px terracotta underline, `role="tablist"` with `role="tab"` children, `aria-selected`, `aria-live="polite"` announcing count
- **Filter transitions:** UX-DR10 — card exit/filter: fade + height collapse 250ms ease-out
- **Empty states:** UX-DR6 — 4 context-specific variants with icons, titles, and hints
- **Reduced motion:** UX-DR11 — all durations → 0ms when `prefers-reduced-motion` active

### File structure (expected new/changed)

| Path | Action |
|------|--------|
| `packages/frontend/src/components/filter-tabs.tsx` | New — FilterTabs component |
| `packages/frontend/src/components/filter-tabs.test.tsx` | New — FilterTabs tests |
| `packages/frontend/src/components/empty-state.tsx` | Modify — add variant prop and filtered variants |
| `packages/frontend/src/components/empty-state.test.tsx` | Modify — add variant tests |
| `packages/frontend/src/components/todo-list.tsx` | Modify — accept filter prop, render filtered empty states |
| `packages/frontend/src/components/todo-list.test.tsx` | Modify — add filter tests |
| `packages/frontend/src/app.tsx` | Modify — add filter state, FilterTabs, pass filtered todos |
| `packages/frontend/src/app.test.tsx` | Modify — add filter integration tests |
| `packages/frontend/src/styles/globals.css` | Modify — add filter animation classes |

### Testing requirements

**Frontend (Vitest + RTL):**
- `filter-tabs.test.tsx`: renders 3 tabs, active tab styling, click handler, ARIA attributes (`role="tablist"`, `role="tab"`, `aria-selected`, `aria-controls`)
- `empty-state.test.tsx`: each variant renders correct content (icon, title, hint text)
- `todo-list.test.tsx`: filtered list shows correct items, empty state for each filter
- `app.test.tsx`: filter state changes, filtered todos passed to list, count announcement

### Previous story intelligence

**From Story 2.1 (Toggle Todo Completion):**
- `isCompleted` field drives the filter logic — active = `!isCompleted`, completed = `isCompleted`
- TodoCard already has active/completed visual states with CSS transitions
- Test patterns: QueryClient mocking, `@testing-library/user-event` for click interactions

**From Story 3.1 (Due Date Support) — if completed before this story:**
- TodoCard will have due date badges and overdue styling
- Overdue styling only applies to active todos — filtering to "Active" may show overdue cards, "Completed" never shows overdue
- Ensure filter doesn't break overdue visual states

**From deferred-work.md:**
- No relevant deferred items for this story

### Git intelligence

- `app.tsx` currently has no filter state — just renders all todos from `useTodosQuery()`
- `TodoList` receives `todos` array directly — filtering happens before passing
- `EmptyState` is a simple component with single variant — needs extension

### Architecture compliance

- Client-side filtering only — no API changes
- `useState` for filter state in `app.tsx`
- CSS variable tokens for all visual properties
- Co-located tests
- kebab-case files, PascalCase components

### Dependencies

- **Depends on:** Story 3.1 should ideally be done first (due date badges affect card layout), but filter logic is independent of due dates
- **No new npm dependencies**
- **No backend changes**

## Dev Agent Record

### Agent Model Used

Cursor agent (GPT-5.1) — dev-story workflow

### Completion Notes List

- Implemented `FilterTabs` with sliding 2px accent indicator (`translateX` + `--duration-normal`), `role="tablist"` / `role="tab"`, `aria-controls="todo-list"`, and `aria-label` including per-tab counts from props.
- Extended `EmptyState` with `variant` (`no-todos`, `no-active`, `no-completed`, `load-error`); Search / AlertTriangle icons for filtered and error variants (Lucide equivalents for UX emoji references).
- `App`: `useState` filter, counts + `AppHeader` now uses **active** remaining count per architecture; `FilterTabs` between add section and list (`--space-4`); `aria-live="polite"` announces `"[N] tasks shown"` only when the filter value changes.
- `TodoList`: takes full todo list + `filter`; tracks filter enter/exit sets on filter change for 250ms (`--duration-smooth`); `TodoCard` gains `isFilterExiting` / `isFilterEntering` with `.todo-list-item-motion`, `.todo-card-filter-exit`, `.todo-card-filter-enter` in `globals.css`. `id="todo-list"` wraps list or empty state so `aria-controls` always resolves.
- Global `prefers-reduced-motion` rules shorten transitions site-wide (existing pattern).
- Tests: new `filter-tabs.test.tsx`; expanded `empty-state`, `todo-list`, `app` tests. Quality gates: `pnpm --filter frontend test`, `pnpm lint`, `pnpm build` all pass.

### File List

- `packages/frontend/src/components/filter-tabs.tsx`
- `packages/frontend/src/components/filter-tabs.test.tsx`
- `packages/frontend/src/components/empty-state.tsx`
- `packages/frontend/src/components/empty-state.test.tsx`
- `packages/frontend/src/components/todo-list.tsx`
- `packages/frontend/src/components/todo-list.test.tsx`
- `packages/frontend/src/components/todo-card.tsx`
- `packages/frontend/src/app.tsx`
- `packages/frontend/src/app.test.tsx`
- `packages/frontend/src/styles/globals.css`
- `_bmad-output/implementation-artifacts/sprint-status.yaml`

### Review Findings

_To be filled by code review_

### Change Log

- 2026-04-09: Story 3.2 — filter tabs, client-side filter state, empty-state variants, list filter animations, tests, sprint status → review
