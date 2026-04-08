import { Plus } from 'lucide-react';
import { useId, useRef, useState } from 'react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { useCreateTodoMutation } from '@/hooks/use-todos';
import type { Todo } from '@/lib/api';

type AddInputProps = {
	onCreated?: (todo: Todo) => void;
};

export function AddInput({ onCreated }: AddInputProps) {
	const inputId = useId();
	const inputRef = useRef<HTMLInputElement>(null);
	const [value, setValue] = useState('');
	const { mutate, isPending } = useCreateTodoMutation();

	const [error, setError] = useState<string | null>(null);

	function submit() {
		const description = value.trim();
		if (!description) return;

		setError(null);
		mutate(
			{ description },
			{
				onSuccess: (todo) => {
					setValue('');
					queueMicrotask(() => inputRef.current?.focus());
					onCreated?.(todo);
				},
				onError: () => {
					setError("Couldn't add that task — try again.");
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
			{error && (
				<p
					className="text-[color:var(--error)] text-[length:var(--text-sm)] leading-[var(--text-sm-leading)]"
					role="alert"
				>
					{error}
				</p>
			)}
		</form>
	);
}
