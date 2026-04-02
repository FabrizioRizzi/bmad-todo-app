---
stepsCompleted:
  - step-01-init
  - step-02-discovery
  - step-02b-vision
  - step-02c-executive-summary
  - step-03-success
  - step-04-journeys
  - step-05-domain
  - step-06-innovation
  - step-07-project-type
  - step-08-scoping
  - step-09-functional
  - step-10-nonfunctional
  - step-11-polish
  - step-12-complete
inputDocuments:
  - _bmad-output/planning-artifacts/product-brief-bmad-todo-app.md
workflowType: 'prd'
documentCounts:
  briefs: 0
  research: 0
  brainstorming: 0
  projectDocs: 0
classification:
  projectType: web_app
  domain: general
  complexity: low
  projectContext: greenfield
lastEdited: '2026-04-02'
editHistory:
  - date: '2026-04-02'
    changes: 'Post-validation refinement: tightened 6 measurability violations (FR11, FR20, FR24, NFR bundle size, reliability, maintainability), replaced 1 density anti-pattern, added conceptual data model'
---

# Product Requirements Document - bmad-todo-app

**Author:** Fab
**Date:** 2026-04-02

## Executive Summary

bmad-todo-app is a full-stack web application for personal task management. It enables individual users to create, view, complete, and delete todo items through a fast, responsive browser-based interface backed by a persistent API. The product targets anyone who needs a straightforward way to track tasks without the overhead of account setup, onboarding, or feature bloat. The core problem it addresses is that most task management tools over-serve — bmad-todo-app delivers a focused, reliable experience that works immediately upon opening.

### What Makes This Special

Deliberate simplicity is the design principle, not a constraint. Where competing tools add features, bmad-todo-app succeeds by doing less with higher polish — instant feedback on every interaction, clear visual distinction between active and completed tasks, and thoughtful handling of empty, loading, and error states across desktop and mobile. The technical foundation is equally intentional: V1 ships as single-user with no authentication, but the architecture is designed so that auth, multi-user support, and future capabilities can be layered on without rearchitecting. The result should feel like a complete, finished product despite its minimal scope.

## Project Classification

- **Project Type:** Web application (SPA with backend API)
- **Domain:** General / Productivity
- **Complexity:** Low — single-user CRUD with no regulated data, no third-party integrations, and minimal business logic
- **Project Context:** Greenfield — new product, no existing codebase or legacy constraints

## Success Criteria

### User Success

- A new user can add their first todo within seconds of landing — no tutorials, no onboarding, no sign-up friction.
- All core actions (create, view, complete, delete, filter, sort) are discoverable and completable without guidance.
- Completed tasks are visually distinguishable from active tasks at a glance.
- The interface works well across desktop and mobile devices without layout breakage or usability degradation.
- Empty, loading, and error states are handled gracefully — the user is never left staring at a blank or broken screen.

### Business Success

- The application is deployable and demonstrable as a complete, working product.
- The codebase is clean enough to withstand a code review — well-structured, readable, and following established conventions.
- The architecture is extensible enough to add authentication and multi-user support without rearchitecting the core system.
- The project serves as a solid foundation that can evolve into a more feature-rich product if needed.

### Technical Success

- API response times under 200ms (p95) for all CRUD operations under normal conditions.
- UI feedback (loading indicators, state transitions) under 100ms for user-initiated actions.
- Data persists reliably across page refreshes, browser restarts, and sessions.
- The application is containerized with Docker for consistent, reproducible deployments.
- Basic error handling on both client and server prevents failures from disrupting the user flow.

### Measurable Outcomes

- 100% of core CRUD operations functional and tested end-to-end.
- Zero data loss on page refresh or session restart.
- API p95 latency < 200ms; UI interaction feedback < 100ms.
- Docker container builds and runs successfully from a single command.
- A first-time user completes the create-view-complete-delete cycle without assistance.

## User Journeys

### Journey 1: Alex's First Visit — "What does this do? Oh, I get it."

Alex is a freelance designer juggling multiple small projects. They've tried Todoist, Notion, and Apple Reminders but always end up abandoning them — too many features, too much setup, too many decisions before getting anything done.

**Opening Scene:** Alex clicks a link and the app loads instantly. There's no sign-up wall, no onboarding carousel, no "choose your plan" modal. They see a clean interface with an input field and an empty state message that makes it obvious what to do.

**Rising Action:** Alex types "Send invoice to client" and hits Enter. The todo appears immediately in the list. They add two more: "Review logo drafts" and "Buy printer ink." Each addition feels instant — no spinners, no lag. The list is clean and readable.

