---
stepsCompleted:
  - step-01-validate-prerequisites
  - step-02-design-epics
  - step-03-create-stories
  - step-04-final-validation
status: complete
completedAt: '2026-04-03'
inputDocuments:
  - _bmad-output/planning-artifacts/prd.md
  - _bmad-output/planning-artifacts/architecture.md
  - _bmad-output/planning-artifacts/ux-design-specification.md
---

# bmad-todo-app - Epic Breakdown

## Overview

This document provides the complete epic and story breakdown for bmad-todo-app, decomposing the requirements from the PRD, UX Design, and Architecture into implementable stories.

## Requirements Inventory

### Functional Requirements

- FR1: User can create a new todo by entering a text description and submitting with the Enter key.
- FR2: User can view all existing todos in a list.
- FR3: User can mark an active todo as complete.
- FR4: User can revert a completed todo back to active.
- FR5: User can delete a todo permanently.
- FR6: User can see a visual distinction between active and completed todos.
- FR7: User can optionally set a due date when creating a todo.
- FR8: User can add, change, or remove a due date on an existing todo.
- FR9: System displays overdue visual indicator on active todos whose due date is in the past.
- FR10: User can filter the todo list to show all todos, only active todos, or only completed todos.
- FR11: User can sort todos by due date (todos without a due date appear last).
- FR12: User can sort todos by completion status.
- FR13: System prevents creation of a todo with an empty or whitespace-only description.
- FR14: System displays a user-visible error message identifying the failed action when a network request fails.
- FR15: System preserves the visible todo list and user context when an error occurs.
- FR16: System displays a loading state while data is being fetched from the server.
- FR17: System displays an empty state message when no todos exist.
- FR18: System persists all todos to a backend database via REST API.
- FR19: System retrieves and displays all persisted todos when the application is loaded.
- FR20: For create, complete, uncomplete, and set/change due date, the server confirms success before the UI reflects the change. For delete, the UI may remove the item immediately (undo window); permanent removal only after undo expires and server confirms DELETE; failed DELETE restores the item.
- FR21: User can perform all actions (create, complete, uncomplete, delete, set due date, filter, sort) using only a keyboard.
- FR22: System provides screen reader-compatible markup for all interactive elements and state changes.
- FR23: System moves focus to the next item in the list after state-changing actions, or to the input field if the list is empty.
- FR24: All text and interactive elements meet WCAG 2.1 AA color contrast requirements.
- FR25: All touch targets meet minimum size requirements for mobile interaction (44x44px).
- FR26: User can access and use all features on screen widths from 320px (mobile) to desktop.
- FR27: System adapts layout and interaction targets across device sizes without horizontal scrolling, overlapping elements, or truncated interactive content.
- FR28: System can be built and run as a set of Docker containers via a single Docker Compose command.
- FR29: System data persists across container restarts.

### NonFunctional Requirements

- NFR1: API response time for all CRUD endpoints: < 200ms at p95 under normal load.
- NFR2: UI feedback on user actions (button state, loading indicators): < 100ms.
- NFR3: Initial page load to interactive state: < 2 seconds on standard broadband.
- NFR4: Client-side JavaScript bundle size: < 200KB gzipped.
- NFR5: All client-server communication must use HTTPS in production.
- NFR6: API inputs must be validated and sanitized server-side to prevent injection attacks.
- NFR7: No todo content logged in plain text on the server beyond operational debugging needs.
- NFR8: The API should not expose internal system details in error responses.
- NFR9: The data model must support future user-scoped isolation without structural changes.
- NFR10: WCAG 2.1 AA compliance across all interactive elements.
- NFR11: All functionality operable via keyboard alone.
- NFR12: Screen reader compatibility: semantic HTML, ARIA attributes where needed, live region announcements for dynamic state changes.
- NFR13: Minimum color contrast ratio of 4.5:1 for normal text, 3:1 for large text.
- NFR14: Minimum touch target size of 44x44px on mobile.
- NFR15: Logical focus order and visible focus indicators on all interactive elements.
- NFR16: Zero data loss on page refresh, browser restart, or container restart.
- NFR17: Database writes must be durable — confirmed writes must survive process crashes.
- NFR18: On network failure, the application must keep existing data visible, display an error message, and prevent silent data corruption.
- NFR19: Codebase must follow consistent naming conventions, file organization, and code formatting enforceable by a linter.
- NFR20: Frontend and backend must communicate exclusively through a documented REST API contract with no shared runtime dependencies.

### Additional Requirements

- Architecture specifies a Manual Scaffold (pnpm workspace) as the starter template — project initialization is the first implementation story
- pnpm workspace monorepo: `packages/frontend` and `packages/backend`
- TypeScript 5.4+ in strict mode across both packages with shared base `tsconfig.json`
- Biome 2.4.x for linting, formatting, and import sorting with pre-commit hook (simple-git-hooks or lefthook)
- Drizzle ORM (1.0.0-beta.19) with PostgreSQL 16.x; nullable `userId` column from V1 for future multi-tenancy
- Zod for server-side validation with Fastify JSON Schema integration and type inference
- TanStack Query for all frontend server state management (no raw useEffect + fetch)
- @fastify/cors and @fastify/helmet registered from Day One
- @fastify/swagger + @fastify/swagger-ui for auto-generated API documentation
- Consistent error response shape: `{ statusCode, error, message }` — Fastify's native format
- Vitest 4.1.x for unit and integration tests (both packages), @testing-library/react + @testing-library/user-event for frontend
- Playwright for end-to-end tests at workspace root
- QA infrastructure set up as part of initial scaffold (Day One)
- Docker deployment: Nginx (nginx:alpine) for frontend static serving + API proxy, Node (node:alpine) for backend, PostgreSQL (postgres:16-alpine) with named volume
- `.env` file for environment configuration with `.env.example` template; Fastify validates required vars on startup with Zod
- Co-located test files (`{source-file}.test.{ext}`), kebab-case file names, flat `components/` directory
- Native fetch wrapped in typed `api.ts` module — no separate HTTP library
- No client-side router (single-view app)
- Pino (Fastify built-in) for structured JSON logging
- Dev database via Docker container (`docker run postgres`); separate from Docker Compose deployment

### UX Design Requirements

