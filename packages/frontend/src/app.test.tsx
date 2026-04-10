import { QueryClientProvider } from '@tanstack/react-query';
import { act, render, screen, waitFor } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import { createTestQueryClient } from '@/test-utils';
import { App } from './app';

const mockTodos = [
	{
		id: '1',
		description: 'Existing task',
		isCompleted: false,
		createdAt: '2026-04-08T00:00:00Z',
		dueDate: null,
	},
];

function renderApp() {
	const queryClient = createTestQueryClient();
	return render(
		<QueryClientProvider client={queryClient}>
			<App />
		</QueryClientProvider>,
	);
}

describe('App – Error Banner Integration', () => {
	beforeEach(() => {
		vi.useFakeTimers({ shouldAdvanceTime: true });
	});

	afterEach(() => {
		vi.useRealTimers();
		vi.unstubAllGlobals();
	});

	it('shows create error banner when create mutation fails', async () => {
		const user = userEvent.setup({ advanceTimers: vi.advanceTimersByTime });

		vi.stubGlobal(
			'fetch',
			vi.fn((input: RequestInfo, init?: RequestInit) => {
				const url = typeof input === 'string' ? input : input.url;
				if (url.includes('/api/todos') && (!init?.method || init.method === 'GET')) {
					return Promise.resolve(
						new Response(JSON.stringify([]), {
							status: 200,
							headers: { 'Content-Type': 'application/json' },
						}),
					);
				}
				if (url.includes('/api/todos') && init?.method === 'POST') {
					return Promise.resolve(
						new Response(
							JSON.stringify({ statusCode: 500, error: 'Internal Server Error', message: 'fail' }),
							{ status: 500, headers: { 'Content-Type': 'application/json' } },
						),
					);
				}
				return Promise.reject(new Error(`Unexpected fetch: ${url}`));
			}),
		);

		renderApp();

		await waitFor(() => {
			expect(screen.getByPlaceholderText(/add a new task/i)).toBeInTheDocument();
		});

		const input = screen.getByPlaceholderText(/add a new task/i);
		await user.type(input, 'New task{enter}');

		await waitFor(() => {
			expect(
				screen.getByText("Couldn't add that task — check your connection and try again."),
			).toBeInTheDocument();
		});

		const banner = screen.getByTestId('error-banner');
		expect(banner.closest('[role="alert"]')).toHaveAttribute('aria-live', 'assertive');
	});

	it('shows toggle error banner when toggle mutation fails', async () => {
		const user = userEvent.setup({ advanceTimers: vi.advanceTimersByTime });

		vi.stubGlobal(
			'fetch',
			vi.fn((input: RequestInfo, init?: RequestInit) => {
				const url = typeof input === 'string' ? input : input.url;
				if (url === '/api/todos' && (!init?.method || init.method === 'GET')) {
					return Promise.resolve(
						new Response(JSON.stringify(mockTodos), {
							status: 200,
							headers: { 'Content-Type': 'application/json' },
						}),
					);
				}
				if (url.includes('/api/todos/') && init?.method === 'PATCH') {
					return Promise.resolve(
						new Response(
							JSON.stringify({ statusCode: 500, error: 'Internal Server Error', message: 'fail' }),
							{ status: 500, headers: { 'Content-Type': 'application/json' } },
						),
					);
				}
				return Promise.reject(new Error(`Unexpected fetch: ${url}`));
			}),
		);

		renderApp();

		await waitFor(() => {
			expect(screen.getByText('Existing task')).toBeInTheDocument();
		});

		const checkbox = screen.getByRole('checkbox', {
			name: /toggle completion for: existing task/i,
		});
		await user.click(checkbox);

		await waitFor(() => {
			expect(screen.getByText("Couldn't update that task — try again.")).toBeInTheDocument();
		});
	});

	it('auto-dismisses error banner after 8 seconds', async () => {
		const user = userEvent.setup({ advanceTimers: vi.advanceTimersByTime });

		vi.stubGlobal(
			'fetch',
			vi.fn((input: RequestInfo, init?: RequestInit) => {
				const url = typeof input === 'string' ? input : input.url;
				if (url.includes('/api/todos') && (!init?.method || init.method === 'GET')) {
					return Promise.resolve(
						new Response(JSON.stringify([]), {
							status: 200,
							headers: { 'Content-Type': 'application/json' },
						}),
					);
				}
				if (url.includes('/api/todos') && init?.method === 'POST') {
					return Promise.resolve(
						new Response(
							JSON.stringify({ statusCode: 500, error: 'Internal Server Error', message: 'fail' }),
							{ status: 500, headers: { 'Content-Type': 'application/json' } },
						),
					);
				}
				return Promise.reject(new Error(`Unexpected fetch: ${url}`));
			}),
		);

		renderApp();

		await waitFor(() => {
			expect(screen.getByPlaceholderText(/add a new task/i)).toBeInTheDocument();
		});

		const input = screen.getByPlaceholderText(/add a new task/i);
		await user.type(input, 'New task{enter}');

		await waitFor(() => {
			expect(
				screen.getByText("Couldn't add that task — check your connection and try again."),
			).toBeInTheDocument();
		});

		act(() => {
			vi.advanceTimersByTime(8200);
		});

		await waitFor(() => {
			expect(
				screen.queryByText("Couldn't add that task — check your connection and try again."),
			).not.toBeInTheDocument();
		});
	});

	it('dismisses error banner on successful action', async () => {
		const user = userEvent.setup({ advanceTimers: vi.advanceTimersByTime });
		let postCallCount = 0;

		const createdTodo = {
			id: 'new-1',
			description: 'New task',
			isCompleted: false,
			createdAt: '2026-04-08T12:00:00.000Z',
			dueDate: null,
		};

		vi.stubGlobal(
			'fetch',
			vi.fn((input: RequestInfo, init?: RequestInit) => {
				const url = typeof input === 'string' ? input : input.url;
				if (url.includes('/api/todos') && (!init?.method || init.method === 'GET')) {
					return Promise.resolve(
						new Response(JSON.stringify([]), {
							status: 200,
							headers: { 'Content-Type': 'application/json' },
						}),
					);
				}
				if (url.includes('/api/todos') && init?.method === 'POST') {
					postCallCount++;
					if (postCallCount === 1) {
						return Promise.resolve(
							new Response(
								JSON.stringify({
									statusCode: 500,
									error: 'Internal Server Error',
									message: 'fail',
								}),
								{ status: 500, headers: { 'Content-Type': 'application/json' } },
							),
						);
					}
					return Promise.resolve(
						new Response(JSON.stringify(createdTodo), {
							status: 201,
							headers: { 'Content-Type': 'application/json' },
						}),
					);
				}
				return Promise.reject(new Error(`Unexpected fetch: ${url}`));
			}),
		);

		renderApp();

		await waitFor(() => {
			expect(screen.getByPlaceholderText(/add a new task/i)).toBeInTheDocument();
		});

		const input = screen.getByPlaceholderText(/add a new task/i);
		await user.type(input, 'New task{enter}');

		await waitFor(() => {
			expect(
				screen.getByText("Couldn't add that task — check your connection and try again."),
			).toBeInTheDocument();
		});

		await user.type(input, 'New task{enter}');

		await waitFor(() => {
			expect(
				screen.queryByText("Couldn't add that task — check your connection and try again."),
			).not.toBeInTheDocument();
		});
	});

	it('replaces previous error with new error (no stacking)', async () => {
		const user = userEvent.setup({ advanceTimers: vi.advanceTimersByTime });

		vi.stubGlobal(
			'fetch',
			vi.fn((input: RequestInfo, init?: RequestInit) => {
				const url = typeof input === 'string' ? input : input.url;
				if (url.includes('/api/todos') && (!init?.method || init.method === 'GET')) {
					return Promise.resolve(
						new Response(JSON.stringify(mockTodos), {
							status: 200,
							headers: { 'Content-Type': 'application/json' },
						}),
					);
				}
				if (url.includes('/api/todos') && init?.method === 'POST') {
					return Promise.resolve(
						new Response(
							JSON.stringify({ statusCode: 500, error: 'Internal Server Error', message: 'fail' }),
							{ status: 500, headers: { 'Content-Type': 'application/json' } },
						),
					);
				}
				if (url.includes('/api/todos/') && init?.method === 'PATCH') {
					return Promise.resolve(
						new Response(
							JSON.stringify({ statusCode: 500, error: 'Internal Server Error', message: 'fail' }),
							{ status: 500, headers: { 'Content-Type': 'application/json' } },
						),
					);
				}
				return Promise.reject(new Error(`Unexpected fetch: ${url}`));
			}),
		);

		renderApp();

		await waitFor(() => {
			expect(screen.getByText('Existing task')).toBeInTheDocument();
		});

		const input = screen.getByPlaceholderText(/add a new task/i);
		await user.type(input, 'New task{enter}');

		await waitFor(() => {
			expect(
				screen.getByText("Couldn't add that task — check your connection and try again."),
			).toBeInTheDocument();
		});

		const checkbox = screen.getByRole('checkbox', {
			name: /toggle completion for: existing task/i,
		});
		await user.click(checkbox);

		await waitFor(() => {
			expect(screen.getByText("Couldn't update that task — try again.")).toBeInTheDocument();
		});

		expect(
			screen.queryByText("Couldn't add that task — check your connection and try again."),
		).not.toBeInTheDocument();

		const banners = screen.getAllByTestId('error-banner');
		expect(banners).toHaveLength(1);
	});
});

