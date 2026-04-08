# Epic 2 Story Creation Summary

**Date:** April 8, 2026  
**Status:** ✅ Complete — All 3 Stories Created & Ready for Development  
**Epic:** Epic 2 — Complete Task Lifecycle

---

## What Was Created

### 📝 Story Files (3 stories)

1. **Story 2.1: Toggle Todo Completion (API + Frontend)**
   - File: `2-1-toggle-todo-completion.md` (14 KB)
   - Covers: Backend PATCH endpoint, frontend checkbox UI, state transitions, error handling
   - Key Requirements: 200ms ease-out animations, `--completed-bg`/`--completed-bar` styling, optimistic updates via TanStack Query
   - Technical: Zod validation, Fastify route, integration tests on both backend and frontend
   - Status: **ready-for-dev**

2. **Story 2.2: Delete Todo with Undo (Deferred DELETE Pattern)**
   - File: `2-2-delete-todo-with-undo.md` (16 KB)
   - Covers: Backend DELETE endpoint, frontend undo toast, 5-second timer, card animations, error recovery
   - Key Requirements: Optimistic removal, undo within 5s cancels API call, timer expiry fires DELETE, responsive button visibility (hover on desktop, 50% opacity on mobile)
   - Technical: Toast state management, TanStack Query mutations with manual cache manipulation, animation coordination
   - Status: **ready-for-dev**

3. **Story 2.3: Error Banner Component**
   - File: `2-3-error-banner-component.md` (12 KB)
   - Covers: Centralized error UI component, action-specific messages, 8-second auto-dismiss, `role="alert"` + `aria-live="assertive"`
   - Key Requirements: 3 message templates (create/toggle/delete), slide-down enter animation, fade exit, error replacement (no stacking)
   - Technical: Error state management, integration with all mutations, accessibility compliance
   - Status: **ready-for-dev**

### 📊 QA Strategy Document

- File: `epic-2-qa-test-strategy.md` (10 KB)
- Covers: 16 E2E test cases organized into 3 user journeys (toggle, delete+undo, error handling)
- Includes: Page object specifications, network mocking guidance, test data setup, MCP server recommendations
- Ready for: QA automation with Playwright (`bmad-qa-generate-e2e-tests` skill)

### 🔄 Sprint Status Updated

- Epic 2 transitioned from `backlog` → `in-progress`
- All 3 stories transitioned from `backlog` → `ready-for-dev`
- Sprint status file: `sprint-status.yaml`

---

## How Each Story Connects

```
Story 2.1: Toggle
├─ Backend: PATCH /api/todos/:id with { isCompleted: boolean }
├─ Frontend: Checkbox UI + TanStack Query mutation
├─ Styling: --completed-bg, --completed-bar, strikethrough, sage green checkbox
└─ Error: Shows error banner "Couldn't update that task — try again."

Story 2.2: Delete with Undo
├─ Backend: DELETE /api/todos/:id → 204 No Content
├─ Frontend: Delete button (responsive visibility) + undo toast
├─ Mechanics: 5-second timer before DELETE fires; undo cancels it
├─ Animations: Card slide-out (200ms ease-in), toast slide-up (200ms ease-out), restore slide-in (300ms ease-out)
└─ Error: DELETE failure restores card + shows error banner "Couldn't delete that task — try again."

Story 2.3: Error Banner
├─ Centralized error display component
├─ Positioning: Between input and todo list
├─ Messages: 3 templates (create, toggle, delete)
├─ Behavior: Auto-dismiss after 8s, dismiss on success, replace previous error
└─ Accessibility: role="alert", aria-live="assertive", immediate screen reader announcement
```

---

## Key Architectural Decisions Documented

### Backend
- **Fastify + Zod:** All routes follow established pattern from Story 1.3
- **Error shape:** `{ statusCode, error, message }` consistent across all endpoints
- **Database:** Drizzle ORM with existing `todos` table (no schema changes needed)
- **Tests:** Integration tests co-located with route files

### Frontend
- **State Management:** TanStack Query v5 with React 19
  - Optimistic updates via `setQueryData` (standard pattern)
  - Mutations with `onError` callbacks wired to error handling
- **Styling:** CSS variables from design tokens
  - No hardcoded colors or timing values
  - All animations use `--duration-*` tokens (fast 150ms, normal 200ms, smooth 250ms, enter 300ms, exit 200ms)
- **Components:** Co-located tests, flat `components/` structure, kebab-case filenames
- **Accessibility:** WCAG 2.1 AA compliance with ARIA attributes

### QA & Testing
- **Browser Debugging:** MCP servers recommended for visual/network inspection
  - `cursor-ide-browser`: snapshots, screenshots, automation, network inspection
  - `user-chrome-devtools`: detailed network body inspection, performance profiling
- **E2E Tests:** Playwright with page object patterns
- **Error Scenarios:** Mocked API failures for comprehensive coverage

---

## MCP Servers Integrated for Epic 2

