import { useEffect, useState } from 'react';

const QUERY = '(prefers-reduced-motion: reduce)';

function getMatches(): boolean {
	if (typeof window === 'undefined') return false;
	return window.matchMedia?.(QUERY).matches ?? false;
}

export function useReducedMotion(): boolean {
	const [matches, setMatches] = useState(getMatches);

	useEffect(() => {
		const mql = window.matchMedia?.(QUERY);
		if (!mql) return;
		const handler = (e: MediaQueryListEvent) => setMatches(e.matches);
		if (typeof mql.addEventListener === 'function') {
			mql.addEventListener('change', handler);
			return () => mql.removeEventListener('change', handler);
		}
		if (typeof mql.addListener === 'function') {
			mql.addListener(handler);
			return () => mql.removeListener(handler);
		}
	}, []);

	return matches;
}