**Climax:** Alex checks off "Send invoice to client." The todo visually shifts to a completed state — clearly different from the active ones, but still visible. They think: "That's it. No friction. This just works."

**Resolution:** Alex closes the tab and moves on with their day. The entire interaction took under 30 seconds. They didn't read a single instruction.

**Capabilities revealed:** Instant load, zero-onboarding UX, fast todo creation, clear visual feedback on completion, responsive input handling.

### Journey 2: Alex Returns — "Everything's still here."

**Opening Scene:** The next morning, Alex opens the app again. Their three todos are exactly where they left them — "Send invoice to client" still completed, the other two still active. No login required, no "session expired" message.

**Rising Action:** Alex completes "Review logo drafts" and decides "Buy printer ink" is no longer relevant. They delete it. The item disappears cleanly. They add two new tasks for the day: "Prepare mood board" and "Schedule call with Sarah."

**Climax:** Alex scans the list — two completed items visually receded, two active items front and center. The app gives them an instant read on where they stand. They toggle "Send invoice to client" back to active because the client asked for a revised invoice.

**Resolution:** Alex has a clear picture of their day. The app loaded fast, remembered everything, and let them reorganize in seconds. It feels like a tool that respects their time.

**Capabilities revealed:** Data persistence across sessions, delete functionality, toggle completion back to active, list scanning with clear status differentiation, fast page load with existing data.

### Journey 3: Alex Hits a Bump — "Something went wrong, but it's fine."

**Opening Scene:** Alex is on a train with spotty mobile connectivity. They open the app on their phone. The layout adapts cleanly to the smaller screen — no horizontal scrolling, no tiny tap targets.

**Rising Action:** Alex tries to add a new todo: "Call accountant." The request fails because the network dropped. Instead of a blank screen or a cryptic error, the app shows a clear, friendly error message indicating the action couldn't be completed. The existing todo list is still visible and intact.

**Climax:** Alex tries to submit an empty todo (accidentally hits Enter with nothing typed). The app prevents it gracefully — no error explosion, just a subtle indication that a description is required. Connectivity returns, Alex adds the todo successfully, and it appears in the list.

**Resolution:** Despite the rough conditions, Alex never lost data, never saw a broken screen, and never had to guess what went wrong. The app handled failure as gracefully as it handles success.

**Capabilities revealed:** Responsive mobile layout, network error handling, input validation, graceful degradation, error messaging that doesn't disrupt existing state.

### Journey Requirements Summary

| Capability Area | Revealed By |
|---|---|
| Instant page load with no auth barrier | Journey 1 |
| Zero-onboarding todo creation | Journey 1 |
| Instant UI feedback on actions | Journey 1, 2 |
| Visual distinction between active and completed todos | Journey 1, 2 |
| Data persistence across sessions | Journey 2 |
| Full CRUD lifecycle (create, read, toggle, delete) | Journey 1, 2 |
| Toggle completion status in both directions | Journey 2 |
| Responsive layout (desktop + mobile) | Journey 3 |
| Graceful error handling (network, validation) | Journey 3 |
| Input validation (prevent empty todos) | Journey 3 |
| Error states that preserve existing data visibility | Journey 3 |

## Domain-Specific Requirements

### Data Sensitivity & Privacy

- Todo content may contain personal or work-sensitive information (e.g., client names, financial tasks, health-related reminders). Even in V1 without auth, the system should treat stored data as potentially sensitive.
- The data model and API should be structured so that user-scoped data isolation can be introduced without migrating or restructuring existing data.
- No todo content should be logged in plain text on the server side beyond what's necessary for debugging.

### Accessibility

- Target WCAG 2.1 AA compliance from V1 — this is not a post-MVP concern.
- Full keyboard navigation: all actions (create, complete, delete, filter, sort) must be performable without a mouse.
- Screen reader support: semantic HTML, ARIA labels where needed, and meaningful focus management after state changes (e.g., after deleting a todo, focus moves to a logical next element).
- Sufficient color contrast ratios for all text and interactive elements, including the visual distinction between active and completed todos.
- Touch targets sized appropriately for mobile (minimum 44x44px).

### Platform Conventions

- Align with established todo app interaction patterns that users already expect:
  - Checkbox or equivalent toggle for completion status.
  - Strikethrough or muted styling for completed items.
  - Enter key submits a new todo from the input field.
  - Clear affordances for delete actions (no hidden gestures required).
- These conventions reduce cognitive load and use existing muscle memory from tools like Todoist, Apple Reminders, and Google Tasks.

## Web Application Specific Requirements

### Project-Type Overview

