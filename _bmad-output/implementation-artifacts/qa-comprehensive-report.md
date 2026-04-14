# Comprehensive QA Report

**Project:** bmad-todo-app
**Date:** 2026-04-14
**QA Engineer:** Quinn (AI QA Agent)
**Scope:** Test Coverage, Performance, Accessibility (WCAG AA), Security Review

---

## Executive Summary

| Area | Score / Status | Verdict |
|------|---------------|---------|
| Test Coverage (Frontend) | 80.78% lines | **PASS** — exceeds 70% target |
| Test Coverage (Backend) | 79.38% lines, 50.87% branches | **PARTIAL** — lines pass, branches below target |
| Performance (Lighthouse) | 56/100 | **NEEDS WORK** — dev-mode penalty; low real concern |
| Accessibility (Lighthouse) | 96/100 | **NEAR-PASS** — 1 systematic color contrast issue |
| Accessibility (axe-core) | 1 rule failing (color-contrast) | **FAIL** — WCAG 1.4.3 violation |
| Best Practices (Lighthouse) | 100/100 | **PASS** |
| Security (Code Review) | 2 critical, 3 high, 5 medium | **NEEDS REMEDIATION** |
| Dependency Audit | 1 moderate advisory | **ACCEPTABLE** |

---

## 1. Test Coverage Analysis

### Tools Used

- **Vitest** v4.1.3 with **@vitest/coverage-v8** v4.1.4
- Coverage config added to both `packages/frontend/vite.config.ts` and `packages/backend/vitest.config.ts`

### Frontend Coverage (194 tests, 14 files)

| Metric | Value | Target | Status |
|--------|-------|--------|--------|
| Statements | 79.07% (699/884) | 70% | **PASS** |
| Branches | 78.08% (392/502) | 70% | **PASS** |
| Functions | 83.18% (183/220) | 70% | **PASS** |
| Lines | 80.78% (618/765) | 70% | **PASS** |

#### Coverage Gaps Identified

| File | Lines % | Issue |
|------|---------|-------|
| `providers.tsx` | 0% | Wrapper component untested (low risk — thin wrapper around QueryClientProvider) |
| `use-todos.ts` | 47.88% | Mutation hooks, error paths, and delete/undo flows undertested |
| `use-reduced-motion.ts` | 80% | Cleanup branch uncovered |
| `api.ts` | 80% | Error paths and edge cases in API client |
| `filter-tabs.tsx` | 75% | Animation and inactive state branches |
| `sort-row.tsx` | 80% | Some button state branches |
| `todo-list.tsx` | 83.92% | Animation lifecycle branches |

#### Priority Gap: `use-todos.ts` (47.88% lines)

This is the critical hook managing all mutation state (create, toggle, delete/undo). Low coverage here means:
- Error recovery paths in mutations are untested at unit level
- Delete/undo timer coordination has gaps
- Concurrent mutation edge cases lack unit-level verification

**Recommendation:** Add focused tests for `useTodos` hook mutation error paths, undo timer behavior, and concurrent operation edge cases. This would push frontend coverage above 85%.

### Backend Coverage (26 tests, 3 files)

| Metric | Value | Target | Status |
|--------|-------|--------|--------|
| Statements | 79% (79/100) | 70% | **PASS** |
| Branches | 50.87% (29/57) | 70% | **FAIL** |
| Functions | 86.36% (19/22) | 70% | **PASS** |
| Lines | 79.38% (77/97) | 70% | **PASS** |

#### Coverage Gaps Identified

| File | Lines % | Branch % | Issue |
|------|---------|----------|-------|
| `error-handler.ts` | 36.84% | 10% | Production error masking, Zod validation paths, unknown error handling |
| `cors.ts` | 55.55% | 33.33% | Production origin validation path untested |
| `env.ts` | 70% | 50% | Production environment variable validation |

#### Priority Gap: `error-handler.ts` (36.84% lines, 10% branches)

