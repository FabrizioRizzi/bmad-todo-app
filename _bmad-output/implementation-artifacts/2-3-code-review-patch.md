# Code Review Patch: Story 2.3 - Error Banner Component

**Date:** 2026-04-08  
**Review Status:** CONDITIONAL APPROVAL  
**Total Patches:** 6 critical fixes

---

## PATCH 1: Extract Auto-Dismiss Timer to Constant

**File:** `packages/frontend/src/components/error-banner.tsx`

**Problem:** Magic number `8000` (8 seconds) appears in multiple places (component + tests). Violates DRY principle and makes future timeout adjustments error-prone.

**Change:**

```typescript
// OLD
dismissTimerRef.current = setTimeout(() => {
	setExiting(true);
	exitTimerRef.current = setTimeout(() => {
		onDismissRef.current();
	}, 200);
}, 8000);

// NEW
const AUTO_DISMISS_MS = 8000;
const EXIT_ANIMATION_MS = 200;

dismissTimerRef.current = setTimeout(() => {
	setExiting(true);
	exitTimerRef.current = setTimeout(() => {
		onDismissRef.current();
	}, EXIT_ANIMATION_MS);
}, AUTO_DISMISS_MS);
```

**Updated Full Component:**

```typescript
import { useEffect, useRef, useState } from 'react';

type ErrorBannerProps = {
	message: string;
	onDismiss: () => void;
};

const AUTO_DISMISS_MS = 8000;
const EXIT_ANIMATION_MS = 200;

export function ErrorBanner({ message, onDismiss }: ErrorBannerProps) {
	const [exiting, setExiting] = useState(false);
	const dismissTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null);
	const exitTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null);
	const onDismissRef = useRef(onDismiss);
	onDismissRef.current = onDismiss;

	// biome-ignore lint/correctness/useExhaustiveDependencies: message triggers timer reset on error replacement (AC #5)
	useEffect(() => {
		setExiting(false);

		if (dismissTimerRef.current) clearTimeout(dismissTimerRef.current);
		if (exitTimerRef.current) clearTimeout(exitTimerRef.current);

		dismissTimerRef.current = setTimeout(() => {
			setExiting(true);
			exitTimerRef.current = setTimeout(() => {
				if (onDismissRef.current) onDismissRef.current();
			}, EXIT_ANIMATION_MS);
		}, AUTO_DISMISS_MS);

		return () => {
			if (dismissTimerRef.current) clearTimeout(dismissTimerRef.current);
			if (exitTimerRef.current) clearTimeout(exitTimerRef.current);
		};
	}, [message]);

	return (
		<div
			role="alert"
			aria-live="assertive"
			data-testid="error-banner"
			className={`flex items-center gap-[var(--space-3)] rounded-[0.625rem] bg-[color:var(--error-bg)] px-[var(--space-4)] py-[var(--space-3)] text-[color:var(--error)] ${
				exiting ? 'error-banner-exit' : 'error-banner-enter'
			}`}
		>
			<span aria-hidden="true" className="shrink-0 text-[length:var(--text-lg)]">
				⚠
			</span>
			<p className="m-0 text-[length:var(--text-sm)] leading-[var(--text-sm-leading)]">{message}</p>
		</div>
	);
}
```

---

## PATCH 2: Add Null Check on onDismissRef.current

**File:** `packages/frontend/src/components/error-banner.tsx`

**Problem:** The exit timer callback invokes `onDismissRef.current()` without checking if it's defined. This is addressed in PATCH 1 above.

**Change:** Line 25 is protected with guard check:

```typescript
// OLD
exitTimerRef.current = setTimeout(() => {
	onDismissRef.current();
}, 200);

// NEW
exitTimerRef.current = setTimeout(() => {
	if (onDismissRef.current) onDismissRef.current();
}, EXIT_ANIMATION_MS);
```

---

## PATCH 3: Add Fallback for Missing ERROR_MESSAGES Key

**File:** `packages/frontend/src/app.tsx`

**Problem:** `showError(actionType)` accesses `ERROR_MESSAGES[actionType]` without fallback. If invalid actionType is passed at runtime, message becomes `undefined`.

**Change:**

```typescript
// OLD
const showError = useCallback((actionType: ErrorActionType) => {
	setErrorMessage(ERROR_MESSAGES[actionType]);
}, []);

// NEW
const showError = useCallback((actionType: ErrorActionType) => {
	setErrorMessage(ERROR_MESSAGES[actionType] ?? 'An error occurred');
}, []);
```

---

## PATCH 4: Add Type-Safe Lookup for ERROR_MESSAGES

**File:** `packages/frontend/src/app.tsx`

**Problem:** No runtime validation that `actionType` is a valid key. TypeScript enforces at compile-time, but defensive programming is safer.

**Change:** Create a helper function to ensure type safety:

```typescript
// ADD this helper after ERROR_MESSAGES definition
const getErrorMessage = (actionType: ErrorActionType): string => {
	const message = ERROR_MESSAGES[actionType];
	if (!message) {
		console.warn(`Missing error message for action type: ${actionType}`);
		return 'An error occurred';
	}
	return message;
};

// USE in showError callback
const showError = useCallback((actionType: ErrorActionType) => {
	setErrorMessage(getErrorMessage(actionType));
}, []);
```

---

## PATCH 5: Export Timer Constants for E2E Tests

**File:** `packages/frontend/src/components/error-banner.tsx`

**Problem:** E2E tests hardcode `8000` instead of using a shared constant. Export constants for test reuse.

**Change:**

