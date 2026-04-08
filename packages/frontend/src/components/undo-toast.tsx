import { useEffect, useRef, useState } from 'react';

export type UndoToastState = {
	todoId: string;
	message: string;
} | null;

type UndoToastProps = {
	state: UndoToastState;
	onUndo: () => void;
	onDismiss: () => void;
};

export function UndoToast({ state, onUndo, onDismiss }: UndoToastProps) {
	const [exiting, setExiting] = useState(false);
	const timerRef = useRef<ReturnType<typeof setTimeout> | null>(null);
	const exitTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null);
	const prevTodoIdRef = useRef<string | null>(null);

	useEffect(() => {
		if (!state) {
			return;
		}

		setExiting(false);
		prevTodoIdRef.current = state.todoId;

		if (timerRef.current) clearTimeout(timerRef.current);
		if (exitTimerRef.current) clearTimeout(exitTimerRef.current);

		timerRef.current = setTimeout(() => {
			setExiting(true);
			exitTimerRef.current = setTimeout(() => {
				onDismiss();
			}, 200);
		}, 5000);

		return () => {
			if (timerRef.current) clearTimeout(timerRef.current);
			if (exitTimerRef.current) clearTimeout(exitTimerRef.current);
		};
	}, [state, state?.todoId, onDismiss]);

	if (!state) return null;

	const handleUndo = () => {
		if (timerRef.current) clearTimeout(timerRef.current);
		if (exitTimerRef.current) clearTimeout(exitTimerRef.current);
		onUndo();
	};

	return (
		<div
			role="status"
			aria-live="polite"
			className="fixed bottom-[var(--space-6)] left-1/2 z-50 -translate-x-1/2"
		>
			<div
				data-testid="undo-toast"
				className={`flex items-center gap-[var(--space-3)] rounded-[12px] bg-[color:var(--toast-bg)] px-[var(--space-4)] py-[var(--space-3)] shadow-[var(--shadow-elevated)] ${
					exiting ? 'undo-toast-exit' : 'undo-toast-enter'
				}`}
			>
				<span className="text-[color:var(--toast-text)] text-[length:var(--text-sm)] leading-[var(--text-sm-leading)]">
					{state.message}
				</span>
				<button
					type="button"
					onClick={handleUndo}
					className="cursor-pointer border-none bg-transparent text-[color:var(--accent)] text-[length:var(--text-sm)] font-[500] leading-[var(--text-sm-leading)] underline decoration-[color:var(--accent)] underline-offset-2 hover:text-[color:var(--accent-hover)]"
				>
					Undo
				</button>
			</div>
		</div>
	);
}
