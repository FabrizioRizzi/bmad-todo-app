# Epic 2: Implementation Readiness Check

**Status:** ✅ ALL SYSTEMS GO  
**Date:** April 8, 2026  
**Epic:** Epic 2 — Complete Task Lifecycle  
**Stories:** 2.1 (Toggle), 2.2 (Delete+Undo), 2.3 (Error Banner)

---

## ✅ Readiness Checklist

### Prerequisites
- [x] Epic 1 (Project Foundation) complete and code merged
- [x] All 3 Epic 2 stories created with comprehensive context
- [x] Architecture decisions documented and validated
- [x] UX specifications available and referenced
- [x] Test strategy defined (16 E2E test cases)
- [x] Database schema requires no changes (todos table exists)
- [x] Backend API patterns established (Fastify + Zod)
- [x] Frontend patterns established (React + TanStack Query)

### Story Specifications
- [x] Story 2.1 (Toggle): 12 acceptance criteria, 8 tasks, complete technical spec
- [x] Story 2.2 (Delete+Undo): 12 acceptance criteria, 10 tasks, complete technical spec
- [x] Story 2.3 (Error Banner): 10 acceptance criteria, 8 tasks, complete technical spec

### Developer Context
- [x] MCP servers explored and documented for visual/browser debugging
- [x] Previous story patterns documented (Story 1.5 patterns apply)
- [x] Technical guardrails specified (no hardcoded values, CSS variables only)
- [x] Error handling paths defined (all mutations wired to error banner)
- [x] Testing requirements complete (backend integration + frontend unit)
- [x] Animation specifications detailed (all use design tokens)
- [x] Accessibility requirements specified (WCAG 2.1 AA, ARIA attributes)
- [x] Responsive design requirements documented (mobile/desktop behaviors)

### QA & Testing
- [x] E2E test strategy document created (16 test cases, 3 journeys)
- [x] Page object specifications defined
- [x] Test data setup documented
- [x] Error injection (network mocking) guidance provided
- [x] MCP server recommendations for test automation included

### Git & Sprint Status
- [x] Sprint status updated (epic-2: in-progress)
- [x] All 3 stories status: ready-for-dev
- [x] Story files staged in implementation-artifacts/

---

## 📋 What's in Each Story File

### Story 2.1: Toggle Todo Completion
**File:** `2-1-toggle-todo-completion.md`

**Backend Work:**
- Add `PATCH /api/todos/:id` route in `packages/backend/src/routes/todo-routes.ts`
- Zod schema validation for `{ isCompleted: boolean }`
- Return full updated todo object (200 response)
- 404 handling when todo not found
- Integration tests in `todo-routes.test.ts`

**Frontend Work:**
- Add `useToggleTodoMutation` hook in `packages/frontend/src/hooks/use-todos.ts`
- Update `todo-card.tsx` with checkbox UI
- Add completed state styling (--completed-bg, --completed-bar, strikethrough, sage green checkmark)
- 200ms ease-out transition animations
- Optimistic update via `setQueryData`, revert on error
- Error banner integration
- Unit tests for checkbox interaction

**Key Patterns:**
- Mutation follows TanStack Query v5 pattern from Story 1.5
- Error handling wired to error banner (Story 2.3)
- All animations use design token variables

---

### Story 2.2: Delete Todo with Undo
**File:** `2-2-delete-todo-with-undo.md`

**Backend Work:**
- Add `DELETE /api/todos/:id` route in `packages/backend/src/routes/todo-routes.ts`
- Return `204 No Content` (no body)
- 404 handling when todo not found
- Integration tests in `todo-routes.test.ts`

**Frontend Work:**
- Add `useDeleteTodoMutation` hook in `packages/frontend/src/hooks/use-todos.ts`
- Create `undo-toast.tsx` component:
  - Dark warm gray background (--toast-bg)
  - White text (--toast-text) with "Task deleted"
  - Terracotta "Undo" link
  - 5-second auto-dismiss timer
  - Slide-up enter animation (200ms ease-out)
  - Fade exit animation (200ms ease-out)
  - Only one toast visible (new delete replaces old)
- Update `todo-card.tsx` with delete button:
  - Hidden by default on desktop (hover reveal)
  - Always visible at 50% opacity on mobile
- Card animations:
  - Exit/delete: slide right + fade (200ms ease-in)
  - Restore on undo: slide + fade (300ms ease-out)
  - Restore on error: slide + fade (300ms ease-out)
- Delete mechanics:
  - Optimistically remove card (setQueryData) before API call
  - Start 5-second undo timer
  - On undo: cancel timer, restore card, do NOT send DELETE
  - On timer expiry: fire DELETE API call
  - On DELETE failure: restore card + show error banner
  - Multiple deletes: new toast replaces old, old timer fires immediately
- Unit tests for all scenarios

**Key Patterns:**
- Optimistic update + error revert (setQueryData)
- Timer management (5s undo window)
- Toast replacement logic (only one visible)
- Responsive button visibility

---

### Story 2.3: Error Banner Component
**File:** `2-3-error-banner-component.md`

**Frontend Work:**
- Create `error-banner.tsx` component:
  - Container with `role="alert"` + `aria-live="assertive"`
  - Warning icon (⚠) + error message text
  - Background: --error-bg, text: --error, border-radius: 10px
  - Props: `message` (string), `onDismiss` (callback)
- Add error state management in `app.tsx`:
  - `errorMessage` state + `showError()` helper
  - Action-specific message templates (create/toggle/delete)
  - 8-second auto-dismiss timeout
  - `clearError()` on success