The centralized error handler has significant untested paths:
- Zod validation error formatting
- Production vs development error message masking
- Unknown error type handling
- 500-level error response shaping

**Recommendation:** Add targeted tests for the error handler plugin covering Zod errors, production mode behavior, and unknown error types. This alone would bring branch coverage above 65%.

### Test Suite Inventory

| Layer | Files | Tests | Lines of Test Code |
|-------|-------|-------|--------------------|
| Frontend Unit (Vitest) | 14 | 194 | ~3,300 |
| Backend Unit (Vitest) | 3 | 26 | ~494 |
| E2E (Playwright) | 15 | ~104 | ~2,500 |
| **Total** | **32** | **~324** | **~6,300** |

---

## 2. Performance Testing

### Tools Used

- **Lighthouse** v13.1.0 (headless Chromium)
- Target: `http://localhost:5173` (Vite dev server)

### Scores

| Category | Score |
|----------|-------|
| Performance | **56/100** |
| Accessibility | **96/100** |
| Best Practices | **100/100** |

### Performance Metrics

| Metric | Value | Score | Notes |
|--------|-------|-------|-------|
| First Contentful Paint | 10.3s | 0 | Dev server penalty — Vite serves unbundled ESM |
| Largest Contentful Paint | 18.8s | 0 | Dev server penalty — no pre-bundling |
| Total Blocking Time | 30ms | 1.0 | **Excellent** — minimal JS blocking |
| Cumulative Layout Shift | 0 | 1.0 | **Excellent** — zero layout shift |
| Speed Index | 10.3s | 0.08 | Dev server penalty |
| Time to Interactive | 18.8s | 0.03 | Dev server penalty |

### Analysis

**The 56/100 performance score is misleading.** Lighthouse was run against the Vite development server, which:
- Serves unbundled ES modules (no tree-shaking, no minification)
- Performs on-demand compilation for every module import
- Adds HMR client overhead

**What actually matters:**
- **TBT: 30ms** — the app's JavaScript is lightweight and non-blocking
- **CLS: 0** — no layout instability
- These two metrics reflect the real application quality

**Recommendation:** Run Lighthouse against a production build (`vite build` → `vite preview` or Docker nginx) for meaningful FCP/LCP/SI numbers. Based on TBT and CLS, the production build will likely score **85-95+**.

### Performance Findings

| ID | Severity | Finding | Recommendation |
|----|----------|---------|----------------|
| P-1 | Low | No bundle size tracking configured | Add `vite-plugin-bundle-stats` or CI size-limit check |
| P-2 | Low | No Core Web Vitals monitoring | Add `web-vitals` library for production monitoring |
| P-3 | Info | Dev server metrics not representative | Run Lighthouse against production build for accurate scores |

---

## 3. Accessibility Testing

### Tools Used

- **axe-core** v4.11.x via `@axe-core/playwright`
- **Lighthouse** accessibility audit
- **WCAG 2.1 AA** standard (tags: wcag2a, wcag2aa, wcag21a, wcag21aa)

### axe-core Results (5 test scenarios)

| Scenario | Violations | Rule |
|----------|------------|------|
| Empty state | 1 (6 nodes) | color-contrast |
| Populated list | 1 (6 nodes) | color-contrast |
| Completed todo | 1 (6 nodes) | color-contrast |
| Filter views (Active) | 1 (5 nodes) | color-contrast |
| Error banner visible | 1 (8 nodes) | color-contrast |

### Single Violation: Color Contrast (WCAG 1.4.3)

**Rule:** `color-contrast` (Serious)
**Impact:** Users with low vision may not be able to read affected text
**Standard:** WCAG 2.1 AA requires 4.5:1 contrast ratio for normal text