bmad-todo-app is a Single Page Application (SPA) with a backend REST API. The frontend handles all routing and state management client-side, communicating with the backend exclusively through API calls. The architecture prioritizes fast, fluid interactions over server-rendered content.

### Technical Architecture Considerations

- **Application Type:** SPA — single HTML entry point, client-side rendering, no server-side page generation.
- **SEO:** Not required. The app is a functional tool, not a content-discoverable site. No SSR, meta tags, or sitemap needed.
- **Real-time:** Not required for V1. Single-user model means no concurrent editing or sync.
- **Data Flow:** V1 uses synchronous (wait-for-response) updates. User actions trigger an API call; the UI updates only after the server confirms success. This simplifies error handling and eliminates rollback logic. See Data Flow Decision below for rationale.

### Browser & Device Support

- **Target browsers:** Evergreen only — latest two versions of Chrome, Firefox, Safari, and Edge.
- **No legacy support:** IE11 and other legacy browsers are explicitly out of scope.
- **Responsive design:** Single responsive layout that adapts from mobile (320px minimum) to desktop. No separate mobile app or adaptive serving.
- **Touch and pointer:** All interactive elements must work with both mouse/keyboard and touch input.

### Performance Targets

- **Initial page load:** App should be interactive within 2 seconds on a standard broadband connection.
- **API round-trips:** All CRUD operations complete in under 200ms (p95) under normal conditions.
- **UI feedback:** Loading indicators and state transitions render within 100ms of user action.
- **Bundle size:** Keep the client bundle lean — no heavy framework overhead for a simple CRUD interface.

### Implementation Considerations

- **Accessibility:** WCAG 2.1 AA compliance (see Domain-Specific Requirements and NFRs for full specification).
- **Error handling:** Network failures, API errors, and validation errors must be caught and communicated without disrupting the visible todo list or losing user context.
- **Containerization:** Frontend served as static assets from a container, backend as a separate service, database as a third container. All orchestrated via Docker Compose.

## Project Scoping & Phased Development

### MVP Strategy & Philosophy

**MVP Approach:** Problem-solving MVP — deliver a focused, polished task management experience that proves execution quality alone can make a simple tool feel complete.

**Resource Requirements:** Solo developer. The scope is deliberately sized for one person to build, test, and deploy end-to-end. This constraint reinforces the simplicity principle — if it's too complex for one developer to hold in their head, it's too complex for V1.

### MVP Feature Set (Phase 1)

**Core User Journeys Supported:**
- Journey 1 (First Visit): Full coverage — instant load, zero-onboarding creation, visual completion feedback.
- Journey 2 (Returning User): Full coverage — data persistence, complete/uncomplete toggle, delete, add new todos.
- Journey 3 (Error Recovery): Full coverage — responsive mobile layout, network error handling, input validation.

**Must-Have Capabilities:**
- Create a todo with text description (Enter to submit).
- View all todos in a list.
- Filter todos by status (all, active, completed).
- Sort todos (by creation date, by status).
- Mark a todo as complete / revert to active (checkbox toggle).
- Delete a todo.
- Persistent storage via REST API (data survives refresh/restart).
- Responsive layout for desktop and mobile (320px minimum).
- Empty state, loading state, and error state handling.
- WCAG 2.1 AA accessibility (keyboard nav, screen reader, contrast).
- Input validation (prevent empty todos).
- Synchronous data flow — wait for API confirmation before updating UI state.
- Dockerized deployment (frontend + backend + database via Docker Compose).

### Conceptual Data Model

A todo item consists of: a unique identifier, a text description (non-empty), a completion status (active or completed), and a creation timestamp. V1 has no user association — all todos belong to a single implicit user. The schema must support adding a user foreign key in Phase 2 without migrating existing records.

### Data Flow Decision

V1 uses **synchronous (wait-for-response) updates** rather than optimistic UI updates. User actions trigger an API call; the UI updates only after the server confirms success. This simplifies error handling, eliminates rollback logic, and is appropriate for a solo-developer project where API latency is expected to be low (<200ms). Optimistic updates can be introduced in a future phase if needed.

### Post-MVP Features

**Phase 2 (Growth):**
- User authentication and individual accounts.
- Multi-user support with isolated task lists.
- Inline editing of todo descriptions.
- Bulk actions (complete all, delete completed).
- Optimistic UI updates for snappier perceived performance.

**Phase 3 (Expansion):**
- Task prioritization and due dates.
- Labels, categories, or project grouping.
- Notifications and reminders.
- Collaboration and shared task lists.
- Offline support with sync.

### Risk Mitigation Strategy

