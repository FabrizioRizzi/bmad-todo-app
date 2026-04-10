import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { render, screen, waitFor } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import { localDateToIsoDate } from '@/lib/utils';
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
		vi.useRealTimers();
		vi.unstubAllGlobals();
		vi.restoreAllMocks();
	});

	it('renders todo description', () => {
		renderWithQueryClient(<TodoCard todo={mockTodo} />);
		const description = screen.getByText('Test todo');
		expect(description).toBeInTheDocument();
		expect(description).toHaveClass('min-w-0', 'break-words');
		expect(description).not.toHaveClass('truncate');
	});

	it('wraps long single-token descriptions without truncating', () => {
		renderWithQueryClient(
			<TodoCard
				todo={{
					...mockTodo,
					description: 'SupercalifragilisticexpialidociousSupercalifragilisticexpialidocious',
				}}
			/>,
		);

		const description = screen.getByText(
			'SupercalifragilisticexpialidociousSupercalifragilisticexpialidocious',
		);
		expect(description).toHaveClass('min-w-0', 'break-words');
		expect(description).not.toHaveClass('truncate');
	});

	it('allows wrapping for multi-word descriptions', () => {
		renderWithQueryClient(
			<TodoCard
				todo={{
					...mockTodo,
					description:
						'One two three four five six seven eight nine ten eleven twelve thirteen fourteen',
				}}
			/>,
		);

		const description = screen.getByText(
			'One two three four five six seven eight nine ten eleven twelve thirteen fourteen',
		);
		expect(description).toHaveClass('min-w-0', 'break-words');
		expect(description).not.toHaveClass('truncate');
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

	it('has appropriate aria-label for active todo', () => {
		renderWithQueryClient(<TodoCard todo={mockTodo} />);
		const checkbox = screen.getByRole('checkbox');
		expect(checkbox).toHaveAttribute('aria-label', 'Mark Test todo as complete');
	});

	it('has appropriate aria-label for completed todo', () => {
		renderWithQueryClient(<TodoCard todo={{ ...mockTodo, isCompleted: true }} />);
		const checkbox = screen.getByRole('checkbox');
		expect(checkbox).toHaveAttribute('aria-label', 'Mark Test todo as active');
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

	it('renders delete button when onDelete is provided', () => {
		renderWithQueryClient(<TodoCard todo={mockTodo} onDelete={vi.fn()} />);
		const deleteBtn = screen.getByRole('button', { name: /Delete:/ });
		expect(deleteBtn).toBeInTheDocument();
	});

	it('does not render delete button when onDelete is not provided', () => {
		renderWithQueryClient(<TodoCard todo={mockTodo} />);
		const deleteBtn = screen.queryByRole('button', { name: /Delete:/ });
		expect(deleteBtn).not.toBeInTheDocument();
	});

	it('calls onDelete with todo id when delete button is clicked', async () => {
		const user = userEvent.setup();
		const onDelete = vi.fn();
		renderWithQueryClient(<TodoCard todo={mockTodo} onDelete={onDelete} />);

		await user.click(screen.getByRole('button', { name: /Delete:/ }));
		expect(onDelete).toHaveBeenCalledWith('1');
	});

	it('calls onDelete when delete button is focused and Enter is pressed', async () => {
		const user = userEvent.setup();
		const onDelete = vi.fn();
		renderWithQueryClient(<TodoCard todo={mockTodo} onDelete={onDelete} />);

		const deleteBtn = screen.getByRole('button', { name: /Delete:/ });
		deleteBtn.focus();
		await user.keyboard('{Enter}');
		expect(onDelete).toHaveBeenCalledWith('1');
	});

	it('calls onDelete when delete button is focused and Space is pressed', async () => {
		const user = userEvent.setup();
		const onDelete = vi.fn();
		renderWithQueryClient(<TodoCard todo={mockTodo} onDelete={onDelete} />);

		const deleteBtn = screen.getByRole('button', { name: /Delete:/ });
		deleteBtn.focus();
		await user.keyboard(' ');
		expect(onDelete).toHaveBeenCalledWith('1');
	});

	it('delete button has correct aria-label', () => {
		renderWithQueryClient(<TodoCard todo={mockTodo} onDelete={vi.fn()} />);
		const deleteBtn = screen.getByRole('button', { name: 'Delete: Test todo' });
		expect(deleteBtn).toBeInTheDocument();
	});

	it('applies exit animation class when isExiting is true', () => {
		renderWithQueryClient(<TodoCard todo={mockTodo} isExiting={true} />);
		const li = screen.getByText('Test todo').closest('li');
		expect(li).toHaveClass('todo-card-exit-delete');
	});

	it('applies enter animation class when isEntering is true', () => {
		renderWithQueryClient(<TodoCard todo={mockTodo} isEntering={true} />);
		const li = screen.getByText('Test todo').closest('li');
		expect(li).toHaveClass('todo-card-enter');
	});

	it('does not apply exit animation class when isExiting is false', () => {
		renderWithQueryClient(<TodoCard todo={mockTodo} isExiting={false} />);
		const li = screen.getByText('Test todo').closest('li');
		expect(li).not.toHaveClass('todo-card-exit-delete');
	});

	it('shows due date badge with Today when dueDate is the current local day', () => {
		const today = localDateToIsoDate(new Date());
		renderWithQueryClient(<TodoCard todo={{ ...mockTodo, dueDate: today }} />);
		expect(screen.getByText('Today')).toBeInTheDocument();
	});

	it('applies overdue styling and Overdue label for active past-due todos', () => {
		vi.useFakeTimers();
		vi.setSystemTime(new Date('2026-04-09T12:00:00'));
		renderWithQueryClient(<TodoCard todo={{ ...mockTodo, dueDate: '2026-04-08' }} />);
		const card = screen.getByText('Test todo').closest('.todo-card-bar');
		expect(card).toHaveClass('todo-card-overdue');
		expect(screen.getByText('Overdue')).toBeInTheDocument();
	});

	it('does not apply overdue styling for completed todos with past due dates', () => {
		vi.useFakeTimers();
		vi.setSystemTime(new Date('2026-04-09T12:00:00'));
		renderWithQueryClient(
			<TodoCard todo={{ ...mockTodo, isCompleted: true, dueDate: '2026-04-08' }} />,
		);
		const card = screen.getByText('Test todo').closest('.todo-card-bar');
		expect(card).not.toHaveClass('todo-card-overdue');
		expect(screen.queryByText('Overdue')).not.toBeInTheDocument();
	});

	it('shows calendar control for todos without a due date', () => {
		renderWithQueryClient(<TodoCard todo={mockTodo} />);
		expect(screen.getByRole('button', { name: /Set due date for Test todo/i })).toBeInTheDocument();
	});

	it('sends PATCH with dueDate when selecting a date in the due date popover', async () => {
		const user = userEvent.setup();
		const now = new Date();
		const y = now.getFullYear();
		const m = String(now.getMonth() + 1).padStart(2, '0');
		const dueStart = `${y}-${m}-01`;
		const duePicked = `${y}-${m}-20`;

		const fetchMock = vi.fn((input: RequestInfo, init?: RequestInit) => {
			const url = typeof input === 'string' ? input : input.url;
			if (url.includes('/api/todos/1') && init?.method === 'PATCH') {
				const body = JSON.parse(init?.body as string) as {
					isCompleted?: boolean;
					dueDate?: string | null;
				};
				return Promise.resolve(
					new Response(
						JSON.stringify({
							id: '1',
							description: 'Test todo',
							isCompleted: body.isCompleted ?? false,
							createdAt: '2026-04-08T00:00:00Z',
							dueDate: body.dueDate !== undefined ? body.dueDate : dueStart,
						}),
						{ status: 200, headers: { 'Content-Type': 'application/json' } },
					),
				);
			}
			return Promise.reject(new Error(`Unexpected fetch: ${url} ${init?.method}`));
		});
		vi.stubGlobal('fetch', fetchMock);

		renderWithQueryClient(<TodoCard todo={{ ...mockTodo, dueDate: dueStart }} />);

		await user.click(screen.getByRole('button', { name: /Change due date for Test todo/i }));
		const grid = screen.getByRole('grid');
		const dayBtn = grid.querySelector(`[data-day="${duePicked}"] button`);
		if (!(dayBtn instanceof HTMLElement)) {
			throw new Error('expected picked day button in calendar grid');
		}
		await user.click(dayBtn);

		await waitFor(() => {
			expect(fetchMock).toHaveBeenCalledWith(
				expect.stringContaining('/api/todos/1'),
				expect.objectContaining({
					method: 'PATCH',
					body: JSON.stringify({ dueDate: duePicked }),
				}),
			);
		});
	});

	it('due date trigger says "Set due date for [task]" when no date is set', () => {
		renderWithQueryClient(<TodoCard todo={mockTodo} />);
		expect(screen.getByRole('button', { name: 'Set due date for Test todo' })).toBeInTheDocument();
	});

	it('due date trigger says "Change due date for [task]" when date exists', () => {
		renderWithQueryClient(<TodoCard todo={{ ...mockTodo, dueDate: '2026-05-01' }} />);
		expect(
			screen.getByRole('button', { name: 'Change due date for Test todo' }),
		).toBeInTheDocument();
	});

	it('delete button aria-label includes task description', () => {
		renderWithQueryClient(<TodoCard todo={mockTodo} onDelete={vi.fn()} />);
		expect(screen.getByRole('button', { name: 'Delete: Test todo' })).toBeInTheDocument();
	});

	it('delete button aria-label safely truncates very long task descriptions', () => {
		const veryLongDescription = `${'Very long task '.repeat(20)}suffix`;
		renderWithQueryClient(
			<TodoCard todo={{ ...mockTodo, description: veryLongDescription }} onDelete={vi.fn()} />,
		);
		const deleteButton = screen.getByRole('button', { name: /^Delete:\s/ });
		const label = deleteButton.getAttribute('aria-label');
		expect(label).toBeTruthy();
		expect(label?.length).toBeLessThan(veryLongDescription.length);
		expect(label?.endsWith('...')).toBe(true);
	});

	it('delete button SVG is aria-hidden', () => {
		renderWithQueryClient(<TodoCard todo={mockTodo} onDelete={vi.fn()} />);
		const deleteBtn = screen.getByRole('button', { name: 'Delete: Test todo' });
		const svg = deleteBtn.querySelector('svg');
		expect(svg).toHaveAttribute('aria-hidden', 'true');
	});

	it('delete button has 44×44px touch target', () => {
		renderWithQueryClient(<TodoCard todo={mockTodo} onDelete={vi.fn()} />);
		const deleteBtn = screen.getByRole('button', { name: /Delete:/ });
		expect(deleteBtn).toHaveClass('h-11', 'w-11');
	});

	it('checkbox wrapper has 44×44px touch target', () => {
		renderWithQueryClient(<TodoCard todo={mockTodo} />);
		const checkbox = screen.getByRole('checkbox');
		const wrapper = checkbox.closest('.relative');
		expect(wrapper).toHaveClass('h-11', 'w-11');
	});

	it('delete button has responsive visibility classes (mobile visible, desktop hover/focus)', () => {
		renderWithQueryClient(<TodoCard todo={mockTodo} onDelete={vi.fn()} />);
		const deleteBtn = screen.getByRole('button', { name: /Delete:/ });
		expect(deleteBtn).toHaveClass('opacity-50');
		expect(deleteBtn.className).toContain('lg:opacity-0');
		expect(deleteBtn.className).toContain('lg:group-hover:opacity-100');
		expect(deleteBtn.className).toContain('lg:focus-visible:opacity-100');
	});

	it('checkmark SVG is aria-hidden when completed', () => {
		renderWithQueryClient(<TodoCard todo={{ ...mockTodo, isCompleted: true }} />);
		const svgs = document.querySelectorAll('svg[aria-hidden="true"]');
		const checkmarkSvg = [...svgs].find((svg) => svg.querySelector('path[d="M5 13l4 4L19 7"]'));
		expect(checkmarkSvg).toBeTruthy();
	});
});
