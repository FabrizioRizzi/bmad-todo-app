import { CheckSquare } from 'lucide-react';
import { useId } from 'react';

export function EmptyState() {
	const headingId = useId();
	return (
		<div
			aria-labelledby={headingId}
			aria-live="polite"
			className="flex flex-col items-center gap-[var(--space-3)] py-[var(--space-8)] text-center"
			role="status"
		>
			<CheckSquare
				aria-hidden
				className="size-[var(--space-8)] text-[color:var(--text-secondary)]"
				strokeWidth={1.5}
			/>
			<p
				className="text-[color:var(--text-primary)] text-[length:var(--text-lg)] leading-[var(--text-lg-leading)] [font-weight:var(--text-lg-weight)]"
				id={headingId}
			>
				No tasks yet
			</p>
			<p className="max-w-[20rem] text-[color:var(--text-secondary)] text-[length:var(--text-sm)] leading-[var(--text-sm-leading)]">
				Type above and press Enter (or tap +) to add your first task.
			</p>
		</div>
	);
}