describe('App – Original Coverage', () => {
	afterEach(() => {
		vi.unstubAllGlobals();
	});

	it('renders the app title in the header', () => {
		const queryClient = createTestQueryClient();
		render(
			<QueryClientProvider client={queryClient}>
				<App />
			</QueryClientProvider>,
		);
		expect(screen.getByRole('heading', { level: 1 })).toHaveTextContent('My Tasks');
	});

	it('shows todo count from loaded list', async () => {
		vi.stubGlobal(
			'fetch',
			vi.fn((input: RequestInfo, init?: RequestInit) => {
				const url = typeof input === 'string' ? input : input.url;
				if (url.includes('/api/todos') && (!init?.method || init.method === 'GET')) {
					return Promise.resolve(
						new Response(
							JSON.stringify([
								{
									id: 'a',
									description: 'One',
									isCompleted: false,
									createdAt: '2026-01-01T00:00:00.000Z',
									dueDate: null,
								},
							]),
							{
								status: 200,
								headers: { 'Content-Type': 'application/json' },
							},
						),
					);
				}
				return Promise.reject(new Error(`Unexpected fetch: ${url}`));
			}),
		);

		const queryClient = createTestQueryClient();
		render(
			<QueryClientProvider client={queryClient}>
				<App />
			</QueryClientProvider>,
		);

		await waitFor(() => {
			expect(screen.getByRole('status', { name: /todo count/i })).toHaveTextContent('1 remaining');
		});
	});

	it('renders add form and todo list regions', async () => {
		const queryClient = createTestQueryClient();
		render(
			<QueryClientProvider client={queryClient}>
				<App />
			</QueryClientProvider>,
		);

		expect(screen.getByRole('region', { name: /add new todo/i })).toBeInTheDocument();
		expect(screen.getByRole('region', { name: /todo list/i })).toBeInTheDocument();
	});

	it('renders add field and submit control', () => {
		const queryClient = createTestQueryClient();
		render(
			<QueryClientProvider client={queryClient}>
				<App />
			</QueryClientProvider>,
		);

		expect(screen.getByPlaceholderText(/add a new task/i)).toBeInTheDocument();
		expect(screen.getByRole('button', { name: /add task/i })).toBeInTheDocument();
	});
});

