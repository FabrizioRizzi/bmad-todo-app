import { screen, waitFor } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import { renderWithQueryClient } from '@/test-utils';
import { AddInput } from './add-input';

describe('AddInput', () => {
	const createdTodo = {
		id: 'new-1',
		description: 'Buy groceries',
		isCompleted: false,
		createdAt: '2026-04-08T12:00:00.000Z',
		dueDate: null,
	};

	afterEach(() => {
		vi.useRealTimers();
		vi.unstubAllGlobals();
	});

	beforeEach(() => {
		vi.stubGlobal(
			'fetch',
			vi.fn((input: RequestInfo, init?: RequestInit) => {
				const url = typeof input === 'string' ? input : input.url;
				if (url.includes('/api/todos') && init?.method === 'POST') {
					return Promise.resolve(
						new Response(JSON.stringify(createdTodo), {
							status: 201,
							headers: { 'Content-Type': 'application/json' },
						}),
					);
				}
				return Promise.reject(new Error(`Unexpected fetch: ${url} ${init?.method}`));
			}),
		);
	});

	it('submits trimmed description on Enter and clears the field', async () => {
		const user = userEvent.setup();
		const onCreated = vi.fn();
		renderWithQueryClient(<AddInput onCreated={onCreated} />);

		const input = screen.getByPlaceholderText(/add a new task/i);
		await user.type(input, 'Buy groceries{enter}');

		await waitFor(() => {
			expect(onCreated).toHaveBeenCalledWith(createdTodo);
		});
		expect(input).toHaveValue('');
	});

	it('submits via the add button like Enter', async () => {
		const user = userEvent.setup();
		const onCreated = vi.fn();
		renderWithQueryClient(<AddInput onCreated={onCreated} />);

		const input = screen.getByPlaceholderText(/add a new task/i);
		await user.type(input, 'Buy groceries');
		await user.click(screen.getByRole('button', { name: /add task/i }));

		await waitFor(() => {
			expect(onCreated).toHaveBeenCalledWith(createdTodo);
		});
	});

	it('does not call fetch when description is empty or whitespace only', async () => {
		const user = userEvent.setup();
		const fetchMock = vi.mocked(fetch);
		renderWithQueryClient(<AddInput />);

		const input = screen.getByPlaceholderText(/add a new task/i);
		await user.type(input, '{enter}');
		await user.type(input, '   {enter}');
		await user.click(screen.getByRole('button', { name: /add task/i }));

		expect(fetchMock).not.toHaveBeenCalled();
	});

	it('opens date picker when calendar control is activated', async () => {
		const user = userEvent.setup();
		renderWithQueryClient(<AddInput />);

		const dueBtn = screen.getByRole('button', { name: /set due date/i });
		await user.click(dueBtn);

		expect(screen.getByRole('grid')).toBeInTheDocument();
	});

	it('updates calendar control label after selecting a date and submits dueDate on create', async () => {
		const user = userEvent.setup();

		const bodies: unknown[] = [];
		vi.stubGlobal(
			'fetch',
			vi.fn((input: RequestInfo, init?: RequestInit) => {
				const url = typeof input === 'string' ? input : input.url;
				if (url.includes('/api/todos') && init?.method === 'POST') {
					const parsed = JSON.parse(init?.body as string) as {
						description: string;
						dueDate?: string | null;
					};
					bodies.push(parsed);
					return Promise.resolve(
						new Response(
							JSON.stringify({
								...createdTodo,
								dueDate: parsed.dueDate ?? null,
							}),
							{
								status: 201,
								headers: { 'Content-Type': 'application/json' },
							},
						),
					);
				}
				return Promise.reject(new Error(`Unexpected fetch: ${url} ${init?.method}`));
			}),
		);

		renderWithQueryClient(<AddInput />);

		await user.click(screen.getByRole('button', { name: /set due date/i }));
		const grid = screen.getByRole('grid');
		const now = new Date();
		const iso15 = `${now.getFullYear()}-${String(now.getMonth() + 1).padStart(2, '0')}-15`;
		const day15Btn = grid.querySelector(`[data-day="${iso15}"] button`);
		if (!(day15Btn instanceof HTMLElement)) {
			throw new Error('expected day 15 button in calendar grid');
		}
		await user.click(day15Btn);

		expect(screen.getByRole('button', { name: /change due date/i })).toHaveTextContent(
			/\d|Jan|Feb|Mar|Apr|May|Jun|Jul|Aug|Sep|Oct|Nov|Dec|Today|Tomorrow/i,
		);

		const input = screen.getByPlaceholderText(/add a new task/i);
		await user.type(input, 'File taxes{enter}');

		await waitFor(() => {
			expect(bodies).toHaveLength(1);
		});
		const posted = bodies[0] as { description: string; dueDate: string };
		expect(posted.description).toBe('File taxes');
		expect(posted.dueDate).toBe(iso15);
	});

	it('resets description and due date after successful create', async () => {
		const user = userEvent.setup();

		vi.stubGlobal(
			'fetch',
			vi.fn((input: RequestInfo, init?: RequestInit) => {
				const url = typeof input === 'string' ? input : input.url;
				if (url.includes('/api/todos') && init?.method === 'POST') {
					const parsed = JSON.parse(init?.body as string) as { dueDate?: string | null };
					return Promise.resolve(
						new Response(
							JSON.stringify({
								...createdTodo,
								dueDate: parsed.dueDate ?? null,
							}),
							{
								status: 201,
								headers: { 'Content-Type': 'application/json' },
							},
						),
					);
				}
				return Promise.reject(new Error(`Unexpected fetch: ${url} ${init?.method}`));
			}),
		);

		renderWithQueryClient(<AddInput />);

		await user.click(screen.getByRole('button', { name: /set due date/i }));
		const grid = screen.getByRole('grid');
		const now = new Date();
		const iso10 = `${now.getFullYear()}-${String(now.getMonth() + 1).padStart(2, '0')}-10`;
		const day10Btn = grid.querySelector(`[data-day="${iso10}"] button`);
		if (!(day10Btn instanceof HTMLElement)) {
			throw new Error('expected day 10 button in calendar grid');
		}
		await user.click(day10Btn);

		const input = screen.getByPlaceholderText(/add a new task/i);
		await user.type(input, 'Task with date{enter}');

		await waitFor(() => {
			expect(input).toHaveValue('');
		});

		const dueBtn = screen.getByRole('button', { name: /set due date/i });
		expect(dueBtn.querySelector('svg')).toBeTruthy();
	});

	it('disables input and button while create is pending', async () => {
		const user = userEvent.setup();
		let resolvePost!: (value: Response) => void;
		const postPromise = new Promise<Response>((resolve) => {
			resolvePost = resolve;
		});

		vi.stubGlobal(
			'fetch',
			vi.fn(() => postPromise),
		);

		renderWithQueryClient(<AddInput />);

		const input = screen.getByPlaceholderText(/add a new task/i);
		const button = screen.getByRole('button', { name: /add task/i });
		await user.type(input, 'Task{enter}');

		expect(input).toBeDisabled();
		expect(button).toBeDisabled();

		resolvePost(
			new Response(JSON.stringify(createdTodo), {
				status: 201,
				headers: { 'Content-Type': 'application/json' },
			}),
		);

		await waitFor(() => {
			expect(input).not.toBeDisabled();
		});
	});
});