| Element | FG Color | BG Color | Actual Ratio | Required |
|---------|----------|----------|-------------|----------|
| Todo count badge | `#8a8279` | `#fafaf7` | 3.61:1 | 4.5:1 |
| Filter tabs (All/Active/Completed) | `#8a8279` | `#fafaf7` | 3.61:1 | 4.5:1 |
| Sort buttons (inactive) | `#8a8279` | `#fafaf7` | 3.61:1 | 4.5:1 |
| Empty state description text | `#8a8279` | `#fafaf7` | 3.61:1 | 4.5:1 |
| Error banner message text | varies | varies | < 4.5:1 | 4.5:1 |

**Root cause:** The `--text-secondary` CSS custom property (`#8a8279`) against the `--surface` / `--background` colors (`#fafaf7`) does not meet the 4.5:1 minimum.

**Remediation:** Darken `--text-secondary` from `#8a8279` to approximately `#736b63` (or darker) to achieve ≥ 4.5:1 ratio against `#fafaf7`. Verify the change looks acceptable visually and re-run the audit.

### What Passes Well

- All ARIA roles, labels, and landmarks are correct
- Keyboard navigation works (Tab, Enter, Escape, Arrow keys)
- Screen reader announcements via `aria-live` regions
- Focus management after delete/undo operations
- Responsive touch targets meet minimum size requirements
- No other WCAG 2.1 AA violations detected by axe-core

---

## 4. Security Review

### Tools Used

- AI-assisted code review (all backend routes, plugins, frontend API layer, Docker configs, secrets)
- `pnpm audit` dependency scanning

### Dependency Audit

