import { CalendarIcon } from 'lucide-react';
import type { ChangeEvent } from 'react';
import { useState } from 'react';
import { Button, buttonVariants } from '@/components/ui/button';
import { Calendar } from '@/components/ui/calendar';
import { Popover, PopoverContent, PopoverTrigger } from '@/components/ui/popover';
import { useToggleTodoMutation, useUpdateDueDateMutation } from '@/hooks/use-todos';
import type { Todo } from '@/lib/api';
import { cn, formatDueDate, isOverdue, isoDateToLocalDate, localDateToIsoDate } from '@/lib/utils';

type TodoCardProps = {
	todo: Todo;
	highlighted?: boolean;
	onToggleError?: () => void;
	onToggleSuccess?: () => void;
	onDueDateError?: () => void;
	onDueDateSuccess?: () => void;
	onDelete?: (id: string) => void;
	isExiting?: boolean;
	isEntering?: boolean;
};

export function TodoCard({
	todo,
	highlighted = false,
	onToggleError,
	onToggleSuccess,
	onDueDateError,
	onDueDateSuccess,
	onDelete,
	isExiting = false,
	isEntering = false,
}: TodoCardProps) {
	const toggleMutation = useToggleTodoMutation();
	const updateDueDateMutation = useUpdateDueDateMutation(onDueDateError);
	const [duePopoverOpen, setDuePopoverOpen] = useState(false);
	const dueDatePatchPending = updateDueDateMutation.isPending;
	const isPending = toggleMutation.isPending || dueDatePatchPending;

	const overdue = isOverdue(todo.dueDate, todo.isCompleted);
	const dueLabel =
		todo.dueDate && overdue && !todo.isCompleted
			? 'Overdue'
			: todo.dueDate
				? formatDueDate(todo.dueDate)
				: null;

	const dueControlLabel = todo.dueDate
		? `Change due date for ${todo.description}`
		: `Set due date for ${todo.description}`;

	const handleToggle = async (e: ChangeEvent<HTMLInputElement>) => {
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

	const applyDueDate = async (next: string | null) => {
		if (dueDatePatchPending) return;
		try {
			await updateDueDateMutation.mutateAsync({ id: todo.id, dueDate: next });
			setDuePopoverOpen(false);
			onDueDateSuccess?.();
		} catch {
			/* mutation reverts cache; keep popover open */
		}
	};

	const animationClass = isExiting ? 'todo-card-exit-delete' : isEntering ? 'todo-card-enter' : '';

	const barClassName = cn(
		'group todo-card-bar rounded-[var(--radius)] border border-[color:var(--border)] border-l-[3px] border-l-[color:var(--active-bar)] bg-[color:var(--active-bg)] py-[length:var(--card-padding-y-mobile)] px-[length:var(--card-padding-x-mobile)] sm:py-[length:var(--card-padding-y-desktop)] sm:px-[length:var(--card-padding-x-desktop)]',
		todo.isCompleted && 'todo-card-completed',
		overdue && !todo.isCompleted && 'todo-card-overdue',
	);

	return (
		<li className={animationClass}>
			<div className={barClassName} data-highlighted={highlighted ? 'true' : undefined}>
				<div className="flex items-center gap-[var(--space-3)]">
					<div className="relative flex h-11 w-11 shrink-0 items-center justify-center">
						<input
							type="checkbox"
							checked={todo.isCompleted}
							onChange={handleToggle}
							disabled={isPending}
							aria-busy={isPending || undefined}
							aria-label={`Toggle completion for: ${todo.description}`}
							className="peer h-6 w-6 cursor-pointer appearance-none rounded border border-[color:var(--border)] transition-all duration-[var(--duration-normal)] ease-[var(--ease-standard)] checked:border-[color:var(--success)] checked:bg-[color:var(--success)]"
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
					<div className="min-w-0 flex-1">
						<p className="todo-card-text min-w-0 break-words [overflow-wrap:anywhere] text-[color:var(--text-primary)] text-[length:var(--text-base)] leading-[var(--text-base-leading)]">
							{todo.description}
						</p>
						<div className="mt-[length:var(--due-row-gap)]">
							<Popover onOpenChange={setDuePopoverOpen} open={duePopoverOpen}>
								{todo.dueDate ? (
									<PopoverTrigger
										aria-label={dueControlLabel}
										aria-expanded={duePopoverOpen}
										className={cn(
											buttonVariants({ variant: 'ghost', size: 'xs' }),
											'h-auto min-h-0 justify-start p-0 font-medium text-[length:var(--text-due)] leading-[var(--text-due-leading)] text-[color:var(--text-secondary)] hover:bg-transparent hover:text-[color:var(--text-primary)]',
											overdue &&
												!todo.isCompleted &&
												'text-[color:var(--overdue)] hover:text-[color:var(--overdue)]',
										)}
										disabled={isPending}
										type="button"
									>
										{dueLabel}
									</PopoverTrigger>
								) : (
									<PopoverTrigger
										aria-label={dueControlLabel}
										aria-expanded={duePopoverOpen}
										className={cn(
											buttonVariants({ variant: 'ghost', size: 'icon-xs' }),
											'size-7 text-[length:var(--text-xs)] leading-[var(--text-xs-leading)] text-[color:var(--text-secondary)]',
										)}
										disabled={isPending}
										type="button"
									>
										<CalendarIcon aria-hidden className="size-[var(--space-3)]" />
									</PopoverTrigger>
								)}
								<PopoverContent align="start" className="w-auto p-0">
									<div className="flex flex-col gap-[var(--space-2)] p-[var(--space-2)]">
										<Calendar
											disabled={dueDatePatchPending}
											mode="single"
											onSelect={(date) => {
												if (date) {
													void applyDueDate(localDateToIsoDate(date));
												}
											}}
											key={todo.dueDate ?? 'no-date'}
											selected={todo.dueDate ? isoDateToLocalDate(todo.dueDate) : undefined}
										/>
										{todo.dueDate ? (
											<Button
												className="w-full"
												disabled={dueDatePatchPending}
												onClick={() => {
													void applyDueDate(null);
												}}
												type="button"
												variant="outline"
											>
												Clear due date
											</Button>
										) : null}
									</div>
								</PopoverContent>
							</Popover>
						</div>
					</div>
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
