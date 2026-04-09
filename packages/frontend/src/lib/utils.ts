import { type ClassValue, clsx } from 'clsx';
import { twMerge } from 'tailwind-merge';
import type { Todo } from '@/lib/api';

export function cn(...inputs: ClassValue[]) {
	return twMerge(clsx(inputs));
}

/** ISO date `YYYY-MM-DD` from a local calendar date (no UTC shift). */
export function localDateToIsoDate(d: Date): string {
	const y = d.getFullYear();
	const m = String(d.getMonth() + 1).padStart(2, '0');
	const day = String(d.getDate()).padStart(2, '0');
	return `${y}-${m}-${day}`;
}

const ISO_DATE_RE = /^(\d{4})-(\d{2})-(\d{2})$/;

/** Valid calendar date for `YYYY-MM-DD` only; rejects invalid month/day combinations. */
function localDateFromValidIso(iso: string): Date | undefined {
	const match = ISO_DATE_RE.exec(iso);
	if (!match) return undefined;
	const y = Number(match[1]);
	const m = Number(match[2]);
	const d = Number(match[3]);
	if (!Number.isInteger(y) || m < 1 || m > 12 || d < 1 || d > 31) return undefined;
	const date = new Date(y, m - 1, d);
	if (date.getFullYear() !== y || date.getMonth() !== m - 1 || date.getDate() !== d) {
		return undefined;
	}
	return date;
}

/** Local calendar midnight for a valid ISO date string; `undefined` if malformed or impossible. */
export function isoDateToLocalDate(iso: string): Date | undefined {
	return localDateFromValidIso(iso);
}

function todayLocalIso(): string {
	return localDateToIsoDate(new Date());
}

/** Relative / short label for a due date (not including "Overdue" — use `isOverdue` in UI). */
export function formatDueDate(dueDate: string): string {
	const parsed = localDateFromValidIso(dueDate);
	if (!parsed) return 'Invalid date';

	const today = todayLocalIso();
	if (dueDate === today) return 'Today';

	const tomorrow = new Date();
	tomorrow.setDate(tomorrow.getDate() + 1);
	if (dueDate === localDateToIsoDate(tomorrow)) return 'Tomorrow';

	const yesterday = new Date();
	yesterday.setDate(yesterday.getDate() - 1);
	if (dueDate === localDateToIsoDate(yesterday)) return 'Yesterday';

	return parsed.toLocaleDateString('en-US', {
		month: 'short',
		day: 'numeric',
	});
}

export function isOverdue(dueDate: string | null, isCompleted: boolean): boolean {
	if (!dueDate || isCompleted) return false;
	if (!localDateFromValidIso(dueDate)) return false;
	return dueDate < todayLocalIso();
}

export type DueSortDirection = 'ascending' | 'descending';

/**
 * Sort by due date. `null` due dates always last.
 * Ascending: soonest first. Descending: latest first among dated items.
 */
export function sortByDueDate(todos: Todo[], direction: DueSortDirection = 'ascending'): Todo[] {
	return [...todos].sort((a, b) => {
		if (a.dueDate === null && b.dueDate === null) return 0;
		if (a.dueDate === null) return 1;
		if (b.dueDate === null) return -1;
		const cmp = a.dueDate.localeCompare(b.dueDate);
		return direction === 'ascending' ? cmp : -cmp;
	});
}

/** Group by completion; preserve order within each group. */
export function sortByStatus(todos: Todo[], direction: 'active-first' | 'completed-first'): Todo[] {
	return [...todos].sort((a, b) => {
		const aDone = a.isCompleted;
		const bDone = b.isCompleted;
		if (direction === 'active-first') {
			if (aDone === bDone) return 0;
			return aDone ? 1 : -1;
		}
		if (aDone === bDone) return 0;
		return aDone ? -1 : 1;
	});
}
