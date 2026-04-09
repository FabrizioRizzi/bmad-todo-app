import { CalendarIcon, Plus } from 'lucide-react';
import { useId, useRef, useState } from 'react';
import { Button, buttonVariants } from '@/components/ui/button';
import { Calendar } from '@/components/ui/calendar';
import { Input } from '@/components/ui/input';
import { Popover, PopoverContent, PopoverTrigger } from '@/components/ui/popover';
import { useCreateTodoMutation } from '@/hooks/use-todos';
import type { Todo } from '@/lib/api';
import { cn, formatDueDate, isoDateToLocalDate, localDateToIsoDate } from '@/lib/utils';

type AddInputProps = {
	onCreated?: (todo: Todo) => void;
	onError?: () => void;
};

export function AddInput({ onCreated, onError }: AddInputProps) {
	const inputId = useId();
	const inputRef = useRef<HTMLInputElement>(null);
	const [value, setValue] = useState('');
	const [dueDateOpen, setDueDateOpen] = useState(false);
	const [selectedDueDate, setSelectedDueDate] = useState<string | null>(null);
	const { mutate, isPending } = useCreateTodoMutation();

	function submit() {
		const description = value.trim();
		if (!description) return;

		const body =
			selectedDueDate !== null ? { description, dueDate: selectedDueDate } : { description };

		mutate(body, {
			onSuccess: (todo) => {
				setValue('');
				setSelectedDueDate(null);
				setDueDateOpen(false);
				queueMicrotask(() => inputRef.current?.focus());
				onCreated?.(todo);
			},
			onError: () => {
				onError?.();
				queueMicrotask(() => inputRef.current?.focus());
			},
		});
	}

	const dueLabel = selectedDueDate !== null ? formatDueDate(selectedDueDate) : null;
	const dueDateTriggerLabel =
		selectedDueDate !== null
			? `Due date ${formatDueDate(selectedDueDate)}, change due date`
			: 'Set due date';

	return (
		<form
			aria-busy={isPending}
			className="flex flex-col gap-[var(--space-3)]"
			onSubmit={(e) => {
				e.preventDefault();
				submit();
			}}
		>
			<label className="sr-only" htmlFor={inputId}>
				New task description
			</label>
			<div className="flex gap-[var(--space-2)]">
				<Input
					ref={inputRef}
					autoComplete="off"
					className="flex-1"
					disabled={isPending}
					id={inputId}
					name="description"
					onChange={(e) => setValue(e.target.value)}
					placeholder="Add a new task..."
					value={value}
				/>
				<Popover onOpenChange={setDueDateOpen} open={dueDateOpen}>
					<PopoverTrigger
						aria-expanded={dueDateOpen}
						aria-label={dueDateTriggerLabel}
						className={cn(buttonVariants({ variant: 'ghost', size: 'icon' }), 'shrink-0')}
						disabled={isPending}
						type="button"
					>
						{dueLabel ? (
							<span className="max-w-[5.5rem] truncate px-1 text-[length:var(--text-due)] leading-[var(--text-due-leading)] font-medium">
								{dueLabel}
							</span>
						) : (
							<CalendarIcon aria-hidden className="size-[var(--space-4)]" />
						)}
					</PopoverTrigger>
					<PopoverContent align="end" className="w-auto p-0">
						<Calendar
							mode="single"
							onSelect={(date) => {
								if (date) {
									setSelectedDueDate(localDateToIsoDate(date));
									setDueDateOpen(false);
								}
							}}
							selected={selectedDueDate ? isoDateToLocalDate(selectedDueDate) : undefined}
						/>
					</PopoverContent>
				</Popover>
				<Button
					aria-label="Add task"
					className="shrink-0"
					disabled={isPending}
					size="icon"
					type="submit"
				>
					<Plus aria-hidden className="size-[var(--space-4)]" />
				</Button>
			</div>
		</form>
	);
}
