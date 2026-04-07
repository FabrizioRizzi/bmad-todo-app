import { afterAll, beforeAll, describe, expect, it } from 'vitest';
import { buildApp } from './app.js';

describe('app', () => {
	let app: Awaited<ReturnType<typeof buildApp>>;

	beforeAll(async () => {
		app = await buildApp({ logger: false });
		await app.ready();
	});

	afterAll(async () => {
		await app.close();
	});

	it('should build without error', () => {
		expect(app).toBeDefined();
	});

	it('should respond with 200 on GET /documentation', async () => {
		const response = await app.inject({
			method: 'GET',
			url: '/documentation/',
		});

		expect(response.statusCode).toBe(200);
		expect(response.headers['content-type']).toContain('text/html');
	});

	it('should return 404 in normalized error shape for unknown routes', async () => {
		const response = await app.inject({
			method: 'GET',
			url: '/nonexistent-route',
		});

		expect(response.statusCode).toBe(404);

		const body = response.json();
		expect(body).toHaveProperty('statusCode', 404);
		expect(body).toMatchObject({ error: 'Not Found' });
		expect(body).toHaveProperty('message');
	});

	it('should include CORS headers in responses', async () => {
		const response = await app.inject({
			method: 'OPTIONS',
			url: '/',
			headers: {
				origin: 'http://localhost:5173',
				'access-control-request-method': 'GET',
			},
		});

		expect(response.headers['access-control-allow-origin']).toBeDefined();
	});

	it('should include security headers from helmet', async () => {
		const response = await app.inject({
			method: 'GET',
			url: '/documentation/',
		});

		expect(response.headers['x-content-type-options']).toBe('nosniff');
		expect(response.headers['x-frame-options']).toBe('SAMEORIGIN');
	});
});
