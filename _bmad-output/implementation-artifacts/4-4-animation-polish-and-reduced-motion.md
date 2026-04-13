# Story 4.4: Animation Polish & Reduced Motion

Status: done

<!-- Note: Validation is optional. Run validate-create-story for quality check before dev-story. -->

## Story

As a user,
I want smooth, polished animations on all interactions,
so that the app feels alive and premium — or instant transitions if I prefer reduced motion.

## Acceptance Criteria

1. **Timing tokens**  
   **Given** any transition driven by UX spec  
   **When** implemented in CSS or inline styles  
   **Then** use tokens: `--duration-fast` (150ms) hover/focus; `--duration-normal` (200ms) checkbox/card property changes; `--duration-smooth` (250ms) reorder/filter/crossfade; `--duration-enter` (300ms) card appear; `--duration-exit` (200ms) card remove.

2. **Easing**  
   **Given** animations  
   **Then** standard: `ease-out` / `--ease-standard`; exits: `ease-in` / `--ease-exit`; card enter spring: `--ease-spring` (`cubic-bezier(0.34, 1.56, 0.64, 1)`).

3. **Animation inventory (13)**  
   **When** audited end-to-end  
   **Then** all behaviors from epic are accounted for:  
   - Card enter: slide down + fade (300ms, spring)  
   - Card exit/delete: slide right + fade (200ms ease-in)  
   - Card exit/filter: fade + height collapse (250ms ease-out)  
   - Checkbox toggle: fill + color (200ms ease-out)  
   - Complete transition: bg, bar, text, strikethrough together (200ms ease-out)  
   - Filter tab underline slide (200ms ease-out)  
   - List reorder/sort: position move (250ms ease-out)  
   - Skeleton pulse: opacity loop 0.25→0.5 (1500ms ease-in-out)  
   - Skeleton→cards crossfade (250ms ease-out)  
   - Toast enter: slide up (200ms ease-out)  
   - Toast exit: fade (200ms ease-out)  
   - Error banner enter: slide down + height expand (200ms ease-out)  
   - Error banner exit: fade + height collapse (200ms ease-out)

4. **Duration caps**  
   **Given** motion is enabled  
   **Then** no animation exceeds **300ms**; exits faster than enters (200 vs 300).

5. **`prefers-reduced-motion: reduce`**  
   **Given** user prefers reduced motion  
   **When** UI updates  
   **Then** transitions effectively **instant** (0ms); skeleton pulse becomes **static** (no looping pulse).  
   **And** all states remain understandable without motion.

6. **No hardcoded durations in TSX**  
   **Given** React/TS code drives motion  
   **Then** prefer CSS classes + variables; avoid raw `ms` literals except where unavoidable (document exceptions).

7. **Tests**  
   **Given** animation system  
   **When** tests run  
   **Then** verify reduced-motion path (media query or mocked `matchMedia`), and that key components reference duration tokens in class names or styles (snapshot or grep-friendly patterns as project prefers).

## Tasks / Subtasks

