import type { Todo } from '@/lib/api';
import { cn } from '@/lib/utils';
import { EmptyState } from './empty-state';
import { TodoCard } from './todo-card';
import { TodoListSkeleton } from './todo-list-skeleton';

type TodoListProps = {
	todos: Todo[];
	isInitialLoading: boolean;
	highlightedId: string | null;
};

export function TodoList({ todos, isInitialLoading, highlightedId }: TodoListProps) {
	const showSkeleton = isInitialLoading;
	const showContent = !isInitialLoading;

	return (
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
				{showContent &&
					(todos.length === 0 ? (
						<EmptyState />
					) : (
						<ul className="flex list-none flex-col gap-[var(--space-3)] p-0">
							{todos.map((todo) => (
								<TodoCard
									key={todo.id}
									description={todo.description}
									highlighted={todo.id === highlightedId}
								/>
							))}
						</ul>
					))}
			</div>
		</div>
	);
}
