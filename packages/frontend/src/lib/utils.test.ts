import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import type { Todo } from '@/lib/api';
import { formatDueDate, isOverdue, localDateToIsoDate, sortByDueDate, sortByStatus } from './utils';

describe('formatDueDate', () => {
	beforeEach(() => {
		vi.useFakeTimers();
		vi.setSystemTime(new Date('2026-04-09T12:00:00'));
	});

	afterEach(() => {
		vi.useRealTimers();
	});

	it('returns Today for the current local date', () => {
		expect(formatDueDate('2026-04-09')).toBe('Today');
	});

	it('returns Tomorrow for the next calendar day', () => {
		expect(formatDueDate('2026-04-10')).toBe('Tomorrow');
	});

	it('returns Yesterday for the previous calendar day', () => {
		expect(formatDueDate('2026-04-08')).toBe('Yesterday');
	});

	it('returns a short month/day label for other dates', () => {
		expect(formatDueDate('2026-07-04')).toMatch(/Jul/);
		expect(formatDueDate('2026-07-04')).toMatch(/4/);
	});

	it('returns Invalid date for malformed or impossible calendar strings', () => {
		expect(formatDueDate('not-a-date')).toBe('Invalid date');
		expect(formatDueDate('2026-02-31')).toBe('Invalid date');
		expect(formatDueDate('2026-13-01')).toBe('Invalid date');
		expect(formatDueDate('2026-4-09')).toBe('Invalid date');
	});
});

describe('isOverdue', () => {
	beforeEach(() => {
		vi.useFakeTimers();
		vi.setSystemTime(new Date('2026-04-09T12:00:00'));
	});

	afterEach(() => {
		vi.useRealTimers();
	});

	it('returns false when there is no due date', () => {
		expect(isOverdue(null, false)).toBe(false);
	});

	it('returns false when the todo is completed even if due date is past', () => {
		expect(isOverdue('2026-01-01', true)).toBe(false);
	});

	it('returns true for an active todo with a past due date', () => {
		expect(isOverdue('2026-04-08', false)).toBe(true);
	});

	it('returns false when due date is today or in the future', () => {
		expect(isOverdue('2026-04-09', false)).toBe(false);
		expect(isOverdue('2026-12-31', false)).toBe(false);
	});

	it('returns false for malformed due date strings', () => {
		expect(isOverdue('2026-02-31', false)).toBe(false);
		expect(isOverdue('bad', false)).toBe(false);
	});
});

describe('localDateToIsoDate', () => {
	it('formats a local Date as YYYY-MM-DD', () => {
		expect(localDateToIsoDate(new Date(2026, 3, 15))).toBe('2026-04-15');
	});
});

const todo = (overrides: Partial<Todo> & Pick<Todo, 'id' | 'description'>): Todo => ({
	isCompleted: false,
	createdAt: '2026-01-01T00:00:00.000Z',
	dueDate: null,
	...overrides,
});

describe('sortByDueDate', () => {
	it('orders soonest due first and nulls last with stable tie-breaking', () => {
		const a = todo({ id: 'a', description: 'A', dueDate: '2026-04-10' });
		const b = todo({ id: 'b', description: 'B', dueDate: '2026-04-02' });
		const c = todo({ id: 'c', description: 'C', dueDate: null });
		const d = todo({ id: 'd', description: 'D', dueDate: null });
		const input = [a, b, c, d];
		expect(sortByDueDate(input, 'ascending').map((t) => t.id)).toEqual(['b', 'a', 'c', 'd']);
		expect(sortByDueDate(input).map((t) => t.id)).toEqual(['b', 'a', 'c', 'd']);
		expect(input.map((t) => t.id)).toEqual(['a', 'b', 'c', 'd']);
	});

	it('orders latest due first when descending, nulls still last', () => {
		const a = todo({ id: 'a', description: 'A', dueDate: '2026-04-10' });
		const b = todo({ id: 'b', description: 'B', dueDate: '2026-04-02' });
		const c = todo({ id: 'c', description: 'C', dueDate: null });
		const input = [b, a, c];
		expect(sortByDueDate(input, 'descending').map((t) => t.id)).toEqual(['a', 'b', 'c']);
	});
});

describe('sortByStatus', () => {
	it('groups active first then completed, stable within groups', () => {
		const done1 = todo({ id: 'd1', description: 'D1', isCompleted: true });
		const open1 = todo({ id: 'o1', description: 'O1', isCompleted: false });
		const open2 = todo({ id: 'o2', description: 'O2', isCompleted: false });
		const done2 = todo({ id: 'd2', description: 'D2', isCompleted: true });
		const input = [done1, open1, open2, done2];
		expect(sortByStatus(input, 'active-first').map((t) => t.id)).toEqual(['o1', 'o2', 'd1', 'd2']);
	});

	it('groups completed first when requested', () => {
		const open = todo({ id: 'o', description: 'O', isCompleted: false });
		const done = todo({ id: 'd', description: 'D', isCompleted: true });
		expect(sortByStatus([open, done], 'completed-first').map((t) => t.id)).toEqual(['d', 'o']);
	});
});