- UX-DR1: Implement CSS variable design token system — 18+ color tokens (--background, --surface, --text-primary, --text-secondary, --text-completed, --accent, --accent-hover, --accent-subtle, --border, --border-focus, --success, --error, --error-bg, --overdue, --overdue-bg, --overdue-bar, --toast-bg, --toast-text, --active-bg, --active-bar, --completed-bg, --completed-bar), 5 typography scale tokens (--text-xl through --text-xs), 7 spacing tokens (--space-1 through --space-8), 5 animation timing tokens (--duration-fast 150ms, --duration-normal 200ms, --duration-smooth 250ms, --duration-enter 300ms, --duration-exit 200ms), 3 easing values (ease-out standard, ease-in exit, cubic-bezier(0.34,1.56,0.64,1) spring)
- UX-DR2: Build TodoCard component with 8 visual states — active (warm white bg + terracotta left bar), active+overdue (--overdue-bg + red left bar + "Overdue" badge), completed (muted stone bg + gray left bar + strikethrough + dimmed text + sage green checkbox), hovered-active/overdue/completed (elevated shadow), loading (pending indicator), animating in (slide+fade 300ms), animating out (slide+fade 200ms). Includes 3px left accent bar, due date badge with relative labels, conditional delete button visibility (hover on desktop, 50% opacity on mobile).
- UX-DR3: Build AddInput composite component — borderless input field with soft shadow, terracotta 2px focus ring + glow, placeholder "Add a new task...", calendar icon button (ghost style) for optional due date with Shadcn Calendar+Popover, 50x50 terracotta add button with white "+", wrapped in `<form>` for native Enter submission. On success: clear input + due date, refocus. On failure: retain text + date, show error banner.
- UX-DR4: Build FilterTabs component — full-width segmented tab bar (All / Active / Completed) with equal-width buttons, 2px terracotta underline on active tab that animates between positions, `role="tablist"` with `role="tab"` children, `aria-selected`, Left/Right arrow keyboard navigation, `aria-live="polite"` announcing count on filter change.
- UX-DR5: Build SortRow component — "Sort by" label + "Due ↓" and "Status ↕" options with vertical divider, subtle background strip, `role="toolbar"` with `aria-label="Sort options"`, `aria-pressed` on sort buttons. Status sort hidden when filter is Active or Completed. "Due ↓" sorts soonest first with nulls last. "Status ↕" toggles active-first / completed-first.
- UX-DR6: Build EmptyState component — 4 context-specific variants: (1) No todos: ☑ icon + "No tasks yet" + "Type above and press Enter (or tap +) to add your first task.", (2) No active: 🔍 + "No active tasks" + "Add a task above to get started.", (3) No completed: 🔍 + "No completed tasks" + "Tasks you complete will appear here.", (4) Load failure: ⚠ + "Couldn't load your tasks" + "Check your connection and try again." Container: `role="status"`, `aria-live="polite"`, centered with --space-8 padding.
- UX-DR7: Build ErrorBanner component — positioned between input and todo list, --error-bg background + --error text, 10px radius, warning icon (⚠) + action-specific message text, slide-down enter animation (200ms ease-out), auto-dismiss after 8s or next successful action, replaces (not stacks) previous error, `role="alert"` with `aria-live="assertive"`. Messages: create="Couldn't add that task — check your connection and try again.", toggle="Couldn't update that task — try again.", delete="Couldn't delete that task — try again.", load="Couldn't load your tasks — check your connection and try again."
- UX-DR8: Build UndoToast component — dark warm gray (--toast-bg) background, warm white (--toast-text) text, terracotta "Undo" link, 12px radius, 5s auto-dismiss timer, slide-up enter (200ms ease-out), fade exit (200ms ease-out), only one toast visible at a time (new delete replaces previous), positioned bottom-center.
- UX-DR9: Implement skeleton loading system — card-shaped skeletons matching TodoCard dimensions (rounded cards with checkbox placeholder), warm border color, pulsing opacity animation (0.25→0.5, 1500ms ease-in-out continuous), crossfade transition (250ms ease-out) to real cards when data loads. Static placeholder when prefers-reduced-motion is active.
- UX-DR10: Implement 13 specific animations: card enter (slide+fade 300ms ease-out), card exit/delete (slide right+fade 200ms ease-in), card exit/filter (fade+height collapse 250ms ease-out), checkbox toggle (fill+color 200ms ease-out), complete transition (multi-property bg/bar/text/strikethrough 200ms ease-out), filter tab underline (slide 200ms ease-out), list reorder/sort (position 250ms ease-out), skeleton pulse (opacity 1500ms ease-in-out loop), skeleton→cards crossfade (250ms ease-out), toast enter (slide up 200ms ease-out), toast exit (fade 200ms ease-out), error banner enter (slide down+height 200ms ease-out), error banner exit (fade+height 200ms ease-out).
- UX-DR11: Implement `prefers-reduced-motion` support — all animation durations set to 0ms when user preference is active, skeleton pulse replaced with static placeholder, no animation required to understand any UI state.
- UX-DR12: Implement undo-delete pattern — on delete click: optimistic card removal via TanStack Query `queryClient.setQueryData`, show undo toast with 5s timer. On undo tap: restore card via `setQueryData`, cancel timer, no API call. On timer expiry: fire `DELETE /api/todos/:id`. On API failure after expiry: restore card + show error banner.
- UX-DR13: Implement responsive breakpoints — base/mobile (0–767px): full-width, 16px side padding, delete button visible at 50% opacity, no input auto-focus; md/tablet (768px+): 24px padding, max-width container; lg/desktop (1024px+): 640px max-width centered, hover states on cards, auto-focus input, delete button hidden until hover.
- UX-DR14: Implement focus management — `:focus-visible` 2px terracotta outline + subtle glow shadow on all interactive elements, tab order: input → add button → filter tabs → sort → todo items (checkbox → due date → delete), after delete focus moves to next item checkbox or input if list empty, after completion toggle focus remains on checkbox.
- UX-DR15: Implement ARIA live regions — `aria-live="polite"` region for: task added announcement, filter change count ("[N] tasks shown"), `aria-live="assertive"` for: error banner messages. Screen reader labels: add button "Add task", delete button "Delete [task text]", checkbox "Mark [task text] as complete/active", due date "Set/Change due date for [task text]".

### FR Coverage Map

