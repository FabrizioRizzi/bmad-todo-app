import { render, screen } from '@testing-library/react';
import { describe, expect, it } from 'vitest';
import { App } from './app';

describe('App shell', () => {
	it('renders the app title in the header', () => {
		render(<App />);
		expect(screen.getByRole('heading', { level: 1 })).toHaveTextContent('bmad-todo-app');
	});

	it('renders count badge placeholder', () => {
		render(<App />);
		expect(screen.getByRole('status', { name: /todo count/i })).toHaveTextContent('0');
	});

	it('renders input and list placeholder regions', () => {
		render(<App />);
		expect(screen.getByRole('region', { name: /add new todo/i })).toBeInTheDocument();
		expect(screen.getByRole('region', { name: /todo list/i })).toBeInTheDocument();
	});

	it('renders shadcn input and button stubs', () => {
		render(<App />);
		expect(screen.getByPlaceholderText(/new task/i)).toBeInTheDocument();
		expect(screen.getByRole('button', { name: /add/i })).toBeInTheDocument();
	});
});
