import { useEffect, useRef, useState } from 'react';

type ErrorBannerProps = {
	message: string;
	onDismiss: () => void;
};

export const AUTO_DISMISS_MS = 8000;
export const EXIT_ANIMATION_MS = 200;

export function ErrorBanner({ message, onDismiss }: ErrorBannerProps) {
	const [exiting, setExiting] = useState(false);
	const dismissTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null);
	const exitTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null);
	const onDismissRef = useRef(onDismiss);
	onDismissRef.current = onDismiss;

	// biome-ignore lint/correctness/useExhaustiveDependencies: message triggers timer reset on error replacement (AC #5)
	useEffect(() => {
		setExiting(false);

		if (dismissTimerRef.current) clearTimeout(dismissTimerRef.current);
		if (exitTimerRef.current) clearTimeout(exitTimerRef.current);

		dismissTimerRef.current = setTimeout(() => {
			setExiting(true);
			exitTimerRef.current = setTimeout(() => {
				if (onDismissRef.current) onDismissRef.current();
			}, EXIT_ANIMATION_MS);
		}, AUTO_DISMISS_MS);

		return () => {
			if (dismissTimerRef.current) clearTimeout(dismissTimerRef.current);
			if (exitTimerRef.current) clearTimeout(exitTimerRef.current);
		};
	}, [message]);

	return (
		<div
			role="alert"
			aria-live="assertive"
			data-testid="error-banner"
			className={`flex items-center gap-[var(--space-3)] rounded-[0.625rem] bg-[color:var(--error-bg)] px-[var(--space-4)] py-[var(--space-3)] text-[color:var(--error)] ${
				exiting ? 'error-banner-exit' : 'error-banner-enter'
			}`}
		>
			<span aria-hidden="true" className="shrink-0 text-[length:var(--text-lg)]">
				⚠
			</span>
			<p className="m-0 text-[length:var(--text-sm)] leading-[var(--text-sm-leading)]">{message}</p>
		</div>
	);
}
