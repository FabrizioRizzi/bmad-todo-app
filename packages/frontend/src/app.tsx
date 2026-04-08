import { AppHeader } from '@/components/app-header';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';

export function App() {
	return (
		<div className="min-h-screen bg-background">
			<main className="mx-auto w-full max-w-[40rem] px-[var(--space-4)] py-[var(--space-8)] sm:px-[var(--space-6)]">
				<AppHeader />
				<section
					aria-label="Add new todo"
					className="mt-[var(--space-5)] rounded-[var(--radius)] border border-[color:var(--border)] border-dashed bg-[color:var(--surface)] p-[var(--space-4)]"
				>
					<p className="text-[color:var(--text-secondary)] text-[length:var(--text-sm)] leading-[var(--text-sm-leading)]">
						Input area — full add field in Story 1.5
					</p>
					<div className="mt-[var(--space-3)] flex gap-[var(--space-2)]">
						<Input className="flex-1" disabled placeholder="New task (placeholder)" />
						<Button disabled type="button">
							Add
						</Button>
					</div>
				</section>
				<section
					aria-label="Todo list"
					className="mt-[var(--space-5)] min-h-[var(--space-8)] rounded-[var(--radius)] border border-[color:var(--border)] border-dashed bg-[color:var(--surface)] p-[var(--space-4)]"
				>
					<p className="text-[color:var(--text-secondary)] text-[length:var(--text-sm)] leading-[var(--text-sm-leading)]">
						List area — todos appear here in Story 1.5
					</p>
				</section>
			</main>
		</div>
	);
}
