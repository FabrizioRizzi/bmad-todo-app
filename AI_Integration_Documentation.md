# AI Integration Documentation

**Project:** bmad-todo-app | **Epics:** 5 | **Stories:** 18 | **Duration:** Apr 3–14, 2026

---

## 1. Agent Usage

All 18 stories across 5 epics were implemented with AI assistance using the BMAD agent framework (Scrum Master, Developer, QA, Code Review agents). The AI handled end-to-end story execution: reading specs, writing code, running tests, and responding to code review findings.

### Model Selection (Critical Learning)

| Model | Best For | Evidence |
|-------|----------|----------|
| **Claude Opus 4.6** | Complex features, architecture, code review | Story 5.2 had zero debug issues; Story 4.4 (13 animations, 51 tests) had zero review findings |
| **Claude 4.5 Haiku** | Straightforward CRUD, simple endpoints | Story 2.1 (toggle) — clean first-pass implementation |
| **GPT 5.4** | Quick fixes, security hardening, env config | Used for Story 5.4 (environment config and security patches) — effective for targeted, well-scoped changes |
| **Codex 5.3** | Autonomous multi-file tasks, code generation | Used for parallelizable implementation tasks — strong at following existing patterns across files |
| **Auto model** | Avoid for design-heavy work | Epic 1 — caused design token incoherence; 44% worse than Opus 4.6 on visual consistency |

By Epic 4, the team standardized on Opus 4.6 for core implementation and review work. GPT 5.4 and Codex 5.3 were introduced in Epic 5 for targeted tasks, proving effective for well-scoped changes that follow established patterns. Epics 4 and 5 had zero structural deferrals attributed to model quality.

### Prompts That Worked Best

- **Detailed story specs with explicit ACs** — stories with numbered acceptance criteria and `Given/When/Then` format produced the most accurate implementations
- **Architecture references in dev notes** — citing specific sections of `architecture.md` in story files kept implementations aligned
- **"Previous story intelligence"** in story specs — documenting patterns from prior stories (e.g., "Epic 4 retro recommends centralizing locators") guided the agent to apply lessons proactively
- **Code review as a separate workflow** — running review in a fresh context (different model instance) caught issues the implementing agent missed (11 patches in Story 2.2 alone)

---

## 2. MCP Server Usage

### cursor-ide-browser

Used from Epic 2 onward for visual verification of timing-dependent features:
- **Story 2.2 (Delete/Undo):** `browser_snapshot` + `browser_click` verified undo timer countdown, toast animations, and card removal timing. Caught timing drift between visual countdown and API commit timer.
- **Epic 3 (Filter/Sort):** Verified filter tab underline animation (~200ms), list reorder motion, and that Status sort hides when filter is Active/Completed.
- **Epic 4 (Accessibility):** Verified focus ring visibility on keyboard navigation, reduced-motion behavior, and responsive layout at 320px/768px/1024px breakpoints.

### user-chrome-devtools

Used for network inspection and API contract verification:
- **Story 2.1:** Network tab verified PATCH response shape and payload. Caught missing `params` schema validation — fixed pre-merge.
- **Story 2.2:** Confirmed no DELETE API call fires during undo grace period.
- **Story 3.1:** Inspected POST with optional `dueDate` and PATCH with `{ dueDate: null }` — confirmed Zod and handler agreement.

### Key MCP Lesson

Browser tools are most valuable for **timing-dependent features** (undo timers, animation sequencing, debounce). Network inspection catches **API contract mismatches** that functional tests miss. Neither MCP was used for Epics 1 or 5 — missed opportunity in Epic 1; not applicable for Epic 5's Docker infrastructure work.

---

## 3. Test Generation

### What AI Did Well

The AI generated **231+ tests** across the project: 26 backend integration tests, 194 frontend unit/component tests, and 11 journey-based e2e tests, plus ~20 per-story Playwright specs.

- **Co-located test patterns:** Tests placed next to source files with consistent `describe`/`it` structure
- **@testing-library/user-event:** Proper async user interaction simulation from Epic 1 onward
- **TanStack Query mocking:** `QueryClient` setup, `useMutation` error/success flows, cache invalidation
- **Playwright page object (Story 5.3):** Centralized ARIA label construction solving Epic 4's locator fragility — all label logic in one `TodoPage` class
- **Specialized tests:** Animation token reference scanning (no raw `ms` literals), reduced-motion behavior, CSS class verification, responsive viewport tests at 3 breakpoints

