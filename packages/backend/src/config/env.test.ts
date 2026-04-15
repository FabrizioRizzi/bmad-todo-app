import { afterEach, describe, expect, it, vi } from 'vitest';

const ORIGINAL_ENV = { ...process.env };
const DATABASE_URL = 'postgresql://postgres:postgres@localhost:5433/bmad_todo_test';

async function loadEnv(overrides: Record<string, string | undefined> = {}) {
	vi.resetModules();
	process.env = { ...ORIGINAL_ENV, DATABASE_URL };
	for (const [key, value] of Object.entries(overrides)) {
		if (value === undefined) {
			delete process.env[key];
			continue;
		}
		process.env[key] = value;
	}

	return import('./env.js');
}

afterEach(() => {
	process.env = { ...ORIGINAL_ENV };
	vi.resetModules();
});

describe('env config', () => {
	it('requires ALLOWED_ORIGINS in production', async () => {
		await expect(
			loadEnv({
				NODE_ENV: 'production',
				ALLOWED_ORIGINS: undefined,
			}),
		).rejects.toThrow(/ALLOWED_ORIGINS is required/);
	});

	it('defaults documentation to disabled in production', async () => {
		const { env } = await loadEnv({
			NODE_ENV: 'production',
			ALLOWED_ORIGINS: 'https://example.com',
			ENABLE_DOCUMENTATION: undefined,
		});

		expect(env.enableDocumentation).toBe(false);
		expect(env.allowedOriginsList).toEqual(['https://example.com']);
	});

	it('parses documentation flag and origin allowlist', async () => {
		const { env } = await loadEnv({
			NODE_ENV: 'production',
			ALLOWED_ORIGINS: 'https://example.com, https://admin.example.com',
			ENABLE_DOCUMENTATION: 'true',
		});

		expect(env.enableDocumentation).toBe(true);
		expect(env.allowedOriginsList).toEqual(['https://example.com', 'https://admin.example.com']);
	});

	it('rejects invalid documentation flag values', async () => {
		await expect(
			loadEnv({
				NODE_ENV: 'test',
				ENABLE_DOCUMENTATION: 'sometimes',
			}),
		).rejects.toThrow(/ENABLE_DOCUMENTATION must be set to true or false/);
	});
});
