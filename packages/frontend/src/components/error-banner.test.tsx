import { act, render, screen } from '@testing-library/react';
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import { ErrorBanner } from './error-banner';

describe('ErrorBanner', () => {
	beforeEach(() => {
		vi.useFakeTimers();
	});

	afterEach(() => {
		vi.useRealTimers();
	});

	it('renders with the provided message', () => {
		render(
			<ErrorBanner
				message="Couldn't add that task — check your connection and try again."
				onDismiss={vi.fn()}
			/>,
		);
		expect(
			screen.getByText("Couldn't add that task — check your connection and try again."),
		).toBeInTheDocument();
	});

	it('renders warning icon', () => {
		render(<ErrorBanner message="Test error" onDismiss={vi.fn()} />);
		const icon = screen.getByText('⚠');
		expect(icon).toBeInTheDocument();
		expect(icon).toHaveAttribute('aria-hidden', 'true');
	});

	it('has role="alert" for screen reader announcement', () => {
		render(<ErrorBanner message="Test error" onDismiss={vi.fn()} />);
		expect(screen.getByRole('alert')).toBeInTheDocument();
	});

	it('has aria-live="assertive" for immediate announcement', () => {
		render(<ErrorBanner message="Test error" onDismiss={vi.fn()} />);
		const alert = screen.getByRole('alert');
		expect(alert).toHaveAttribute('aria-live', 'assertive');
	});

	it('auto-dismisses after 8 seconds', () => {
		const onDismiss = vi.fn();
		render(<ErrorBanner message="Test error" onDismiss={onDismiss} />);

		act(() => {
			vi.advanceTimersByTime(7999);
		});
		expect(onDismiss).not.toHaveBeenCalled();

		act(() => {
			vi.advanceTimersByTime(201);
		});
		expect(onDismiss).toHaveBeenCalledOnce();
	});

	it('calls onDismiss callback when dismissed', () => {
		const onDismiss = vi.fn();
		render(<ErrorBanner message="Test error" onDismiss={onDismiss} />);

		act(() => {
			vi.advanceTimersByTime(8200);
		});
		expect(onDismiss).toHaveBeenCalledOnce();
	});

	it('applies error-banner-enter class on initial render', () => {
		render(<ErrorBanner message="Test error" onDismiss={vi.fn()} />);
		const banner = screen.getByTestId('error-banner');
		expect(banner.className).toContain('error-banner-enter');
	});

	it('applies error-banner-exit class when auto-dismiss timer fires', () => {
		render(<ErrorBanner message="Test error" onDismiss={vi.fn()} />);

		act(() => {
			vi.advanceTimersByTime(8000);
		});

		const banner = screen.getByTestId('error-banner');
		expect(banner.className).toContain('error-banner-exit');
	});

	it('resets timer when message changes', () => {
		const onDismiss = vi.fn();
		const { rerender } = render(<ErrorBanner message="Error 1" onDismiss={onDismiss} />);

		act(() => {
			vi.advanceTimersByTime(5000);
		});

		rerender(<ErrorBanner message="Error 2" onDismiss={onDismiss} />);

		act(() => {
			vi.advanceTimersByTime(5000);
		});
		expect(onDismiss).not.toHaveBeenCalled();

		act(() => {
			vi.advanceTimersByTime(3200);
		});
		expect(onDismiss).toHaveBeenCalledOnce();
	});

	it('cleans up timers on unmount', () => {
		const onDismiss = vi.fn();
		const { unmount } = render(<ErrorBanner message="Test error" onDismiss={onDismiss} />);

		unmount();

		act(() => {
			vi.advanceTimersByTime(10000);
		});
		expect(onDismiss).not.toHaveBeenCalled();
	});

	it('renders correct create error message', () => {
		render(
			<ErrorBanner
				message="Couldn't add that task — check your connection and try again."
				onDismiss={vi.fn()}
			/>,
		);
		expect(
			screen.getByText("Couldn't add that task — check your connection and try again."),
		).toBeInTheDocument();
	});

	it('renders correct toggle error message', () => {
		render(<ErrorBanner message="Couldn't update that task — try again." onDismiss={vi.fn()} />);
		expect(screen.getByText("Couldn't update that task — try again.")).toBeInTheDocument();
	});

	it('renders correct delete error message', () => {
		render(<ErrorBanner message="Couldn't delete that task — try again." onDismiss={vi.fn()} />);
		expect(screen.getByText("Couldn't delete that task — try again.")).toBeInTheDocument();
	});
});
