# Story 2.2: Delete Todo with Undo

Status: ready-for-dev

<!-- Ultimate context engine analysis completed - comprehensive developer guide created -->

## Story

As a user,
I want to delete a todo with the ability to undo within a few seconds,
So that I can remove tasks confidently without fear of accidental loss.

## Acceptance Criteria

1. **DELETE endpoint implementation**
   **Given** the backend API is running
   **When** I send `DELETE /api/todos/:id`
   **Then** the todo is permanently removed from the database
   **And** the response is `204 No Content`

2. **404 Not Found on DELETE**
   **Given** the backend API is running
   **When** I send `DELETE /api/todos/:id` where `:id` does not exist
   **Then** the response is `404` with `{ statusCode: 404, error: "Not Found", message: "Todo not found" }`

3. **Optimistic card removal - slide out animation**
   **Given** a todo is displayed in the list
   **When** I click the delete button (✕)
   **Then** the card animates out immediately (slide right + fade, 200ms ease-in) — this is an optimistic removal
   **And** the undo toast appears at the bottom center: dark warm gray background (`--toast-bg`), white text ("Task deleted"), terracotta "Undo" link, 12px radius
   **And** the toast has a 5-second auto-dismiss timer

4. **Undo before timer expires**
   **Given** the undo toast is visible
   **When** I click "Undo" before the timer expires
   **Then** the deleted card animates back into the list (slide + fade, 300ms ease-out)
   **And** the toast dismisses
   **And** no `DELETE` API call is sent

5. **Timer expires - fire DELETE**
   **Given** the undo toast is visible
   **When** the 5-second timer expires without "Undo" being clicked
   **Then** the toast auto-dismisses (fade, 200ms ease-out)
   **And** the `DELETE /api/todos/:id` API call fires

6. **DELETE API failure - restore card**
   **Given** the DELETE API call fires after the undo timer expires
   **When** the API call fails
   **Then** the deleted card reappears in the list with a slide-in animation
   **And** an error banner appears: "Couldn't delete that task — try again."

7. **Multiple deletes - toast replacement**
   **Given** a second todo is deleted while an undo toast is already visible
   **When** the new delete occurs
   **Then** the previous undo toast is replaced by the new one (only one toast visible at a time)
   **And** the previous delete's API call fires immediately (timer expired early)

8. **Desktop delete button visibility**
   **Given** the delete button on desktop
   **When** the user is not hovering over a card
   **Then** the delete button is hidden

9. **Desktop delete button on hover**
   **Given** the delete button on desktop
   **When** the user hovers over a card
   **Then** the delete button appears

10. **Mobile delete button visibility**
    **Given** the app is viewed on a touch device (mobile/tablet)
    **When** cards are displayed
    **Then** the delete button is always visible at 50% opacity

11. **Backend integration tests**
    **Given** the delete functionality
    **When** tests are run
    **Then** co-located tests for `todo-routes.test.ts` verify DELETE endpoint

12. **Frontend integration tests**
    **Given** the delete functionality
    **When** tests are run
    **Then** frontend tests verify: optimistic removal, undo restores card, timer fires API call, error restores card

## Tasks / Subtasks

