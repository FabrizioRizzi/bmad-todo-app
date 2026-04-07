# Story 1.1: Monorepo Scaffold & Tooling Setup

Status: review

## Story

As a user,
I want the app to live in a single repo with shared TypeScript tooling, linting, and tests wired from day one,
So that the product stays consistent and regressions are caught before they reach me.

## Acceptance Criteria

1. A `pnpm-workspace.yaml` exists at root with `packages: ['packages/*']`.
2. `packages/frontend/` is a Vite + React + TypeScript project (scaffolded via `pnpm create vite@latest --template react-ts`).
3. `packages/backend/` is initialized with `package.json` and TypeScript.
4. A shared `tsconfig.base.json` exists at root with strict mode enabled.
5. Each package's `tsconfig.json` extends the base config.
6. `biome.json` exists at workspace root with lint, format, and import sorting rules.
7. `pnpm biome check` passes with zero errors on both packages.
8. Vitest is configured in both packages with a test script (`pnpm test`).
9. `@testing-library/react` and `@testing-library/user-event` are installed in the frontend package.
10. Playwright is configured at workspace root in `e2e/` with a placeholder test.
11. A root `pnpm dev` script starts both frontend and backend concurrently.
12. A root `pnpm build` script builds both packages.
13. A `.env.example` file exists documenting required environment variables.

## Tasks / Subtasks

