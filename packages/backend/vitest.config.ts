import { defineConfig } from 'vitest/config';

export default defineConfig({
	test: {
		environment: 'node',
		globals: true,
		exclude: ['dist/**', 'node_modules/**'],
		env: {
			DATABASE_URL: 'postgresql://postgres:postgres@localhost:5432/bmad_todo',
			NODE_ENV: 'test',
		},
		coverage: {
			provider: 'v8',
			reporter: ['text', 'text-summary', 'json-summary'],
			include: ['src/**/*.ts'],
			exclude: [
				'src/**/*.test.ts',
				'src/server.ts',
				'src/scripts/**',
			],
		},
	},
});
