import { useCallback, useEffect, useLayoutEffect, useMemo, useRef, useState } from 'react';
import { AddInput } from '@/components/add-input';
import { AppHeader } from '@/components/app-header';
import { ErrorBanner } from '@/components/error-banner';
import { FilterTabs, type TodoFilter } from '@/components/filter-tabs';
import { SortRow, type TodoSort } from '@/components/sort-row';
import { TodoList, todoMatchesFilter } from '@/components/todo-list';
import { UndoToast } from '@/components/undo-toast';
import { useDeleteTodo, useTodosQuery } from '@/hooks/use-todos';
import { type DueSortDirection, sortByDueDate, sortByStatus } from '@/lib/utils';

export type ErrorActionType = 'create' | 'toggle' | 'delete' | 'dueDate';

const ERROR_MESSAGES: Record<ErrorActionType, string> = {
	create: "Couldn't add that task — check your connection and try again.",
	toggle: "Couldn't update that task — try again.",
	delete: "Couldn't delete that task — try again.",
	dueDate: "Couldn't update the due date — try again.",
};

const getErrorMessage = (actionType: ErrorActionType): string => {
	const message = ERROR_MESSAGES[actionType];
	if (!message) {
		console.warn(`Missing error message for action type: ${actionType}`);
		return 'An error occurred';
	}
	return message;
};

