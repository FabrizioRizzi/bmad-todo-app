import { Plus } from 'lucide-react';
import { useId, useRef, useState } from 'react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { useCreateTodoMutation } from '@/hooks/use-todos';
import type { Todo } from '@/lib/api';

type AddInputProps = {
	onCreated?: (todo: Todo) => void;
	onError?: () => void;
};

export function AddInput({ onCreated, onError }: AddInputProps) {
	const inputId = useId();
	const inputRef = useRef<HTMLInputElement>(null);
	const [value, setValue] = useState('');
	const { mutate, isPending } = useCreateTodoMutation();

	function submit() {
		const description = value.trim();
		if (!description) return;

		mutate(
			{ description },
			{
				onSuccess: (todo) => {
					setValue('');
					queueMicrotask(() => inputRef.current?.focus());
					onCreated?.(todo);
				},
				onError: () => {
					onError?.();
					queueMicrotask(() => inputRef.current?.focus());
				},
			},
		);
	}

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
