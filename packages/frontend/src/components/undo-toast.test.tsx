import { act, fireEvent, render, screen } from '@testing-library/react';
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import { UndoToast, type UndoToastState } from './undo-toast';

describe('UndoToast', () => {
	beforeEach(() => {
		vi.useFakeTimers();
	});

	afterEach(() => {
		vi.useRealTimers();
	});

	it('renders nothing when state is null', () => {
		const { container } = render(<UndoToast state={null} onUndo={vi.fn()} onDismiss={vi.fn()} />);
		expect(container.innerHTML).toBe('');
	});

	it('renders toast with message when state is provided', () => {
		const state: UndoToastState = { todoId: '1', message: 'Task deleted' };
		render(<UndoToast state={state} onUndo={vi.fn()} onDismiss={vi.fn()} />);

		expect(screen.getByText('Task deleted')).toBeInTheDocument();
		expect(screen.getByRole('button', { name: 'Undo' })).toBeInTheDocument();
	});

	it('calls onUndo when Undo button is clicked', () => {
		const onUndo = vi.fn();
		const state: UndoToastState = { todoId: '1', message: 'Task deleted' };

		render(<UndoToast state={state} onUndo={onUndo} onDismiss={vi.fn()} />);

		fireEvent.click(screen.getByRole('button', { name: 'Undo' }));
		expect(onUndo).toHaveBeenCalledOnce();
	});

	it('auto-dismisses after 5 seconds plus exit animation', () => {
		const onDismiss = vi.fn();
		const state: UndoToastState = { todoId: '1', message: 'Task deleted' };

		render(<UndoToast state={state} onUndo={vi.fn()} onDismiss={onDismiss} />);

		act(() => {
			vi.advanceTimersByTime(5000);
		});

		act(() => {
			vi.advanceTimersByTime(200);
		});

		expect(onDismiss).toHaveBeenCalledOnce();
	});

	it('does not auto-dismiss before 5 seconds', () => {
		const onDismiss = vi.fn();
		const state: UndoToastState = { todoId: '1', message: 'Task deleted' };

		render(<UndoToast state={state} onUndo={vi.fn()} onDismiss={onDismiss} />);

		act(() => {
			vi.advanceTimersByTime(4900);
		});

		expect(onDismiss).not.toHaveBeenCalled();
	});

	it('has undo-toast-enter class when visible', () => {
		const state: UndoToastState = { todoId: '1', message: 'Task deleted' };
		render(<UndoToast state={state} onUndo={vi.fn()} onDismiss={vi.fn()} />);

		const toast = screen.getByTestId('undo-toast');
		expect(toast.className).toContain('undo-toast-enter');
		expect(toast.className).not.toContain('undo-toast-exit');
	});

	it('applies undo-toast-exit class when timer expires', () => {
		const state: UndoToastState = { todoId: '1', message: 'Task deleted' };
		render(<UndoToast state={state} onUndo={vi.fn()} onDismiss={vi.fn()} />);

		act(() => {
			vi.advanceTimersByTime(5000);
		});

		const toast = screen.getByTestId('undo-toast');
		expect(toast.className).toContain('undo-toast-exit');
	});

	it('cancels timer when Undo is clicked', () => {
		const onDismiss = vi.fn();
		const onUndo = vi.fn();
		const state: UndoToastState = { todoId: '1', message: 'Task deleted' };

		render(<UndoToast state={state} onUndo={onUndo} onDismiss={onDismiss} />);

		fireEvent.click(screen.getByRole('button', { name: 'Undo' }));

		act(() => {
			vi.advanceTimersByTime(10000);
		});

		expect(onDismiss).not.toHaveBeenCalled();
	});

	it('has proper accessibility attributes', () => {
		const state: UndoToastState = { todoId: '1', message: 'Task deleted' };
		render(<UndoToast state={state} onUndo={vi.fn()} onDismiss={vi.fn()} />);

		const statusEl = screen.getByRole('status');
		expect(statusEl).toHaveAttribute('aria-live', 'polite');
	});
});
