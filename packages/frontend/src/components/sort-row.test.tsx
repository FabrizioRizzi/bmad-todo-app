import { render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { describe, expect, it, vi } from 'vitest';
import { SortRow } from './sort-row';

const defaultDue = 'ascending' as const;

describe('SortRow', () => {
	it('renders Sort by label and sort options for All filter', () => {
		const onSortChange = vi.fn();
		render(
			<SortRow
				activeSort="due"
				dueDirection={defaultDue}
				filter="all"
				statusDirection="active-first"
				onSortChange={onSortChange}
			/>,
		);
		expect(screen.getByText('Sort by')).toBeInTheDocument();
		expect(screen.getByRole('button', { name: /sort by due date/i })).toHaveTextContent('Due ↑');
		expect(
			screen.getByRole('button', { name: /sort by status.*active tasks first/i }),
		).toHaveTextContent('Status ↕');
	});

	it('shows Due ↑ when due ascending and Due ↓ when descending; Due ↕ when status is active', () => {
		const onSortChange = vi.fn();
		const { rerender } = render(
			<SortRow
				activeSort="due"
				dueDirection="ascending"
				filter="all"
				statusDirection="active-first"
				onSortChange={onSortChange}
			/>,
		);
		expect(screen.getByRole('button', { name: /soonest due first/i })).toHaveTextContent('Due ↑');
		rerender(
			<SortRow
				activeSort="due"
				dueDirection="descending"
				filter="all"
				statusDirection="active-first"
				onSortChange={onSortChange}
			/>,
		);
		expect(screen.getByRole('button', { name: /latest due first/i })).toHaveTextContent('Due ↓');
		rerender(
			<SortRow
				activeSort="status"
				dueDirection="ascending"
				filter="all"
				statusDirection="active-first"
				onSortChange={onSortChange}
			/>,
		);
		expect(screen.getByRole('button', { name: /sort by due date/i })).toHaveTextContent('Due ↕');
	});

	it('shows Status ↑ when status sort is active-first and Status ↓ when completed-first', () => {
		const onSortChange = vi.fn();
		const { rerender } = render(
			<SortRow
				activeSort="status"
				dueDirection={defaultDue}
				filter="all"
				statusDirection="active-first"
				onSortChange={onSortChange}
			/>,
		);
		expect(
			screen.getByRole('button', { name: /sort by status.*active tasks first/i }),
		).toHaveTextContent('Status ↑');
		rerender(
			<SortRow
				activeSort="status"
				dueDirection={defaultDue}
				filter="all"
				statusDirection="completed-first"
				onSortChange={onSortChange}
			/>,
		);
		expect(
			screen.getByRole('button', { name: /sort by status.*completed tasks first/i }),
		).toHaveTextContent('Status ↓');
	});

	it('uses toolbar semantics and aria-label', () => {
		const onSortChange = vi.fn();
		render(
			<SortRow
				activeSort="due"
				dueDirection={defaultDue}
				filter="all"
				statusDirection="active-first"
				onSortChange={onSortChange}
			/>,
		);
		expect(screen.getByRole('toolbar', { name: 'Sort options' })).toBeInTheDocument();
	});

	it('sets aria-pressed true for active sort only', () => {
		const onSortChange = vi.fn();
		render(
			<SortRow
				activeSort="status"
				dueDirection={defaultDue}
				filter="all"
				statusDirection="completed-first"
				onSortChange={onSortChange}
			/>,
		);
		expect(screen.getByRole('button', { name: /sort by due date/i })).toHaveAttribute(
			'aria-pressed',
			'false',
		);
		expect(
			screen.getByRole('button', { name: /sort by status.*completed tasks first/i }),
		).toHaveAttribute('aria-pressed', 'true');
		expect(
			screen.getByRole('button', { name: /sort by status.*completed tasks first/i }),
		).toHaveTextContent('Status ↓');
	});

	it('calls onSortChange when buttons are clicked', async () => {
		const user = userEvent.setup();
		const onSortChange = vi.fn();
		render(
			<SortRow
				activeSort="status"
				dueDirection={defaultDue}
				filter="all"
				statusDirection="active-first"
				onSortChange={onSortChange}
			/>,
		);
		await user.click(screen.getByRole('button', { name: /sort by due date/i }));
		expect(onSortChange).toHaveBeenCalledWith('due');
		onSortChange.mockClear();
		await user.click(screen.getByRole('button', { name: /sort by status/i }));
		expect(onSortChange).toHaveBeenCalledWith('status');
	});

	it('hides Status when filter is active or completed', () => {
		const onSortChange = vi.fn();
		const { rerender } = render(
			<SortRow
				activeSort="due"
				dueDirection={defaultDue}
				filter="active"
				statusDirection="active-first"
				onSortChange={onSortChange}
			/>,
		);
		expect(screen.queryByRole('button', { name: /sort by status/i })).not.toBeInTheDocument();

		rerender(
			<SortRow
				activeSort="due"
				dueDirection={defaultDue}
				filter="completed"
				statusDirection="active-first"
				onSortChange={onSortChange}
			/>,
		);
		expect(screen.queryByRole('button', { name: /sort by status/i })).not.toBeInTheDocument();
	});
});
