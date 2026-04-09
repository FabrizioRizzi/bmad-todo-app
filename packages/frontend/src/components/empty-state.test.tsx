import { render, screen } from '@testing-library/react';
import { describe, expect, it } from 'vitest';
import { EmptyState } from './empty-state';

describe('EmptyState', () => {
	it('renders no-todos variant by default', () => {
		render(<EmptyState />);
		const region = screen.getByRole('status', { name: /no tasks yet/i });
		expect(region).toHaveAttribute('aria-live', 'polite');
		expect(screen.getByText('No tasks yet')).toBeInTheDocument();
		expect(
			screen.getByText('Type above and press Enter (or tap +) to add your first task.'),
		).toBeInTheDocument();
	});

	it('renders no-active variant', () => {
		render(<EmptyState variant="no-active" />);
		expect(screen.getByRole('status', { name: /no active tasks/i })).toBeInTheDocument();
		expect(screen.getByText('No active tasks')).toBeInTheDocument();
		expect(screen.getByText('Add a task above to get started.')).toBeInTheDocument();
	});

	it('renders no-completed variant', () => {
		render(<EmptyState variant="no-completed" />);
		expect(screen.getByRole('status', { name: /no completed tasks/i })).toBeInTheDocument();
		expect(screen.getByText('No completed tasks')).toBeInTheDocument();
		expect(screen.getByText('Tasks you complete will appear here.')).toBeInTheDocument();
	});

	it('renders load-error variant', () => {
		render(<EmptyState variant="load-error" />);
		expect(screen.getByRole('status', { name: /couldn't load your tasks/i })).toBeInTheDocument();
		expect(screen.getByText("Couldn't load your tasks")).toBeInTheDocument();
		expect(screen.getByText('Check your connection and try again.')).toBeInTheDocument();
	});
});
