import { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import { AddInput } from '@/components/add-input';
import { AppHeader } from '@/components/app-header';
import { ErrorBanner } from '@/components/error-banner';
import { FilterTabs, type TodoFilter } from '@/components/filter-tabs';
import { TodoList } from '@/components/todo-list';
import { UndoToast } from '@/components/undo-toast';
import { useDeleteTodo, useTodosQuery } from '@/hooks/use-todos';

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
	const [highlightedId, setHighlightedId] = useState<string | null>(null);
	const [errorMessage, setErrorMessage] = useState<string | null>(null);
	const [filterAnnouncement, setFilterAnnouncement] = useState('');
	const prevFilterForLiveRef = useRef<TodoFilter | null>(null);

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

	useEffect(() => {
		if (!highlightedId) return;
		const timer = setTimeout(() => setHighlightedId(null), 2000);
		return () => clearTimeout(timer);
	}, [highlightedId]);

	return (
		<div className="min-h-screen bg-background">
			<main className="mx-auto w-full max-w-[40rem] px-[var(--space-4)] py-[var(--space-8)] sm:px-[var(--space-6)]">
				<AppHeader count={activeCount} />
				<section
					aria-label="Add new todo"
					className="mt-[var(--space-5)] rounded-[var(--radius)] border border-[color:var(--border)] bg-[color:var(--surface)] p-[var(--space-4)] shadow-[var(--shadow-soft)]"
				>
					<AddInput
						onCreated={(todo) => {
							setHighlightedId(todo.id);
							clearError();
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
				<div aria-live="polite" className="sr-only">
					{filterAnnouncement}
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
							todos={todos}
							onDelete={requestDelete}
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
