import { defineConfig } from 'vitest/config';

const databaseUrl =
	process.env.DATABASE_URL_TEST?.trim() ||
	process.env.DATABASE_URL?.trim() ||
	'postgresql://postgres:postgres@localhost:5433/bmad_todo_test';

export default defineConfig({
	test: {
		environment: 'node',
		globals: true,
		exclude: ['dist/**', 'node_modules/**'],
		globalSetup: ['./src/test/setup-db.ts'],
		env: {
			DATABASE_URL: databaseUrl,
			DATABASE_URL_TEST: databaseUrl,
			NODE_ENV: 'test',
		},
		coverage: {
			provider: 'v8',
			reporter: ['text', 'text-summary', 'json-summary'],
			include: ['src/**/*.ts'],
			exclude: ['src/**/*.test.ts', 'src/server.ts', 'src/scripts/**'],
		},
	},
});
