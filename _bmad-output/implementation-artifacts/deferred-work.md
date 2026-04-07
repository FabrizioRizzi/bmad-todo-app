## Deferred from: code review of 1-2-backend-api-and-database-foundation.md (2026-04-07)

- Listen on `0.0.0.0` in `server.ts` — deployment/security hardening to revisit with hosting strategy (not a functional defect for this story).

## Deferred from: code review of story-1.3 (2026-04-07)

- No max length on description — `createTodoBodySchema` uses bare `z.string()` with no `.max()`, allowing arbitrarily large payloads. Revisit when adding input length constraints across the API.
- `postTodo400ResponseSchema` union second branch overly permissive — `zodBodyValidationErrorSchema.message` is `z.string()` without enforcing the `"Validation error: "` prefix. Cosmetic schema strictness to tighten later.
