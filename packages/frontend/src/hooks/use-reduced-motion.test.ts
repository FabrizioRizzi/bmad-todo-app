import { act, renderHook } from '@testing-library/react';
import { afterEach, describe, expect, it, vi } from 'vitest';
import { useReducedMotion } from './use-reduced-motion';

function createMockMql(initial: boolean) {
	const listeners = new Set<(e: MediaQueryListEvent) => void>();
	return {
		mql: {
			matches: initial,
			media: '(prefers-reduced-motion: reduce)',
			addEventListener: vi.fn((_: string, cb: (e: MediaQueryListEvent) => void) =>
				listeners.add(cb),
			),
			removeEventListener: vi.fn((_: string, cb: (e: MediaQueryListEvent) => void) =>
				listeners.delete(cb),
			),
			addListener: vi.fn(),
			removeListener: vi.fn(),
			onchange: null,
			dispatchEvent: vi.fn(() => false),
		},
		fire(matches: boolean) {
			this.mql.matches = matches;
			for (const cb of listeners) {
				cb({ matches } as MediaQueryListEvent);
			}
		},
	};
}

describe('useReducedMotion', () => {
	afterEach(() => {
		vi.unstubAllGlobals();
	});

	it('returns false when prefers-reduced-motion is not set', () => {
		const { result } = renderHook(() => useReducedMotion());
		expect(result.current).toBe(false);
	});

	it('returns true when prefers-reduced-motion: reduce is active', () => {
		const mock = createMockMql(true);
		vi.stubGlobal(
			'matchMedia',
			vi.fn(() => mock.mql),
		);
		const { result } = renderHook(() => useReducedMotion());
		expect(result.current).toBe(true);
	});

	it('updates when media query changes dynamically', () => {
		const mock = createMockMql(false);
		vi.stubGlobal(
			'matchMedia',
			vi.fn(() => mock.mql),
		);
		const { result } = renderHook(() => useReducedMotion());
		expect(result.current).toBe(false);

		act(() => mock.fire(true));
		expect(result.current).toBe(true);

		act(() => mock.fire(false));
		expect(result.current).toBe(false);
	});

	it('cleans up event listener on unmount', () => {
		const mock = createMockMql(false);
		vi.stubGlobal(
			'matchMedia',
			vi.fn(() => mock.mql),
		);
		const { unmount } = renderHook(() => useReducedMotion());
		unmount();
		expect(mock.mql.removeEventListener).toHaveBeenCalled();
	});
});
