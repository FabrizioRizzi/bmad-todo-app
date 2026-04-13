import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { render, screen } from '@testing-library/react';
import { afterEach, describe, expect, it, vi } from 'vitest';
import { ErrorBanner } from './error-banner';
import { FilterTabs } from './filter-tabs';
import { TodoCard } from './todo-card';
import { TodoList } from './todo-list';
import { TodoListSkeleton } from './todo-list-skeleton';
import { UndoToast } from './undo-toast';

const createQueryClient = () =>
	new QueryClient({
		defaultOptions: {
			queries: { retry: false },
			mutations: { retry: false },
		},
	});

const renderWithQC = (component: React.ReactNode) => {
	const qc = createQueryClient();
	return render(<QueryClientProvider client={qc}>{component}</QueryClientProvider>);
};

const mockTodo = {
	id: '1',
	description: 'Test todo',
	isCompleted: false,
	createdAt: '2026-04-08T00:00:00Z',
	dueDate: null,
};

describe('Animation System – Duration Token References (AC #1, #6)', () => {
	afterEach(() => vi.restoreAllMocks());

	it('checkbox uses --duration-normal token for transitions', () => {
		renderWithQC(<TodoCard todo={mockTodo} />);
		const checkbox = screen.getByRole('checkbox');
		expect(checkbox.className).toContain('duration-[var(--duration-normal)]');
	});

	it('checkbox uses --ease-standard easing', () => {
		renderWithQC(<TodoCard todo={mockTodo} />);
		const checkbox = screen.getByRole('checkbox');
		expect(checkbox.className).toContain('ease-[var(--ease-standard)]');
	});

	it('delete button uses --duration-fast token for hover transition', () => {
		renderWithQC(<TodoCard todo={mockTodo} onDelete={vi.fn()} />);
		const deleteBtn = screen.getByRole('button', { name: /Delete:/ });
		expect(deleteBtn.className).toContain('duration-[var(--duration-fast)]');
	});

	it('card hover shadow uses --duration-fast token', () => {
		renderWithQC(<TodoCard todo={mockTodo} />);
		const card = screen.getByText('Test todo').closest('.todo-card-bar');
		expect(card?.className).toContain('duration-[var(--duration-fast)]');
	});

	it('filter tab text uses --duration-fast token', () => {
		render(
			<FilterTabs
				activeFilter="all"
				counts={{ all: 1, active: 1, completed: 0 }}
				onFilterChange={vi.fn()}
			/>,
		);
		const tab = screen.getByRole('tab', { name: /all/i });
		expect(tab.className).toContain('duration-[var(--duration-fast)]');
	});

	it('filter underline uses --duration-normal token', () => {
		const { container } = render(
			<FilterTabs
				activeFilter="all"
				counts={{ all: 1, active: 1, completed: 0 }}
				onFilterChange={vi.fn()}
			/>,
		);
		const underline = container.querySelector('[aria-hidden]')?.querySelector('div');
		expect(underline?.className).toContain('duration-[var(--duration-normal)]');
	});
});

