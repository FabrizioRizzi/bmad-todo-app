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
	'rounded-[var(--radius-sm)] border-none px-[var(--space-2)] py-[var(--space-2)] text-[length:var(--text-sm)] leading-[var(--text-sm-leading)] transition-colors duration-[var(--duration-fast)] ease-[var(--ease-standard)]';

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
	const dueText = dueButtonLabel(activeSort, dueDirection);
	const statusText = statusButtonLabel(activeSort, statusDirection);

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
					type="button"
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
					onClick={() => onSortChange('due')}
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
							type="button"
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
							onClick={() => onSortChange('status')}
						>
							{statusText}
						</button>
					</>
				) : null}
			</div>
		</div>
	);
}