describe('App – Todo filters', () => {
	afterEach(() => {
		vi.unstubAllGlobals();
	});

	it('updates visible todos when filter tabs change', async () => {
		const user = userEvent.setup();
		vi.stubGlobal(
			'fetch',
			vi.fn((input: RequestInfo, init?: RequestInit) => {
				const url = typeof input === 'string' ? input : input.url;
				if (url.includes('/api/todos') && (!init?.method || init.method === 'GET')) {
					return Promise.resolve(
						new Response(
							JSON.stringify([
								{
									id: 'a',
									description: 'Still open',
									isCompleted: false,
									createdAt: '2026-01-01T00:00:00.000Z',
									dueDate: null,
								},
								{
									id: 'b',
									description: 'Already done',
									isCompleted: true,
									createdAt: '2026-01-02T00:00:00.000Z',
									dueDate: null,
								},
							]),
							{
								status: 200,
								headers: { 'Content-Type': 'application/json' },
							},
						),
					);
				}
				return Promise.reject(new Error(`Unexpected fetch: ${url}`));
			}),
		);

		const queryClient = createTestQueryClient();
		render(
			<QueryClientProvider client={queryClient}>
				<App />
			</QueryClientProvider>,
		);

		await waitFor(() => {
			expect(screen.getByText('Still open')).toBeInTheDocument();
		});
		expect(screen.getByText('Already done')).toBeInTheDocument();

		await user.click(screen.getByRole('tab', { name: /active, 1 tasks/i }));

		await waitFor(() => {
			expect(screen.getByText('Still open')).toBeInTheDocument();
		});
		await waitFor(
			() => {
				expect(screen.queryByText('Already done')).not.toBeInTheDocument();
			},
			{ timeout: 2000 },
		);

		await user.click(screen.getByRole('tab', { name: /completed, 1 tasks/i }));

		await waitFor(() => {
			expect(screen.getByText('Already done')).toBeInTheDocument();
		});
		await waitFor(
			() => {
				expect(screen.queryByText('Still open')).not.toBeInTheDocument();
			},
			{ timeout: 2000 },
		);
	});

	it('announces task count in live region when filter changes', async () => {
		const user = userEvent.setup();
		vi.stubGlobal(
			'fetch',
			vi.fn((input: RequestInfo, init?: RequestInit) => {
				const url = typeof input === 'string' ? input : input.url;
				if (url.includes('/api/todos') && (!init?.method || init.method === 'GET')) {
					return Promise.resolve(
						new Response(
							JSON.stringify([
								{
									id: 'a',
									description: 'One',
									isCompleted: false,
									createdAt: '2026-01-01T00:00:00.000Z',
									dueDate: null,
								},
								{
									id: 'b',
									description: 'Two',
									isCompleted: true,
									createdAt: '2026-01-02T00:00:00.000Z',
									dueDate: null,
								},
							]),
							{
								status: 200,
								headers: { 'Content-Type': 'application/json' },
							},
						),
					);
				}
				return Promise.reject(new Error(`Unexpected fetch: ${url}`));
			}),
		);

		const queryClient = createTestQueryClient();
		const { container } = render(
			<QueryClientProvider client={queryClient}>
				<App />
			</QueryClientProvider>,
		);

		await waitFor(() => {
			expect(screen.getByText('One')).toBeInTheDocument();
		});

		await user.click(screen.getByRole('tab', { name: /active, 1 tasks/i }));

		await waitFor(() => {
			const live = container.querySelector('[aria-live="polite"].sr-only');
			expect(live?.textContent).toBe('1 tasks shown');
		});
	});

	it('shows Reset sort when sort is non-default and restores default without changing filter', async () => {
		const user = userEvent.setup();
		vi.stubGlobal(
			'fetch',
			vi.fn((input: RequestInfo, init?: RequestInit) => {
				const url = typeof input === 'string' ? input : input.url;
				if (url.includes('/api/todos') && (!init?.method || init.method === 'GET')) {
					return Promise.resolve(
						new Response(
							JSON.stringify([
								{
									id: 'a',
									description: 'Still open',
									isCompleted: false,
									createdAt: '2026-01-01T00:00:00.000Z',
									dueDate: null,
								},
								{
									id: 'b',
									description: 'Already done',
									isCompleted: true,
									createdAt: '2026-01-02T00:00:00.000Z',
									dueDate: null,
								},
							]),
							{
								status: 200,
								headers: { 'Content-Type': 'application/json' },
							},
						),
					);
				}
				return Promise.reject(new Error(`Unexpected fetch: ${url}`));
			}),
		);

		const queryClient = createTestQueryClient();
		render(
			<QueryClientProvider client={queryClient}>
				<App />
			</QueryClientProvider>,
		);

		await waitFor(() => {
			expect(screen.getByText('Still open')).toBeInTheDocument();
		});
		expect(screen.queryByRole('button', { name: /reset sort/i })).not.toBeInTheDocument();

		await user.click(screen.getByRole('tab', { name: /active, 1 tasks/i }));

		await waitFor(() => {
			expect(screen.getByText('Still open')).toBeInTheDocument();
		});
		await waitFor(
			() => {
				expect(screen.queryByText('Already done')).not.toBeInTheDocument();
			},
			{ timeout: 2500 },
		);

		await user.click(screen.getByRole('button', { name: /sort by due date/i }));

		await waitFor(() => {
			expect(screen.getByRole('button', { name: /reset sort/i })).toBeInTheDocument();
		});

		await user.click(screen.getByRole('button', { name: /reset sort/i }));

		await waitFor(() => {
			expect(screen.queryByRole('button', { name: /reset sort/i })).not.toBeInTheDocument();
		});
		expect(screen.getByRole('button', { name: /soonest due first/i })).toHaveTextContent('Due ↑');
		expect(screen.getByText('Still open')).toBeInTheDocument();
		await waitFor(
			() => {
				expect(screen.queryByText('Already done')).not.toBeInTheDocument();
			},
			{ timeout: 2500 },
		);
	});
});