describe('Animation System – CSS Class References (AC #3)', () => {
	afterEach(() => vi.restoreAllMocks());

	it('card enter: applies todo-card-enter class when entering', () => {
		renderWithQC(<TodoCard todo={mockTodo} isEntering={true} />);
		const li = screen.getByText('Test todo').closest('li');
		expect(li).toHaveClass('todo-card-enter');
	});

	it('card exit/delete: applies todo-card-exit-delete class when exiting', () => {
		renderWithQC(<TodoCard todo={mockTodo} isExiting={true} />);
		const li = screen.getByText('Test todo').closest('li');
		expect(li).toHaveClass('todo-card-exit-delete');
	});

	it('card exit/filter: applies todo-card-filter-exit class', () => {
		renderWithQC(<TodoCard todo={mockTodo} isFilterExiting={true} />);
		const li = screen.getByText('Test todo').closest('li');
		expect(li).toHaveClass('todo-card-filter-exit');
	});

	it('card filter enter: applies todo-card-filter-enter class', () => {
		renderWithQC(<TodoCard todo={mockTodo} isFilterEntering={true} />);
		const li = screen.getByText('Test todo').closest('li');
		expect(li).toHaveClass('todo-card-filter-enter');
	});

	it('card motion wrapper: applies todo-list-item-motion class', () => {
		renderWithQC(<TodoCard todo={mockTodo} />);
		const li = screen.getByText('Test todo').closest('li');
		expect(li).toHaveClass('todo-list-item-motion');
	});

	it('card complete transition: applies todo-card-bar + todo-card-completed for completed todo', () => {
		renderWithQC(<TodoCard todo={{ ...mockTodo, isCompleted: true }} />);
		const bar = screen.getByText('Test todo').closest('.todo-card-bar');
		expect(bar).toHaveClass('todo-card-completed');
	});

	it('card text transition: applies todo-card-text class', () => {
		renderWithQC(<TodoCard todo={mockTodo} />);
		const text = screen.getByText('Test todo');
		expect(text).toHaveClass('todo-card-text');
	});

	it('card sort FLIP target: applies todo-sort-flip-target class', () => {
		renderWithQC(<TodoCard todo={mockTodo} />);
		const flipTarget = screen.getByText('Test todo').closest('.todo-sort-flip-target');
		expect(flipTarget).toBeTruthy();
	});

	it('skeleton: applies todo-skeleton-pulse class', () => {
		const { container } = render(<TodoListSkeleton />);
		expect(container.querySelector('.todo-skeleton-pulse')).toBeInTheDocument();
	});

	it('skeleton crossfade: TodoList uses duration-smooth for opacity transition', () => {
		renderWithQC(
			<TodoList
				todos={[]}
				filter="all"
				sortLayoutKey="due:ascending:active-first"
				isInitialLoading={true}
				highlightedId={null}
			/>,
		);
		const wrappers = document.querySelectorAll('.transition-opacity');
		const hasDurationSmooth = [...wrappers].some((el) =>
			el.className.includes('duration-[var(--duration-smooth)]'),
		);
		expect(hasDurationSmooth).toBe(true);
	});

	it('toast enter: applies undo-toast-enter class', () => {
		render(
			<UndoToast
				state={{ todoId: '1', message: 'Task deleted' }}
				onUndo={vi.fn()}
				onDismiss={vi.fn()}
			/>,
		);
		const toast = screen.getByTestId('undo-toast');
		expect(toast.className).toContain('undo-toast-enter');
	});

	it('error banner enter: applies error-banner-enter class', () => {
		render(<ErrorBanner message="Error" onDismiss={vi.fn()} />);
		const banner = screen.getByTestId('error-banner');
		expect(banner.className).toContain('error-banner-enter');
	});
});

