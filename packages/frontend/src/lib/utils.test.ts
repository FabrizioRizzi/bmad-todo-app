import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import { formatDueDate, isOverdue, localDateToIsoDate } from './utils';

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
