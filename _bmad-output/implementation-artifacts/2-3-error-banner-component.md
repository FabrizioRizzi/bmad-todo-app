# Story 2.3: Error Banner Component

Status: ready-for-dev

<!-- Ultimate context engine analysis completed - comprehensive developer guide created -->

## Story

As a user,
I want clear, non-disruptive error messages when something goes wrong,
So that I understand what failed and can try again without losing my place.

## Acceptance Criteria

1. **Error banner positioning**
   **Given** an API call fails (create, toggle, or delete)
   **When** the error banner appears
   **Then** it is positioned between the input area and the todo list
   **And** it has `--error-bg` background, `--error` text color, 10px border radius
   **And** it contains a warning icon (⚠) and an action-specific message

2. **Error banner animations**
   **Given** the error banner appears
   **When** animated into view
   **Then** it slides down into position (200ms ease-out with `--duration-normal` token)

3. **Auto-dismiss after 8 seconds**
   **Given** the error banner is visible
   **When** 8 seconds pass without another error
   **Then** the banner auto-dismisses with a fade animation (200ms ease-out)

4. **Dismiss on success**
   **Given** the error banner is visible
   **When** the next API call succeeds (any action)
   **Then** the banner dismisses immediately

5. **Error replacement (no stacking)**
   **Given** an error occurs while the error banner is already showing a previous error
   **When** the new error is displayed
   **Then** the previous error is replaced — only the most recent error is shown (no stacking)

6. **Create error message**
   **Given** error messages
   **When** a create fails
   **Then** the message reads: "Couldn't add that task — check your connection and try again."

7. **Toggle error message**
   **Given** error messages
   **When** a toggle fails
   **Then** the message reads: "Couldn't update that task — try again."

8. **Delete error message**
   **Given** error messages
   **When** a delete fails (after undo expired)
   **Then** the message reads: "Couldn't delete that task — try again."

9. **Accessibility - aria live alert**
   **Given** the error banner
   **When** rendered
   **Then** it has `role="alert"` and `aria-live="assertive"` for immediate screen reader announcement

10. **Component tests**
    **Given** the error banner component
    **When** tests are run
    **Then** co-located tests verify: renders with correct message per action type, auto-dismisses after 8s, dismisses on success, replaces previous error

## Tasks / Subtasks

