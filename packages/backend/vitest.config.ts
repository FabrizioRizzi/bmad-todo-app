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
	},
});
