import { render, screen } from '@testing-library/react';
import { describe, expect, it } from 'vitest';
import { EmptyState } from './empty-state';

describe('EmptyState', () => {
	it('renders status region and exact copy from AC', () => {
		render(<EmptyState />);
		const region = screen.getByRole('status', { name: /no tasks yet/i });
		expect(region).toHaveAttribute('aria-live', 'polite');
		expect(screen.getByText('No tasks yet')).toBeInTheDocument();
		expect(
			screen.getByText('Type above and press Enter (or tap +) to add your first task.'),
		).toBeInTheDocument();
	});
});
