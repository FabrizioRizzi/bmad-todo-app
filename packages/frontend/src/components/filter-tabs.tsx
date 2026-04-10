import { type KeyboardEvent, useEffect, useRef, useState } from 'react';
import { cn } from '@/lib/utils';

export type TodoFilter = 'all' | 'active' | 'completed';

export type FilterCounts = {
	all: number;
	active: number;
	completed: number;
};

type FilterTabsProps = {
	activeFilter: TodoFilter;
	onFilterChange: (filter: TodoFilter) => void;
	counts: FilterCounts;
};

const TABS: { id: TodoFilter; label: string }[] = [
	{ id: 'all', label: 'All' },
	{ id: 'active', label: 'Active' },
	{ id: 'completed', label: 'Completed' },
];

function tabIndex(filter: TodoFilter): number {
	return TABS.findIndex((t) => t.id === filter);
}

export function FilterTabs({ activeFilter, onFilterChange, counts }: FilterTabsProps) {
	const activeIndex = tabIndex(activeFilter);
	const [focusIndex, setFocusIndex] = useState(activeIndex);
	const tabRefs = useRef<Array<HTMLButtonElement | null>>([]);

	useEffect(() => {
		setFocusIndex(tabIndex(activeFilter));
	}, [activeFilter]);

	const focusTab = (index: number) => {
		const len = TABS.length;
		const next = ((index % len) + len) % len;
		setFocusIndex(next);
		requestAnimationFrame(() => tabRefs.current[next]?.focus());
	};

	const activateIndex = (index: number) => {
		const tab = TABS[index];
		if (tab) onFilterChange(tab.id);
	};

	const onTabKeyDown = (e: KeyboardEvent<HTMLButtonElement>, index: number) => {
		switch (e.key) {
			case 'ArrowRight':
				e.preventDefault();
				focusTab(index + 1);
				break;
			case 'ArrowLeft':
				e.preventDefault();
				focusTab(index - 1);
				break;
			case 'Home':
				e.preventDefault();
				focusTab(0);
				break;
			case 'End':
				e.preventDefault();
				focusTab(TABS.length - 1);
				break;
			case 'Enter':
			case ' ':
				e.preventDefault();
				activateIndex(index);
				break;
			default:
				break;
		}
	};

	return (
		<div className="relative w-full">
			<div className="flex w-full" role="tablist">
				{TABS.map((tab, index) => {
					const selected = tab.id === activeFilter;
					const tabCount = counts[tab.id];
					return (
						<button
							key={tab.id}
							ref={(el) => {
								tabRefs.current[index] = el;
							}}
							type="button"
							role="tab"
							tabIndex={focusIndex === index ? 0 : -1}
							aria-selected={selected}
							aria-controls="todo-list"
							aria-label={`${tab.label}, ${tabCount} tasks`}
							id={`filter-tab-${tab.id}`}
							className={cn(
								'flex-1 border-none bg-transparent py-[var(--space-3)] text-center text-[length:var(--text-sm)] leading-[var(--text-sm-leading)] transition-colors duration-[var(--duration-fast)] ease-[var(--ease-standard)]',
								selected
									? 'text-[color:var(--accent)] [font-weight:var(--text-sm-weight)]'
									: 'cursor-pointer text-[color:var(--text-secondary)] hover:text-[color:var(--text-primary)]',
							)}
							onClick={() => onFilterChange(tab.id)}
							onKeyDown={(e) => onTabKeyDown(e, index)}
						>
							{tab.label}
						</button>
					);
				})}
			</div>
			<div
				aria-hidden
				className="pointer-events-none absolute right-0 bottom-0 left-0 h-[2px] bg-[color:var(--border)]"
			>
				<div
					className="h-full bg-[color:var(--accent)] transition-transform duration-[var(--duration-normal)] ease-[var(--ease-standard)]"
					style={{
						width: `${100 / TABS.length}%`,
						transform: `translateX(${activeIndex * 100}%)`,
					}}
				/>
			</div>
		</div>
	);
}
