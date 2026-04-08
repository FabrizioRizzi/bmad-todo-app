import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { createTodo, getTodos, type Todo } from '@/lib/api';

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
