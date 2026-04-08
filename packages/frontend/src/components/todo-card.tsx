type TodoCardProps = {
	description: string;
	highlighted?: boolean;
};

export function TodoCard({ description, highlighted = false }: TodoCardProps) {
	return (
		<li>
			<div
				className="rounded-[var(--radius)] border border-[color:var(--border)] border-l-[3px] border-l-[color:var(--active-bar)] bg-[color:var(--active-bg)] py-[var(--space-4)] pr-[var(--space-4)] pl-[var(--space-3)]"
				data-highlighted={highlighted ? 'true' : undefined}
			>
				<p className="text-[color:var(--text-primary)] text-[length:var(--text-base)] leading-[var(--text-base-leading)]">
					{description}
				</p>
			</div>
		</li>
	);
}
