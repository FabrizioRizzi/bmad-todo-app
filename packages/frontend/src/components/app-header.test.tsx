import { render, screen } from '@testing-library/react';
import { describe, expect, it } from 'vitest';
import { AppHeader } from './app-header';

describe('AppHeader', () => {
	it('shows title and count placeholder', () => {
		render(<AppHeader />);
		expect(screen.getByRole('heading', { level: 1 })).toHaveTextContent('bmad-todo-app');
		expect(screen.getByRole('status', { name: /todo count/i })).toHaveTextContent('0');
	});
});
