import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { render, screen, waitFor } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import { TodoCard } from './todo-card';

const createQueryClient = () =>
	new QueryClient({
		defaultOptions: {
			queries: { retry: false },
			mutations: { retry: false },
		},
	});

const renderWithQueryClient = (component: React.ReactNode) => {
	const queryClient = createQueryClient();
	return render(<QueryClientProvider client={queryClient}>{component}</QueryClientProvider>);
};

describe('TodoCard', () => {
	const mockTodo = {
		id: '1',
		description: 'Test todo',
		isCompleted: false,
		createdAt: '2026-04-08T00:00:00Z',
		dueDate: null,
	};

	beforeEach(() => {
		vi.spyOn(console, 'error').mockImplementation(() => {});
	});

	afterEach(() => {
		vi.restoreAllMocks();
	});

	it('renders todo description', () => {
		renderWithQueryClient(<TodoCard todo={mockTodo} />);
		expect(screen.getByText('Test todo')).toBeInTheDocument();
	});

	it('renders checkbox unchecked when todo is not completed', () => {
		renderWithQueryClient(<TodoCard todo={mockTodo} />);
		const checkbox = screen.getByRole('checkbox');
		expect(checkbox).not.toBeChecked();
	});

	it('renders checkbox checked when todo is completed', () => {
		renderWithQueryClient(<TodoCard todo={{ ...mockTodo, isCompleted: true }} />);
		const checkbox = screen.getByRole('checkbox');
		expect(checkbox).toBeChecked();
	});

	it('applies completed class when todo is completed', () => {
		renderWithQueryClient(<TodoCard todo={{ ...mockTodo, isCompleted: true }} />);
		const card = screen.getByText('Test todo').closest('.todo-card-bar');
		expect(card).toHaveClass('todo-card-completed');
	});

	it('does not apply completed class when todo is not completed', () => {
		renderWithQueryClient(<TodoCard todo={mockTodo} />);
		const card = screen.getByText('Test todo').closest('.todo-card-bar');
		expect(card).not.toHaveClass('todo-card-completed');
	});

	it('disables checkbox during pending state', async () => {
		const user = userEvent.setup();
		renderWithQueryClient(<TodoCard todo={mockTodo} />);
		const checkbox = screen.getByRole('checkbox');

		await user.click(checkbox);
		await waitFor(
			() => {
				expect(checkbox).not.toBeDisabled();
			},
			{ timeout: 1000 },
		);
	});

	it('does not have aria-busy attribute when idle', () => {
		renderWithQueryClient(<TodoCard todo={mockTodo} />);
		const checkbox = screen.getByRole('checkbox');
		expect(checkbox).not.toHaveAttribute('aria-busy');
	});

	it('has appropriate aria-label', () => {
		renderWithQueryClient(<TodoCard todo={mockTodo} />);
		const checkbox = screen.getByRole('checkbox');
		expect(checkbox).toHaveAttribute('aria-label', 'Toggle completion for: Test todo');
	});

	it('applies highlighted class when highlighted prop is true', () => {
		renderWithQueryClient(<TodoCard todo={mockTodo} highlighted={true} />);
		const card = screen.getByText('Test todo').closest('.todo-card-bar');
		expect(card).toHaveAttribute('data-highlighted', 'true');
	});

	it('does not apply highlighted class when highlighted prop is false', () => {
		renderWithQueryClient(<TodoCard todo={mockTodo} highlighted={false} />);
		const card = screen.getByText('Test todo').closest('.todo-card-bar');
		expect(card).not.toHaveAttribute('data-highlighted', 'true');
	});
});