| Severity | Count | Package | Advisory |
|----------|-------|---------|----------|
| Moderate | 1 | `esbuild` (via drizzle-kit) | [GHSA-67mh-4wv8-2f99](https://github.com/advisories/GHSA-67mh-4wv8-2f99) — dev server CORS issue |

**Risk:** Dev-toolchain only (drizzle-kit → esbuild). Not present in production runtime.

### Security Findings

#### CRITICAL

| ID | Finding | File | Risk |
|----|---------|------|------|
| S-1 | **No authentication or authorization on REST API** | `routes/todo-routes.ts` | All endpoints are public. No user identity, no scoping. `userId` column exists on schema but is never populated. Any client can CRUD any todo. (OWASP A01, A07) |
| S-2 | **PostgreSQL exposed on host via docker-compose.override.yml** | `docker-compose.override.yml` | Port 5432 published to host network with default credentials. (OWASP A05) |

#### HIGH

| ID | Finding | File | Risk |
|----|---------|------|------|
| S-3 | **Swagger UI enabled unconditionally** | `plugins/swagger.ts`, `app.ts` | Full API surface exposed at `/documentation` in all environments. Reconnaissance aid. (OWASP A05) |
| S-4 | **Content-Security-Policy disabled** | `plugins/helmet.ts` | `contentSecurityPolicy: false` removes a key defense-in-depth header. (OWASP A05) |
| S-5 | **No rate limiting** | All routes | No `@fastify/rate-limit` or equivalent. Vulnerable to brute-force and DoS. (OWASP A04) |

#### MEDIUM

| ID | Finding | File | Risk |
|----|---------|------|------|
| S-6 | **Unbounded description string** | `todo-schemas.ts` | `z.string()` with no `.max()` limit. Large payloads accepted. (OWASP A04) |
| S-7 | **CORS allows null/missing origin in production** | `plugins/cors.ts` | When origin is falsy, callback allows the request. (OWASP A05) |
| S-8 | **Validation errors leak field details** | `plugins/error-handler.ts` | Zod validation messages sent to client, aiding schema reconnaissance. (OWASP A09) |
| S-9 | **Nginx lacks security headers** | `frontend/nginx.conf` | No CSP, X-Frame-Options, Referrer-Policy, or Permissions-Policy. (OWASP A05) |
| S-10 | **Docker containers run as root** | Both Dockerfiles | `node:22-alpine` and `nginx:alpine` without `USER` directive. (OWASP A05) |

#### LOW / INFORMATIONAL

| ID | Finding | Risk |
|----|---------|------|
| S-11 | CSRF not applicable today (no cookies/sessions) — but will be needed if auth is added | Future risk |
| S-12 | Backend `.env` contains dev credentials — ensure it stays gitignored | Credential hygiene |
| S-13 | Moderate esbuild advisory via drizzle-kit (dev-only) | Minimal production risk |

### What's Done Well (Security Positives)

- **SQL Injection:** Drizzle ORM with parameterized queries throughout — no raw SQL in production code
- **XSS:** React escapes all text content; no `dangerouslySetInnerHTML` usage
- **ID Validation:** Route params validated as UUID via Zod (`z.uuid()`)
- **CORS in Production:** `ALLOWED_ORIGINS` env var required when `NODE_ENV=production`
- **Docker Secrets:** DB credentials use Docker secrets files rather than env vars in compose
- **500 Error Masking:** Internal error messages hidden from client in production mode
- **Structured Validation:** Zod + fastify-type-provider-zod provides consistent request/response validation
- **Lockfile Integrity:** `--frozen-lockfile` used in Docker builds

---

## 5. Recommended Actions (Priority Order)

### Must Fix (Before Any Public Deployment)

1. **Fix color contrast** — Darken `--text-secondary` to achieve ≥ 4.5:1 ratio (affects todo count badge, filter tabs, sort buttons, empty state text, error banner)
2. **Add authentication** if deploying beyond localhost (S-1)
3. **Restrict Swagger UI to dev mode** (S-3)
4. **Add input length limits** — `z.string().min(1).max(500)` on description (S-6)

### Should Fix

5. **Add error handler tests** — Cover Zod errors, production mode, unknown errors (raises backend branch coverage to ~65%+)
6. **Add `use-todos.ts` mutation tests** — Cover error paths, undo timer, concurrent ops (raises frontend coverage to ~85%+)
7. **Enable CSP** — Even a basic `default-src 'self'` policy (S-4)
8. **Add rate limiting** — `@fastify/rate-limit` with sensible defaults (S-5)
9. **Add nginx security headers** — CSP, X-Frame-Options, Referrer-Policy (S-9)
10. **Run as non-root in Docker** — Add `USER node` / `USER nginx` (S-10)

### Nice to Have

11. **Run Lighthouse against production build** for accurate performance scores
12. **Add bundle size tracking** in CI
13. **Sanitize validation error messages in production** (S-8)
14. **Update drizzle-kit** to resolve transitive esbuild advisory (S-13)

---

## 6. Test Artifacts Produced

| Artifact | Path | Purpose |
|----------|------|---------|
| Frontend coverage config | `packages/frontend/vite.config.ts` | V8 coverage provider configured |
| Backend coverage config | `packages/backend/vitest.config.ts` | V8 coverage provider configured |
| Accessibility audit test | `e2e/qa-accessibility-audit.spec.ts` | 5 axe-core WCAG AA scenarios |
| Lighthouse report | `lighthouse-report.json` | Performance + a11y + best practices |
| This report | `_bmad-output/implementation-artifacts/qa-comprehensive-report.md` | Consolidated QA findings |

---

## 7. How to Re-Run

```bash
# Coverage (frontend)
cd packages/frontend && pnpm vitest run --coverage

# Coverage (backend)
cd packages/backend && pnpm vitest run --coverage

# Accessibility audit (requires app running on :5173 + :3000)
npx playwright test e2e/qa-accessibility-audit.spec.ts --config e2e/playwright.config.ts

# Lighthouse (requires app running on :5173)
npx lighthouse http://localhost:5173 --output=json --output-path=./lighthouse-report.json --chrome-flags="--headless --no-sandbox" --only-categories=performance,accessibility,best-practices

# Dependency audit
pnpm audit
```

---

**Report generated:** 2026-04-14
**Next review:** After remediation of critical/high items
