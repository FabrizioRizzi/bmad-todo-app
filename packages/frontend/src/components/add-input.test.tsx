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