From exploration, identified two MCP servers with visual/browser debugging capabilities:

### 1. **cursor-ide-browser**
- **Use case:** In-IDE browser automation with snapshots
- **Key tools:** `browser_snapshot` (refs for automation), `browser_click`, `browser_network_requests`, `browser_wait_for`, `browser_take_screenshot`
- **Epic 2 value:** Quick iteration during dev, visual verification of animations, network inspection

### 2. **user-chrome-devtools**
- **Use case:** Full Chrome DevTools integration
- **Key tools:** `take_snapshot`, `take_screenshot`, `list_network_requests`, `get_network_request` (with bodies), `wait_for`, `evaluate_script`, `performance_start_trace`
- **Epic 2 value:** Deep network debugging, API body inspection, timing analysis, performance profiling

**Recommended flow:** Use `cursor-ide-browser` during active dev for quick feedback; use `user-chrome-devtools` for final debugging and performance validation.

---

## Next Steps for Developer

### Immediate (Dev Stories 2.1, 2.2, 2.3)

1. **Pick first story** (suggest 2.1 — Toggle)
   - Command: `dev story 2-1-toggle-todo-completion`
   - Or: `bmad-dev-story` skill with story 2.1 file path

2. **Implement** backend PATCH route + frontend checkbox + tests
   - Follow patterns from Story 1.3 (API) and Story 1.5 (frontend)
   - Run quality gates: `pnpm lint`, `pnpm test`, `pnpm build`

3. **Code review** after implementation
   - Command: `run code review` or `bmad-code-review` skill
   - Fixes any issues found

4. **Repeat for stories 2.2 and 2.3** in sequence

### After All 3 Stories Done

5. **Generate E2E tests** with QA agent
   - Command: `create qa automated tests for epic 2`
   - Or: `bmad-qa-generate-e2e-tests` skill with epic-2-qa-test-strategy.md
   - QA agent creates Playwright test specs from the strategy document

6. **Run E2E test suite**
   - `pnpm test:e2e` — verify all 16 test cases pass
   - Target: 100% pass rate, < 5 minutes execution

7. **Optional: Retrospective**
   - Command: `retrospective epic 2`
   - Captures lessons learned for AI Integration Documentation

---

## File Artifacts Created

```
_bmad-output/implementation-artifacts/
├── 2-1-toggle-todo-completion.md (14 KB) ✅ ready-for-dev
├── 2-2-delete-todo-with-undo.md (16 KB) ✅ ready-for-dev
├── 2-3-error-banner-component.md (12 KB) ✅ ready-for-dev
├── epic-2-qa-test-strategy.md (10 KB) 📊 QA roadmap
└── sprint-status.yaml ✅ updated (epic-2: in-progress)
```

---

## Context Engine Analysis

### What the Story Files Contain (Per Story)

✅ **Story Objective** — Clear user story statement  
✅ **Acceptance Criteria** — 6–12 detailed BDD scenarios  
✅ **Tasks & Subtasks** — 7–10 concrete implementation tasks  
✅ **Dev Notes Section:**
- Scope boundaries (what NOT to build)
- Technical requirements (architecture guardrails)
- API contract (backend route specs)
- UX references (with source links to UX spec)
- File structure (expected new/changed files)
- Testing requirements (unit + integration)
- Previous story intelligence (patterns from 1.5, etc.)
- Git intelligence (recent commit patterns)
- Latest technical notes (April 2026 versions)
- **NEW:** MCP servers for visual/debugging (story-specific guidance)

✅ **Error Handling** — Each story includes mutation error paths, error banner integration, recovery flows

✅ **References** — All artifacts sourced to PRD, architecture, UX spec, previous stories

---

## Quality Checklist

- ✅ All 3 stories created with comprehensive context
- ✅ MCP server capabilities explored and documented for visual debugging
- ✅ QA strategy document ready for E2E test generation
- ✅ Sprint status updated (epic-2: in-progress, all 3 stories: ready-for-dev)
- ✅ Consistent technical patterns across all stories (TanStack Query, Zod, Fastify, etc.)
- ✅ Accessibility requirements documented (ARIA, color contrast, focus management deferred to Epic 4)
- ✅ Responsive design requirements documented (mobile/desktop/hover states)
- ✅ Animation timing specifications complete (all use design token variables)
- ✅ Error handling and recovery paths specified in detail

---

## Ready for Implementation

All three stories are **ready-for-dev** with everything the development agent needs:
- Clear acceptance criteria
- Step-by-step tasks
- Technical guardrails
- API contracts
- Testing requirements
- Previous story patterns
- MCP debugging tools
- References to all source documents

**Recommendation:** Start with Story 2.1 (Toggle) as it's the simplest and establishes the mutation pattern for Story 2.2 (Delete) and integrates with Story 2.3 (Error Banner).

---

**Created by:** Ultimate BMad Context Engine  
**For:** Development Team  
**Epic:** 2 — Complete Task Lifecycle  
**Date:** 2026-04-08
