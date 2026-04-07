import { afterAll, beforeAll, beforeEach, describe, expect, it } from 'vitest';
import { buildApp } from '../app.js';
import dbPlugin from '../plugins/db.js';
import { todos } from '../schema/todos.js';
import todoRoutes from './todo-routes.js';

describe('todo routes', () => {
	let app: Awaited<ReturnType<typeof buildApp>>;

	beforeAll(async () => {
		app = await buildApp({ logger: false });
		await app.register(dbPlugin);
		await app.register(todoRoutes);
		await app.ready();
	});

	afterAll(async () => {
		await app.close();
	});

	beforeEach(async () => {
		await app.db.delete(todos);
	});

	it('POST /api/todos returns 201 with camelCase DTO and no userId', async () => {
		const response = await app.inject({
			method: 'POST',
			url: '/api/todos',
			payload: { description: 'Buy groceries' },
		});

		expect(response.statusCode).toBe(201);
		const body = response.json();
		expect(body).toMatchObject({
			description: 'Buy groceries',
			isCompleted: false,
			dueDate: null,
		});
		expect(body.id).toMatch(
			/^[0-9a-f]{8}-[0-9a-f]{4}-[1-5][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i,
		);
		expect(body.createdAt).toMatch(/^\d{4}-\d{2}-\d{2}T/);
		expect(body).not.toHaveProperty('userId');
		expect(Object.keys(body).sort()).toEqual(
			['createdAt', 'description', 'dueDate', 'id', 'isCompleted'].sort(),
		);
	});

	it('POST /api/todos accepts isCompleted and dueDate', async () => {
		const response = await app.inject({
			method: 'POST',
			url: '/api/todos',
			payload: {
				description: 'Ship release',
				isCompleted: true,
				dueDate: '2026-04-15',
			},
		});

		expect(response.statusCode).toBe(201);
		expect(response.json()).toMatchObject({
			description: 'Ship release',
			isCompleted: true,
			dueDate: '2026-04-15',
		});
	});

	it('GET /api/todos returns 200 with array of todos ordered by createdAt ASC', async () => {
		const first = await app.inject({
			method: 'POST',
			url: '/api/todos',
			payload: { description: 'First' },
		});
		const second = await app.inject({
			method: 'POST',
			url: '/api/todos',
			payload: { description: 'Second' },
		});
		const idFirst = first.json().id as string;
		const idSecond = second.json().id as string;

		const response = await app.inject({
			method: 'GET',
			url: '/api/todos',
		});

		expect(response.statusCode).toBe(200);
		const body = response.json() as Array<Record<string, unknown>>;
		expect(Array.isArray(body)).toBe(true);
		expect(body).toHaveLength(2);
		expect(body[0].id).toBe(idFirst);
		expect(body[1].id).toBe(idSecond);
		for (const item of body) {
			expect(item).not.toHaveProperty('userId');
			expect(item).toHaveProperty('isCompleted');
			expect(item).toHaveProperty('createdAt');
			expect(item).toHaveProperty('dueDate');
			expect(Object.keys(item).sort()).toEqual(
				['createdAt', 'description', 'dueDate', 'id', 'isCompleted'].sort(),
			);
		}
	});

	it('GET /api/todos returns 200 with empty array when no todos', async () => {
		const response = await app.inject({
			method: 'GET',
			url: '/api/todos',
		});

		expect(response.statusCode).toBe(200);
		expect(response.json()).toEqual([]);
	});

	it('POST /api/todos with empty description returns 400 with exact message', async () => {
		const response = await app.inject({
			method: 'POST',
			url: '/api/todos',
			payload: { description: '' },
		});

		expect(response.statusCode).toBe(400);
		expect(response.json()).toEqual({
			statusCode: 400,
			error: 'Bad Request',
			message: 'Description is required',
		});

		const count = await app.db.select().from(todos);
		expect(count).toHaveLength(0);
	});

	it('POST /api/todos with whitespace-only description returns 400 with exact message', async () => {
		const response = await app.inject({
			method: 'POST',
			url: '/api/todos',
			payload: { description: '   ' },
		});

		expect(response.statusCode).toBe(400);
		expect(response.json()).toEqual({
			statusCode: 400,
			error: 'Bad Request',
			message: 'Description is required',
		});

		const rows = await app.db.select().from(todos);
		expect(rows).toHaveLength(0);
	});

	it('POST /api/todos with missing description returns validation error from global handler', async () => {
		const response = await app.inject({
			method: 'POST',
			url: '/api/todos',
			payload: {},
		});

		expect(response.statusCode).toBe(400);
		const body = response.json() as { statusCode: number; error: string; message: string };
		expect(body.statusCode).toBe(400);
		expect(body.error).toBe('Bad Request');
		expect(body.message.startsWith('Validation error:')).toBe(true);
	});

	it('POST /api/todos with wrong type for description returns validation error from global handler', async () => {
		const response = await app.inject({
			method: 'POST',
			url: '/api/todos',
			payload: { description: 123 },
		});

		expect(response.statusCode).toBe(400);
		const body = response.json() as { statusCode: number; error: string; message: string };
		expect(body.statusCode).toBe(400);
		expect(body.error).toBe('Bad Request');
		expect(body.message.startsWith('Validation error:')).toBe(true);
	});

	it('POST /api/todos strips unknown body fields', async () => {
		const response = await app.inject({
			method: 'POST',
			url: '/api/todos',
			payload: { description: 'Valid', extraField: 'strip me' },
		});

		expect(response.statusCode).toBe(201);
		expect(response.json()).not.toHaveProperty('extraField');
	});
});
