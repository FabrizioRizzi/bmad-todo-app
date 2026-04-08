import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { type RenderOptions, type RenderResult, render } from '@testing-library/react';
import type { ReactElement, ReactNode } from 'react';

export function createTestQueryClient() {
	return new QueryClient({
		defaultOptions: {
			queries: { retry: false },
			mutations: { retry: false },
		},
	});
}

function createWrapper(client: QueryClient) {
	return function Wrapper({ children }: { children: ReactNode }) {
		return <QueryClientProvider client={client}>{children}</QueryClientProvider>;
	};
}

export function renderWithQueryClient(
	ui: ReactElement,
	options?: Omit<RenderOptions, 'wrapper'> & { client?: QueryClient },
): RenderResult & { queryClient: QueryClient } {
	const { client: clientOption, ...renderOptions } = options ?? {};
	const client = clientOption ?? createTestQueryClient();
	return {
		...render(ui, { ...renderOptions, wrapper: createWrapper(client) }),
		queryClient: client,
	};
}
