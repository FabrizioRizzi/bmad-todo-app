import { render, screen } from '@testing-library/react';
import { describe, expect, it } from 'vitest';
import type { Todo } from '@/lib/api';
import { TodoList } from './todo-list';

const sampleTodos: Todo[] = [
	{
		id: '1',
		description: 'Alpha',
		isCompleted: false,
		createdAt: '2026-01-01T00:00:00.000Z',
		dueDate: null,
	},
	{
		id: '2',
		description: 'Beta',
		isCompleted: false,
		createdAt: '2026-01-02T00:00:00.000Z',
		dueDate: null,
	},
];

describe('TodoList', () => {
	it('shows skeleton placeholders while initial load is pending', () => {
		const { container } = render(
			<TodoList highlightedId={null} isInitialLoading={true} todos={[]} />,
		);
		expect(container.querySelector('.todo-skeleton-pulse')).toBeInTheDocument();
		expect(screen.queryByText('Alpha')).not.toBeInTheDocument();
	});

	it('renders descriptions in API order when loaded', () => {
		render(<TodoList highlightedId={null} isInitialLoading={false} todos={sampleTodos} />);
		const items = screen.getAllByText(/Alpha|Beta/);
		expect(items[0]).toHaveTextContent('Alpha');
		expect(items[1]).toHaveTextContent('Beta');
	});

	it('shows empty state when loaded with no todos', () => {
		render(<TodoList highlightedId={null} isInitialLoading={false} todos={[]} />);
		expect(screen.getByRole('status', { name: /no tasks yet/i })).toBeInTheDocument();
	});

	it('applies highlighted styling to the matching id', () => {
		render(<TodoList highlightedId="2" isInitialLoading={false} todos={sampleTodos} />);
		expect(screen.getByText('Beta').closest('[data-highlighted="true"]')).toBeTruthy();
		expect(screen.getByText('Alpha').closest('[data-highlighted="true"]')).toBeNull();
	});
});