| FR | Epic | Description |
|---|---|---|
| FR1 | Epic 1 | Create todo with Enter key |
| FR2 | Epic 1 | View all todos in a list |
| FR3 | Epic 2 | Mark todo as complete |
| FR4 | Epic 2 | Revert completed todo to active |
| FR5 | Epic 2 | Delete todo permanently |
| FR6 | Epic 2 | Visual distinction active vs completed |
| FR7 | Epic 3 | Optional due date at creation |
| FR8 | Epic 3 | Add/change/remove due date on existing |
| FR9 | Epic 3 | Overdue visual indicator |
| FR10 | Epic 3 | Filter by all/active/completed |
| FR11 | Epic 3 | Sort by due date |
| FR12 | Epic 3 | Sort by completion status |
| FR13 | Epic 1 | Prevent empty todo creation |
| FR14 | Epic 2 | Error message on network failure |
| FR15 | Epic 2 | Preserve list on error |
| FR16 | Epic 1 | Loading state during fetch |
| FR17 | Epic 1 | Empty state when no todos |
| FR18 | Epic 1 | Persist todos via REST API |
| FR19 | Epic 1 | Retrieve todos on load |
| FR20 | Epic 1, Epic 2 | Sync UI for create/toggle/due date (Epic 1); delete + undo-deferred DELETE (Epic 2) |
| FR21 | Epic 4 | Keyboard-only operation |
| FR22 | Epic 4 | Screen reader markup |
| FR23 | Epic 4 | Focus management after actions |
| FR24 | Epic 4 | WCAG AA color contrast |
| FR25 | Epic 4 | 44x44px touch targets |
| FR26 | Epic 4 | 320px to desktop support |
| FR27 | Epic 4 | Adaptive layout without breakage |
| FR28 | Epic 5 | Docker Compose build and run |
| FR29 | Epic 5 | Data persists across restarts |

## Epic List

### Epic 1: Project Foundation & First Todo
The user can open the app and create their first todo — the "Hello World" moment. This epic scaffolds the entire monorepo, database, and API, then delivers the minimum viable interaction: type a task, press Enter, see it appear in a persistent list.
**FRs covered:** FR1, FR2, FR13, FR16, FR17, FR18, FR19, FR20 (sync create/load path; FR20 delete portion completed in Epic 2)

### Epic 2: Complete Task Lifecycle
The user can manage their tasks through the full lifecycle — complete, uncomplete, delete with undo safety net, and see clear visual distinction between active and completed items. After this epic, Journey 1 and Journey 2 from the PRD are fully supported.
**FRs covered:** FR3, FR4, FR5, FR6, FR14, FR15, FR20 (delete + undo-deferred removal)

### Epic 3: Due Dates & Organization
The user can set due dates, see overdue indicators, and organize their list through filtering and sorting. This transforms the app from a simple list into a real task management tool.
**FRs covered:** FR7, FR8, FR9, FR10, FR11, FR12

### Epic 4: Polish, Accessibility & Responsive Design
The app works beautifully across all devices with full accessibility support. Animations, keyboard navigation, screen reader support, focus management, and responsive layouts transform the functional app into a polished product.
**FRs covered:** FR21, FR22, FR23, FR24, FR25, FR26, FR27

### Epic 5: Production Deployment
The app is containerized and deployable with a single command. Docker Compose orchestrates frontend, backend, and database with persistent storage.
**FRs covered:** FR28, FR29

## Epic 1: Project Foundation & First Todo

The user can open the app and create their first todo — the "Hello World" moment. This epic scaffolds the entire monorepo, database, and API, then delivers the minimum viable interaction: type a task, press Enter, see it appear in a persistent list.

### Story 1.1: Monorepo Scaffold & Tooling Setup

As a user,
I want the app to live in a single repo with shared TypeScript tooling, linting, and tests wired from day one,
So that the product stays consistent and regressions are caught before they reach me.

*(Foundation story — work is mostly technical setup; the benefit is reliability and speed of future delivery.)*

**Acceptance Criteria:**

**Given** the repository root
**When** the scaffold is complete
**Then** a `pnpm-workspace.yaml` exists with `packages: ['packages/*']`
**And** `packages/frontend/` is a Vite + React + TypeScript project (from `pnpm create vite@latest --template react-ts`)
**And** `packages/backend/` is initialized with `package.json` and TypeScript
**And** a shared `tsconfig.base.json` exists at root with strict mode enabled
**And** each package's `tsconfig.json` extends the base config
**And** `biome.json` exists at workspace root with lint, format, and import sorting rules
**And** `pnpm biome check` passes with zero errors on both packages
**And** Vitest is configured in both packages with a test script (`pnpm test`)
**And** `@testing-library/react` and `@testing-library/user-event` are installed in the frontend package
**And** Playwright is configured at workspace root in `e2e/` with a placeholder test
**And** a root `pnpm dev` script starts both frontend and backend concurrently
**And** a root `pnpm build` script builds both packages
**And** a `.env.example` file exists documenting required environment variables

### Story 1.2: Backend API & Database Foundation

As a user,
I want my todos stored in a proper database behind a secure, documented HTTP API,
So that my list survives refreshes and the system can grow (e.g. accounts later) without rebuilding storage from scratch.

*(Foundation story — delivers the persistence layer before the UI can show real data.)*

**Acceptance Criteria:**

**Given** the backend package
**When** the server starts
**Then** Fastify 5.x listens on the configured port (default 3000)
**And** @fastify/cors, @fastify/helmet, and @fastify/swagger + @fastify/swagger-ui plugins are registered
**And** Swagger UI is accessible at `/documentation`
**And** a global error handler normalizes errors to `{ statusCode, error, message }` format
**And** environment variables are validated on startup via Zod schema (DATABASE_URL required)

**Given** the Drizzle schema
**When** the `todos` table is defined
**Then** it has columns: `id` (UUID, primary key, default generated), `description` (text, not null), `is_completed` (boolean, default false), `created_at` (timestamp, default now), `due_date` (date, nullable), `user_id` (UUID, nullable — for future multi-tenancy)
**And** Drizzle Kit can generate a migration from the schema
**And** `drizzle-kit migrate` applies the migration to the database

**Given** a running PostgreSQL container for development
**When** the backend starts with a valid `DATABASE_URL`
**Then** the Drizzle connection pool is established and queries execute successfully

