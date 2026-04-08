# Story 1.4: Frontend Foundation with Design Tokens

Status: done

<!-- Ultimate context engine analysis completed - comprehensive developer guide created -->

## Story

As a user,
I want a visually polished app shell that loads instantly,
So that I see a complete-looking interface before any data arrives.

## Acceptance Criteria

1. **App shell layout**
   Given the frontend dev server is running, when the app loads in a browser, then the shell renders immediately with: (a) a **header** showing the app title and a **count badge placeholder** (static label or "0" is fine — not wired to API), (b) a dedicated **input area** region below the header (placeholder layout only — full `AddInput` is Story 1.5), (c) a **list area** region below that (placeholder — real list is Story 1.5). Use semantic structure (`<header>`, `<main>`, landmark-friendly sections). Match architecture naming: implement header UI in `components/app-header.tsx` and compose it from `app.tsx`.

2. **Tailwind CSS v4 + Vite**
   Given `packages/frontend`, when the toolchain is configured, then **Tailwind CSS v4** is installed with the official **`@tailwindcss/vite`** plugin registered in `vite.config.ts` (alongside `@vitejs/plugin-react`). Global styles import Tailwind via `styles/globals.css` using v4 `@import "tailwindcss";` (or the current documented equivalent). `pnpm --filter frontend build` succeeds.

3. **Design tokens in `styles/globals.css`**
   Given `:root` (or `@theme` if using Tailwind v4 theme mapping — either is acceptable if components end up using **CSS variables** consistently), when tokens are defined, then **all** of the following **CSS custom properties** exist with values that satisfy the UX palette (use hex/rgb in definitions; **components must consume `var(--token)`**):
   - **Colors:** `--background`, `--surface`, `--text-primary`, `--text-secondary`, `--text-completed`, `--accent`, `--accent-hover`, `--accent-subtle`, `--border`, `--border-focus`, `--success`, `--error`, `--error-bg`, `--active-bg`, `--active-bar`, `--completed-bg`, `--completed-bar`, `--toast-bg`, `--toast-text`, `--overdue`, `--overdue-bg`, `--overdue-bar`
   - **Typography scale:** `--text-xl`, `--text-lg`, `--text-base`, `--text-sm`, `--text-xs` (map to the UX spec: sizes, suggested font-weights, line-heights — store as needed, e.g. compound via separate vars or Tailwind theme extension)
   - **Spacing:** `--space-1` through `--space-8` (UX table defines 1–6 and 8; **also define `--space-7`** as **40px** / `2.5rem` to bridge 32px→48px on the scale)
   - **Durations:** `--duration-fast` (150ms), `--duration-normal` (200ms), `--duration-smooth` (250ms), `--duration-enter` (300ms), `--duration-exit` (200ms)
   - **Easing:** at least three named tokens, e.g. `--ease-standard` (`ease-out`), `--ease-exit` (`ease-in`), `--ease-spring` (`cubic-bezier(0.34, 1.56, 0.64, 1)`) per UX-DR1

4. **Base typography and page chrome**
   Given the global styles, when the page renders, then the **system font stack** is the default `font-family` on `body`, the **page background** uses `var(--background)` (warm stone per UX), and the main content lives in a **centered column** with **max-width 640px** (`max-w-[640px] mx-auto` or equivalent using spacing tokens for horizontal padding).

5. **Shadcn/ui baseline**
   Given the frontend package, when Shadcn is initialized for **Vite + React + Tailwind v4**, then **`components/ui/button.tsx`** and **`components/ui/input.tsx`** exist (Radix-free primitives as generated/copied by the CLI), plus supporting files (`lib/utils.ts` with `cn`, `components.json`, path alias `@/` already matches Story 1.1). **Do not** add Calendar, Popover, or other primitives yet (Story 3.1 / later).

6. **Token-only styling rule**
   Given any new layout/styling added in this story, when implementing colors, spacing, font sizes, or motion in TSX/CSS, then use **`var(--…)`** or Tailwind utilities mapped from theme to those variables — **no raw hex colors, raw px spacing, or hardcoded `ms` durations** in component code (hex is allowed **only** inside token definitions in `globals.css`).

7. **Quality gate**
   Given the workspace, when `pnpm lint` and `pnpm --filter frontend test` run, then both pass. Extend or add co-located tests (e.g. `app.test.tsx` / `app-header.test.tsx`) to assert the shell renders (title visible, placeholder regions present).

## Tasks / Subtasks

