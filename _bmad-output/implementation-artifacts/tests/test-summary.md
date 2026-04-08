# Test Automation Summary

**Date:** 2026-04-08
**Project:** bmad-todo-app
**Framework:** Playwright v1.59.1

---

## Generated / Fixed Tests

### E2E Tests

- [x] `e2e/example.spec.ts` - Homepage smoke test (1 test)
- [x] `e2e/todos.spec.ts` - Create and View List (14 tests)
- [x] `e2e/toggle-todo-completion.spec.ts` - Toggle Todo Completion (7 tests) **FIXED**

### Changes Made

#### `e2e/playwright.config.ts`
- Added sandbox detection: when `PLAYWRIGHT_BROWSERS_PATH` points to `cursor-sandbox-cache`, the config falls back to `channel: 'chrome'` (system Chrome) instead of the bundled Chromium
- This avoids the architecture mismatch where the sandbox caches x64 binaries on an ARM64 Mac

#### `e2e/toggle-todo-completion.spec.ts`
- **Fixed broken locators**: replaced fragile `checkbox.locator('..').locator('..')` parent traversal with robust `todoCard()` helper using XPath `ancestor::div[contains(@class,"todo-card-bar")]`
- **Fixed test isolation**: replaced `page.locator('input[type="checkbox"]').first()` with `todoCheckbox()` helper that targets the specific todo's checkbox via `aria-label`, preventing interference from other parallel tests or leftover DB state
- **All 7 tests now pass reliably** in parallel execution

## Coverage

- **E2E test files:** 3
- **Total E2E tests:** 22 (all passing)
- **UI features covered:**
  - Homepage load & header display
  - Todo creation (Enter key + button click)
  - Input validation (empty, whitespace)
  - Count badge updates
  - Input clearing after submit
  - Focus management
  - Multiple todo display
  - Error handling (creation failure)
  - Input preservation on error
  - Todo persistence across reload
  - Toggle completion (active → completed)
  - Toggle completion (completed → active)
  - Optimistic update + error revert
  - Independent multi-todo toggling
  - Checkbox accessibility attributes

## Cursor Sandbox Limitation

**E2E tests cannot run inside the Cursor IDE default sandbox.** The sandbox:
1. Sets `PLAYWRIGHT_BROWSERS_PATH` to a cache dir with **x64** Chromium on an **ARM64** Mac
2. Restricts process spawning — even system Chrome (SIGABRT + `kill EPERM`)

### Workaround

Run E2E tests with `required_permissions: ["all"]` to disable the sandbox:

```bash
# From Cursor agent: use required_permissions: ["all"]
# From terminal: run normally
pnpm test:e2e
```

The `channel: 'chrome'` fallback in the Playwright config ensures the correct browser binary is used regardless of the `PLAYWRIGHT_BROWSERS_PATH` env var.

## Next Steps

- Run tests in CI (GitHub Actions, etc.) — no special config needed
- The sandbox limitation is a Cursor platform issue, not a project issue
