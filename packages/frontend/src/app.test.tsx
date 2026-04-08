import { screen, waitFor } from '@testing-library/react';
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import { App } from './app';
import { renderWithQueryClient } from './test-utils';

function mockTodosFetch(body: unknown) {
	vi.stubGlobal(
		'fetch',
		vi.fn(() =>
			Promise.resolve(
				new Response(JSON.stringify(body), {
					status: 200,
					headers: { 'Content-Type': 'application/json' },
				}),
			),
		),
	);
}

describe('App', () => {
	afterEach(() => {
		vi.unstubAllGlobals();
	});

	beforeEach(() => {
		mockTodosFetch([]);
	});

	it('renders the app title in the header', () => {
		renderWithQueryClient(<App />);
		expect(screen.getByRole('heading', { level: 1 })).toHaveTextContent('My Tasks');
	});

	it('shows todo count from loaded list', async () => {
		mockTodosFetch([
			{
				id: 'a',
				description: 'One',
				isCompleted: false,
				createdAt: '2026-01-01T00:00:00.000Z',
				dueDate: null,
			},
		]);
		renderWithQueryClient(<App />);
		await waitFor(() => {
			expect(screen.getByRole('status', { name: /todo count/i })).toHaveTextContent('1 remaining');
		});
	});

	it('renders add form and todo list regions', async () => {
		renderWithQueryClient(<App />);
		expect(screen.getByRole('region', { name: /add new todo/i })).toBeInTheDocument();
		expect(screen.getByRole('region', { name: /todo list/i })).toBeInTheDocument();
		await waitFor(() => {
			expect(screen.getByRole('status', { name: /no tasks yet/i })).toBeInTheDocument();
		});
	});

	it('renders add field and submit control', () => {
		renderWithQueryClient(<App />);
		expect(screen.getByPlaceholderText(/add a new task/i)).toBeInTheDocument();
		expect(screen.getByRole('button', { name: /add task/i })).toBeInTheDocument();
	});
});
