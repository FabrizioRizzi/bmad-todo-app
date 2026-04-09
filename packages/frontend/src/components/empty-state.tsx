import { AlertTriangle, CheckSquare, Search } from 'lucide-react';
import { useId } from 'react';
import { cn } from '@/lib/utils';

export type EmptyStateVariant = 'no-todos' | 'no-active' | 'no-completed' | 'load-error';

type EmptyStateProps = {
	variant?: EmptyStateVariant;
};

const VARIANT_CONFIG: Record<
	EmptyStateVariant,
	{ Icon: typeof CheckSquare; title: string; hint: string; iconClass?: string }
> = {
	'no-todos': {
		Icon: CheckSquare,
		title: 'No tasks yet',
		hint: 'Type above and press Enter (or tap +) to add your first task.',
	},
	'no-active': {
		Icon: Search,
		title: 'No active tasks',
		hint: 'Add a task above to get started.',
	},
	'no-completed': {
		Icon: Search,
		title: 'No completed tasks',
		hint: 'Tasks you complete will appear here.',
	},
	'load-error': {
		Icon: AlertTriangle,
		title: "Couldn't load your tasks",
		hint: 'Check your connection and try again.',
	},
};

export function EmptyState({ variant = 'no-todos' }: EmptyStateProps) {
	const headingId = useId();
	const { Icon, title, hint } = VARIANT_CONFIG[variant];

	return (
		<div
			aria-labelledby={headingId}
			aria-live="polite"
			className={cn(
				'flex flex-col items-center gap-[var(--space-3)] py-[var(--space-8)] text-center',
			)}
			role="status"
		>
			<Icon
				aria-hidden
				className="size-[var(--space-8)] text-[color:var(--text-secondary)]"
				strokeWidth={1.5}
			/>
			<p
				className="text-[color:var(--text-primary)] text-[length:var(--text-lg)] leading-[var(--text-lg-leading)] [font-weight:var(--text-lg-weight)]"
				id={headingId}
			>
				{title}
			</p>
			<p className="max-w-[20rem] text-[color:var(--text-secondary)] text-[length:var(--text-sm)] leading-[var(--text-sm-leading)]">
				{hint}
			</p>
		</div>
	);
}
