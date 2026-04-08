import { resolve } from 'node:path';
import { fileURLToPath } from 'node:url';
import tailwindcss from '@tailwindcss/vite';
import react from '@vitejs/plugin-react';
import { loadEnv } from 'vite';
import { defineConfig } from 'vitest/config';

const __dirname = fileURLToPath(new URL('.', import.meta.url));

export default defineConfig(({ mode }) => {
	const env = loadEnv(mode, __dirname, 'DEV_');
	const apiProxyTarget = env.DEV_API_TARGET ?? 'http://localhost:3000';

	return {
		plugins: [react(), tailwindcss()],
		server: {
			proxy: {
				'/api': {
					target: apiProxyTarget,
					changeOrigin: true,
				},
			},
		},
		resolve: {
			alias: {
				'@': resolve(__dirname, './src'),
			},
		},
		test: {
			environment: 'jsdom',
			setupFiles: ['./src/test-setup.ts'],
			globals: true,
		},
	};
});
