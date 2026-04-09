import { render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { describe, expect, it, vi } from 'vitest';
import { FilterTabs } from './filter-tabs';

const defaultCounts = { all: 3, active: 2, completed: 1 };

describe('FilterTabs', () => {
	it('renders three tabs with correct labels', () => {
		render(<FilterTabs activeFilter="all" counts={defaultCounts} onFilterChange={vi.fn()} />);
		expect(screen.getByRole('tab', { name: /all, 3 tasks/i })).toBeInTheDocument();
		expect(screen.getByRole('tab', { name: /active, 2 tasks/i })).toBeInTheDocument();
		expect(screen.getByRole('tab', { name: /completed, 1 tasks/i })).toBeInTheDocument();
	});

	it('marks active tab with aria-selected true and others false', () => {
		render(<FilterTabs activeFilter="active" counts={defaultCounts} onFilterChange={vi.fn()} />);
		expect(screen.getByRole('tab', { name: /all, 3 tasks/i })).toHaveAttribute(
			'aria-selected',
			'false',
		);
		expect(screen.getByRole('tab', { name: /active, 2 tasks/i })).toHaveAttribute(
			'aria-selected',
			'true',
		);
		expect(screen.getByRole('tab', { name: /completed, 1 tasks/i })).toHaveAttribute(
			'aria-selected',
			'false',
		);
	});

	it('uses tablist and tab roles with aria-controls', () => {
		render(<FilterTabs activeFilter="all" counts={defaultCounts} onFilterChange={vi.fn()} />);
		expect(screen.getByRole('tablist')).toBeInTheDocument();
		for (const name of [/all, 3 tasks/i, /active, 2 tasks/i, /completed, 1 tasks/i]) {
			expect(screen.getByRole('tab', { name })).toHaveAttribute('aria-controls', 'todo-list');
		}
	});

	it('calls onFilterChange with correct value when a tab is clicked', async () => {
		const user = userEvent.setup();
		const onFilterChange = vi.fn();
		render(
			<FilterTabs activeFilter="all" counts={defaultCounts} onFilterChange={onFilterChange} />,
		);
		await user.click(screen.getByRole('tab', { name: /completed, 1 tasks/i }));
		expect(onFilterChange).toHaveBeenCalledWith('completed');
	});

	it('applies accent styling to the active tab', () => {
		render(<FilterTabs activeFilter="completed" counts={defaultCounts} onFilterChange={vi.fn()} />);
		const completedTab = screen.getByRole('tab', { name: /completed, 1 tasks/i });
		expect(completedTab.className).toContain('text-[color:var(--accent)]');
		const allTab = screen.getByRole('tab', { name: /all, 3 tasks/i });
		expect(allTab.className).toContain('text-[color:var(--text-secondary)]');
	});
});
