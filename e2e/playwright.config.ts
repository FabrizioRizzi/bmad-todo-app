import path from 'node:path';

import { defineConfig, devices } from '@playwright/test';

const isSandboxedBrowserPath =
	process.env.PLAYWRIGHT_BROWSERS_PATH?.includes('cursor-sandbox-cache') ?? false;

const chromiumUse = isSandboxedBrowserPath
	? { ...devices['Desktop Chrome'], channel: 'chrome' as const }
	: { ...devices['Desktop Chrome'] };

export default defineConfig({
	testDir: '.',
	globalTeardown: path.resolve(__dirname, './global-teardown.ts'),
	webServer: [
		{
			command: 'pnpm --filter backend dev',
			cwd: '..',
			url: 'http://localhost:3000/api/todos',
			reuseExistingServer: !process.env.CI,
		},
		{
			command: 'pnpm --filter frontend dev',
			cwd: '..',
			url: 'http://localhost:5173',
			reuseExistingServer: !process.env.CI,
		},
	],
	fullyParallel: true,
	forbidOnly: !!process.env.CI,
	retries: process.env.CI ? 2 : 0,
	workers: process.env.CI ? 1 : undefined,
	reporter: 'html',
	use: {
		baseURL: 'http://localhost:5173',
		trace: 'on-first-retry',
	},
	projects: [
		{
			name: 'chromium',
			use: chromiumUse,
		},
	],
});