**Technical Risks:**
- *Data persistence reliability* — mitigated by using a proven relational database and testing persistence across container restarts.
- *Docker complexity for solo dev* — mitigated by keeping the Compose setup minimal (three services, no custom networking beyond defaults).
- *Accessibility compliance* — mitigated by using semantic HTML from the start and testing with keyboard/screen reader during development, not as an afterthought.

**Market Risks:**
- Not applicable for V1 — this is a portfolio/demonstration project, not a commercial launch.

**Resource Risks:**
- *Solo developer bottleneck* — mitigated by the deliberately minimal scope. Every feature in the MVP list is achievable by one developer in a reasonable timeframe.
- *Scope creep* — mitigated by a clear Phase 1/2/3 boundary. If something isn't in the Must-Have list, it waits.

## Functional Requirements

### Task Management

- FR1: User can create a new todo by entering a text description and submitting with the Enter key.
- FR2: User can view all existing todos in a list.
- FR3: User can mark an active todo as complete.
- FR4: User can revert a completed todo back to active.
- FR5: User can delete a todo permanently.
- FR6: User can see a visual distinction between active and completed todos.

### Filtering & Sorting

- FR7: User can filter the todo list to show all todos, only active todos, or only completed todos.
- FR8: User can sort todos by creation date.
- FR9: User can sort todos by completion status.

### Input Validation & Error Handling

- FR10: System prevents creation of a todo with an empty or whitespace-only description.
- FR11: System displays a user-visible error message identifying the failed action when a network request fails.
- FR12: System preserves the visible todo list and user context when an error occurs.
- FR13: System displays a loading state while data is being fetched from the server.
- FR14: System displays an empty state message when no todos exist.

### Data Persistence

- FR15: System persists all todos to a backend database via REST API.
- FR16: System retrieves and displays all persisted todos when the application is loaded.
- FR17: All todo state changes (create, complete, uncomplete, delete) are confirmed by the server before the UI reflects the change.

### Accessibility

- FR18: User can perform all actions (create, complete, uncomplete, delete, filter, sort) using only a keyboard.
- FR19: System provides screen reader-compatible markup for all interactive elements and state changes.
- FR20: System moves focus to the next item in the list after state-changing actions, or to the input field if the list is empty (e.g., after deleting a todo, focus moves to the adjacent todo or the creation input).
- FR21: All text and interactive elements meet WCAG 2.1 AA color contrast requirements.
- FR22: All touch targets meet minimum size requirements for mobile interaction (44x44px).

### Responsive Design

- FR23: User can access and use all features on screen widths from 320px (mobile) to desktop.
- FR24: System adapts layout and interaction targets across device sizes without horizontal scrolling, overlapping elements, or truncated interactive content.

### Deployment

- FR25: System can be built and run as a set of Docker containers via a single Docker Compose command.
- FR26: System data persists across container restarts.

## Non-Functional Requirements

### Performance

- API response time for all CRUD endpoints: < 200ms at p95 under normal load.
- UI feedback on user actions (button state, loading indicators): < 100ms.
- Initial page load to interactive state: < 2 seconds on standard broadband.
- Client-side JavaScript bundle size: < 200KB gzipped. No unnecessary framework overhead for a CRUD application.

### Security

- All client-server communication must use HTTPS in production.
- API inputs must be validated and sanitized server-side to prevent injection attacks.
- No todo content logged in plain text on the server beyond operational debugging needs.
- The API should not expose internal system details in error responses.
- The data model must support future user-scoped isolation without structural changes.

### Accessibility

- WCAG 2.1 AA compliance across all interactive elements.
- All functionality operable via keyboard alone (no mouse-dependent interactions).
- Screen reader compatibility: semantic HTML, ARIA attributes where needed, live region announcements for dynamic state changes.
- Minimum color contrast ratio of 4.5:1 for normal text, 3:1 for large text.
- Minimum touch target size of 44x44px on mobile.
- Logical focus order and visible focus indicators on all interactive elements.

### Reliability

- Zero data loss on page refresh, browser restart, or container restart.
- Database writes must be durable — confirmed writes must survive process crashes.
- On network failure, the application must: keep existing data visible, display an error message identifying the failure, and prevent silent data corruption.

### Maintainability

- Codebase must follow consistent naming conventions, file organization, and code formatting enforceable by a linter.
- Frontend and backend must communicate exclusively through a documented REST API contract with no shared runtime dependencies.
- Architecture must allow adding authentication and multi-user support without rearchitecting existing components.
- Docker Compose setup must be reproducible — any developer can clone, build, and run with a single command.
