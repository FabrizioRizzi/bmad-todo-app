import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { createTodo, getTodos, type Todo, toggleTodo } from '@/lib/api';

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