- Wire all mutations to error handler:
  - Story 1.5 `useCreateTodoMutation`: call `showError('create')` on error
  - Story 2.1 `useToggleTodoMutation`: call `showError('toggle')` on error
  - Story 2.2 `useDeleteTodoMutation`: call `showError('delete')` on error
- Animation: slide-down enter (200ms ease-out), fade exit (200ms ease-out)
- Error replacement: new error replaces previous (no stacking)
- Unit tests for component + app integration

**Key Patterns:**
- Centralized error display
- Auto-dismiss with manual override
- Error replacement (only most recent shown)
- Screen reader announcements (role + aria-live)

---

## 🧪 QA Strategy Overview

**File:** `epic-2-qa-test-strategy.md`

**3 User Journeys:** 16 E2E test cases total

1. **Journey 1: Toggle Completion** (4 test cases)
   - Complete active todo (visual transition, API call)
   - Uncomplete todo (reverse transition)
   - Toggle error handling (revert + error banner)
   - Wait for auto-dismiss

2. **Journey 2: Delete with Undo** (7 test cases)
   - Delete → optimistic removal + undo toast
   - Undo before timer expires (card restores, no DELETE call)
   - Timer expires → DELETE API fires (204 response)
   - DELETE API failure → card restores + error banner
   - Multiple deletes → toast replacement, first timer fires
   - Desktop delete button visibility (hover reveal)
   - Mobile delete button visibility (always visible at 50%)

3. **Journey 3: Error Handling & Recovery** (5 test cases)
   - Create error recovery (input retained, dismisses on success)
   - Toggle error & recovery (checkbox reverts, dismisses on success)
   - Delete API error (timer expires, DELETE fails, card restores)
   - Error banner auto-dismiss (8 seconds)
   - Error replacement (new error replaces old)

**Execution:**
- Playwright automation with page object fixtures
- Network mocking for API failure scenarios
- Timing assertions (animation duration ~200–300ms, timers 5s/8s)
- Accessibility assertions (ARIA attributes)
- Responsive assertions (mobile/desktop viewports)

**Success Criteria:** 100% pass rate, < 5 minutes total runtime

---

## 🛠️ Recommended Dev Sequence

### Phase 1: Story 2.1 (Toggle)
1. Dev implements PATCH backend + frontend checkbox
2. All AC met, tests pass
3. Code review
4. Merge

**Duration:** 2–3 hours (established patterns, straightforward mutations)

### Phase 2: Story 2.2 (Delete + Undo)
1. Dev implements DELETE backend + undo toast + mechanics
2. All AC met, tests pass (especially timer + restore logic)
3. Code review
4. Merge

**Duration:** 3–4 hours (more complex state management, animation coordination)

### Phase 3: Story 2.3 (Error Banner)
1. Dev creates error banner component + wires all 3 mutations
2. All AC met, tests pass
3. Code review
4. Merge

**Duration:** 2–3 hours (component is simple, integration is key)

### Phase 4: QA & E2E Tests
1. QA agent generates Playwright specs from test strategy
2. Tests run against full stack (frontend + backend + DB)
3. All 16 test cases pass
4. Results documented

**Duration:** 1–2 hours (automation generation + test execution)

**Total Estimated Time:** 8–12 hours for complete Epic 2 (including code reviews + QA)

---

## 📚 Key Resources & Patterns

### Backend Patterns (from Story 1.3)
- Fastify routes in `packages/backend/src/routes/todo-routes.ts`
- Zod schemas in `packages/backend/src/validation/todo-schemas.ts`
- Error shape: `{ statusCode, error, message }` (Fastify native)
- Integration tests co-located: `todo-routes.test.ts`

### Frontend Patterns (from Story 1.5)
- TanStack Query hooks in `packages/frontend/src/hooks/use-todos.ts`
- Components in `packages/frontend/src/components/` (flat structure, kebab-case files)
- Styling: CSS variables from `styles/globals.css` (no hardcoded colors or ms values)
- Tests co-located: `*.test.tsx`
- Test utilities in `test-utils.tsx` (mocking, RTL setup)

### Styling & Animation
- All animations use `--duration-*` tokens: fast (150ms), normal (200ms), smooth (250ms), enter (300ms), exit (200ms)
- All colors use `--*` CSS variables (e.g., --error-bg, --completed-bg, --toast-bg)
- Responsive: base styles mobile, `md:` and `lg:` prefixes for tablet/desktop
- Reduced motion: `prefers-reduced-motion: reduce` → all durations 0ms

### Accessibility (WCAG 2.1 AA)
- Semantic HTML (`<form>`, `<ul>`, `<li>`, `<button>`, `<input>`)
- ARIA labels on icon-only buttons
- `role="alert"` + `aria-live="assertive"` for error messages
- `:focus-visible` for keyboard focus indicators (2px terracotta outline)
- Color contrast: 4.5:1 for normal text (verified in earlier stories)

### MCP Servers for Debugging
- **cursor-ide-browser:** Snapshots, automation, network inspection (in-IDE flow)
- **user-chrome-devtools:** Full DevTools access, detailed network bodies, performance profiling

---

## ✅ Final Sign-Off

**All stories ready for developer implementation.**

✅ Context complete  
✅ Patterns established  
✅ Acceptance criteria clear  
✅ Technical guardrails documented  
✅ Error handling specified  
✅ Testing requirements defined  
✅ MCP server guidance provided  
✅ QA strategy ready  
✅ Sprint status updated  

**Next command for developer:**
```
dev story 2-1-toggle-todo-completion
```

Or use the `bmad-dev-story` skill with the story file path.

---

**Created:** 2026-04-08  
**Epic:** 2 — Complete Task Lifecycle  
**Status:** Ready for Implementation  
