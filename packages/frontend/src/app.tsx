import { useCallback, useEffect, useState } from 'react';
import { AddInput } from '@/components/add-input';
import { AppHeader } from '@/components/app-header';
import { ErrorBanner } from '@/components/error-banner';
import { TodoList } from '@/components/todo-list';
import { UndoToast } from '@/components/undo-toast';
import { useDeleteTodo, useTodosQuery } from '@/hooks/use-todos';

export type ErrorActionType = 'create' | 'toggle' | 'delete';

const ERROR_MESSAGES: Record<ErrorActionType, string> = {
	create: "Couldn't add that task — check your connection and try again.",
	toggle: "Couldn't update that task — try again.",
	delete: "Couldn't delete that task — try again.",
};

export function App() {
	const { data: todos = [], isPending, isError } = useTodosQuery();
	const [highlightedId, setHighlightedId] = useState<string | null>(null);
	const [errorMessage, setErrorMessage] = useState<string | null>(null);

	const clearError = useCallback(() => {
		setErrorMessage(null);
	}, []);

	const showError = useCallback((actionType: ErrorActionType) => {
		setErrorMessage(ERROR_MESSAGES[actionType]);
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
				<AppHeader count={todos.length} />
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
							highlightedId={highlightedId}
							isInitialLoading={isPending}
							todos={todos}
							onDelete={requestDelete}
							exitingIds={exitingIds}
							enteringIds={enteringIds}
							onToggleError={() => showError('toggle')}
							onToggleSuccess={clearError}
						/>
					)}
				</section>
			</main>
			<UndoToast state={toastState} onUndo={undoDelete} onDismiss={dismissToast} />
		</div>
	);
}