### Story 1.3: Todo CRUD API Endpoints

As a user,
I want API endpoints that create and retrieve todos,
So that my tasks are persisted and available across sessions.

**Acceptance Criteria:**

**Given** the backend API is running
**When** I send `POST /api/todos` with body `{ "description": "Buy groceries" }`
**Then** a new todo is created in the database with `isCompleted: false`, `createdAt` set to current timestamp, and `dueDate: null`
**And** the response is `201` with the full todo object `{ id, description, isCompleted, createdAt, dueDate }`
**And** all JSON fields use camelCase naming

**Given** the backend API is running
**When** I send `POST /api/todos` with body `{ "description": "" }` or `{ "description": "   " }`
**Then** the response is `400` with `{ statusCode: 400, error: "Bad Request", message: "Description is required" }`
**And** no record is created in the database

**Given** todos exist in the database
**When** I send `GET /api/todos`
**Then** the response is `200` with an array of all todo objects
**And** each object contains `{ id, description, isCompleted, createdAt, dueDate }`

**Given** no todos exist in the database
**When** I send `GET /api/todos`
**Then** the response is `200` with an empty array `[]`

**Given** a Zod validation schema for `CreateTodoBody`
**When** a request body does not match the schema
**Then** the response is `400` with a descriptive validation error message
**And** no internal server details are exposed

**Given** the todo CRUD endpoints
**When** tests are run
**Then** co-located integration tests in `todo-routes.test.ts` verify all endpoint behaviors above

### Story 1.4: Frontend Foundation with Design Tokens

As a user,
I want a visually polished app shell that loads instantly,
So that I see a complete-looking interface before any data arrives.

**Acceptance Criteria:**

**Given** the frontend package
**When** the app loads in a browser
**Then** the app shell renders immediately: header with app title and count badge placeholder, input area, and list area
**And** Tailwind CSS v4 is configured with the `@tailwindcss/vite` plugin
**And** CSS variable design tokens are defined in `styles/globals.css` for all color tokens (--background, --surface, --text-primary, --text-secondary, --text-completed, --accent, --accent-hover, --accent-subtle, --border, --border-focus, --success, --error, --error-bg, --active-bg, --active-bar, --completed-bg, --completed-bar, --toast-bg, --toast-text, --overdue, --overdue-bg, --overdue-bar), typography tokens (--text-xl through --text-xs), spacing tokens (--space-1 through --space-8), and animation timing tokens (--duration-fast through --duration-exit)
**And** the system font stack is set as the base font-family
**And** the page has a warm stone background (`--background`) with a centered container (max-width 640px)
**And** Shadcn/ui is initialized and the required base primitives (Button, Input) are available in `components/ui/`

**Given** the design tokens are defined
**When** any component references a visual property
**Then** it uses CSS variable tokens — no raw hex colors, pixel values for spacing, or hardcoded timing values

### Story 1.5: Create Todo & View List

As a user,
I want to type a task and press Enter to add it to my list,
So that I can capture tasks the moment I think of them.

**Acceptance Criteria:**

**Given** the app is loaded and the input field is visible
**When** I type "Buy groceries" and press Enter
**Then** a loading indicator appears within 100ms
**And** the API call `POST /api/todos` fires with `{ "description": "Buy groceries" }`
**And** on success, the new todo card appears in the list with active styling (warm white background, terracotta left bar, task text in `--text-primary`)
**And** the input field clears and regains focus for the next entry

**Given** the app is loaded and the input field is visible
**When** I click the terracotta "+" add button
**Then** the form submits the same way as pressing Enter

**Given** the input field is empty or contains only whitespace
**When** I press Enter or click "+"
**Then** nothing happens — no API call fires, no error is shown

**Given** the app is loaded
**When** todos exist in the database
**Then** all todos are fetched via `GET /api/todos` and displayed in the list as cards
**And** each card shows the task description text

**Given** the app is loaded
**When** no todos exist
**Then** the empty state is shown: ☑ icon, "No tasks yet", "Type above and press Enter (or tap +) to add your first task."

**Given** the app is loading data from the API
**When** the fetch is in progress
**Then** skeleton card placeholders are displayed in the list area (pulsing animation, card-shaped, matching TodoCard dimensions)
**And** on success, skeletons crossfade to real cards (250ms transition)

**Given** the frontend data layer
**When** any todo data is fetched or mutated
**Then** TanStack Query manages the server state (`useQuery(['todos'])` for fetching, `useMutation` for creating)
**And** the typed API client in `lib/api.ts` wraps native `fetch` with `getTodos()` and `createTodo()` functions
**And** the Vite dev server proxies `/api/*` requests to the backend

**Given** all frontend components created in this story
**When** tests are run
**Then** co-located tests verify: AddInput renders and submits, TodoList displays items, EmptyState renders, skeleton loading appears during fetch

## Epic 2: Complete Task Lifecycle

The user can manage their tasks through the full lifecycle — complete, uncomplete, delete with undo safety net, and see clear visual distinction between active and completed items. After this epic, Journey 1 and Journey 2 from the PRD are fully supported.

### Story 2.1: Toggle Todo Completion (API + Frontend)

As a user,
I want to click a checkbox to mark a todo as complete or revert it back to active,
So that I can track my progress and correct mistakes.

**Acceptance Criteria:**

**Given** the backend API is running
**When** I send `PATCH /api/todos/:id` with body `{ "isCompleted": true }`
**Then** the todo's `is_completed` column is updated to `true` in the database
**And** the response is `200` with the full updated todo object

**Given** the backend API is running
**When** I send `PATCH /api/todos/:id` with body `{ "isCompleted": false }`
**Then** the todo's `is_completed` column is updated to `false`
**And** the response is `200` with the full updated todo object

**Given** the backend API is running
**When** I send `PATCH /api/todos/:id` where `:id` does not exist
**Then** the response is `404` with `{ statusCode: 404, error: "Not Found", message: "Todo not found" }`

**Given** an active todo is displayed in the list
**When** I click the checkbox
**Then** the checkbox shows a pending state within 100ms
**And** on success, the card transitions smoothly (200ms ease-out): background shifts to muted stone (`--completed-bg`), left bar shifts to gray (`--completed-bar`), text gets strikethrough + dimmed color (`--text-completed`), checkbox fills with sage green and shows a checkmark

