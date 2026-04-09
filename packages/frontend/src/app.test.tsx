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
});