### What AI Missed

- **Edge cases in stateful interactions:** Story 2.2 code review found 11 issues tests didn't catch — race conditions between timers, memory leaks from uncleaned-up `setTimeout`, stale snapshot on undo
- **Parallel test isolation:** Pre-existing flaky tests in Stories 3.2/3.3 went undetected until Story 5.3's journey tests ran all specs in parallel, exposing shared database contamination
- **Visual timing verification:** Unit tests with mocked timers can't catch visual countdown drift from actual API timers — required MCP browser tools and code review
- **Infrastructure testing:** Docker stories (5.1, 5.2) had no automated tests; verification was manual smoke testing (`docker compose up`, CRUD check, restart persistence)

---

## 4. Debugging with AI

| Epic | Issue | AI Resolution |
|------|-------|---------------|
| 1 | Vite proxy not routing `/api/*` to backend | Quick diagnosis — misconfigured `server.proxy` in `vite.config.ts` |
| 1 | TanStack Query cache not invalidating after create | Identified missing `queryClient.invalidateQueries` call |
| 2 | Toast visual timer drifting from API commit timer | Code review found `useEffect` dependency desync — fixed with timer ref alignment |
| 2 | NaN sort when `createdAt` malformed | Added defensive `isNaN` guards in sort comparator |
| 3 | Shadcn calendar integration with pnpm store | Hand-wired `react-day-picker` v9 + popover primitives when CLI friction blocked standard install |
| 4 | Checkbox locator breaking across stories | Identified root cause (ARIA label changes) — resolved permanently in Story 5.3 with page object |
| 5 | `tsconfig.base.json` not in Docker build context | Diagnosed pnpm workspace requirement — added `COPY tsconfig.base.json ./` to Dockerfile |
| 5 | Test files included in production `tsc` build | Added exclusion pattern to `tsconfig.app.json` |
| 5 | Root `prepare` script failing with `--prod` install | Added `--ignore-scripts` to production dependency install in Dockerfile |

The AI was strongest at diagnosing **configuration issues** (Vite, TypeScript, Docker) and **state management bugs** (cache invalidation, timer sync). Debugging was faster when the error message or stack trace was included directly in the prompt.

---

## 5. Limitations Encountered

### Where AI Struggled

- **Design system coherence (Epic 1):** Auto model created 30+ design tokens but applied them inconsistently — treated tokens as individual checklist items instead of a unified visual system. Required human review and `DESIGN_SYSTEM.md` creation.
- **Holding 20+ constraints simultaneously:** Stories with dense UX specs (e.g., 13 animations in Story 4.4) needed carefully structured story files to keep the agent aligned. Vague prompts produced fragmented results.
- **pnpm monorepo Docker patterns (Epic 5):** Three debug cycles in Story 5.1 — all workspace-aware build context issues. The AI didn't anticipate monorepo-specific Dockerfile requirements upfront.
- **Pre-existing bug detection:** Flaky e2e tests from Epic 3 went unnoticed until Epic 5's parallel execution surfaced them. The AI didn't proactively identify test isolation issues.
- **Operational risk assessment:** The pgdata volume credential mismatch (changing secrets with existing volume causes auth failure) was deferred in code review, not flagged as a documentation priority.

### Where Human Expertise Was Critical

- **Model selection strategy** — choosing Opus 4.6 vs. Haiku vs. Auto based on story complexity. This single decision had the highest impact on output quality across the entire project.
- **Architecture trade-offs** — type sharing strategy (OpenAPI vs. duplicated types), when to optimize performance, Docker image size trade-offs (320MB backend with production deps).
- **Code review as a quality gate** — the AI implementing code couldn't catch its own architectural blind spots. Running review in a separate context with fresh reasoning caught 30+ issues across the project.
- **Visual and UX judgment** — design coherence, animation "feel", responsive layout decisions, and accessibility adequacy required human eyes and product sense.
- **Priority decisions** — which technical debt to address now vs. defer, which review findings to patch vs. accept as documented exceptions.

---

**Last Updated:** 2026-04-14 (Epic 5 retrospective complete — all 5 epics delivered)