describe('App – Sort todos', () => {
	afterEach(() => {
		vi.unstubAllGlobals();
	});

	function descriptionsInListOrder() {
		const region = screen.getByRole('region', { name: /todo list/i });
		return [...region.querySelectorAll('.todo-card-text')].map(
			(el) => el.textContent?.trim() ?? '',
		);
	}

	it('orders by due date (soonest first, nulls last) when Due sort is active', async () => {
		const user = userEvent.setup();
		vi.stubGlobal(
			'fetch',
			vi.fn((input: RequestInfo, init?: RequestInit) => {
				const url = typeof input === 'string' ? input : input.url;
				if (url.includes('/api/todos') && (!init?.method || init.method === 'GET')) {
					return Promise.resolve(
						new Response(
							JSON.stringify([
								{
									id: 'late',
									description: 'Later',
									isCompleted: false,
									createdAt: '2026-01-03T00:00:00.000Z',
									dueDate: '2026-04-20',
								},
								{
									id: 'none',
									description: 'No due',
									isCompleted: false,
									createdAt: '2026-01-01T00:00:00.000Z',
									dueDate: null,
								},
								{
									id: 'soon',
									description: 'Sooner',
									isCompleted: false,
									createdAt: '2026-01-02T00:00:00.000Z',
									dueDate: '2026-04-05',
								},
							]),
							{ status: 200, headers: { 'Content-Type': 'application/json' } },
						),
					);
				}
				return Promise.reject(new Error(`Unexpected fetch: ${url}`));
			}),
		);

		const queryClient = createTestQueryClient();
		render(
			<QueryClientProvider client={queryClient}>
				<App />
			</QueryClientProvider>,
		);

		await waitFor(() => {
			expect(descriptionsInListOrder()).toEqual(['Sooner', 'Later', 'No due']);
		});
		expect(screen.getByRole('button', { name: /soonest due first/i })).toHaveTextContent('Due ↑');

		await user.click(screen.getByRole('button', { name: /sort by due date/i }));
		await waitFor(() => {
			expect(descriptionsInListOrder()).toEqual(['Later', 'Sooner', 'No due']);
		});
		expect(screen.getByRole('button', { name: /latest due first/i })).toHaveTextContent('Due ↓');
	});

	it('groups active first when Status sort is chosen on All filter', async () => {
		const user = userEvent.setup();
		vi.stubGlobal(
			'fetch',
			vi.fn((input: RequestInfo, init?: RequestInit) => {
				const url = typeof input === 'string' ? input : input.url;
				if (url.includes('/api/todos') && (!init?.method || init.method === 'GET')) {
					return Promise.resolve(
						new Response(
							JSON.stringify([
								{
									id: 'done',
									description: 'Done item',
									isCompleted: true,
									createdAt: '2026-01-01T00:00:00.000Z',
									dueDate: null,
								},
								{
									id: 'open',
									description: 'Open item',
									isCompleted: false,
									createdAt: '2026-01-02T00:00:00.000Z',
									dueDate: null,
								},
							]),
							{ status: 200, headers: { 'Content-Type': 'application/json' } },
						),
					);
				}
				return Promise.reject(new Error(`Unexpected fetch: ${url}`));
			}),
		);

		const queryClient = createTestQueryClient();
		render(
			<QueryClientProvider client={queryClient}>
				<App />
			</QueryClientProvider>,
		);

		await waitFor(() => {
			expect(screen.getByText('Open item')).toBeInTheDocument();
		});
		expect(descriptionsInListOrder()).toEqual(['Done item', 'Open item']);

		await user.click(screen.getByRole('button', { name: /sort by status.*active tasks first/i }));

		await waitFor(() => {
			expect(descriptionsInListOrder()).toEqual(['Open item', 'Done item']);
		});
		expect(
			screen.getByRole('button', { name: /sort by status.*active tasks first/i }),
		).toHaveTextContent('Status ↑');

		await user.click(screen.getByRole('button', { name: /sort by status/i }));
		await waitFor(() => {
			expect(descriptionsInListOrder()).toEqual(['Done item', 'Open item']);
		});
		expect(
			screen.getByRole('button', { name: /sort by status.*completed tasks first/i }),
		).toHaveTextContent('Status ↓');
	});

	it('resets to Due sort when filter is no longer All', async () => {
		const user = userEvent.setup();
		vi.stubGlobal(
			'fetch',
			vi.fn((input: RequestInfo, init?: RequestInit) => {
				const url = typeof input === 'string' ? input : input.url;
				if (url.includes('/api/todos') && (!init?.method || init.method === 'GET')) {
					return Promise.resolve(
						new Response(
							JSON.stringify([
								{
									id: 'a',
									description: 'A',
									isCompleted: false,
									createdAt: '2026-01-01T00:00:00.000Z',
									dueDate: null,
								},
								{
									id: 'b',
									description: 'B',
									isCompleted: true,
									createdAt: '2026-01-02T00:00:00.000Z',
									dueDate: null,
								},
							]),
							{ status: 200, headers: { 'Content-Type': 'application/json' } },
						),
					);
				}
				return Promise.reject(new Error(`Unexpected fetch: ${url}`));
			}),
		);

		const queryClient = createTestQueryClient();
		render(
			<QueryClientProvider client={queryClient}>
				<App />
			</QueryClientProvider>,
		);

		await waitFor(() => {
			expect(screen.getByText('A')).toBeInTheDocument();
		});

		await user.click(screen.getByRole('button', { name: /sort by status.*active tasks first/i }));
		await waitFor(() => {
			expect(
				screen.getByRole('button', { name: /sort by status.*active tasks first/i }),
			).toHaveAttribute('aria-pressed', 'true');
		});

		await user.click(screen.getByRole('tab', { name: /active, 1 tasks/i }));

		await waitFor(() => {
			expect(screen.getByRole('button', { name: /sort by due date/i })).toHaveAttribute(
				'aria-pressed',
				'true',
			);
		});
		expect(screen.queryByRole('button', { name: /sort by status/i })).not.toBeInTheDocument();
	});
});