export function App() {
	const { data: todos = [], isPending, isError } = useTodosQuery();
	const [filter, setFilter] = useState<TodoFilter>('all');
	const [sort, setSort] = useState<TodoSort>('due');
	const [statusDirection, setStatusDirection] = useState<'active-first' | 'completed-first'>(
		'active-first',
	);
	const [dueDirection, setDueDirection] = useState<DueSortDirection>('ascending');
	const [highlightedId, setHighlightedId] = useState<string | null>(null);
	const [errorMessage, setErrorMessage] = useState<string | null>(null);
	const [filterAnnouncement, setFilterAnnouncement] = useState('');
	const [createAnnouncement, setCreateAnnouncement] = useState('');
	const [createAnnouncementVersion, setCreateAnnouncementVersion] = useState(0);
	const prevFilterForLiveRef = useRef<TodoFilter | null>(null);
	const addInputRef = useRef<HTMLInputElement>(null);
	const pendingDeleteFocusRef = useRef<{ orderedIds: string[]; deletedId: string } | null>(null);
	/** Mirrors `sort` for click handlers — avoid calling setState inside another setState updater (Strict Mode runs updaters twice). */
	const sortRef = useRef<TodoSort>(sort);
	sortRef.current = sort;

	const activeCount = useMemo(() => todos.filter((t) => !t.isCompleted).length, [todos]);
	const completedCount = useMemo(() => todos.filter((t) => t.isCompleted).length, [todos]);
	const counts = useMemo(
		() => ({ all: todos.length, active: activeCount, completed: completedCount }),
		[todos.length, activeCount, completedCount],
	);

	const filteredShownCount = useMemo(() => {
		if (filter === 'all') return todos.length;
		if (filter === 'active') return activeCount;
		return completedCount;
	}, [filter, todos.length, activeCount, completedCount]);

	const filteredTodos = useMemo(
		() => todos.filter((t) => todoMatchesFilter(t, filter)),
		[todos, filter],
	);

	const sortedMatchingTodos = useMemo(() => {
		if (sort === 'due') return sortByDueDate(filteredTodos, dueDirection);
		return sortByStatus(filteredTodos, statusDirection);
	}, [filteredTodos, sort, dueDirection, statusDirection]);

	/** Stable key for sort-only list reorder (FLIP). Excludes filter so tab switches do not run sort animations. */
	const sortLayoutKey = useMemo(
		() => `${sort}:${dueDirection}:${statusDirection}`,
		[sort, dueDirection, statusDirection],
	);

	const handleSortChange = useCallback((next: TodoSort) => {
		if (next === 'due') {
			if (sortRef.current === 'due') {
				setDueDirection((d) => (d === 'ascending' ? 'descending' : 'ascending'));
			} else {
				setDueDirection('ascending');
			}
			setSort('due');
			return;
		}
		if (sortRef.current === 'status') {
			setStatusDirection((d) => (d === 'active-first' ? 'completed-first' : 'active-first'));
		} else {
			setStatusDirection('active-first');
		}
		setSort('status');
	}, []);

	const sortIsNonDefault = sort === 'status' || dueDirection === 'descending';

	const handleResetSort = useCallback(() => {
		setSort('due');
		setDueDirection('ascending');
		setStatusDirection('active-first');
	}, []);

	useEffect(() => {
		if (filter === 'active' || filter === 'completed') {
			setSort('due');
			setStatusDirection('active-first');
			setDueDirection('ascending');
		}
	}, [filter]);

	useEffect(() => {
		if (prevFilterForLiveRef.current === null) {
			prevFilterForLiveRef.current = filter;
			return;
		}
		if (prevFilterForLiveRef.current === filter) return;
		prevFilterForLiveRef.current = filter;
		setFilterAnnouncement(`${filteredShownCount} tasks shown`);
	}, [filter, filteredShownCount]);

	const clearError = useCallback(() => {
		setErrorMessage(null);
	}, []);

	const showError = useCallback((actionType: ErrorActionType) => {
		setErrorMessage(getErrorMessage(actionType));
	}, []);

	const handleDeleteError = useCallback(() => {
		showError('delete');
	}, [showError]);

	const { requestDelete, undoDelete, dismissToast, toastState, exitingIds, enteringIds } =
		useDeleteTodo(handleDeleteError);

	const requestDeleteWithFocusRestore = useCallback(
		(todoId: string) => {
			const orderedIds = sortedMatchingTodos.map((t) => t.id);
			pendingDeleteFocusRef.current = { orderedIds, deletedId: todoId };
			if (!requestDelete(todoId)) {
				pendingDeleteFocusRef.current = null;
			}
		},
		[requestDelete, sortedMatchingTodos],
	);

	useLayoutEffect(() => {
		const pending = pendingDeleteFocusRef.current;
		if (!pending) return;
		const { orderedIds, deletedId } = pending;
		const stillInList = todos.some((t) => t.id === deletedId);
		if (stillInList) return;

		pendingDeleteFocusRef.current = null;
		const idx = orderedIds.indexOf(deletedId);
		const nextId = idx >= 0 && idx < orderedIds.length - 1 ? orderedIds[idx + 1] : null;

		requestAnimationFrame(() => {
			if (nextId) {
				const el = document.querySelector<HTMLElement>(
					`li[data-todo-id="${CSS.escape(nextId)}"] input[type="checkbox"]`,
				);
				el?.focus();
			} else {
				addInputRef.current?.focus();
			}
		});
	}, [todos]);

	useEffect(() => {
		if (window.matchMedia('(min-width: 1024px)').matches) {
			addInputRef.current?.focus();
		}
	}, []);

	useEffect(() => {
		if (!highlightedId) return;
		const timer = setTimeout(() => setHighlightedId(null), 2000);
		return () => clearTimeout(timer);
	}, [highlightedId]);

	useEffect(() => {
		if (createAnnouncementVersion === 0 || !createAnnouncement) return;
		const timer = setTimeout(() => setCreateAnnouncement(''), 1000);
		return () => clearTimeout(timer);
	}, [createAnnouncementVersion, createAnnouncement]);

	return (
		<div className="min-h-screen overflow-x-hidden bg-background">
			<main className="mx-auto w-full max-w-[40rem] px-[var(--space-4)] py-[var(--space-8)] md:px-[var(--space-5)] lg:px-[var(--space-6)]">
				<AppHeader count={activeCount} />
				<section
					aria-label="Add new todo"
					className="mt-[var(--space-5)] rounded-[var(--radius)] border border-[color:var(--border)] bg-[color:var(--surface)] p-[var(--space-4)] shadow-[var(--shadow-soft)]"
				>
					<AddInput
						ref={addInputRef}
						onCreated={(todo) => {
							setHighlightedId(todo.id);
							clearError();
							setCreateAnnouncement('Task added');
							setCreateAnnouncementVersion((v) => v + 1);
						}}
						onError={() => showError('create')}
					/>
				</section>
				{errorMessage && (
					<div className="mt-[var(--space-3)]">
						<ErrorBanner message={errorMessage} onDismiss={clearError} />
					</div>
				)}
				<div className="mt-[var(--space-4)] w-full">
					<FilterTabs activeFilter={filter} counts={counts} onFilterChange={setFilter} />
				</div>
				<div className="mt-[var(--space-2)] flex w-full flex-wrap items-center gap-x-[var(--space-3)] gap-y-[var(--space-2)]">
					<div className="min-w-0 flex-1">
						<SortRow
							activeSort={sort}
							dueDirection={dueDirection}
							filter={filter}
							statusDirection={statusDirection}
							onSortChange={handleSortChange}
						/>
					</div>
					{sortIsNonDefault ? (
						<button
							type="button"
							aria-label="Reset sort to due date, soonest first"
							className="shrink-0 rounded-[var(--radius-sm)] border-none bg-transparent min-h-[44px] px-[var(--space-2)] py-[var(--space-2)] text-[length:var(--text-sm)] leading-[var(--text-sm-leading)] font-medium text-[color:var(--accent)] underline-offset-2 transition-colors duration-[var(--duration-fast)] ease-[var(--ease-standard)] hover:underline"
							onClick={handleResetSort}
						>
							Reset sort
						</button>
					) : null}
				</div>
				<div aria-live="polite" className="sr-only" data-testid="filter-announcement">
					{filterAnnouncement}
				</div>
				<div
					key={createAnnouncementVersion}
					aria-live="polite"
					className="sr-only"
					data-testid="create-announcement"
				>
					{createAnnouncement}
				</div>
				<section
					aria-label="Todo list"
					className="mt-[var(--space-5)] rounded-[var(--radius)] border border-[color:var(--border)] bg-[color:var(--surface)] p-[var(--space-4)] shadow-[var(--shadow-soft)]"
				>
					{isError ? (
						<p
							className="py-[var(--space-4)] text-center text-[color:var(--error)] text-[length:var(--text-sm)] leading-[var(--text-sm-leading)]"
							role="alert"
						>
							Could not load todos — please try again later.
						</p>
					) : (
						<TodoList
							filter={filter}
							highlightedId={highlightedId}
							isInitialLoading={isPending}
							orderedMatchingTodos={sortedMatchingTodos}
							sortLayoutKey={sortLayoutKey}
							todos={todos}
							onDelete={requestDeleteWithFocusRestore}
							exitingIds={exitingIds}
							enteringIds={enteringIds}
							onToggleError={() => showError('toggle')}
							onToggleSuccess={clearError}
							onDueDateError={() => showError('dueDate')}
							onDueDateSuccess={clearError}
						/>
					)}
				</section>
			</main>
			<UndoToast state={toastState} onUndo={undoDelete} onDismiss={dismissToast} />
		</div>
	);
}