```typescript
// ADD export at top of file
export const AUTO_DISMISS_MS = 8000;
export const EXIT_ANIMATION_MS = 200;
```

**Update E2E tests to use constants:**

File: `e2e/error-banner.spec.ts`

```typescript
// OLD (around line 571)
await page.waitForTimeout(5000);
await expect(banner).toBeVisible();
await page.waitForTimeout(4000);

// NEW
import { AUTO_DISMISS_MS, EXIT_ANIMATION_MS } from '@/components/error-banner';

const checkInterval = 5000;
const totalWait = AUTO_DISMISS_MS + EXIT_ANIMATION_MS + 500; // buffer
await page.waitForTimeout(checkInterval);
await expect(banner).toBeVisible();
await page.waitForTimeout(totalWait - checkInterval);
```

---

## PATCH 6: Restore Original app.test.tsx Coverage

**File:** `packages/frontend/src/app.test.tsx`

**Problem:** New tests completely replace original tests. Lost coverage for app title, todo count, form elements, etc.

**Change:** Add original tests back alongside new error banner tests:

```typescript
// ADD at end of file, before closing describe block

describe('App – Original Coverage', () => {
	it('renders the app title in the header', () => {
		const queryClient = createTestQueryClient();
		render(
			<QueryClientProvider client={queryClient}>
				<App />
			</QueryClientProvider>,
		);
		expect(screen.getByRole('heading', { level: 1 })).toHaveTextContent('My Tasks');
	});

	it('shows todo count from loaded list', async () => {
		vi.stubGlobal(
			'fetch',
			vi.fn((input: RequestInfo, init?: RequestInit) => {
				const url = typeof input === 'string' ? input : input.url;
				if (url.includes('/api/todos') && (!init?.method || init.method === 'GET')) {
					return Promise.resolve(
						new Response(JSON.stringify([
							{
								id: 'a',
								description: 'One',
								isCompleted: false,
								createdAt: '2026-01-01T00:00:00.000Z',
								dueDate: null,
							},
						]), {
							status: 200,
							headers: { 'Content-Type': 'application/json' },
						}),
					);
				}
				return Promise.reject(new Error(`Unexpected fetch: ${url}`));
			}),
		);

		const queryClient = createTestQueryClient();
		render(
			<QueryClientProvider client={queryClient}>
				<App />
			</QueryClientProvider>,
		);

		await waitFor(() => {
			expect(screen.getByRole('status', { name: /todo count/i })).toHaveTextContent('1 remaining');
		});
		
		vi.unstubAllGlobals();
	});

	it('renders add form and todo list regions', async () => {
		const queryClient = createTestQueryClient();
		render(
			<QueryClientProvider client={queryClient}>
				<App />
			</QueryClientProvider>,
		);
		
		expect(screen.getByRole('region', { name: /add new todo/i })).toBeInTheDocument();
		expect(screen.getByRole('region', { name: /todo list/i })).toBeInTheDocument();
	});

	it('renders add field and submit control', () => {
		const queryClient = createTestQueryClient();
		render(
			<QueryClientProvider client={queryClient}>
				<App />
			</QueryClientProvider>,
		);
		
		expect(screen.getByPlaceholderText(/add a new task/i)).toBeInTheDocument();
		expect(screen.getByRole('button', { name: /add task/i })).toBeInTheDocument();
	});
});
```

---

## DECISION_NEEDED: Confirm --ease-standard Equals ease-out

**File:** `packages/frontend/src/styles/globals.css`

**Issue:** Spec requires "200ms ease-out" animations. Implementation uses `var(--ease-standard)` token.

**Action:** Verify that `--ease-standard` CSS variable is set to `ease-out`:

1. Check `packages/frontend/src/styles/globals.css` or design tokens file for:
   ```css
   --ease-standard: ease-out;
   ```

2. If `--ease-standard` is NOT `ease-out`, change the animation to explicit:
   ```css
   .error-banner-enter {
       animation: error-banner-slide-down var(--duration-normal) ease-out forwards;
   }
   
   .error-banner-exit {
       opacity: 0;
       transform: translateY(-10px);
       transition:
           opacity var(--duration-normal) ease-out,
           transform var(--duration-normal) ease-out;
   }
   ```

---

## Summary of Changes

| Patch | File | Type | Priority |
|-------|------|------|----------|
| 1 & 2 | error-banner.tsx | Extract constant + add null check | High |
| 3 & 4 | app.tsx | Add fallbacks + type safety | High |
| 5 | error-banner.tsx + e2e tests | Use constants across files | Medium |
| 6 | app.test.tsx | Restore test coverage | High |
| Decision | globals.css | Verify ease-out token | High |

---

## Checklist for Developer

- [ ] Apply PATCH 1: Extract AUTO_DISMISS_MS and EXIT_ANIMATION_MS constants
- [ ] Apply PATCH 2: Add null check on onDismissRef.current callback
- [ ] Apply PATCH 3: Add fallback for missing ERROR_MESSAGES key
- [ ] Apply PATCH 4: Create getErrorMessage helper with validation
- [ ] Apply PATCH 5: Export constants and update E2E tests
- [ ] Apply PATCH 6: Restore original app.test.tsx coverage
- [ ] **Decision:** Confirm --ease-standard = ease-out or update animations
- [ ] Run `pnpm --filter frontend test` — all tests should pass
- [ ] Run `pnpm lint` — zero errors
- [ ] Run `pnpm --filter frontend build` — builds successfully
- [ ] Commit changes with message: "fix(error-banner): address code review findings"
- [ ] Update sprint status: 2-3-error-banner-component → done
