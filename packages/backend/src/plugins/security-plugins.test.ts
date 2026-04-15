import { afterEach, describe, expect, it, vi } from 'vitest';

const ORIGINAL_ENV = { ...process.env };
const DATABASE_URL = 'postgresql://postgres:postgres@localhost:5433/bmad_todo_test';

async function buildTestApp(envOverrides: Record<string, string | undefined> = {}) {
	vi.resetModules();
	process.env = { ...ORIGINAL_ENV, DATABASE_URL };
	for (const [key, value] of Object.entries(envOverrides)) {
		if (value === undefined) {
			delete process.env[key];
			continue;
		}
		process.env[key] = value;
	}

	const { buildApp } = await import('../app.js');
	return buildApp({ logger: false });
}

afterEach(() => {
	process.env = { ...ORIGINAL_ENV };
	vi.resetModules();
});

describe('security-oriented plugin behavior', () => {
	it('disables Swagger UI by default in production', async () => {
		const app = await buildTestApp({
			NODE_ENV: 'production',
			ALLOWED_ORIGINS: 'https://example.com',
			ENABLE_DOCUMENTATION: undefined,
		});
		await app.ready();

		const response = await app.inject({
			method: 'GET',
			url: '/documentation/',
		});

		expect(response.statusCode).toBe(404);

		await app.close();
	});

	it('can re-enable Swagger UI explicitly in production', async () => {
		const app = await buildTestApp({
			NODE_ENV: 'production',
			ALLOWED_ORIGINS: 'https://example.com',
			ENABLE_DOCUMENTATION: 'true',
		});
		await app.ready();

		const response = await app.inject({
			method: 'GET',
			url: '/documentation/',
		});

		expect(response.statusCode).toBe(200);

		await app.close();
	});

	it('omits CORS headers for missing origins in production', async () => {
		const app = await buildTestApp({
			NODE_ENV: 'production',
			ALLOWED_ORIGINS: 'https://example.com',
			ENABLE_DOCUMENTATION: 'false',
		});
		await app.ready();

		const response = await app.inject({
			method: 'OPTIONS',
			url: '/nonexistent-route',
			headers: {
				'access-control-request-method': 'GET',
			},
		});

		expect(response.headers['access-control-allow-origin']).toBeUndefined();

		await app.close();
	});

	it('only allows configured origins in production', async () => {
		const app = await buildTestApp({
			NODE_ENV: 'production',
			ALLOWED_ORIGINS: 'https://allowed.example.com',
			ENABLE_DOCUMENTATION: 'false',
		});
		await app.ready();

		const allowed = await app.inject({
			method: 'OPTIONS',
			url: '/nonexistent-route',
			headers: {
				origin: 'https://allowed.example.com',
				'access-control-request-method': 'GET',
			},
		});
		const blocked = await app.inject({
			method: 'OPTIONS',
			url: '/nonexistent-route',
			headers: {
				origin: 'https://blocked.example.com',
				'access-control-request-method': 'GET',
			},
		});

		expect(allowed.headers['access-control-allow-origin']).toBe('https://allowed.example.com');
		expect(blocked.headers['access-control-allow-origin']).toBeUndefined();

		await app.close();
	});

	it('enables CSP headers when documentation UI is disabled', async () => {
		const app = await buildTestApp({
			NODE_ENV: 'production',
			ALLOWED_ORIGINS: 'https://example.com',
			ENABLE_DOCUMENTATION: 'false',
		});
		await app.ready();

		const response = await app.inject({
			method: 'GET',
			url: '/nonexistent-route',
		});

		expect(response.headers['content-security-policy']).toContain("default-src 'self'");

		await app.close();
	});
});
