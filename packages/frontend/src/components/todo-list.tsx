import { useEffect, useLayoutEffect, useMemo, useRef, useState } from 'react';
import type { Todo } from '@/lib/api';
import { cn } from '@/lib/utils';
import type { EmptyStateVariant } from './empty-state';
import { EmptyState } from './empty-state';
import type { TodoFilter } from './filter-tabs';
import { TodoCard } from './todo-card';
import { TodoListSkeleton } from './todo-list-skeleton';

export function todoMatchesFilter(todo: Todo, filter: TodoFilter): boolean {
	if (filter === 'all') return true;
	if (filter === 'active') return !todo.isCompleted;
	return todo.isCompleted;
}

function emptyVariantForFilter(filter: TodoFilter): EmptyStateVariant {
	if (filter === 'active') return 'no-active';
	if (filter === 'completed') return 'no-completed';
	return 'no-todos';
}

type Box = { left: number; top: number };

/** Longer than `--duration-smooth` so sort reset after filter is skipped too. */
const FILTER_FLIP_SUPPRESS_MS = 280;

type TodoListProps = {
	todos: Todo[];
	filter: TodoFilter;
	/** Identity of sort mode only (not filter) — FLIP runs when this changes, not when tabs change. */
	sortLayoutKey: string;
	/** Filtered todos in display order (e.g. sorted). Defaults to API order within the filter. */
	orderedMatchingTodos?: Todo[];
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
	sortLayoutKey,
	orderedMatchingTodos: orderedMatchingTodosProp,
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
	/** Tracks last rendered filter; init on first paint only (not null forever). */
	const prevFilterRef = useRef<TodoFilter | null>(null);
	const listRef = useRef<HTMLUListElement>(null);
	const prevFlipPositionsRef = useRef<Map<string, Box>>(new Map());
	const prevFilterFlipRef = useRef(filter);
	const prevSortLayoutKeyFlipRef = useRef(sortLayoutKey);
	const noSortFlipUntilRef = useRef(0);

	const defaultOrderedMatching = useMemo(
		() => todos.filter((todo) => todoMatchesFilter(todo, filter)),
		[todos, filter],
	);

	const orderedMatchingTodos = orderedMatchingTodosProp ?? defaultOrderedMatching;

	/*
	 * Compute filter transition during render (React: set state when prop changes in render).
	 * useLayoutEffect ran after the first commit with the new filter, so one paint could show only
	 * matching rows (e.g. 1 completed), then exiting rows appeared → container jumped taller.
	 */
	if (prevFilterRef.current === null) {
		prevFilterRef.current = filter;
	} else if (prevFilterRef.current !== filter) {
		const prevSnapshot = prevFilterRef.current;
		prevFilterRef.current = filter;
		const exiting = new Set<string>();
		const entering = new Set<string>();
		for (const todo of todos) {
			const matchedPrev = todoMatchesFilter(todo, prevSnapshot);
			const matchedNext = todoMatchesFilter(todo, filter);
			if (matchedPrev && !matchedNext) exiting.add(todo.id);
			if (!matchedPrev && matchedNext) entering.add(todo.id);
		}
		setFilterExitingIds(exiting);
		setFilterEnteringIds(entering);
	}

	// biome-ignore lint/correctness/useExhaustiveDependencies: intentional; needed for FLIP animation timing on filter change
	useEffect(() => {
		const tid = window.setTimeout(() => {
			setFilterExitingIds(new Set());
			setFilterEnteringIds(new Set());
		}, 250);
		return () => window.clearTimeout(tid);
	}, [filter]);

	const visibleTodos = todos.filter(
		(todo) => todoMatchesFilter(todo, filter) || filterExitingIds.has(todo.id),
	);

	const matchingIdSet = useMemo(
		() => new Set(orderedMatchingTodos.map((t) => t.id)),
		[orderedMatchingTodos],
	);

	/* Exiting rows first keeps items that are leaving in the same vertical band (e.g. Active→Completed:
	 * three actives stay on top while they collapse; completed row is appended below — avoids a short
	 * “only matches” frame that reorders the whole stack). */
	const renderTodos = useMemo(() => {
		const exitingOnly = visibleTodos.filter((t) => !matchingIdSet.has(t.id));
		return [...exitingOnly, ...orderedMatchingTodos];
	}, [visibleTodos, orderedMatchingTodos, matchingIdSet]);

	// biome-ignore lint/correctness/useExhaustiveDependencies: FLIP tied to sortLayoutKey + filter transitions, not full renderTodos identity
	useLayoutEffect(() => {
		if (typeof window === 'undefined') return;
		const ul = listRef.current;
		if (!ul) return;

		const reduceMotionQuery = window.matchMedia?.('(prefers-reduced-motion: reduce)');
		const reduceMotion = Boolean(reduceMotionQuery?.matches);

		const capturePositions = (): Map<string, Box> => {
			const next = new Map<string, Box>();
			const targets = [...ul.querySelectorAll('.todo-sort-flip-target')] as HTMLElement[];
			for (const el of targets) {
				const li = el.closest('li[data-todo-id]');
				const id = li?.getAttribute('data-todo-id');
				if (!id) continue;
				const rect = el.getBoundingClientRect();
				next.set(id, { left: rect.left, top: rect.top });
			}
			return next;
		};

		const newPositions = capturePositions();

		const filterChanged = prevFilterFlipRef.current !== filter;
		prevFilterFlipRef.current = filter;

		if (reduceMotion) {
			prevFlipPositionsRef.current = newPositions;
			prevSortLayoutKeyFlipRef.current = sortLayoutKey;
			return;
		}

		if (filterChanged) {
			noSortFlipUntilRef.current = performance.now() + FILTER_FLIP_SUPPRESS_MS;
			prevFlipPositionsRef.current = newPositions;
			prevSortLayoutKeyFlipRef.current = sortLayoutKey;
			return;
		}

		if (performance.now() < noSortFlipUntilRef.current) {
			prevFlipPositionsRef.current = newPositions;
			prevSortLayoutKeyFlipRef.current = sortLayoutKey;
			return;
		}

		const sortKeyChanged = prevSortLayoutKeyFlipRef.current !== sortLayoutKey;
		prevSortLayoutKeyFlipRef.current = sortLayoutKey;

		if (!sortKeyChanged) {
			prevFlipPositionsRef.current = newPositions;
			return;
		}

		const oldPositions = prevFlipPositionsRef.current;
		const targets = [...ul.querySelectorAll('.todo-sort-flip-target')] as HTMLElement[];

		const toAnimate: { el: HTMLElement; dx: number; dy: number }[] = [];
		for (const el of targets) {
			const li = el.closest('li[data-todo-id]');
			const id = li?.getAttribute('data-todo-id');
			if (!id) continue;
			const old = oldPositions.get(id);
			const newPos = newPositions.get(id);
			if (!old || !newPos) continue;
			const dx = old.left - newPos.left;
			const dy = old.top - newPos.top;
			if (Math.abs(dx) < 0.5 && Math.abs(dy) < 0.5) continue;
			toAnimate.push({ el, dx, dy });
		}

		for (const { el, dx, dy } of toAnimate) {
			el.style.transition = 'none';
			el.style.transform = `translate(${dx}px, ${dy}px)`;
		}
		void ul.offsetHeight;

		for (const { el } of toAnimate) {
			requestAnimationFrame(() => {
				requestAnimationFrame(() => {
					el.style.transition = 'transform var(--duration-smooth) ease-out';
					el.style.transform = 'translate(0, 0)';
					const onEnd = (e: TransitionEvent) => {
						if (e.propertyName !== 'transform') return;
						el.style.transition = '';
						el.style.transform = '';
						el.removeEventListener('transitionend', onEnd);
					};
					el.addEventListener('transitionend', onEnd);
				});
			});
		}

		prevFlipPositionsRef.current = newPositions;
	}, [renderTodos, sortLayoutKey, filter]);

	const matchingCount = todos.filter((t) => todoMatchesFilter(t, filter)).length;
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
								<ul ref={listRef} className="flex list-none flex-col gap-[var(--space-3)] p-0">
									{renderTodos.map((todo) => (
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
