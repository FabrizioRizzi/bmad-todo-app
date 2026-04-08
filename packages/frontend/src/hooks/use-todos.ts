import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { useCallback, useEffect, useRef, useState } from 'react';
import type { UndoToastState } from '@/components/undo-toast';
import { createTodo, deleteTodo, getTodos, type Todo, toggleTodo } from '@/lib/api';

export const todosQueryKey = ['todos'] as const;

export function useTodosQuery() {
	return useQuery({
		queryKey: todosQueryKey,
		queryFn: getTodos,
	});
}

export function useCreateTodoMutation() {
	const queryClient = useQueryClient();

	return useMutation({
		mutationFn: createTodo,
		onSuccess: (newTodo) => {
			queryClient.setQueryData<Todo[]>(todosQueryKey, (previous) => {
				const list = previous ?? [];
				const merged = [...list.filter((t) => t.id !== newTodo.id), newTodo];
				return merged.sort(
					(a, b) => new Date(a.createdAt).getTime() - new Date(b.createdAt).getTime(),
				);
			});
		},
	});
}

export function useToggleTodoMutation() {
	const queryClient = useQueryClient();

	return useMutation({
		mutationFn: ({ id, isCompleted }: { id: string; isCompleted: boolean }) =>
			toggleTodo(id, isCompleted),
		onMutate: async ({ id, isCompleted }) => {
			await queryClient.cancelQueries({ queryKey: todosQueryKey });
			const previousTodos = queryClient.getQueryData<Todo[]>(todosQueryKey);

			queryClient.setQueryData<Todo[]>(todosQueryKey, (previous) => {
				if (!previous) return previous;
				return previous.map((todo) => (todo.id === id ? { ...todo, isCompleted } : todo));
			});

			return { previousTodos };
		},
		onError: (_error, _variables, context) => {
			if (context?.previousTodos) {
				queryClient.setQueryData(todosQueryKey, context.previousTodos);
			}
		},
		onSuccess: (updatedTodo) => {
			queryClient.setQueryData<Todo[]>(todosQueryKey, (previous) => {
				if (!previous) return previous;
				return previous.map((todo) => (todo.id === updatedTodo.id ? updatedTodo : todo));
			});
		},
	});
}

type PendingDelete = {
	todoId: string;
	removedTodo: Todo;
	timerId: ReturnType<typeof setTimeout>;
};

export function useDeleteTodo(onError?: () => void) {
	const queryClient = useQueryClient();
	const [toastState, setToastState] = useState<UndoToastState>(null);
	const [exitingIds, setExitingIds] = useState<Set<string>>(new Set());
	const [enteringIds, setEnteringIds] = useState<Set<string>>(new Set());
	const pendingRef = useRef<PendingDelete | null>(null);
	const commitTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null);

	const fireDelete = useCallback(
		async (todoId: string, removedTodo: Todo) => {
			try {
				await deleteTodo(todoId);
			} catch (err) {
				const error = err as { statusCode?: number };
				if (error?.statusCode === 404) {
					setToastState(null);
					return;
				}

				queryClient.setQueryData<Todo[]>(todosQueryKey, (previous) => {
					const list = previous ?? [];
					const existing = list.find((t) => t.id === removedTodo.id);
					if (existing) return list;
					const merged = [...list, removedTodo];
					return merged.sort((a, b) => {
						const aTime = new Date(a.createdAt).getTime();
						const bTime = new Date(b.createdAt).getTime();
						return Number.isNaN(aTime) || Number.isNaN(bTime) ? 0 : aTime - bTime;
					});
				});
				setEnteringIds((prev) => new Set(prev).add(todoId));
				setTimeout(() => {
					setEnteringIds((prev) => {
						const next = new Set(prev);
						next.delete(todoId);
						return next;
					});
				}, 300);
				onError?.();
			}
		},
		[queryClient, onError],
	);

	const flushPending = useCallback(() => {
		const pending = pendingRef.current;
		if (pending) {
			clearTimeout(pending.timerId);
			pendingRef.current = null;
			fireDelete(pending.todoId, pending.removedTodo);
		}
		if (commitTimerRef.current) {
			clearTimeout(commitTimerRef.current);
			commitTimerRef.current = null;
		}
	}, [fireDelete]);

	const requestDelete = useCallback(
		(todoId: string) => {
			flushPending();

			const currentTodos = queryClient.getQueryData<Todo[]>(todosQueryKey);
			const removedTodo = currentTodos?.find((t) => t.id === todoId);
			if (!removedTodo) {
				onError?.();
				return;
			}

			setExitingIds((prev) => new Set(prev).add(todoId));

			const commitTimer = setTimeout(() => {
				queryClient.setQueryData<Todo[]>(todosQueryKey, (previous) => {
					if (!previous) return previous;
					return previous.filter((t) => t.id !== todoId);
				});
				setExitingIds((prev) => {
					const next = new Set(prev);
					next.delete(todoId);
					return next;
				});

				setToastState({ todoId, message: 'Task deleted' });

				const timerId = setTimeout(() => {
					pendingRef.current = null;
					commitTimerRef.current = null;
					setToastState(null);
					fireDelete(todoId, removedTodo);
				}, 5000);

				pendingRef.current = { todoId, removedTodo, timerId };
			}, 200);

			commitTimerRef.current = commitTimer;
		},
		[queryClient, fireDelete, flushPending, onError],
	);

	const undoDelete = useCallback(() => {
		const pending = pendingRef.current;
		if (!pending) return;

		clearTimeout(pending.timerId);
		pendingRef.current = null;
		if (commitTimerRef.current) {
			clearTimeout(commitTimerRef.current);
			commitTimerRef.current = null;
		}
		setToastState(null);

		queryClient.setQueryData<Todo[]>(todosQueryKey, (previous) => {
			const list = previous ?? [];
			const existing = list.find((t) => t.id === pending.removedTodo.id);
			if (existing) return list;
			const merged = [...list, pending.removedTodo];
			return merged.sort((a, b) => {
				const aTime = new Date(a.createdAt).getTime();
				const bTime = new Date(b.createdAt).getTime();
				return Number.isNaN(aTime) || Number.isNaN(bTime) ? 0 : aTime - bTime;
			});
		});
		setEnteringIds((prev) => new Set(prev).add(pending.todoId));
		setTimeout(() => {
			setEnteringIds((prev) => {
				const next = new Set(prev);
				next.delete(pending.todoId);
				return next;
			});
		}, 300);
	}, [queryClient]);

	const dismissToast = useCallback(() => {
		const pending = pendingRef.current;
		if (pending) {
			clearTimeout(pending.timerId);
			pendingRef.current = null;
			fireDelete(pending.todoId, pending.removedTodo);
		}
		if (commitTimerRef.current) {
			clearTimeout(commitTimerRef.current);
			commitTimerRef.current = null;
		}
		setToastState(null);
	}, [fireDelete]);

	useEffect(() => {
		return () => {
			if (pendingRef.current) {
				clearTimeout(pendingRef.current.timerId);
			}
			if (commitTimerRef.current) {
				clearTimeout(commitTimerRef.current);
			}
		};
	}, []);

	return {
		requestDelete,
		undoDelete,
		dismissToast,
		toastState,
		exitingIds,
		enteringIds,
	};
}
