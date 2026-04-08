export function TodoListSkeleton() {
	return (
		<ul aria-hidden className="flex list-none flex-col gap-[var(--space-3)] p-0">
			{[0, 1, 2].map((key) => (
				<li key={key}>
					<div className="todo-skeleton-pulse rounded-[var(--radius)] border border-[color:var(--border)] border-l-[3px] border-l-[color:var(--border)] bg-[color:var(--surface)] py-[var(--space-5)] px-[var(--space-4)]" />
				</li>
			))}
		</ul>
	);
}
