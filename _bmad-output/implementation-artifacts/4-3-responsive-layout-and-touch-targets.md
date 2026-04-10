# Story 4.3: Responsive Layout & Touch Targets

Status: done

<!-- Note: Validation is optional. Run validate-create-story for quality check before dev-story. -->

## Story

As a user on a mobile device,
I want the app to adapt to my screen size with appropriately sized touch targets,
so that I can use all features comfortably on any device.

## Acceptance Criteria

1. **Mobile (320px–767px)**  
   **Given** viewport in mobile range  
   **When** the layout renders  
   **Then** full width with **16px** horizontal padding.  
   **And** the add input is **not** auto-focused (avoid keyboard popup).  
   **And** delete on each card is **always visible** at **50% opacity**.  
   **And** every interactive control has minimum **44×44px** hit target (checkbox, delete, filter tabs, sort buttons, add, calendar trigger); expand hit area with padding when visual icon is smaller.

2. **Tablet (768px–1023px)**  
   **Given** tablet viewport  
   **Then** horizontal padding **24px**.  
   **And** max-width container begins to center.  
   **And** delete buttons always visible (no hover-only reveal).  
   **And** 44px targets maintained.

3. **Desktop (1024px+)**  
   **Given** desktop viewport  
   **Then** content centered at **max-width 640px** (`max-w-[40rem]` already used — verify).  
   **And** extra space is whitespace.  
   **And** input **auto-focuses** on load.  
   **And** card hover elevation applies.  
   **And** delete buttons **hidden until card hover** (current desktop pattern — preserve unless AC conflicts).

4. **No overflow / overlap**  
   **Given** any width 320px → desktop  
   **Then** no horizontal scroll, no overlapping or illegible truncation of primary content.

5. **Single column**  
   **Given** all breakpoints  
   **Then** layout remains single-column.

6. **Tailwind approach**  
   **Given** responsive CSS  
   **Then** mobile-first base + `md:` / `lg:` (or project-standard breakpoints) for tablet/desktop.  
   **And** container uses centered max-width per UX.

7. **Tests**  
   **Given** responsive rules  
   **When** tests run  
   **Then** verify minimum touch target sizes (where measurable in RTL), breakpoint classes, no horizontal overflow at 320px (e2e viewport recommended).

## Tasks / Subtasks

