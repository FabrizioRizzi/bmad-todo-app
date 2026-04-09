import { useEffect, useRef, useState } from 'react';
import type { Todo } from '@/lib/api';
import { cn } from '@/lib/utils';
import type { EmptyStateVariant } from './empty-state';
import { EmptyState } from './empty-state';
import type { TodoFilter } from './filter-tabs';
import { TodoCard } from './todo-card';
import { TodoListSkeleton } from './todo-list-skeleton';

function matchesFilter(todo: Todo, filter: TodoFilter): boolean {
	if (filter === 'all') return true;
	if (filter === 'active') return !todo.isCompleted;
	return todo.isCompleted;
}

function emptyVariantForFilter(filter: TodoFilter): EmptyStateVariant {
	if (filter === 'active') return 'no-active';
	if (filter === 'completed') return 'no-completed';
	return 'no-todos';
}

type TodoListProps = {
	todos: Todo[];
	filter: TodoFilter;
	isInitialLoading: boolean;
	highlightedId: string | null;
	onDelete?: (id: string) => void;
	exitingIds?: Set<string>;
	enteringIds?: Set<string>;
	onToggleError?: () => void;
	onToggleSuccess?: () => void;
	onDueDateError?: () => void;
	onDueDateSuccess?: () => void;
};

export function TodoList({
	todos,
	filter,
	isInitialLoading,
	highlightedId,
	onDelete,
	exitingIds,
	enteringIds,
	onToggleError,
	onToggleSuccess,
	onDueDateError,
	onDueDateSuccess,
}: TodoListProps) {
	const showSkeleton = isInitialLoading;
	const showContent = !isInitialLoading;
	const [filterExitingIds, setFilterExitingIds] = useState<Set<string>>(() => new Set());
	const [filterEnteringIds, setFilterEnteringIds] = useState<Set<string>>(() => new Set());
	const prevFilterRef = useRef<TodoFilter | null>(null);

	useEffect(() => {
		const prev = prevFilterRef.current;
		if (prev === null) {
			prevFilterRef.current = filter;
			return;
		}
		if (prev === filter) return;

		const prevSnapshot = prev;
		prevFilterRef.current = filter;

		const exiting = new Set<string>();
		const entering = new Set<string>();
		for (const todo of todos) {
			const matchedPrev = matchesFilter(todo, prevSnapshot);
			const matchedNext = matchesFilter(todo, filter);
			if (matchedPrev && !matchedNext) exiting.add(todo.id);
			if (!matchedPrev && matchedNext) entering.add(todo.id);
		}

		setFilterExitingIds(exiting);
		setFilterEnteringIds(entering);
		const tid = window.setTimeout(() => {
			setFilterExitingIds(new Set());
			setFilterEnteringIds(new Set());
		}, 250);
		return () => window.clearTimeout(tid);
	}, [filter, todos]);

	const visibleTodos = todos.filter(
		(todo) => matchesFilter(todo, filter) || filterExitingIds.has(todo.id),
	);

	const matchingCount = todos.filter((t) => matchesFilter(t, filter)).length;
	const showFilteredEmpty = matchingCount === 0 && filterExitingIds.size === 0 && filter !== 'all';
	const showNoTodosEmpty = matchingCount === 0 && filterExitingIds.size === 0 && filter === 'all';

	return (
		<div className="relative">
			<div className="relative min-h-[var(--space-8)]">
				<div
					aria-hidden={!showSkeleton}
					className={cn(
						'transition-opacity duration-[var(--duration-smooth)] ease-[var(--ease-standard)]',
						showSkeleton ? 'opacity-100' : 'pointer-events-none absolute inset-0 opacity-0',
					)}
				>
					<TodoListSkeleton />
				</div>
				<div
					className={cn(
						'transition-opacity duration-[var(--duration-smooth)] ease-[var(--ease-standard)]',
						showContent ? 'opacity-100' : 'opacity-0',
					)}
				>
					{showContent && (
						<div id="todo-list">
							{showNoTodosEmpty || showFilteredEmpty ? (
								<EmptyState variant={emptyVariantForFilter(filter)} />
							) : (
								<ul className="flex list-none flex-col gap-[var(--space-3)] p-0">
									{visibleTodos.map((todo) => (
										<TodoCard
											key={todo.id}
											todo={todo}
											highlighted={todo.id === highlightedId}
											onToggleError={onToggleError}
											onToggleSuccess={onToggleSuccess}
											onDueDateError={onDueDateError}
											onDueDateSuccess={onDueDateSuccess}
											onDelete={onDelete}
											isExiting={exitingIds?.has(todo.id)}
											isEntering={enteringIds?.has(todo.id)}
											isFilterExiting={filterExitingIds.has(todo.id)}
											isFilterEntering={filterEnteringIds.has(todo.id)}
										/>
									))}
								</ul>
							)}
						</div>
					)}
				</div>
			</div>
		</div>
	);
}