- [ ] Task 1: Backend DELETE endpoint (AC: #1, #2)
  - [ ] Add `DELETE /api/todos/:id` route handler to `packages/backend/src/routes/todo-routes.ts`
  - [ ] Query database by ID; throw 404 if not found
  - [ ] Delete the todo from the `todos` table
  - [ ] Return `204 No Content` response (no body)
  - [ ] Add `todo-routes.test.ts` integration tests for DELETE with success + 404 cases

- [ ] Task 2: Frontend undo toast component (AC: #3, #4, #5)
  - [ ] Create `packages/frontend/src/components/undo-toast.tsx` with:
    - Dark warm gray background (`--toast-bg`)
    - Warm white text (`--toast-text`)
    - Terracotta "Undo" link-style button
    - 12px border radius
    - 5-second auto-dismiss timer
    - Slide-up enter animation (200ms ease-out) per UX-DR8
    - Fade exit animation (200ms ease-out)
  - [ ] Export toast trigger function/hook for use in App
  - [ ] Handle only one toast visible at a time (new delete replaces previous toast)
  - [ ] Use `setQueryData` to manage visibility state (TanStack Query or React Context)

- [ ] Task 3: Delete mutation hook (AC: #3, #5, #6)
  - [ ] Add `useDeleteTodoMutation` to `packages/frontend/src/hooks/use-todos.ts`
  - [ ] On delete click:
    - Optimistically remove card via `setQueryData` (filter from todos array)
    - Start 5-second undo timer
    - Show undo toast with "Undo" button
  - [ ] On "Undo" click:
    - Cancel timer
    - Restore card via `setQueryData` (add back to todos array)
    - Dismiss toast
    - **Do not send DELETE API call**
  - [ ] On timer expiry (5s without undo):
    - Fire `DELETE /api/todos/:id` API call
    - Toast auto-dismisses
  - [ ] On DELETE API success:
    - Card stays removed (already optimistically removed)
  - [ ] On DELETE API failure:
    - Restore card via `setQueryData` with slide-in animation (AC #6)
    - Show error banner: "Couldn't delete that task — try again."

- [ ] Task 4: Delete button in TodoCard (AC: #8, #9, #10)
  - [ ] Update `packages/frontend/src/components/todo-card.tsx` to add delete button (✕ icon, e.g., `lucide-react` or custom SVG)
  - [ ] Desktop (lg breakpoint 1024px+):
    - Delete button hidden by default (`opacity-0` or `hidden`)
    - Visible on card hover (use `:hover` group or manual state)
  - [ ] Mobile (base + md breakpoint <1024px):
    - Delete button always visible at 50% opacity (`opacity-50`)
  - [ ] On click, call `useDeleteTodoMutation` with `id`

- [ ] Task 5: Animations & transitions (AC: #3, #4, #5, #6)
  - [ ] Card exit/delete animation (slide right + fade, 200ms ease-in) in `styles/globals.css`:
    - `.todo-card-exit-delete` with `transform: translateX(100px)`, `opacity: 0`, `transition: all 200ms ease-in`
  - [ ] Card re-enter animation after undo or error (slide + fade, 300ms ease-out):
    - `.todo-card-enter` with `transform: translateX(0)`, `opacity: 1`, `transition: all 300ms ease-out`
  - [ ] Toast enter (slide up 200ms ease-out):
    - `.undo-toast-enter` with `transform: translateY(0)`, `opacity: 1`, initial state `translateY(20px)`, `opacity: 0`
  - [ ] Toast exit (fade 200ms ease-out):
    - `.undo-toast-exit` with `opacity: 0`, `transition: opacity 200ms ease-out`
  - [ ] Reduced motion: all durations → 0ms when `prefers-reduced-motion: reduce`

- [ ] Task 6: Error handling integration (AC: #6)
  - [ ] Wire delete mutation's `onError` to trigger error banner with message: "Couldn't delete that task — try again."
  - [ ] If ErrorBanner not yet built (Story 2.3 deferred): add placeholder or context hook
  - [ ] Test error path: mock DELETE API failure in dev

- [ ] Task 7: Multiple delete handling (AC: #7)
  - [ ] In delete mutation `onSuccess`, check if another undo toast is already visible
  - [ ] If yes: fire DELETE for the previous todo (timer expires early)
  - [ ] Clean up old timer; start new timer for new delete
  - [ ] Replace toast in DOM

- [ ] Task 8: Frontend tests (AC: #11, #12)
  - [ ] Co-located `todo-card.test.tsx` or `undo-toast.test.tsx`:
    - Click delete → card animates out, toast appears
    - Click "Undo" → card animates back in, toast dismisses, no DELETE call sent
    - Timer expires → DELETE call fires
    - DELETE fails → card restores, error message shown
  - [ ] Test multiple deletes: new delete replaces old toast and triggers old timer
  - [ ] Mock `useDeleteTodoMutation` or use QueryClient testing utilities
  - [ ] Verify animation classes applied during transitions

- [ ] Task 9: Backend tests (AC: #11)
  - [ ] Add test to `packages/backend/src/routes/todo-routes.test.ts`:
    - DELETE success: todo removed from DB, response is 204 + no body
    - DELETE 404: no deletion, response is 404 + error body

- [ ] Task 10: Quality gates
  - [ ] Run `pnpm --filter frontend test` — all tests pass
  - [ ] Run `pnpm --filter backend test` — integration tests pass
  - [ ] Run `pnpm lint` — zero errors
  - [ ] Run `pnpm build` — both packages build successfully
  - [ ] Manual test: `pnpm dev`, delete a todo, verify slide-out, undo toast, timer fires DELETE, verify card removed

## Dev Notes

### Scope boundaries (do not implement here)

- **No** keyboard interactions (Escape to dismiss toast — Epic 4 Story 4.1)
- **No** focus management after delete (Epic 4)
- **No** analytics or logging of deleted items
- **Note:** ErrorBanner component deferred to Story 2.3; integrate as placeholder or context hook

### Technical requirements

- **API contract:** `DELETE /api/todos/:id` → `204 No Content`.
- **Optimistic removal:** Card immediately filtered from list via `setQueryData` before API call.
- **Undo mechanism:** 5-second timer; on expiry, fire DELETE. On undo, cancel timer and restore via `setQueryData`.
- **Toast management:** Only one toast visible; new delete replaces previous toast and fires previous delete immediately.
- **Animations:** All use CSS variables (`--duration-exit` 200ms ease-in for delete, `--duration-enter` 300ms ease-out for restore).
- **Error handling:** DELETE failure restores card + shows error banner.
- **Responsive:** Delete button hidden on desktop (hover reveal), always visible at 50% opacity on mobile.

### API contract (must match backend)

- `DELETE /api/todos/:id` → `204 No Content` (no response body).
- 404: `{ statusCode: 404, error: "Not Found", message: "Todo not found" }`.
- [Source: `packages/backend/src/routes/todo-routes.ts` — endpoint pattern from Story 1.3]

### UX references

- Delete button visibility (desktop hover, mobile always visible): UX-DR2 (TodoCard visual states).
- Undo toast styling and animation: UX-DR8 (dark warm gray bg, white text, terracotta Undo link, 12px radius, slide-up enter 200ms, fade exit 200ms, 5s auto-dismiss).
- Delete animation (slide right + fade): UX-DR10 (card exit/delete — slide right + fade 200ms ease-in).
- Undo restore animation (slide + fade): UX-DR10 (card enter — slide + fade 300ms ease-out).
- Reduced motion: UX-DR11 (all animation durations → 0ms).
- [Source: `_bmad-output/planning-artifacts/ux-design-specification.md`]

### File structure (expected new/changed)

| Path | Action |
|------|--------|
| `packages/backend/src/routes/todo-routes.ts` | Add DELETE handler |
| `packages/backend/src/routes/todo-routes.test.ts` | Add DELETE tests |
| `packages/frontend/src/hooks/use-todos.ts` | Add `useDeleteTodoMutation` |
| `packages/frontend/src/components/undo-toast.tsx` | **Create** |
| `packages/frontend/src/components/undo-toast.test.tsx` | **Create** |
| `packages/frontend/src/components/todo-card.tsx` | Add delete button + responsive visibility |
| `packages/frontend/src/components/todo-card.test.tsx` | Add delete interaction tests |
| `packages/frontend/src/styles/globals.css` | Add `.todo-card-exit-delete`, `.todo-card-enter`, `.undo-toast-enter`, `.undo-toast-exit` animations |
| `packages/frontend/src/app.tsx` | Wire undo toast and error handling |

### Testing requirements

**Backend (Vitest + Drizzle query verification):**
- DELETE success: todo removed from DB, response is 204 + no body.
- DELETE 404: no deletion, response is 404 + error body.

**Frontend (Vitest + RTL + user-event):**
- Delete button click: card animates out, todo removed from list (optimistic), undo toast appears with 5s timer.
- Undo click before timer: card animates back, undo toast dismissed, no DELETE API call fired.
- Timer expires: DELETE API call fired, toast auto-dismisses, card stays removed.
- DELETE API fails: card restores with animation, error banner shown.
- Multiple deletes: new delete replaces old toast, old timer fires immediately.
- Responsive: delete button hidden on desktop (hover reveal), visible at 50% opacity on mobile.

### Previous story intelligence (Story 2.1 — Toggle Todo Completion)

- TodoCard component exists with checkbox + completed styling.
- `useToggleTodoMutation` pattern established; `useDeleteTodoMutation` follows same TanStack Query setup.
- Error handling pattern for mutations already defined in Story 2.1.
- Optimistic update via `setQueryData` established in Story 1.5 (create mutation).

### Git intelligence summary

- Recent commits: toggle/complete functionality (Story 2.1) merged — backend PATCH route + frontend mutation hook ready.
- Delete is a new endpoint; follows Fastify + Zod pattern established in earlier stories.
- Frontend mutation pattern well-established; undo timer is a new pattern specific to this story.

### Latest technical notes (April 2026)

- **TanStack Query v5 + React 19:** `setQueryData` still the standard for optimistic updates and manual cache manipulation. No breaking changes affecting this story.
- **Tailwind v4 + CSS variables:** Use `--duration-exit`, `--duration-enter` tokens for animation timing. Tailwind applies transitions if `transition-all` utility present.
- **TypeScript 5.4+ strict mode:** Ensure `setQueryData` type safety when filtering todos array; use `Todo[]` type guard.

### MCP Servers for visual / debugging (Epic 2 use)

**Useful for delete/undo testing:**

1. **cursor-ide-browser** (in-IDE browser automation)
   - Use `browser_snapshot` + `browser_click` to delete a todo, inspect undo toast appears
   - Use `browser_wait_for` to pause 5 seconds and verify DELETE fires (or use network inspector)
   - Use `browser_network_requests` to see DELETE request with 204 response
   - Use `browser_take_screenshot` to visually verify card slide-out animation and toast styling

2. **user-chrome-devtools** (Chrome DevTools integration)
   - Use `take_snapshot` + `click` for delete button automation
   - Use `wait_for` to pause while undo toast timer counts down
   - Use `list_network_requests` + `get_network_request` to inspect DELETE API calls (204 response)
   - Use `take_screenshot` to confirm card animations and toast appearance
   - Use `evaluate_script` to verify toast timer state via DOM (e.g., check data attributes or CSS)

**Suggested testing flow:**
- Automated E2E test via Playwright (separate test: delete, wait, verify removal)
- Manual visual verification via `cursor-ide-browser` for undo animation timing
- Network inspection via `user-chrome-devtools` to confirm 204 response and timing

### Project context reference

- No `project-context.md` in repo; use architecture + epics + this file.

### References

- [Source: `_bmad-output/planning-artifacts/epics.md` — Epic 2, Story 2.2]
- [Source: `_bmad-output/planning-artifacts/architecture.md` — Backend routes, Fastify error handling]
- [Source: `_bmad-output/planning-artifacts/ux-design-specification.md` — Delete button, undo toast, animations]
- [Source: `_bmad-output/implementation-artifacts/2-1-toggle-todo-completion.md` — Mutation pattern, error handling]
- [Source: `_bmad-output/implementation-artifacts/1-5-create-todo-and-view-list.md` — TanStack Query, optimistic updates]

## Dev Agent Record

### Agent Model Used

Haiku 4.5

### Debug Log References

(None yet — story not yet implemented)

### Completion Notes List

(Pending implementation)

### File List

(Will be updated after implementation)

### Change Log

- 2026-04-08: Story 2.2 created — ready for dev implementation.

### Review Findings

(Pending code review after implementation)

## Story completion status

- **Status:** ready-for-dev
- **Note:** Comprehensive context engine analysis completed. Undo/delete pattern fully specified with animations, responsive behavior, error handling, and MCP debugging guidance. Developer has everything needed for flawless implementation.
