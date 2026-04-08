export function TodoListSkeleton() {
	return (
		<ul aria-hidden className="flex list-none flex-col gap-[var(--space-3)] p-0">
			{[0, 1, 2].map((key) => (
				<li key={key}>
					<div className="todo-skeleton-pulse rounded-[var(--radius)] border border-[color:var(--border)] border-l-[3px] border-l-[color:var(--border)] bg-[color:var(--surface)] py-[var(--space-4)] pr-[var(--space-4)] pl-[var(--space-3)]">
						<div className="flex items-center gap-[var(--space-3)]">
							{/* Checkbox placeholder — grey square */}
							<div className="h-6 w-6 shrink-0 rounded bg-[color:var(--text-secondary)] opacity-20" />

							{/* Text placeholder — grey rectangle */}
							<div className="h-5 flex-1 rounded bg-[color:var(--text-secondary)] opacity-20" />
						</div>
					</div>
				</li>
			))}
		</ul>
	);
}