**Given** a completed todo is displayed in the list
**When** I click the checkbox
**Then** the transition reverses: background shifts to warm white (`--active-bg`), left bar shifts to terracotta (`--active-bar`), strikethrough is removed, text returns to `--text-primary`, checkbox empties

**Given** a toggle API call fails
**When** the server returns an error
**Then** the checkbox reverts to its previous state
**And** an error banner appears: "Couldn't update that task — try again."

**Given** the toggle functionality
**When** tests are run
**Then** co-located tests for `todo-routes.test.ts` verify PATCH endpoint behaviors
**And** frontend tests verify checkbox interaction and state transitions

### Story 2.2: Delete Todo with Undo

As a user,
I want to delete a todo with the ability to undo within a few seconds,
So that I can remove tasks confidently without fear of accidental loss.

**Acceptance Criteria:**

**Given** the backend API is running
**When** I send `DELETE /api/todos/:id`
**Then** the todo is permanently removed from the database
**And** the response is `204 No Content`

**Given** the backend API is running
**When** I send `DELETE /api/todos/:id` where `:id` does not exist
**Then** the response is `404` with `{ statusCode: 404, error: "Not Found", message: "Todo not found" }`

**Given** a todo is displayed in the list
**When** I click the delete button (✕)
**Then** the card animates out immediately (slide right + fade, 200ms ease-in) — this is an optimistic removal
**And** the undo toast appears at the bottom center: dark warm gray background (`--toast-bg`), white text ("Task deleted"), terracotta "Undo" link, 12px radius
**And** the toast has a 5-second auto-dismiss timer

**Given** the undo toast is visible
**When** I click "Undo" before the timer expires
**Then** the deleted card animates back into the list (slide + fade, 300ms ease-out)
**And** the toast dismisses
**And** no `DELETE` API call is sent

**Given** the undo toast is visible
**When** the 5-second timer expires without "Undo" being clicked
**Then** the toast auto-dismisses (fade, 200ms ease-out)
**And** the `DELETE /api/todos/:id` API call fires

**Given** the DELETE API call fires after the undo timer expires
**When** the API call fails
**Then** the deleted card reappears in the list with a slide-in animation
**And** an error banner appears: "Couldn't delete that task — try again."

**Given** a second todo is deleted while an undo toast is already visible
**When** the new delete occurs
**Then** the previous undo toast is replaced by the new one (only one toast visible at a time)
**And** the previous delete's API call fires immediately (timer expired early)

**Given** the delete button on desktop
**When** the user is not hovering over a card
**Then** the delete button is hidden

**Given** the delete button on desktop
**When** the user hovers over a card
**Then** the delete button appears

**Given** the app is viewed on a touch device (mobile/tablet)
**When** cards are displayed
**Then** the delete button is always visible at 50% opacity

**Given** the delete functionality
**When** tests are run
**Then** co-located tests for `todo-routes.test.ts` verify DELETE endpoint
**And** frontend tests verify: optimistic removal, undo restores card, timer fires API call, error restores card

### Story 2.3: Error Banner Component

As a user,
I want clear, non-disruptive error messages when something goes wrong,
So that I understand what failed and can try again without losing my place.

**Acceptance Criteria:**

**Given** an API call fails (create, toggle, or delete)
**When** the error banner appears
**Then** it is positioned between the input area and the todo list
**And** it has `--error-bg` background, `--error` text color, 10px border radius
**And** it contains a warning icon (⚠) and an action-specific message
**And** it slides down into position (200ms ease-out)

**Given** the error banner is visible
**When** 8 seconds pass without another error
**Then** the banner auto-dismisses with a fade animation (200ms ease-out)

**Given** the error banner is visible
**When** the next API call succeeds (any action)
**Then** the banner dismisses immediately

**Given** an error occurs while the error banner is already showing a previous error
**When** the new error is displayed
**Then** the previous error is replaced — only the most recent error is shown (no stacking)

**Given** error messages
**When** a create fails
**Then** the message reads: "Couldn't add that task — check your connection and try again."

**Given** error messages
**When** a toggle fails
**Then** the message reads: "Couldn't update that task — try again."

**Given** error messages
**When** a delete fails (after undo expired)
**Then** the message reads: "Couldn't delete that task — try again."

**Given** the error banner
**When** rendered
**Then** it has `role="alert"` and `aria-live="assertive"` for immediate screen reader announcement

**Given** the error banner component
**When** tests are run
**Then** co-located tests verify: renders with correct message per action type, auto-dismisses after 8s, dismisses on success, replaces previous error

## Epic 3: Due Dates & Organization

The user can set due dates, see overdue indicators, and organize their list through filtering and sorting. This transforms the app from a simple list into a real task management tool.

### Story 3.1: Due Date Support (API + TodoCard)

As a user,
I want to set, change, or remove a due date on my todos,
So that I can track when tasks need to be completed.

**Acceptance Criteria:**

**Given** the backend API is running
**When** I send `POST /api/todos` with body `{ "description": "File taxes", "dueDate": "2026-04-15" }`
**Then** the todo is created with `dueDate` set to `"2026-04-15"`
**And** the response includes `dueDate: "2026-04-15"`

**Given** the backend API is running
**When** I send `POST /api/todos` with body `{ "description": "Buy milk" }` (no dueDate field)
**Then** the todo is created with `dueDate: null`

**Given** an existing todo
**When** I send `PATCH /api/todos/:id` with body `{ "dueDate": "2026-05-01" }`
**Then** the todo's due date is updated to `"2026-05-01"`
**And** the response is `200` with the updated todo

**Given** an existing todo with a due date
**When** I send `PATCH /api/todos/:id` with body `{ "dueDate": null }`
**Then** the todo's due date is cleared (set to null)
**And** the response is `200` with the updated todo

**Given** the AddInput component
**When** I click the calendar icon button
**Then** a date picker popover opens (Shadcn Calendar + Popover)
**And** I can select a date for the new todo
**And** the calendar button shows the selected date label instead of the icon
**And** submitting the form creates the todo with the selected due date

**Given** the AddInput component with a date selected
**When** the todo is successfully created
**Then** the input clears, the due date resets (calendar returns to icon), and the input refocuses