- [ ] Task 1: ErrorBanner component creation (AC: #1, #2, #3, #5, #9)
  - [ ] Create `packages/frontend/src/components/error-banner.tsx`
  - [ ] Component accepts props: `message` (string), `onDismiss` (callback function)
  - [ ] Render structure:
    - Container div with `role="alert"` + `aria-live="assertive"`
    - Warning icon (⚠ from lucide-react or custom SVG)
    - Error message text
  - [ ] Styling:
    - Background: `var(--error-bg)` with `--error` text color
    - Border-radius: `10px` (0.625rem)
    - Padding: Use spacing tokens (`--space-*`)
  - [ ] Exit animation: add `.error-banner-exit` class on dismiss (fade + height collapse, 200ms ease-out)

- [ ] Task 2: Error state management in App (AC: #3, #4, #5)
  - [ ] Add `errorMessage` state to `packages/frontend/src/app.tsx` (or use context)
  - [ ] Create helper function `showError(actionType: 'create' | 'toggle' | 'delete')` that:
    - Sets error message based on action type (AC #6, #7, #8)
    - Clears any existing 8-second timeout
    - Starts new 8-second auto-dismiss timeout
  - [ ] Create helper function `clearError()` that:
    - Clears the error message
    - Clears any pending timeout
  - [ ] Wire mutations to call `showError()` on failure
  - [ ] Wire mutations to call `clearError()` on success

- [ ] Task 3: Integrate with mutation error handlers (AC: #4, #6, #7, #8)
  - [ ] Update `useCreateTodoMutation` (from Story 1.5) to call `showError('create')` on error
  - [ ] Update `useToggleTodoMutation` (from Story 2.1) to call `showError('toggle')` on error
  - [ ] Update `useDeleteTodoMutation` (from Story 2.2) to call `showError('delete')` on error
  - [ ] Each mutation's `onError` callback receives the error and invokes the error handler via context or props

- [ ] Task 4: Animation implementation (AC: #2, #3)
  - [ ] In `packages/frontend/src/styles/globals.css`, add:
    - `.error-banner-enter`: slide down + height expand (200ms ease-out)
      - Initial state: `max-height: 0`, `opacity: 0`, `transform: translateY(-20px)`
      - Final state: `max-height: 200px`, `opacity: 1`, `transform: translateY(0)`
    - `.error-banner-exit`: fade + height collapse (200ms ease-out)
      - Final state: `max-height: 0`, `opacity: 0`
  - [ ] Apply `.error-banner-enter` on initial render
  - [ ] Apply `.error-banner-exit` when `onDismiss` called; remove from DOM after animation completes
  - [ ] Use `--duration-normal` (200ms) token for consistency

- [ ] Task 5: Accessibility compliance (AC: #9)
  - [ ] Component has `role="alert"` + `aria-live="assertive"` for immediate announcement
  - [ ] Warning icon has `aria-hidden="true"` (icon is decorative; message text is the content)
  - [ ] Message text is plain, non-technical language
  - [ ] Component tested with screen reader simulation (NVDA/JAWS/VoiceOver)

- [ ] Task 6: Error message context/service (optional but recommended)
  - [ ] Consider creating a context provider `ErrorContext` to manage error state globally
  - [ ] Alternative: pass `showError` callback via props from App down to components (simpler for single-screen app)
  - [ ] For this story, props-based approach is sufficient; refactor to context only if managing many components

- [ ] Task 7: Frontend tests (AC: #10)
  - [ ] Co-located `error-banner.test.tsx`:
    - Renders with correct message for each action type
    - Auto-dismisses after 8 seconds (mock `setTimeout`)
    - Dismisses immediately on success (via `onDismiss` callback)
    - Replaces previous error when new error occurs while banner visible
    - Animation classes applied (`error-banner-enter`, `error-banner-exit`)
    - `role="alert"` + `aria-live="assertive"` present
  - [ ] Co-located test for App integration:
    - Mutation fails → error banner appears with correct message
    - Mutation succeeds → banner dismisses

- [ ] Task 8: Quality gates
  - [ ] Run `pnpm --filter frontend test` — all tests pass
  - [ ] Run `pnpm lint` — zero errors
  - [ ] Run `pnpm --filter frontend build` — builds successfully
  - [ ] Manual test: `pnpm dev`
    - Create mutation fails → error banner appears (message: create error)
    - Wait 8 seconds → banner auto-dismisses
    - Toggle mutation fails → error banner appears (message: toggle error)
    - Click any successful action → banner dismisses
    - Multiple errors: new error replaces old (only one banner visible)

## Dev Notes

### Scope boundaries (do not implement here)

- **No** dismissal via Escape key (Epic 4 Story 4.1 handles keyboard interactions)
- **No** manual close button on banner (auto-dismiss or success-dismiss only)
- **No** error queuing or stacking; only most recent error shown

### Technical requirements

- **Positioning:** Rendered between input and todo list in App layout.
- **Styling:** Use CSS variables (`--error-bg`, `--error`) and tokens for spacing/timing.
- **Animation:** Slide down on enter (200ms ease-out), fade out on exit (200ms ease-out).
- **Auto-dismiss:** 8-second timer; clears on next successful action.
- **Accessibility:** `role="alert"` + `aria-live="assertive"` for screen reader announcement.
- **Message templates:** Action-specific messages per AC #6, #7, #8.

### UX references

- Error banner styling, positioning, animation: UX-DR7 (positioned between input and list, --error-bg + --error text, 10px radius, ⚠ icon, action-specific message, slide-down enter 200ms ease-out, auto-dismiss after 8s or on success, replaces not stacks, `role="alert"` + `aria-live="assertive"`).
- Messages: "Couldn't add that task — check your connection and try again." (create), "Couldn't update that task — try again." (toggle), "Couldn't delete that task — try again." (delete).
- [Source: `_bmad-output/planning-artifacts/ux-design-specification.md`]

### File structure (expected new/changed)

| Path | Action |
|------|--------|
| `packages/frontend/src/components/error-banner.tsx` | **Create** |
| `packages/frontend/src/components/error-banner.test.tsx` | **Create** |
| `packages/frontend/src/styles/globals.css` | Add `.error-banner-enter`, `.error-banner-exit` animations |
| `packages/frontend/src/app.tsx` | Add error state, wire mutation error handlers |
| `packages/frontend/src/hooks/use-todos.ts` | Update mutations to call error handler (or pass callback from App) |

### Testing requirements

**Frontend (Vitest + RTL + user-event):**
- ErrorBanner component:
  - Renders with message prop
  - Auto-dismisses after 8 seconds (via mocked `setTimeout`)
  - Dismisses on `onDismiss` call
  - Animation classes applied
  - `role="alert"` + `aria-live="assertive"` attributes present
- App integration:
  - Create mutation error → error banner appears with create message
  - Toggle mutation error → error banner appears with toggle message
  - Delete mutation error → error banner appears with delete message
  - Success action → banner dismisses
  - Multiple errors: new error replaces previous

### Previous story intelligence (Story 2.1 & 2.2 — Toggle & Delete)

- Mutations established in Stories 2.1 and 2.2; error handlers need integration.
- Error banner is the centralized UI for displaying failures; integrates with existing mutation patterns.
- App component already renders input, list, and toast (from Story 2.2); error banner fits naturally between input and list.

### Git intelligence summary

- Recent commits: toggle (Story 2.1) + delete with undo (Story 2.2) merged.
- Error handling placeholders left in earlier stories; this story fills the gap.
- All mutations follow TanStack Query `useMutation` with `onError` callback; wire to error banner here.

### Latest technical notes (April 2026)

- **React 19 + hooks:** Use `useState` for error state; optional useEffect for auto-dismiss timer cleanup.
- **Tailwind v4 + CSS variables:** All colors/timing use design tokens; no hardcoded hex or ms values.
- **TypeScript 5.4+ strict mode:** Type error handlers and message templates; ensure action type is discriminated.

### MCP Servers for visual / debugging (Epic 2 use)

**Useful for error banner testing:**

1. **cursor-ide-browser** (in-IDE browser automation)
   - Use `browser_snapshot` to inspect error banner DOM structure (`role="alert"`, text content)
   - Use `browser_wait_for` to pause 8 seconds and verify auto-dismiss
   - Use `browser_take_screenshot` to visually confirm banner styling and position
   - Use `browser_highlight` to highlight the banner element during testing

2. **user-chrome-devtools** (Chrome DevTools integration)
   - Use `take_snapshot` to inspect banner attributes
   - Use `evaluate_script` to verify auto-dismiss timer state (e.g., check data attributes)
   - Use `take_screenshot` to visually confirm banner appearance and animations
   - Use `wait_for` to pause while timer counts down

**Suggested testing flow:**
- Unit tests via Vitest (coverage for all scenarios)
- Manual visual verification via `cursor-ide-browser` snapshots during dev
- Auto-dismiss timing verification via `browser_wait_for` or screenshot sequence

### Project context reference

- No `project-context.md` in repo; use architecture + epics + this file.

### References

- [Source: `_bmad-output/planning-artifacts/epics.md` — Epic 2, Story 2.3]
- [Source: `_bmad-output/planning-artifacts/ux-design-specification.md` — Error banner UX requirements]
- [Source: `_bmad-output/implementation-artifacts/2-1-toggle-todo-completion.md` — Mutation error handling pattern]
- [Source: `_bmad-output/implementation-artifacts/2-2-delete-todo-with-undo.md` — Delete error integration]

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

- 2026-04-08: Story 2.3 created — ready for dev implementation.

### Review Findings

(Pending code review after implementation)

## Story completion status

- **Status:** ready-for-dev
- **Note:** Comprehensive context engine analysis completed. Error banner component fully specified with accessibility, animations, message templates, and integration points for all mutations. Developer has everything needed for flawless implementation.