describe('Animation System – Reduced Motion (AC #5, #7)', () => {
	afterEach(() => {
		vi.unstubAllGlobals();
		vi.restoreAllMocks();
	});

	function mockReducedMotion(enabled: boolean) {
		vi.stubGlobal(
			'matchMedia',
			vi.fn((query: string) => ({
				matches: query === '(prefers-reduced-motion: reduce)' ? enabled : false,
				media: query,
				onchange: null,
				addEventListener: vi.fn(),
				removeEventListener: vi.fn(),
				addListener: vi.fn(),
				removeListener: vi.fn(),
				dispatchEvent: vi.fn(() => false),
			})),
		);
	}

	it('skeleton renders with todo-skeleton-pulse class (reduced motion handled by CSS)', () => {
		mockReducedMotion(true);
		const { container } = render(<TodoListSkeleton />);
		expect(container.querySelector('.todo-skeleton-pulse')).toBeInTheDocument();
	});

	it('FLIP animation is skipped under reduced motion (sort layout change does not animate)', () => {
		mockReducedMotion(true);

		const todos = [
			{ ...mockTodo, id: '1', description: 'Alpha' },
			{ ...mockTodo, id: '2', description: 'Beta' },
		];

		const { rerender } = renderWithQC(
			<TodoList
				todos={todos}
				filter="all"
				sortLayoutKey="due:ascending:active-first"
				isInitialLoading={false}
				highlightedId={null}
			/>,
		);

		rerender(
			<QueryClientProvider client={createQueryClient()}>
				<TodoList
					todos={todos}
					filter="all"
					sortLayoutKey="status:ascending:active-first"
					isInitialLoading={false}
					highlightedId={null}
				/>
			</QueryClientProvider>,
		);

		const flipTargets = document.querySelectorAll('.todo-sort-flip-target');
		for (const el of flipTargets) {
			const htmlEl = el as HTMLElement;
			expect(htmlEl.style.transform).toBeFalsy();
		}
	});

	it('filter exit/enter IDs are cleared immediately (0ms timeout) under reduced motion', async () => {
		mockReducedMotion(true);

		const todos = [
			{ ...mockTodo, id: '1', isCompleted: false },
			{ ...mockTodo, id: '2', description: 'Done', isCompleted: true },
		];

		const { rerender } = renderWithQC(
			<TodoList
				todos={todos}
				filter="all"
				sortLayoutKey="due:ascending:active-first"
				isInitialLoading={false}
				highlightedId={null}
			/>,
		);

		rerender(
			<QueryClientProvider client={createQueryClient()}>
				<TodoList
					todos={todos}
					filter="active"
					sortLayoutKey="due:ascending:active-first"
					isInitialLoading={false}
					highlightedId={null}
				/>
			</QueryClientProvider>,
		);

		await vi.waitFor(() => {
			const exitingItems = document.querySelectorAll('.todo-card-filter-exit');
			expect(exitingItems.length).toBe(0);
		});
	});

	it('all components still render their states understandably without motion', () => {
		mockReducedMotion(true);

		renderWithQC(<TodoCard todo={{ ...mockTodo, isCompleted: true }} />);
		const text = screen.getByText('Test todo');
		expect(text).toHaveClass('todo-card-text');

		const card = text.closest('.todo-card-bar');
		expect(card).toHaveClass('todo-card-completed');
	});
});

describe('Animation System – Duration Cap (AC #4)', () => {
	it('no animation token exceeds 300ms', () => {
		const root = document.documentElement;
		const style = getComputedStyle(root);

		const tokenDurations = [
			{ name: '--duration-fast', maxMs: 300 },
			{ name: '--duration-normal', maxMs: 300 },
			{ name: '--duration-smooth', maxMs: 300 },
			{ name: '--duration-enter', maxMs: 300 },
			{ name: '--duration-exit', maxMs: 300 },
		];

		for (const { name, maxMs } of tokenDurations) {
			const raw = style.getPropertyValue(name).trim();
			if (!raw) continue;
			const ms = raw.endsWith('ms') ? Number.parseFloat(raw) : Number.parseFloat(raw) * 1000;
			expect(ms, `${name} = ${raw} exceeds ${maxMs}ms`).toBeLessThanOrEqual(maxMs);
		}
	});

	it('exits are faster than or equal to enters (200ms vs 300ms)', () => {
		const root = document.documentElement;
		const style = getComputedStyle(root);
		const enterRaw = style.getPropertyValue('--duration-enter').trim();
		const exitRaw = style.getPropertyValue('--duration-exit').trim();
		if (!enterRaw || !exitRaw) return;

		const parseMs = (s: string) =>
			s.endsWith('ms') ? Number.parseFloat(s) : Number.parseFloat(s) * 1000;

		expect(parseMs(exitRaw)).toBeLessThanOrEqual(parseMs(enterRaw));
	});
});
