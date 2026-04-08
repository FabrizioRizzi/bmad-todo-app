import { useToggleTodoMutation } from '@/hooks/use-todos';
import type { Todo } from '@/lib/api';

type TodoCardProps = {
	todo: Todo;
	highlighted?: boolean;
	onToggleError?: () => void;
	onToggleSuccess?: () => void;
	onDelete?: (id: string) => void;
	isExiting?: boolean;
	isEntering?: boolean;
};

export function TodoCard({
	todo,
	highlighted = false,
	onToggleError,
	onToggleSuccess,
	onDelete,
	isExiting = false,
	isEntering = false,
}: TodoCardProps) {
	const toggleMutation = useToggleTodoMutation();
	const isPending = toggleMutation.isPending;

	const handleToggle = async (e: React.ChangeEvent<HTMLInputElement>) => {
		try {
			await toggleMutation.mutateAsync({
				id: todo.id,
				isCompleted: e.target.checked,
			});
			onToggleSuccess?.();
		} catch {
			onToggleError?.();
		}
	};

	const animationClass = isExiting ? 'todo-card-exit-delete' : isEntering ? 'todo-card-enter' : '';
	const isSingleTokenDescription = !/\s/.test(todo.description.trim());
	const descriptionLayoutClass = isSingleTokenDescription ? 'truncate' : 'break-words';

	return (
		<li className={animationClass}>
			<div
				className={`group todo-card-bar rounded-[var(--radius)] border border-[color:var(--border)] border-l-[3px] border-l-[color:var(--active-bar)] bg-[color:var(--active-bg)] py-[var(--space-4)] pr-[var(--space-4)] pl-[var(--space-3)] ${
					todo.isCompleted ? 'todo-card-completed' : ''
				}`}
				data-highlighted={highlighted ? 'true' : undefined}
			>
				<div className="flex items-center gap-[var(--space-3)]">
					<div className="relative flex h-11 w-11 shrink-0 items-center justify-center">
						<input
							type="checkbox"
							checked={todo.isCompleted}
							onChange={handleToggle}
							disabled={isPending}
							aria-busy={isPending || undefined}
							aria-label={`Toggle completion for: ${todo.description}`}
							className="peer h-6 w-6 rounded border border-[color:var(--border)] cursor-pointer transition-all duration-[var(--duration-normal)] ease-[var(--ease-standard)] appearance-none checked:border-[color:var(--success)] checked:bg-[color:var(--success)]"
						/>
						{todo.isCompleted && (
							<svg
								className="pointer-events-none absolute h-4 w-4 text-[color:var(--surface)]"
								fill="none"
								strokeLinecap="round"
								strokeLinejoin="round"
								strokeWidth="2"
								viewBox="0 0 24 24"
								stroke="currentColor"
								aria-label="Completed"
							>
								<path d="M5 13l4 4L19 7"></path>
							</svg>
						)}
					</div>
					<p
						className={`todo-card-text min-w-0 flex-1 ${descriptionLayoutClass} text-[color:var(--text-primary)] text-[length:var(--text-base)] leading-[var(--text-base-leading)]`}
					>
						{todo.description}
					</p>
					{onDelete && (
						<button
							type="button"
							onClick={() => onDelete(todo.id)}
							aria-label={`Delete: ${todo.description}`}
							className="flex h-8 w-8 shrink-0 cursor-pointer items-center justify-center rounded-full border-none bg-transparent text-[color:var(--text-secondary)] transition-all duration-[var(--duration-fast)] hover:bg-[color:var(--error-bg)] hover:text-[color:var(--error)] opacity-50 lg:opacity-0 lg:group-hover:opacity-100"
						>
							<svg
								width="16"
								height="16"
								viewBox="0 0 24 24"
								fill="none"
								stroke="currentColor"
								strokeWidth="2"
								strokeLinecap="round"
								strokeLinejoin="round"
								aria-hidden="true"
							>
								<path d="M18 6L6 18" />
								<path d="M6 6l12 12" />
							</svg>
						</button>
					)}
				</div>
			</div>
		</li>
	);
}
