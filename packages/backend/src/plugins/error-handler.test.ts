import { afterEach, describe, expect, it, vi } from 'vitest';
import { z } from 'zod';

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

describe('error handler plugin', () => {
	it('returns validation details outside production', async () => {
		const app = await buildTestApp({ NODE_ENV: 'test' });
		app.get(
			'/validation',
			{
				schema: {
					querystring: z.object({
						limit: z.coerce.number().min(2),
					}),
				},
			},
			async () => ({ ok: true }),
		);
		await app.ready();

		const response = await app.inject({
			method: 'GET',
			url: '/validation?limit=1',
		});

		expect(response.statusCode).toBe(400);
		expect(response.json()).toMatchObject({
			statusCode: 400,
			error: 'Bad Request',
		});
		expect(response.json().message).toContain('Validation error:');

		await app.close();
	});

	it('masks validation details in production', async () => {
		const app = await buildTestApp({
			NODE_ENV: 'production',
			ALLOWED_ORIGINS: 'https://example.com',
			ENABLE_DOCUMENTATION: 'false',
		});
		app.get(
			'/validation',
			{
				schema: {
					querystring: z.object({
						limit: z.coerce.number().min(2),
					}),
				},
			},
			async () => ({ ok: true }),
		);
		await app.ready();

		const response = await app.inject({
			method: 'GET',
			url: '/validation?limit=1',
		});

		expect(response.statusCode).toBe(400);
		expect(response.json()).toEqual({
			statusCode: 400,
			error: 'Bad Request',
			message: 'Request validation failed',
		});

		await app.close();
	});

	it('keeps mapped status codes for expected application errors', async () => {
		const app = await buildTestApp({ NODE_ENV: 'test' });
		app.get('/conflict', async () => {
			const error = new Error('Todo already exists') as Error & { statusCode?: number };
			error.statusCode = 409;
			throw error;
		});
		await app.ready();

		const response = await app.inject({
			method: 'GET',
			url: '/conflict',
		});

		expect(response.statusCode).toBe(409);
		expect(response.json()).toEqual({
			statusCode: 409,
			error: 'Conflict',
			message: 'Todo already exists',
		});

		await app.close();
	});

	it('masks unexpected 500 errors in production', async () => {
		const app = await buildTestApp({
			NODE_ENV: 'production',
			ALLOWED_ORIGINS: 'https://example.com',
			ENABLE_DOCUMENTATION: 'false',
		});
		app.get('/boom', async () => {
			throw new Error('database exploded');
		});
		await app.ready();

		const response = await app.inject({
			method: 'GET',
			url: '/boom',
		});

		expect(response.statusCode).toBe(500);
		expect(response.json()).toEqual({
			statusCode: 500,
			error: 'Internal Server Error',
			message: 'Internal Server Error',
		});

		await app.close();
	});

	it('normalizes response serialization failures', async () => {
		const app = await buildTestApp({ NODE_ENV: 'test' });
		app.get(
			'/bad-response',
			{
				schema: {
					response: {
						200: z.object({
							name: z.string(),
						}),
					},
				},
			},
			async () => ({ invalid: true }) as unknown as { name: string },
		);
		await app.ready();

		const response = await app.inject({
			method: 'GET',
			url: '/bad-response',
		});

		expect(response.statusCode).toBe(500);
		expect(response.json()).toEqual({
			statusCode: 500,
			error: 'Internal Server Error',
			message: 'Response validation failed',
		});

		await app.close();
	});
});