- [x] Task 1: Inventory vs `globals.css` + components (AC: #3, #6)  
  - [x] List each animation; map to file + property; fix stragglers using raw ms or wrong easing.

- [x] Task 2: Skeleton loading (AC: #3, #5)  
  - [x] Ensure pulse uses `--duration-skeleton-pulse`; under reduced motion, static opacity.

- [x] Task 3: List / card / filter / toast / error banner (AC: #1–#4)  
  - [x] Align `todo-list`, `todo-card`, `filter-tabs`, `undo-toast`, `error-banner` with token + easing rules.

- [x] Task 4: Reduced motion cohesion (AC: #5)  
  - [x] Global `@media (prefers-reduced-motion: reduce)` already forces near-zero duration — verify no `animation` bypasses; JS-driven motion (`todo-list` FLIP) must respect `matchMedia` (partially present — extend).

- [x] Task 5: Sort reorder (AC: #3)  
  - [x] Confirm FLIP / CSS transitions use `--duration-smooth` and `--ease-standard`.

- [x] Task 6: Tests (AC: #7)  
  - [x] Extend existing tests that mock `prefers-reduced-motion`.  
  - [x] Optional style lint or unit test that fails on new raw duration literals in `*.tsx` (only if low noise).

## Dev Notes

### Scope boundaries

- **No** new feature animations outside the inventory unless required to fix inconsistencies.  
- **No** responsive layout (4.3) except when motion interacts with breakpoints.

### Critical: What already exists

- **`globals.css`**: full token set; global `prefers-reduced-motion` block with `!important` on durations.  
- **`todo-list.tsx`**: `matchMedia('(prefers-reduced-motion: reduce)')` for FLIP — align with AC #5 (static skeleton).  
- **Undo toast / delete / error**: keyframes in `globals.css` — verify token usage.

### Architecture compliance

- UX-DR animation system from architecture + PRD; design tokens are source of truth.  
- [Source: `_bmad-output/planning-artifacts/architecture.md` — Animation system / NFR]

### Previous story intelligence

**From Story 3.3:** Sort reorder 250ms; `FILTER_FLIP_SUPPRESS_MS` and delete transition merging — preserve when retiming.

### File structure (expected)

| Path | Action |
|------|--------|
| `packages/frontend/src/styles/globals.css` | Token alignment, keyframes |
| `packages/frontend/src/components/todo-list.tsx` | FLIP + reduced motion |
| `packages/frontend/src/components/todo-card.tsx` | Transitions |
| `packages/frontend/src/components/filter-tabs.tsx` | Underline transition |
| `packages/frontend/src/components/undo-toast.tsx` | Enter/exit classes |
| `packages/frontend/src/components/error-banner.tsx` | Enter/exit |
| `packages/frontend/src/components/add-input.tsx` / skeletons | Loading states |

### References

- [Source: `_bmad-output/planning-artifacts/epics.md` — Epic 4, Story 4.4]  
- [Source: `_bmad-output/planning-artifacts/ux-design-specification.md` — UX-DR1, UX-DR9–DR11]  
- [Source: `packages/frontend/src/styles/globals.css` — motion tokens]

## Dev Agent Record

### Agent Model Used

Claude Opus 4.6 (Cursor)

### Debug Log References

No debug issues encountered.

### Completion Notes List

- **Task 1 – Inventory audit**: Mapped all 13 animations to file + property. Fixed 6 issues: card enter direction (translateX→translateY) + easing (→ --ease-spring token), card exit/delete easing (cubic-bezier → --ease-exit), card exit/filter easing (cubic-bezier → --ease-standard), skeleton pulse opacity (0.45→1 → 0.25→0.5), toast enter duration (--duration-smooth → --duration-normal) + easing, error banner exit (added height collapse), filter enter easing (→ --ease-spring token). Zero raw ms literals in TSX confirmed.
- **Task 2 – Skeleton**: Added explicit `@media (prefers-reduced-motion: reduce)` override for `.todo-skeleton-pulse` — sets `animation: none !important; opacity: 0.4` for fully static placeholder under reduced motion.
- **Task 3 – Component alignment**: All components verified using design tokens. Added `duration-[var(--duration-fast)]` to card hover shadow transition. Error banner enter now includes `max-height: 10rem` to support height collapse on exit.
- **Task 4 – Reduced motion**: Created `useReducedMotion` hook with dynamic `matchMedia` listener. Integrated into `TodoList`: filter animation timeout set to 0ms under reduced motion; FLIP now uses hook value instead of inline `matchMedia` call. All CSS animations covered by global `!important` reduced-motion block.
- **Task 5 – Sort reorder**: Updated FLIP CSS class and JS inline style to use `var(--ease-standard)` token instead of literal `ease-out`.
- **Task 6 – Tests**: 51 new tests across 3 files — `useReducedMotion` hook tests (4), animation system tests covering token references (7), CSS class references (12), reduced-motion behavior (4), duration cap verification (2), and raw duration literal lint (22 source files scanned). All 194 tests pass.

### Change Log

- 2026-04-13: Story 4.4 implementation — animation polish, token alignment, reduced-motion cohesion, 51 new tests.

### File List

- `packages/frontend/src/styles/globals.css` — Modified: fixed card enter/exit/filter easing+direction, skeleton pulse opacity, toast enter duration, error banner height collapse, sort FLIP easing token, skeleton reduced-motion override
- `packages/frontend/src/components/todo-list.tsx` — Modified: integrated `useReducedMotion` hook for FLIP + filter timeouts, sort FLIP easing token
- `packages/frontend/src/components/todo-card.tsx` — Modified: added duration-fast + ease-standard to card hover shadow transition
- `packages/frontend/src/hooks/use-reduced-motion.ts` — New: shared `useReducedMotion` hook with dynamic `matchMedia` listener
- `packages/frontend/src/hooks/use-reduced-motion.test.ts` — New: 4 tests for useReducedMotion hook
- `packages/frontend/src/components/animation-system.test.tsx` — New: 25 tests for animation token references, CSS classes, reduced motion, duration caps
- `packages/frontend/src/components/animation-no-raw-durations.test.ts` — New: 22+ tests scanning source files for raw duration literals