describe('App – Keyboard and focus (Story 4.1)', () => {
	afterEach(() => {
		vi.unstubAllGlobals();
		vi.useRealTimers();
	});

	it('focuses add input when the last todo in the list is removed (delete commit)', async () => {
		vi.useFakeTimers({ shouldAdvanceTime: true });
		const user = userEvent.setup({ advanceTimers: vi.advanceTimersByTime });
		vi.stubGlobal(
			'fetch',
			vi.fn((input: RequestInfo, init?: RequestInit) => {
				const url = typeof input === 'string' ? input : input.url;
				if (url.includes('/api/todos') && (!init?.method || init.method === 'GET')) {
					return Promise.resolve(
						new Response(
							JSON.stringify([
								{
									id: 'only',
									description: 'Solo task',
									isCompleted: false,
									createdAt: '2026-01-01T00:00:00.000Z',
									dueDate: null,
								},
							]),
							{ status: 200, headers: { 'Content-Type': 'application/json' } },
						),
					);
				}
				if (url.includes('/api/todos/') && init?.method === 'DELETE') {
					return Promise.resolve(new Response(null, { status: 204 }));
				}
				return Promise.reject(new Error(`Unexpected fetch: ${url}`));
			}),
		);

		const queryClient = createTestQueryClient();
		render(
			<QueryClientProvider client={queryClient}>
				<App />
			</QueryClientProvider>,
		);

		await waitFor(() => {
			expect(screen.getByText('Solo task')).toBeInTheDocument();
		});

		await user.click(screen.getByRole('button', { name: /delete: solo task/i }));

		await act(async () => {
			vi.advanceTimersByTime(300);
		});

		const input = screen.getByPlaceholderText(/add a new task/i);
		await waitFor(() => expect(input).toHaveFocus(), { timeout: 3000 });
	});

	it('Tab from focused Due sort moves to Reset sort when Reset is visible', async () => {
		const user = userEvent.setup();
		vi.stubGlobal(
			'fetch',
			vi.fn((input: RequestInfo, init?: RequestInit) => {
				const url = typeof input === 'string' ? input : input.url;
				if (url.includes('/api/todos') && (!init?.method || init.method === 'GET')) {
					return Promise.resolve(
						new Response(
							JSON.stringify([
								{
									id: 'a',
									description: 'Still open',
									isCompleted: false,
									createdAt: '2026-01-01T00:00:00.000Z',
									dueDate: null,
								},
							]),
							{ status: 200, headers: { 'Content-Type': 'application/json' } },
						),
					);
				}
				return Promise.reject(new Error(`Unexpected fetch: ${url}`));
			}),
		);

		const queryClient = createTestQueryClient();
		render(
			<QueryClientProvider client={queryClient}>
				<App />
			</QueryClientProvider>,
		);

		await waitFor(() => {
			expect(screen.getByText('Still open')).toBeInTheDocument();
		});

		await user.click(screen.getByRole('button', { name: /sort by due date/i }));
		const reset = screen.getByRole('button', { name: /reset sort/i });
		expect(reset).toBeInTheDocument();

		const dueBtn = screen.getByRole('button', { name: /sort by due date/i });
		dueBtn.focus();
		await user.keyboard('{Tab}');
		await waitFor(() => expect(reset).toHaveFocus());
	});
});
