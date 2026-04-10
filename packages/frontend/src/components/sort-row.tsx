import { type KeyboardEvent, useEffect, useRef, useState } from 'react';
import { cn, type DueSortDirection } from '@/lib/utils';
import type { TodoFilter } from './filter-tabs';

export type TodoSort = 'due' | 'status';

type SortRowProps = {
	activeSort: TodoSort;
	dueDirection: DueSortDirection;
	statusDirection: 'active-first' | 'completed-first';
	onSortChange: (sort: TodoSort) => void;
	filter: TodoFilter;
};

const btnBase =
	'rounded-[var(--radius-sm)] border-none min-h-[44px] min-w-[44px] px-[var(--space-2)] py-[var(--space-2)] text-[length:var(--text-sm)] leading-[var(--text-sm-leading)] transition-colors duration-[var(--duration-fast)] ease-[var(--ease-standard)]';

function dueButtonLabel(activeSort: TodoSort, dueDirection: DueSortDirection) {
	if (activeSort !== 'due') return 'Due ↕';
	if (dueDirection === 'ascending') return 'Due ↑';
	return 'Due ↓';
}

function statusButtonLabel(
	activeSort: TodoSort,
	statusDirection: 'active-first' | 'completed-first',
) {
	if (activeSort !== 'status') return 'Status ↕';
	if (statusDirection === 'active-first') return 'Status ↑';
	return 'Status ↓';
}

export function SortRow({
	activeSort,
	dueDirection,
	statusDirection,
	onSortChange,
	filter,
}: SortRowProps) {
	const showStatusSort = filter === 'all';
	const maxFocusIdx = showStatusSort ? 1 : 0;
	const dueText = dueButtonLabel(activeSort, dueDirection);
	const statusText = statusButtonLabel(activeSort, statusDirection);

	const [focusIndex, setFocusIndex] = useState(() =>
		activeSort === 'status' && filter === 'all' ? 1 : 0,
	);
	const dueRef = useRef<HTMLButtonElement>(null);
	const statusRef = useRef<HTMLButtonElement>(null);

	useEffect(() => {
		if (!showStatusSort) setFocusIndex(0);
	}, [showStatusSort]);

	const focusAt = (idx: number) => {
		const next = Math.min(Math.max(0, idx), maxFocusIdx);
		setFocusIndex(next);
		requestAnimationFrame(() => {
			(next === 0 ? dueRef : statusRef).current?.focus();
		});
	};

	const onToolbarKeyDown = (e: KeyboardEvent<HTMLButtonElement>, slot: 'due' | 'status') => {
		const idx = slot === 'due' ? 0 : 1;
		switch (e.key) {
			case 'ArrowRight': {
				e.preventDefault();
				const next = idx >= maxFocusIdx ? 0 : idx + 1;
				focusAt(next);
				break;
			}
			case 'ArrowLeft': {
				e.preventDefault();
				const next = idx <= 0 ? maxFocusIdx : idx - 1;
				focusAt(next);
				break;
			}
			case 'Home':
				e.preventDefault();
				focusAt(0);
				break;
			case 'End':
				e.preventDefault();
				focusAt(maxFocusIdx);
				break;
			case 'Enter':
			case ' ':
				e.preventDefault();
				onSortChange(slot);
				break;
			default:
				break;
		}
	};

	return (
		<div
			aria-label="Sort options"
			className="flex flex-wrap items-center gap-x-[var(--space-3)] gap-y-[var(--space-2)] bg-[color:var(--surface)] px-[var(--space-4)] py-[var(--space-2)]"
			role="toolbar"
		>
			<span className="text-[length:var(--text-xs)] leading-[var(--text-xs-leading)] font-medium tracking-wide text-[color:var(--text-secondary)] uppercase">
				Sort by
			</span>
			<div className="flex items-center gap-[var(--space-2)]">
				<button
					ref={dueRef}
					type="button"
					tabIndex={focusIndex === 0 ? 0 : -1}
					aria-label={
						activeSort !== 'due'
							? 'Sort by due date, soonest due first'
							: dueDirection === 'ascending'
								? 'Sort by due date, soonest due first'
								: 'Sort by due date, latest due first'
					}
					aria-pressed={activeSort === 'due'}
					className={cn(
						btnBase,
						activeSort === 'due'
							? 'cursor-default bg-[color:var(--surface)] font-semibold text-[color:var(--text-primary)] shadow-[var(--shadow-soft)] ring-1 ring-[color:var(--border)]'
							: 'cursor-pointer bg-transparent font-normal text-[color:var(--text-secondary)] hover:text-[color:var(--text-primary)]',
					)}
					onClick={() => {
						setFocusIndex(0);
						onSortChange('due');
					}}
					onKeyDown={(e) => onToolbarKeyDown(e, 'due')}
				>
					{dueText}
				</button>
				{showStatusSort ? (
					<>
						<div
							aria-hidden
							className="h-4 w-px shrink-0 bg-[color:var(--border)]"
							role="presentation"
						/>
						<button
							ref={statusRef}
							type="button"
							tabIndex={focusIndex === 1 ? 0 : -1}
							aria-label={
								activeSort !== 'status'
									? 'Sort by status, active tasks first'
									: statusDirection === 'completed-first'
										? 'Sort by status, completed tasks first'
										: 'Sort by status, active tasks first'
							}
							aria-pressed={activeSort === 'status'}
							className={cn(
								btnBase,
								activeSort === 'status'
									? 'cursor-default bg-[color:var(--surface)] font-semibold text-[color:var(--text-primary)] shadow-[var(--shadow-soft)] ring-1 ring-[color:var(--border)]'
									: 'cursor-pointer bg-transparent font-normal text-[color:var(--text-secondary)] hover:text-[color:var(--text-primary)]',
							)}
							onClick={() => {
								setFocusIndex(1);
								onSortChange('status');
							}}
							onKeyDown={(e) => onToolbarKeyDown(e, 'status')}
						>
							{statusText}
						</button>
					</>
				) : null}
			</div>
		</div>
	);
}