- [x] Task 1: Tailwind v4 + global CSS (AC: #2, #3, #4)
  - [x] Add `tailwindcss` and `@tailwindcss/vite`; wire plugin in `packages/frontend/vite.config.ts`.
  - [x] Create `packages/frontend/src/styles/globals.css` with `@import "tailwindcss";` and full token set per AC #3–#4; set `body` background and font stack.
  - [x] Import `./styles/globals.css` from `main.tsx`.
- [x] Task 2: Shadcn init + primitives (AC: #5, #6)
  - [x] Run Shadcn CLI init in `packages/frontend` (pnpm dlx) targeting Tailwind v4 + `@/*` paths; add **`button`** and **`input`** components only.
  - [x] Ensure `cn` helper in `lib/utils.ts`; align Tailwind content paths so UI classes compile.
- [x] Task 3: App shell components (AC: #1, #4, #6)
  - [x] Add `components/app-header.tsx`: title + count badge placeholder using tokens.
  - [x] Update `app.tsx`: compose header, input area stub, list area stub inside centered container; use tokens / Tailwind mapped to variables for layout padding.
- [x] Task 4: Tests + verification (AC: #7)
  - [x] Add or update co-located tests to cover shell rendering.
  - [x] Run `pnpm lint`, `pnpm --filter frontend test`, `pnpm --filter frontend build`.

### Review Findings

- [x] [Review][Patch] Move AppHeader inside `<main>` so header shares the centered 640px column [packages/frontend/src/app.tsx] — fixed
- [x] [Review][Patch] Refactor Shadcn `button.tsx` internals to use project design tokens [packages/frontend/src/components/ui/button.tsx] — fixed
- [x] [Review][Patch] Refactor Shadcn `input.tsx` internals to use project design tokens [packages/frontend/src/components/ui/input.tsx] — fixed
- [x] [Review][Patch] `shadcn` package is a runtime dependency — move to `devDependencies` [packages/frontend/package.json] — fixed
- [x] [Review][Patch] AppHeader top padding — resolved by moving header inside `<main>` which applies `py-[var(--space-8)]`
- [x] [Review][Patch] `app.tsx` sections use `rounded-lg` → replaced with `rounded-[var(--radius)]` — fixed
- [x] [Review][Patch] `app-header.tsx` badge `rounded-full` → replaced with `rounded-[9999px]` — fixed
- [x] [Review][Patch] `aria-label="Todo count (placeholder)"` → changed to `"Todo count"` — fixed
- [x] [Review][Patch] Sprint status `last_updated by` comment updated to `code-review 1-4 review` — fixed
- [x] [Review][Defer] Dark mode tokens defined but incomplete and no toggle mechanism — deferred, out of scope for this story
- [x] [Review][Defer] Sidebar tokens are unused Shadcn boilerplate — deferred, pre-existing
- [x] [Review][Defer] `tsconfig.json` path alias may not propagate to project references — deferred, verify in next story
- [x] [Review][Defer] `prefers-reduced-motion` uses `0.01ms` instead of `0s` — deferred, minor browser compat concern
- [x] [Review][Defer] Dark mode `.dark` overrides incomplete (missing many token overrides) — deferred, dark mode out of scope
- [x] [Review][Defer] `--chart-*` tokens use raw hex duplicating existing tokens — deferred, cosmetic

## Dev Notes

### Scope boundary (do not implement in this story)

- **No** `lib/api.ts`, **no** TanStack Query, **no** Vite proxy changes for `/api` (Story 1.5).
- **No** `AddInput`, `TodoList`, `TodoCard`, `EmptyState`, skeletons, or real todo data.
- **No** backend or `packages/backend` changes.
- **No** Docker / nginx changes.

### Technical requirements

- **ESM + paths:** Keep `@/*` → `./src/*` from Story 1.1; use **kebab-case** filenames (`app-header.tsx`).
- **Biome:** Tabs, single quotes — `pnpm lint` must pass.
- **Tailwind v4:** Prefer official `@tailwindcss/vite` integration; avoid legacy PostCSS-only setup unless docs require it.
- **Shadcn:** Components are **copied source** in repo (not a versioned npm design-system package). After init, commit generated `components/ui/*` and config.

### UX token values (implement in `globals.css` definitions)

Use [Source: `_bmad-output/planning-artifacts/ux-design-specification.md` — Visual Design Foundation / Color System / Typography / Spacing / Motion] for concrete hex and scale. Key examples: `--background` #F5F0EB, `--surface` #FAFAF7, `--accent` #C4654A, `--active-bg` #FBF9F7, `--active-bar` #D9A193, `--completed-bg` #F3EFEA, `--completed-bar` #D4CEC7.

### Architecture compliance

- [Source: `_bmad-output/planning-artifacts/architecture.md` — Structure Patterns] Flat `components/`, `styles/globals.css`, `components/ui/` for Shadcn, `lib/utils.ts`.
- [Source: `_bmad-output/planning-artifacts/architecture.md` — Enforcement Guidelines] Reference CSS variable tokens everywhere in UI code.
- [Source: `_bmad-output/planning-artifacts/epics.md` — Story 1.4] BDD acceptance criteria aligned with epic text.

### File structure requirements

| Path | Action |
|------|--------|
| `packages/frontend/vite.config.ts` | Modify — add `@tailwindcss/vite` |
| `packages/frontend/package.json` | Modify — dependencies for tailwind, shadcn peer deps |
| `packages/frontend/src/styles/globals.css` | Create |
| `packages/frontend/src/main.tsx` | Modify — import globals |
| `packages/frontend/src/lib/utils.ts` | Create (if not added by CLI) |
| `packages/frontend/src/components/ui/button.tsx` | Create (Shadcn) |
| `packages/frontend/src/components/ui/input.tsx` | Create (Shadcn) |
| `packages/frontend/src/components/app-header.tsx` | Create |
| `packages/frontend/src/app.tsx` | Modify — shell layout |
| `packages/frontend/src/app.test.tsx` | Modify / add companion tests |
| `packages/frontend/components.json` | Create (Shadcn) |

### Testing requirements

- **Vitest + RTL** (jsdom) — co-located `*.test.tsx`.
- Assert visible title and placeholder regions; optional: smoke that `Button`/`Input` render without throwing.

### Previous story intelligence (Story 1.3)

- Backend exposes `GET/POST /api/todos` with camelCase DTO `{ id, description, isCompleted, createdAt, dueDate }` — **not used** in this story; count badge stays placeholder.
- Strict API error shapes and Zod patterns are irrelevant to 1.4.

### Previous story intelligence (Story 1.1)

- Frontend is Vite 8 + React 19 + Vitest 4 with `@/` alias; **Tailwind was not installed in 1.1** — this story adds it.
- `pnpm --filter frontend dev` uses Vite default port **5173**.

### Forward compatibility notes

- Story **1.5** will add TanStack Query, `lib/api.ts`, Vite proxy, and real **AddInput** / list / empty / skeleton behaviors atop this shell.
- Shadcn **Calendar** + **Popover** will be added when due-date UX lands (Epic 3).
- All future components should continue **token-only** styling per AC #6.

### Latest technical notes (April 2026)

- Use **Tailwind CSS v4** and **Shadcn/ui** docs for the **Vite + React** path; CLI flags and `components.json` defaults evolve — follow the version pinned by the CLI at init time and lock working config in repo.
- **React 19** is already in `packages/frontend` — ensure Shadcn primitives support your installed React version (adjust CLI/version if prompted).

### Project context reference

- No `project-context.md` found in repo; rely on architecture + this story.

### References

- [Source: `_bmad-output/planning-artifacts/epics.md` — Epic 1, Story 1.4]
- [Source: `_bmad-output/planning-artifacts/ux-design-specification.md` — UX-DR1 tokens, color/spacing/typography/motion tables]
- [Source: `_bmad-output/planning-artifacts/architecture.md` — Frontend structure, Shadcn strategy]
- [Source: `_bmad-output/implementation-artifacts/1-1-monorepo-scaffold-and-tooling-setup.md` — frontend baseline]
- [Source: `_bmad-output/implementation-artifacts/1-3-todo-crud-api-endpoints.md` — API contract for later stories]

## Dev Agent Record

### Agent Model Used

Cursor (auto model selection)

### Implementation Plan

- Tailwind v4 via `@tailwindcss/vite` alongside `@vitejs/plugin-react`; global tokens and Shadcn bridge variables in `globals.css` (Earthy Modern palette + motion/spacing per UX spec).
- Shadcn `base-nova` stack with `@base-ui/react` primitives; only `button` and `input` added beyond init.
- App shell: `AppHeader` (`<header>`) + `<main>` with named regions; layout uses `var(--space-*)` and `max-w-[40rem]` (640px); `bg-background` for page chrome.
- Biome: enabled `css.parser.tailwindDirectives` for v4 `@theme` / `@apply` parsing.

### Debug Log References

### Completion Notes List

- All ACs satisfied: Tailwind v4 + Vite plugin, full token set in `:root`, system font stack on `body`, centered column, Shadcn `button` + `input`, token-driven shell styling.
- `pnpm lint`, `pnpm --filter frontend test`, and `pnpm --filter frontend build` pass. Root `pnpm test` requires Postgres for backend integration/route tests (not part of story AC #7).

### File List

- `biome.json`
- `pnpm-lock.yaml`
- `_bmad-output/implementation-artifacts/sprint-status.yaml`
- `packages/frontend/package.json`
- `packages/frontend/vite.config.ts`
- `packages/frontend/tsconfig.json`
- `packages/frontend/components.json`
- `packages/frontend/src/styles/globals.css`
- `packages/frontend/src/main.tsx`
- `packages/frontend/src/app.tsx`
- `packages/frontend/src/app.test.tsx`
- `packages/frontend/src/components/app-header.tsx`
- `packages/frontend/src/components/app-header.test.tsx`
- `packages/frontend/src/components/ui/button.tsx`
- `packages/frontend/src/components/ui/input.tsx`
- `packages/frontend/src/lib/utils.ts`

### Change Log

- 2026-04-08: Story 1.4 — Tailwind v4, design tokens, Shadcn baseline, app shell, tests; sprint status → review.

## Story completion status

- **Status:** done
- **Note:** Ready for code review (run `code-review` with a different LLM than implementer when possible).
