type AppHeaderProps = {
	count: number;
};

export function AppHeader({ count }: AppHeaderProps) {
	return (
		<header className="flex flex-col items-center gap-[var(--space-3)] border-[color:var(--border)] border-b pb-[var(--space-4)] text-center">
			<h1 className="text-[color:var(--text-primary)] text-[length:var(--text-xl)] leading-[var(--text-xl-leading)] [font-weight:var(--text-xl-weight)]">
				My Tasks
			</h1>
			<div
				aria-label="Todo count"
				className="rounded-[9999px] bg-[color:var(--accent-subtle)] px-[var(--space-3)] py-[var(--space-1)] text-[color:var(--accent)] text-[length:var(--text-xs)] leading-[var(--text-xs-leading)] [font-weight:var(--text-xs-weight)]"
				role="status"
			>
				{count} remaining
			</div>
		</header>
	);
}