**Given** a todo card with a due date
**When** the card is displayed
**Then** a due date badge appears below the task text in 11px secondary text
**And** the badge shows a relative label: "Today", "Tomorrow", "Apr 5", etc.

**Given** a todo card with a due date
**When** I click the due date badge
**Then** a date picker popover opens anchored to the card
**And** I can change or clear the due date
**And** the change fires a `PATCH /api/todos/:id` with the new `dueDate` value (synchronous — waits for confirmation)
**And** on success, the badge updates smoothly
**And** on failure, the badge reverts to the previous date and an error banner appears

**Given** a todo card without a due date
**When** the card is displayed
**Then** a small calendar icon is shown in the due date area for setting a date

**Given** an active todo whose due date is in the past
**When** the card is displayed
**Then** the card background shifts to `--overdue-bg`, the left bar becomes `--overdue-bar` (muted red), and the due date badge displays "Overdue" in `--overdue` color

**Given** a completed todo whose due date is in the past
**When** the card is displayed
**Then** no overdue styling is applied — completed todos never show overdue indicators

**Given** the due date functionality
**When** tests are run
**Then** backend tests verify PATCH with dueDate, POST with optional dueDate
**And** frontend tests verify: date picker opens, due date badge renders with relative labels, overdue styling applies for active past-due items, overdue styling does not apply for completed items

### Story 3.2: Filter Todos by Status

As a user,
I want to filter my list to show all, only active, or only completed todos,
So that I can focus on what matters right now.

**Acceptance Criteria:**

**Given** the app is loaded with a mix of active and completed todos
**When** the FilterTabs component renders
**Then** three equal-width tabs are displayed: "All", "Active", "Completed"
**And** the "All" tab is active by default with a 2px terracotta underline
**And** the tabs span the full width of the container

**Given** the "All" filter is active
**When** I click the "Active" tab
**Then** the underline animates to the "Active" tab position (200ms ease-out)
**And** completed items animate out of the list (fade + height collapse, 250ms ease-out)
**And** only active items remain visible

**Given** the "All" filter is active
**When** I click the "Completed" tab
**Then** the underline animates to the "Completed" tab position
**And** active items animate out of the list
**And** only completed items remain visible

**Given** any filter is active
**When** I click the "All" tab
**Then** all items animate back into the list

**Given** the "Active" filter is active
**When** no active todos exist
**Then** the filtered empty state appears: 🔍 icon, "No active tasks", "Add a task above to get started."

**Given** the "Completed" filter is active
**When** no completed todos exist
**Then** the filtered empty state appears: 🔍 icon, "No completed tasks", "Tasks you complete will appear here."

**Given** the FilterTabs component
**When** rendered
**Then** the container has `role="tablist"`
**And** each tab has `role="tab"` with `aria-selected="true/false"` and `aria-controls="todo-list"`

**Given** the filter state
**When** filtering is applied client-side
**Then** the filter state is managed via React `useState` in the app component — no API calls for filtering

**Given** the filter functionality
**When** tests are run
**Then** co-located tests verify: tabs render, active tab styling, filter correctly shows/hides items, empty states display per filter

### Story 3.3: Sort Todos

As a user,
I want to sort my todos by due date or completion status,
So that I can prioritize what needs attention first.

**Acceptance Criteria:**

**Given** the app is loaded with todos
**When** the SortRow component renders
**Then** it appears below the filter tabs with a subtle background strip
**And** it shows "Sort by" label in uppercase small secondary text
**And** "Due ↓" and "Status ↕" options are displayed with a vertical divider between them
**And** "Due ↓" is the active (default) sort with highlighted styling

**Given** the "Due ↓" sort is active
**When** todos are displayed
**Then** todos are sorted by due date, soonest first
**And** todos without a due date appear last in the list

**Given** the "Due ↓" sort is active
**When** I click "Status ↕"
**Then** "Status ↕" becomes the active sort (highlighted styling)
**And** the list reorders with smooth animation (250ms ease-out): active items group first, completed items group below

**Given** "Status ↕" is active showing active-first order
**When** I click "Status ↕" again
**Then** the order toggles: completed items group first, active items group below

**Given** the filter is set to "Active" or "Completed"
**When** the SortRow renders
**Then** the "Status ↕" sort option is hidden (only "Due ↓" is shown — status sort is redundant when already filtered)

**Given** the filter is set to "All"
**When** the SortRow renders
**Then** both "Due ↓" and "Status ↕" sort options are shown

**Given** the SortRow component
**When** rendered
**Then** the container has `role="toolbar"` with `aria-label="Sort options"`
**And** each sort button has `role="button"` with `aria-pressed="true/false"`

**Given** the sort state
**When** sorting is applied client-side
**Then** the sort state is managed via React `useState` in the app component — no API calls for sorting

**Given** the sort functionality
**When** tests are run
**Then** co-located tests verify: sort row renders, active sort styling, due date sort order (nulls last), status sort toggle, status sort hidden when filtered

## Epic 4: Polish, Accessibility & Responsive Design

The app works beautifully across all devices with full accessibility support. Animations, keyboard navigation, screen reader support, focus management, and responsive layouts transform the functional app into a polished product.

### Story 4.1: Keyboard Navigation & Focus Management

As a user who navigates with a keyboard,
I want to perform all actions without a mouse,
So that the app is fully usable with keyboard alone.

**Acceptance Criteria:**

**Given** the app is loaded on desktop
**When** I press Tab repeatedly
**Then** focus moves through interactive elements in logical order: input field → calendar button → add button → filter tabs → sort options → todo items (within each item: checkbox → due date control → delete button)
**And** Shift+Tab reverses the order

**Given** any interactive element is focused
**When** it receives focus via keyboard (`:focus-visible`)
**Then** a 2px terracotta outline with subtle glow shadow appears around the element
**And** the focus ring uses `outline` (not `border`) to avoid layout shifts

**Given** any interactive element is clicked with a mouse
**When** it receives focus via mouse click
**Then** no focus ring is shown (`:focus-visible` only, not `:focus`)

**Given** the input field is focused
**When** I press Enter
**Then** the form submits (create todo)

**Given** a checkbox is focused
**When** I press Space
**Then** the completion status toggles

**Given** a delete button is focused
**When** I press Enter or Space
**Then** the delete action triggers (with undo toast)