- [x] Task 1: Initialize pnpm workspace (AC: #1)
  - [x] Run `pnpm init` at project root to create root `package.json`
  - [x] Create `pnpm-workspace.yaml` with `packages: ['packages/*']`
  - [x] Set root `package.json` to `"private": true`
- [x] Task 2: Scaffold frontend package (AC: #2)
  - [x] Run `pnpm create vite@latest packages/frontend --template react-ts`
  - [x] Verify Vite + React + TypeScript project structure
  - [x] Remove default Vite boilerplate content (App.tsx placeholder, CSS, assets) — leave minimal shell
  - [x] Ensure `@vitejs/plugin-react` is present in vite.config.ts
- [x] Task 3: Initialize backend package (AC: #3)
  - [x] Create `packages/backend/` directory
  - [x] Run `pnpm init` inside `packages/backend/`
  - [x] Add TypeScript as a dev dependency
  - [x] Create minimal `src/server.ts` entry point (placeholder: `console.log('backend starting')`)
  - [x] Add `tsx` as dev dependency for development server
  - [x] Add `"dev": "tsx watch src/server.ts"` and `"build": "tsc"` scripts
- [x] Task 4: Create shared TypeScript base config (AC: #4, #5)
  - [x] Create `tsconfig.base.json` at root with strict mode, target ES2022, `module` / `moduleResolution` suited to Vite (`ESNext` + `bundler`)
  - [x] Update `packages/frontend/tsconfig.json` to extend `../../tsconfig.base.json`
  - [x] Configure frontend tsconfig with path alias `@/*` → `./src/*`
  - [x] Create `packages/backend/tsconfig.json` extending `../../tsconfig.base.json`
  - [x] Configure backend tsconfig with `module` / `moduleResolution` `NodeNext`, `outDir: "./dist"`, path alias `@/*` → `./src/*`
  - [x] Ensure both compile without errors
- [x] Task 5: Configure Biome (AC: #6, #7)
  - [x] Install `@biomejs/biome` as root dev dependency: `pnpm add -Dw @biomejs/biome`
  - [x] Create `biome.json` at workspace root with lint, format, and import sorting rules
  - [x] Configure import sorting order: React/external → internal aliases → relative → CSS
  - [x] Configure formatter: indent with tabs (Biome default), line width 100
  - [x] Add root script `"lint": "biome check ."`
  - [x] Add root script `"lint:fix": "biome check --write ."`
  - [x] Run `pnpm biome check` and fix any issues until zero errors
- [x] Task 6: Configure pre-commit hook (AC: #7)
  - [x] Install `simple-git-hooks` as a root dev dependency (pre-commit runs `pnpm biome check --staged` directly; no `lint-staged` or `lefthook` required)
  - [x] Configure pre-commit hook to run `pnpm biome check --staged --no-errors-on-unmatched` on staged files
  - [x] Add `"prepare": "simple-git-hooks"` (or equivalent) to root package.json
  - [x] Verify hook triggers on commit
- [x] Task 7: Configure Vitest for both packages (AC: #8, #9)
  - [x] Install `vitest` as root dev dependency: `pnpm add -Dw vitest`
  - [x] Configure frontend Vitest in `vite.config.ts` (jsdom environment)
  - [x] Install `@testing-library/react`, `@testing-library/user-event`, `@testing-library/jest-dom`, `jsdom` in frontend
  - [x] Create `packages/frontend/src/test-setup.ts` importing `@testing-library/jest-dom/vitest`
  - [x] Configure backend Vitest in a `vitest.config.ts` (node environment)
  - [x] Add `"test"` script in each package's `package.json`
  - [x] Add root `"test"` script that runs tests in both packages
  - [x] Create a placeholder test in each package to verify setup works
- [x] Task 8: Configure Playwright (AC: #10)
  - [x] Install `@playwright/test` as root dev dependency
  - [x] Create `e2e/playwright.config.ts` at workspace root
  - [x] Configure base URL to `http://localhost:5173` (Vite dev server)
  - [x] Create `e2e/example.spec.ts` placeholder test
  - [x] Add root script `"test:e2e": "playwright test"`
  - [x] Run `npx playwright install` to install browser binaries
- [x] Task 9: Configure root workspace scripts (AC: #11, #12)
  - [x] Add `"dev"` script using `concurrently` (or pnpm `--parallel`) to start both packages
  - [x] Add `"build"` script to build both packages
  - [x] Install `concurrently` if chosen for dev script
  - [x] Verify `pnpm dev` starts both frontend (Vite on :5173) and backend (tsx on :3000)
  - [x] Verify `pnpm build` completes without errors
- [x] Task 10: Create .env.example and .gitignore updates (AC: #13)
  - [x] Create `.env.example` with documented variables: `DATABASE_URL`, `PORT`, `NODE_ENV`
  - [x] Ensure `.env` is in `.gitignore`
  - [x] Ensure `node_modules/`, `dist/`, and `*.local` are in `.gitignore`
- [x] Task 11: Verify full setup
  - [x] Run `pnpm install` from root — all dependencies resolve
  - [x] Run `pnpm lint` — zero errors
  - [x] Run `pnpm test` — placeholder tests pass in both packages
  - [x] Run `pnpm dev` — both servers start
  - [x] Run `pnpm build` — both packages build successfully

## Dev Notes

### Critical Architecture Compliance

This is the foundational story — every subsequent story builds on the structure established here. Deviations will cascade into all future work.

**Monorepo structure MUST match:**
```
bmad-todo-app/
├── .env.example
├── .gitignore
├── biome.json
├── package.json                    # Root workspace scripts
├── pnpm-lock.yaml
├── pnpm-workspace.yaml             # packages: ['packages/*']
├── tsconfig.base.json              # Shared TypeScript base config
├── e2e/
│   ├── playwright.config.ts
│   └── example.spec.ts             # Placeholder
├── packages/
│   ├── frontend/
│   │   ├── package.json
│   │   ├── tsconfig.json           # Extends ../../tsconfig.base.json
│   │   ├── tsconfig.app.json       # Vite-specific (from create-vite)
│   │   ├── vite.config.ts
│   │   ├── index.html
│   │   └── src/
│   │       ├── main.tsx
│   │       ├── app.tsx             # Minimal shell
│   │       ├── app.test.tsx        # Placeholder test
│   │       └── test-setup.ts       # Vitest + RTL setup
│   └── backend/
│       ├── package.json
│       ├── tsconfig.json           # Extends ../../tsconfig.base.json
│       └── src/
│           ├── server.ts           # Placeholder entry point
│           └── server.test.ts      # Placeholder test
```

### Naming Conventions (Enforced from Day One)

| Element | Convention | Example |
|---------|-----------|---------|
| Files | kebab-case | `todo-card.tsx`, `todo-routes.ts` |
| React components | PascalCase | `TodoCard`, `AddInput` |
| Functions/variables | camelCase | `getTodos()`, `isCompleted` |
| Types/interfaces | PascalCase | `Todo`, `CreateTodoRequest` |
| Constants | UPPER_SNAKE_CASE | `API_BASE_URL` |
| CSS variables | kebab-case | `--text-primary`, `--duration-fast` |
| Test files | co-located `{source}.test.{ext}` | `app.test.tsx` |

### Library Versions (Verified April 2026)

| Library | Version | Notes |
|---------|---------|-------|
| pnpm | 10.x (latest 10.33.0) | Workspace manager — do NOT use npm or yarn |
| TypeScript | 5.6+ (or 6.0 if stable) | Strict mode required |
| Vite | Latest via `create-vite@latest` (9.x) | Use `--template react-ts` |
| React | 19.x (from Vite template) | Comes with create-vite |
| Biome | 2.4.x (latest 2.4.10) | Single tool: lint + format + import sort |
| Vitest | 4.1.x (latest 4.1.2) | Supports Vite 8; use `vitest` not `jest` |
| @testing-library/react | Latest | For frontend component tests |
| @testing-library/user-event | Latest | For simulating user interactions |
| @testing-library/jest-dom | Latest | For DOM assertion matchers |
| Playwright | 1.59.x | For e2e tests; install browsers with `npx playwright install` |
| tsx | Latest | Backend dev server (TypeScript execution, no compile step) |

### tsconfig.base.json Specification

```json
{
  "compilerOptions": {
    "target": "ES2022",
    "lib": ["ES2023"],
    "module": "ESNext",
    "moduleResolution": "bundler",
    "strict": true,
    "esModuleInterop": true,
    "skipLibCheck": true,
    "forceConsistentCasingInFileNames": true,
    "resolveJsonModule": true,
    "isolatedModules": true,
    "noUnusedLocals": true,
    "noUnusedParameters": true,
    "noFallthroughCasesInSwitch": true,
    "declaration": true,
    "declarationMap": true,
    "sourceMap": true
  }
}
```

The frontend tsconfig extends this and adds JSX support (`"jsx": "react-jsx"`), DOM libs, and path aliases. The backend tsconfig extends this and overrides `module` / `moduleResolution` to `NodeNext` for Node ESM, plus `outDir`, `rootDir`, and path aliases.

### biome.json Specification

```json
{
  "$schema": "https://biomejs.dev/schemas/2.4.10/schema.json",
  "organizeImports": {
    "enabled": true
  },
  "linter": {
    "enabled": true,
    "rules": {
      "recommended": true
    }
  },
  "formatter": {
    "enabled": true,
    "indentStyle": "tab",
    "lineWidth": 100
  },
  "javascript": {
    "formatter": {
      "quoteStyle": "single",
      "semicolons": "always"
    }
  }
}
```

Biome import ordering is configured to sort: React/external packages first, then internal aliases (`@/`), then relative imports, then CSS.

### Vite Config Notes

The frontend `vite.config.ts` must include:
- `@vitejs/plugin-react` plugin
- Vitest configuration with `jsdom` environment and `test-setup.ts` as setup file
- Path alias resolution matching tsconfig (`@/` → `./src/`)
- **Do NOT add Tailwind or proxy config yet** — those come in Story 1.4 and 1.5

### Backend Package Notes

- Entry point is `src/server.ts` — a minimal placeholder for now
- Use `tsx` for development (fast TypeScript execution with watch mode)
- Use `tsc` for production build (compiles to `dist/`)
- **Do NOT install Fastify, Drizzle, or any backend dependencies yet** — those come in Story 1.2

### Pre-commit Hook Setup

Choose either `simple-git-hooks` or `lefthook`:

**Option A — simple-git-hooks (simpler, zero deps):**
```json
// package.json
{
  "simple-git-hooks": {
    "pre-commit": "pnpm biome check --staged --no-errors-on-unmatched"
  }
}
```

**Option B — lefthook (faster, parallel, monorepo-aware):**
```yaml
# lefthook.yml
pre-commit:
  commands:
    lint:
      run: pnpm biome check --staged --no-errors-on-unmatched
```

Either is acceptable. The architecture doc mentions both as options.

### What This Story Does NOT Include

Do NOT implement any of the following (they belong to later stories):
- Fastify server setup (Story 1.2)
- Database/Drizzle setup (Story 1.2)
- API routes (Story 1.3)
- Tailwind CSS / design tokens (Story 1.4)
- Shadcn/ui initialization (Story 1.4)
- React components beyond minimal App shell (Story 1.4, 1.5)
- TanStack Query (Story 1.5)
- Vite proxy configuration (Story 1.5)
- Docker configuration (Story 5.1, 5.2)

### .env.example Content

```bash
# Database
DATABASE_URL=postgresql://postgres:postgres@localhost:5432/bmad_todo

# Backend
PORT=3000
NODE_ENV=development
```

### Project Structure Notes

- All paths and module names align with the architecture document's project directory structure
- The `e2e/` folder is at workspace root, not inside either package
- Test files are co-located with source files (not in a separate `__tests__/` directory)
- The root `package.json` is private and contains only workspace scripts and shared dev dependencies
- Each package manages its own runtime dependencies

### References

- [Source: _bmad-output/planning-artifacts/architecture.md#Starter Template Evaluation] — Manual scaffold initialization sequence
- [Source: _bmad-output/planning-artifacts/architecture.md#Structure Patterns] — Frontend and backend directory structure
- [Source: _bmad-output/planning-artifacts/architecture.md#Naming Patterns] — All naming conventions
- [Source: _bmad-output/planning-artifacts/architecture.md#Implementation Patterns & Consistency Rules] — Biome config, import ordering, enforcement guidelines
- [Source: _bmad-output/planning-artifacts/architecture.md#Core Architectural Decisions] — TypeScript strict mode, Vitest, Playwright, co-located tests
- [Source: _bmad-output/planning-artifacts/epics.md#Story 1.1] — Acceptance criteria and user story
- [Source: _bmad-output/planning-artifacts/prd.md#Additional Requirements] — pnpm workspace, TypeScript 5.4+, Biome 2.4.x, Vitest 4.1.x

## Dev Agent Record

### Agent Model Used

claude-4.6-opus-high

### Debug Log References

- Biome 2.x config differs from story spec: `organizeImports` moved to `assist.actions.source.organizeImports`, `files.ignore` replaced by `files.includes` with negated patterns, folder ignore no longer needs `/**` suffix
- Backend `tsc` build initially failed: `console` not found — resolved by adding `@types/node` and `"types": ["node"]` to backend tsconfig
- Frontend `tsc -b` failed with `test` property unknown on `UserConfigExport` — resolved by importing `defineConfig` from `vitest/config` instead of `vite`
- Frontend `tsc -b` failed with missing `@types/node` — re-added to frontend devDependencies (was removed during ESLint cleanup)
- pnpm `onlyBuiltDependencies` field needed to approve esbuild and simple-git-hooks build scripts
- Backend vitest picked up compiled `dist/server.test.js` — added `exclude: ['dist/**']` to vitest config

### Completion Notes List

- All 11 tasks and their subtasks completed successfully
- Monorepo structure matches the architecture spec exactly
- Used `pnpm --parallel -r run dev` instead of `concurrently` (no extra dependency needed)
- Used `simple-git-hooks` (Option A) for pre-commit hook
- Biome 2.4.10 config adapted for v2 schema (assist actions, files.includes with negated patterns)
- All acceptance criteria verified: workspace yaml, frontend/backend packages, shared tsconfig, biome, vitest, playwright, dev/build scripts, .env.example

### File List

- package.json (modified — workspace root with scripts, devDependencies, simple-git-hooks config)
- pnpm-workspace.yaml (new — workspace definition)
- pnpm-lock.yaml (modified — all dependencies)
- tsconfig.base.json (new — shared TypeScript base config)
- biome.json (new — lint, format, import sorting)
- .env.example (new — documented environment variables)
- .gitignore (modified — added *.local, playwright entries)
- packages/frontend/package.json (modified — removed ESLint, added testing libs, test script)
- packages/frontend/index.html (modified — updated title)
- packages/frontend/vite.config.ts (modified — vitest config, path aliases, import sorting)
- packages/frontend/tsconfig.json (modified — biome-compatible formatting)
- packages/frontend/tsconfig.app.json (modified — extends base, path aliases)
- packages/frontend/tsconfig.node.json (modified — extends base)
- packages/frontend/src/app.tsx (modified — minimal shell, named export)
- packages/frontend/src/main.tsx (modified — safe root element access, named import)
- packages/frontend/src/test-setup.ts (new — @testing-library/jest-dom/vitest setup)
- packages/frontend/src/app.test.tsx (new — placeholder test)
- packages/backend/package.json (new — scripts, tsx, typescript, @types/node)
- packages/backend/tsconfig.json (new — extends base, outDir, node types)
- packages/backend/vitest.config.ts (new — node environment, dist exclusion)
- packages/backend/src/server.ts (new — placeholder entry point)
- packages/backend/src/server.test.ts (new — placeholder test)
- e2e/playwright.config.ts (new — chromium, base URL localhost:5173)
- e2e/example.spec.ts (new — placeholder e2e test)

### Change Log

- 2026-04-07: Story 1.1 implemented — full monorepo scaffold with pnpm workspace, TypeScript, Biome, Vitest, Playwright, and pre-commit hooks
- 2026-04-07: Code review patches — Playwright `webServer`, explicit `vitest` in frontend/backend packages, Task 6 wording fix
- 2026-04-07: Backend TypeScript — `NodeNext` / `NodeNext` override in `packages/backend/tsconfig.json`; shared base stays bundler-oriented

### Review Findings

- [x] [Review][Patch] Playwright should start or reuse the Vite dev server — addressed: `webServer` in `e2e/playwright.config.ts` runs `pnpm --filter frontend dev` from repo root with `reuseExistingServer` locally.
- [x] [Review][Patch] Declare Vitest in workspace packages — addressed: `vitest` added to `devDependencies` in `packages/frontend` and `packages/backend`.
- [x] [Review][Decision] Shared `tsconfig.base.json` module settings vs story Task 4 — resolved: keep bundler-oriented base for Vite; `packages/backend/tsconfig.json` overrides `module` and `moduleResolution` to `NodeNext`.
- [x] [Review][Patch] Story Task 6 subtasks vs repo — addressed: Task 6 subtask text updated to match `simple-git-hooks` + Biome on staged files only.