- [x] Task 1: Viewport-specific autofocus (AC: #1, #3)  
  - [x] Gate `AddInput` auto-focus: desktop only via `matchMedia('(min-width: 1024px)')` or Tailwind `lg` breakpoint + `useEffect`.  
  - [x] Ensure no focus on mobile/tablet initial load.

- [x] Task 2: Delete visibility by breakpoint (AC: #1–#3)  
  - [x] `TodoCard`: mobile/tablet — delete always visible @ 50% opacity; desktop — hover/focus-visible reveal as today.  
  - [x] Ensure focus-visible still shows delete for keyboard users on desktop.

- [x] Task 3: 44×44px targets (AC: #1, #2)  
  - [x] Audit: filter tabs, sort row buttons, add, calendar, checkbox hit area, delete, reset sort.  
  - [x] Apply `min-h-[44px] min-w-[44px]` or padding to meet target without breaking layout.

- [x] Task 4: Padding + container (AC: #1, #2, #3, #6)  
  - [x] Align `app.tsx` main padding: 16px mobile, 24px tablet — current `px-[var(--space-4)] sm:px-[var(--space-6)]` may need `lg:` adjustments to match epic exactly.

- [x] Task 5: Overflow audit (AC: #4)  
  - [x] Long descriptions, sort row wrap, header — `min-w-0` / truncation as needed.

- [x] Task 6: Tests (AC: #7)  
  - [x] RTL with mocked viewport or class assertions; Playwright e2e at 320×568.

### Review Findings

- [x] [Review][Decision] Scope boundary mismatch (4.2 ARIA behavior bundled into 4.3 diff) — resolved: keep these ARIA additions in Story 4.3.
- [x] [Review][Patch] Missing desktop hover elevation on todo cards (AC3: "card hover elevation applies") [`packages/frontend/src/components/todo-card.tsx:90`] — fixed with desktop hover shadow elevation.
- [x] [Review][Patch] Due-date trigger for todos with an existing due date does not enforce 44×44 touch target (AC1/AC2) [`packages/frontend/src/components/todo-card.tsx:136`] — fixed with `min-h-[44px] min-w-[44px]`.
- [x] [Review][Patch] Create-announcement timeout can clear too early on rapid consecutive creates because timer does not reset when message text is unchanged [`packages/frontend/src/app.tsx:184`] — fixed by keying timer effect off announcement version.
- [x] [Review][Patch] Playwright checkbox locator builds `RegExp` directly from todo text, making tests fragile for regex metacharacters [`e2e/story-4.3-responsive-layout.spec.ts:79`] — fixed by escaping todo text before building `RegExp`.
- [x] [Review][Patch] E2E coverage only checks single-column at desktop and does not assert mobile delete opacity equals 50% (AC1 + AC5 + AC7 gap) [`e2e/story-4.3-responsive-layout.spec.ts:51`] — fixed with opacity assertion and all-breakpoint single-column verification.

## Dev Notes

### Scope boundaries

- **No** new keyboard roving (4.1) beyond ensuring touch targets don’t break focus outlines.  
- **No** full ARIA audit (4.2).  
- **No** animation inventory (4.4) except if reduced motion already interacts with transitions.

### Critical: What already exists

- **`app.tsx`**: `main` uses `max-w-[40rem]`, `px-[var(--space-4)] sm:px-[var(--space-6)]`.  
- **`globals.css`**: design tokens for spacing; card padding mobile/desktop variables.  
- **Delete visibility**: likely hover-based on desktop in `todo-card.tsx` — extend with breakpoint modifiers.

### WCAG / NFR

- FR25 (44×44 targets), FR26 (320–desktop), FR27 (adaptive layout).  
- [Source: `_bmad-output/planning-artifacts/architecture.md` — FR26-27 responsive]

### File structure (expected)

| Path | Action |
|------|--------|
| `packages/frontend/src/app.tsx` | Padding breakpoints, optional layout wrappers |
| `packages/frontend/src/components/add-input.tsx` | Conditional autofocus |
| `packages/frontend/src/components/todo-card.tsx` | Delete opacity + hit targets |
| `packages/frontend/src/components/filter-tabs.tsx` / `sort-row.tsx` | Min touch size |
| `packages/frontend/src/styles/globals.css` | Token use only for new values where possible |

### Previous story intelligence

**From 4.1 / 4.2:** Larger hit areas must not break tab order or accessible names.

### Testing requirements

- Playwright: `page.setViewportSize({ width: 320, height: 568 })`, assert `scrollWidth <= clientWidth` on main container.  
- RTL: `getBoundingClientRect()` width/height ≥ 44 for key buttons (approximate).

### References

- [Source: `_bmad-output/planning-artifacts/epics.md` — Epic 4, Story 4.3]  
- [Source: `_bmad-output/planning-artifacts/ux-design-specification.md` — responsive / touch]

## Dev Agent Record

### Agent Model Used

Claude claude-4.6-opus-high

### Debug Log References

- Added `matchMedia` polyfill to `test-setup.ts` to fix jsdom missing `window.matchMedia`

### Completion Notes List

- **Task 1:** Added desktop-only auto-focus via `matchMedia('(min-width: 1024px)')` in `useEffect` on mount in `app.tsx`. Mobile/tablet do not auto-focus, avoiding keyboard popup.
- **Task 2:** Delete button already had `opacity-50 lg:opacity-0 lg:group-hover:opacity-100`. Added `lg:focus-visible:opacity-100` so keyboard users on desktop can still see the delete button when focused.
- **Task 3:** Audited all interactive controls. Delete button enlarged from 32×32 to 44×44 (`h-11 w-11`). Filter tabs got `min-h-[44px]`. Sort buttons got `min-h-[44px] min-w-[44px]`. Reset sort button got `min-h-[44px]`. Calendar icon trigger in TodoCard got `min-h-[44px] min-w-[44px]`. Due date text trigger got padding for adequate touch area. Checkbox wrapper was already 44×44. Add button was already 44×44 via `size="icon"`.
- **Task 4:** Changed main container padding from `sm:px-[var(--space-6)]` to `md:px-[var(--space-5)] lg:px-[var(--space-6)]` — 16px mobile, 24px tablet, 32px desktop. Max-width 640px centered already in place.
- **Task 5:** Added `overflow-x-hidden` to outer container div. Existing `break-words` + `[overflow-wrap:anywhere]` on descriptions, `flex-wrap` on sort row, and `min-w-0` on text containers already prevent overflow.
- **Task 6:** Added RTL tests for responsive classes (padding breakpoints, overflow-x-hidden, touch target classes, autofocus with mocked matchMedia). Created 14 Playwright e2e tests at mobile (320×568), tablet (768×1024), and desktop (1280×720) viewports testing: no horizontal scroll, delete visibility, auto-focus behavior, touch target sizes, max-width centering, hover-reveal, and single-column layout.

### Change Log

- 2026-04-10: Implemented Story 4.3 — responsive layout, touch targets, viewport-specific autofocus, overflow prevention, and comprehensive tests.

### File List

- `packages/frontend/src/app.tsx` — Desktop-only auto-focus, responsive padding (`md:`/`lg:`), overflow-x-hidden, reset sort min-h
- `packages/frontend/src/app.test.tsx` — Added responsive layout + autofocus tests (4 new tests)
- `packages/frontend/src/components/todo-card.tsx` — Delete button 44×44, focus-visible reveal, calendar trigger touch targets
- `packages/frontend/src/components/todo-card.test.tsx` — Added touch target + responsive visibility tests (3 new tests)
- `packages/frontend/src/components/filter-tabs.tsx` — Added `min-h-[44px]` to tab buttons
- `packages/frontend/src/components/filter-tabs.test.tsx` — Added touch target test (1 new test)
- `packages/frontend/src/components/sort-row.tsx` — Added `min-h-[44px] min-w-[44px]` to sort buttons
- `packages/frontend/src/components/sort-row.test.tsx` — Added touch target test (1 new test)
- `packages/frontend/src/styles/globals.css` — No changes (tokens already sufficient)
- `packages/frontend/src/test-setup.ts` — Added `matchMedia` polyfill for jsdom
- `e2e/story-4.3-responsive-layout.spec.ts` — New: 14 Playwright e2e tests across 3 viewports