**Given** the FilterTabs component is focused
**When** I press Left/Right arrow keys
**Then** focus moves between filter tabs
**And** pressing Enter or Space activates the focused tab

**Given** the SortRow toolbar is focused
**When** I press Left/Right arrow keys
**Then** focus moves between sort options
**And** pressing Enter or Space activates the focused option

**Given** a todo is deleted
**When** the card is removed from the list
**Then** focus moves to the next item's checkbox in the list
**And** if the deleted item was the last one and the list is now empty, focus moves to the input field

**Given** a todo's completion is toggled
**When** the transition completes
**Then** focus remains on the same checkbox

**Given** the undo toast is visible
**When** I press Escape
**Then** the toast dismisses (and the delete API fires if timer hasn't expired)

**Given** all keyboard interactions
**When** tests are run
**Then** tests verify: tab order, focus ring visibility on keyboard focus only, arrow key navigation in tabs/toolbar, focus movement after delete, Escape dismisses toast

### Story 4.2: Screen Reader Support & ARIA

As a user who relies on a screen reader,
I want all content and state changes announced properly,
So that I can use the app with full context and confidence.

**Acceptance Criteria:**

**Given** the app is loaded
**When** a screen reader reads the page
**Then** all semantic HTML is used: `<form>` for input, `<ul>` for todo list, `<li>` for each item, `<button>` for all clickable elements, `<input>` for the text field

**Given** the add button (icon-only)
**When** a screen reader encounters it
**Then** it announces "Add task" via `aria-label="Add task"`

**Given** a todo item's delete button (icon-only)
**When** a screen reader encounters it
**Then** it announces "Delete [task text]" via `aria-label="Delete [task text]"`

**Given** a todo item's checkbox
**When** a screen reader encounters it on an active item
**Then** it announces "Mark [task text] as complete"
**And** on a completed item, it announces "Mark [task text] as active"

**Given** a todo item's due date control
**When** a screen reader encounters it
**Then** it announces "Set due date for [task text]" (if no date) or "Change due date for [task text]" (if date exists)

**Given** the FilterTabs component
**When** a screen reader encounters it
**Then** the container is announced as a tablist
**And** each tab announces its selected state via `aria-selected`

**Given** the filter is changed
**When** the list updates
**Then** an `aria-live="polite"` region announces "[N] tasks shown"

**Given** a todo is successfully created
**When** the mutation succeeds
**Then** an `aria-live="polite"` region announces "Task added"

**Given** an error occurs
**When** the error banner appears
**Then** it is immediately announced via `role="alert"` with `aria-live="assertive"`

**Given** the SortRow component
**When** a screen reader encounters it
**Then** the container announces as a toolbar with `aria-label="Sort options"`
**And** each sort button announces its pressed state via `aria-pressed`

**Given** all ARIA and screen reader behaviors
**When** tests are run
**Then** tests verify: all ARIA labels present on icon-only buttons, aria-selected on filter tabs, aria-pressed on sort buttons, aria-live regions exist for announcements, role="alert" on error banner

### Story 4.3: Responsive Layout & Touch Targets

As a user on a mobile device,
I want the app to adapt to my screen size with appropriately sized touch targets,
So that I can use all features comfortably on any device.

**Acceptance Criteria:**

**Given** the app is loaded on a mobile device (screen width 320px–767px)
**When** the layout renders
**Then** the page uses full width with 16px horizontal padding
**And** the input field is not auto-focused (avoids unwanted keyboard popup)
**And** the delete button on each card is always visible at 50% opacity
**And** all interactive elements have a minimum touch target area of 44x44px (including checkbox, delete button, filter tabs, sort buttons, add button, calendar button)
**And** where visual size is smaller than 44px (e.g., checkbox icon), the tappable area extends via padding

**Given** the app is loaded on a tablet (screen width 768px–1023px)
**When** the layout renders
**Then** horizontal padding increases to 24px
**And** the max-width container begins to center
**And** delete buttons are always visible (touch devices can't hover)
**And** all 44px touch targets are maintained

**Given** the app is loaded on a desktop (screen width 1024px+)
**When** the layout renders
**Then** the content area is centered at max-width 640px
**And** extra screen space becomes whitespace (reinforces calm/focus)
**And** the input field auto-focuses on page load
**And** hover states are active on all cards (elevation increase on hover)
**And** delete buttons are hidden until card hover

**Given** any screen width from 320px to desktop
**When** the app is used
**Then** there is no horizontal scrolling
**And** no elements overlap or are truncated
**And** the layout is single-column throughout

**Given** the responsive layout
**When** CSS is inspected
**Then** mobile-first responsive classes are used (base styles target mobile, `md:` and `lg:` prefixes for tablet/desktop)
**And** the container uses Tailwind `max-w-[640px] mx-auto`

**Given** all responsive behaviors
**When** tests are run
**Then** tests verify: touch targets meet 44px minimum, layout adapts at breakpoints, no horizontal overflow at 320px

### Story 4.4: Animation Polish & Reduced Motion

As a user,
I want smooth, polished animations on all interactions,
So that the app feels alive and premium — or instant transitions if I prefer reduced motion.

**Acceptance Criteria:**

**Given** any component with state transitions
**When** the transition occurs
**Then** it uses the defined animation timing tokens: `--duration-fast` (150ms) for hover/focus, `--duration-normal` (200ms) for checkbox/card property changes, `--duration-smooth` (250ms) for list reorder/filter/crossfade, `--duration-enter` (300ms) for card appear, `--duration-exit` (200ms) for card remove

**Given** any animation
**When** it plays
**Then** it uses the appropriate easing: standard transitions use `ease-out`, exit animations use `ease-in`, card appear uses `cubic-bezier(0.34, 1.56, 0.64, 1)` for a slight spring overshoot

**Given** the complete animation inventory
**When** all 13 animations are implemented
**Then** card enter: slides down + fades in (300ms ease-out with spring)
**And** card exit/delete: slides right + fades out (200ms ease-in)
**And** card exit/filter: fades + height collapses (250ms ease-out)
**And** checkbox toggle: fill + color transition (200ms ease-out)
**And** complete transition: background, bar color, text color, strikethrough all transition simultaneously (200ms ease-out)
**And** filter tab underline: slides horizontally between positions (200ms ease-out)
**And** list reorder/sort: items move to new positions (250ms ease-out)
**And** skeleton pulse: continuous opacity loop 0.25→0.5 (1500ms ease-in-out)
**And** skeleton→cards: crossfade (250ms ease-out)
**And** toast enter: slides up from below (200ms ease-out)
**And** toast exit: fades out (200ms ease-out)
**And** error banner enter: slides down + height expands (200ms ease-out)
**And** error banner exit: fades + height collapses (200ms ease-out)

**Given** the user has `prefers-reduced-motion: reduce` enabled in their OS settings
**When** any animation would play
**Then** all transition durations are set to 0ms (instant state changes)
**And** the skeleton loading pulse is replaced with a static placeholder
**And** all UI states remain fully understandable without animation

**Given** all animations
**When** they play
**Then** no animation exceeds 300ms duration
**And** exit animations are faster than enter animations (200ms vs 300ms)

**Given** the animation system
**When** tests are run
**Then** tests verify: reduced motion media query disables transitions, animation timing tokens are referenced (not hardcoded values)

## Epic 5: Production Deployment

The app is containerized and deployable with a single command. Docker Compose orchestrates frontend, backend, and database with persistent storage.

### Story 5.1: Dockerize Frontend & Backend

As a user,
I want the frontend and backend built into lean, production-ready container images,
So that whoever runs the app gets the same artifacts every time — no drift between laptops or servers.

*(Foundation story — packaging for repeatable deploys.)*

**Acceptance Criteria:**

**Given** the frontend package
**When** a Docker image is built from `packages/frontend/Dockerfile`
**Then** it uses a multi-stage build: Stage 1 (build) uses a Node image to run `pnpm build` and produce static files in `dist/`; Stage 2 (serve) uses `nginx:alpine` (~7MB) to serve the static files
**And** an `nginx.conf` is included that serves static assets with gzip and caching headers
**And** the nginx config proxies `/api/*` requests to the backend service
**And** the final image size is minimal (no Node runtime, no source files, no node_modules)

**Given** the backend package
**When** a Docker image is built from `packages/backend/Dockerfile`
**Then** it uses a multi-stage build: Stage 1 (build) compiles TypeScript to JavaScript; Stage 2 (run) uses `node:alpine` with only production dependencies and compiled output
**And** the final image contains no TypeScript source, no devDependencies, and no build tooling

**Given** either Dockerfile
**When** the build completes
**Then** `docker build` succeeds without errors
**And** the resulting image can be inspected and verified

**Given** the Dockerfiles
**When** tests/verification is run
**Then** both images build successfully and contain only production artifacts

### Story 5.2: Docker Compose & Data Persistence

As a user,
I want to start the entire application with a single command,
So that I can deploy and demonstrate the complete working product.

**Acceptance Criteria:**

**Given** the repository root
**When** I run `docker compose up`
**Then** three services start: frontend (nginx), backend (Fastify), and database (PostgreSQL 16-alpine)
**And** the frontend is accessible at the configured port (e.g., `http://localhost:8080`)
**And** the backend API is accessible through the nginx proxy at `/api/*`
**And** the database accepts connections from the backend service

**Given** the Docker Compose configuration
**When** the database service is defined
**Then** it uses `postgres:16-alpine` image
**And** a named Docker volume is configured for PostgreSQL data persistence
**And** database credentials are read from the `.env` file (not hardcoded in `docker-compose.yml`)

**Given** the `.env.example` file
**When** copied to `.env` and populated
**Then** it contains all required environment variables: `DATABASE_URL`, `POSTGRES_USER`, `POSTGRES_PASSWORD`, `POSTGRES_DB`, `PORT` (backend), and any other service configuration
**And** the `.env` file is listed in `.gitignore`

**Given** the application is running via Docker Compose
**When** I create, complete, and delete todos through the frontend
**Then** all operations succeed end-to-end (frontend → nginx → backend → PostgreSQL)

**Given** the application is running with existing todos
**When** I run `docker compose down` followed by `docker compose up`
**Then** all previously created todos are still present (data persists via named volume)
**And** no data is lost across container restarts

**Given** a fresh clone of the repository
**When** a developer runs `cp .env.example .env` and `docker compose up --build`
**Then** the entire application builds and starts successfully from a single command
**And** the app is fully functional on the configured port

**Given** database migrations
**When** the backend container starts
**Then** migrations are applied before the API accepts requests (via a startup script or entrypoint that runs `drizzle-kit migrate` before starting the server)

**Given** the Docker Compose deployment
**When** tests/verification is run
**Then** `docker compose build` succeeds, `docker compose up` starts all three services, the frontend loads, API responds, and data persists across restart cycles

### Story 5.3: End-to-End Test Suite

As a user,
I want the main journeys (add, complete, filter, due dates, errors) checked by automated browser tests against a real stack,
So that releases are far less likely to ship broken basics.

*(Foundation story — quality gate for ongoing changes.)*

**Acceptance Criteria:**

**Given** the Playwright configuration in `e2e/`
**When** the test suite runs against the full stack (frontend + backend + database)
**Then** `todo-crud.spec.ts` verifies the complete CRUD lifecycle: create a todo → verify it appears → complete it → verify visual change → uncomplete it → delete it → verify undo toast → let timer expire → verify deletion

**Given** the e2e test suite
**When** `todo-filtering.spec.ts` runs
**Then** it verifies: create multiple todos (some completed) → filter to Active → verify only active shown → filter to Completed → verify only completed shown → filter to All → verify all shown

**Given** the e2e test suite
**When** `todo-due-dates.spec.ts` runs
**Then** it verifies: create a todo with a due date → verify due date badge appears → change the due date → verify badge updates → sort by due date → verify order

**Given** the e2e test suite
**When** `todo-error-states.spec.ts` runs
**Then** it verifies: empty state displays on first visit → error banner appears when API fails (mocked network error) → error banner auto-dismisses or clears on success

**Given** a page object in `e2e/fixtures/todo-page.ts`
**When** used by test specs
**Then** it provides reusable methods for common actions: `addTodo(text, dueDate?)`, `completeTodo(index)`, `deleteTodo(index)`, `filterBy(status)`, `sortBy(option)`, `getVisibleTodos()`, `getErrorBanner()`

**Given** all e2e tests
**When** run against the full stack
**Then** all tests pass and verify the application works end-to-end as a complete product
