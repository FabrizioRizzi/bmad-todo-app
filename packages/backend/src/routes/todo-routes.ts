import { asc, eq } from 'drizzle-orm';
import fp from 'fastify-plugin';
import type { FastifyPluginAsyncZod } from 'fastify-type-provider-zod';
import { z } from 'zod';
import { todos } from '../schema/todos.js';
import {
	createTodoBodySchema,
	patchTodoBodySchema,
	postTodo400ResponseSchema,
	todoListResponseSchema,
	todoResponseSchema,
} from '../validation/todo-schemas.js';

type TodoRow = typeof todos.$inferSelect;

export function toTodoDto(row: TodoRow) {
	const { userId: _omitUserId, ...rest } = row;
	return {
		id: rest.id,
		description: rest.description,
		isCompleted: rest.isCompleted,
		createdAt: rest.createdAt.toISOString(),
		dueDate: rest.dueDate ?? null,
	};
}

const todoRoutesPlugin: FastifyPluginAsyncZod = async (fastify) => {
	fastify.post(
		'/api/todos',
		{
			schema: {
				body: createTodoBodySchema,
				response: {
					201: todoResponseSchema,
					400: postTodo400ResponseSchema,
				},
			},
		},
		async (request, reply) => {
			const { description, isCompleted, dueDate } = request.body;
			const trimmed = description.trim();
			if (trimmed.length === 0) {
				return reply.status(400).send({
					statusCode: 400,
					error: 'Bad Request',
					message: 'Description is required',
				});
			}

			const [row] = await fastify.db
				.insert(todos)
				.values({
					description: trimmed,
					isCompleted,
					dueDate: dueDate ?? null,
				})
				.returning();
			if (!row) {
				throw new Error('Insert did not return a row');
			}

			return reply.status(201).send(toTodoDto(row));
		},
	);

	fastify.get(
		'/api/todos',
		{
			schema: {
				response: {
					200: todoListResponseSchema,
				},
			},
		},
		async (_request, reply) => {
			const rows = await fastify.db
				.select()
				.from(todos)
				.orderBy(asc(todos.createdAt), asc(todos.id));
			return reply.status(200).send(rows.map(toTodoDto));
		},
	);

	fastify.patch(
		'/api/todos/:id',
		{
			schema: {
				params: z.object({ id: z.uuid() }),
				body: patchTodoBodySchema,
				response: {
					200: todoResponseSchema,
					400: z.object({
						statusCode: z.literal(400),
						error: z.literal('Bad Request'),
						message: z.string(),
					}),
					404: z.object({
						statusCode: z.literal(404),
						error: z.literal('Not Found'),
						message: z.literal('Todo not found'),
					}),
				},
			},
		},
		async (request, reply) => {
			const { id } = request.params;
			const { isCompleted } = request.body;

			const [row] = await fastify.db
				.update(todos)
				.set({ isCompleted })
				.where(eq(todos.id, id))
				.returning();

			if (!row) {
				return reply.status(404).send({
					statusCode: 404,
					error: 'Not Found',
					message: 'Todo not found',
				});
			}

			return reply.status(200).send(toTodoDto(row));
		},
	);

	fastify.delete(
		'/api/todos/:id',
		{
			schema: {
				params: z.object({ id: z.uuid() }),
				response: {
					204: z.undefined(),
					404: z.object({
						statusCode: z.literal(404),
						error: z.literal('Not Found'),
						message: z.literal('Todo not found'),
					}),
				},
			},
		},
		async (request, reply) => {
			const { id } = request.params;

			const deleted = await fastify.db
				.delete(todos)
				.where(eq(todos.id, id))
				.returning({ id: todos.id });

			if (deleted.length === 0) {
				return reply.status(404).send({
					statusCode: 404,
					error: 'Not Found',
					message: 'Todo not found',
				});
			}

			return reply.status(204).send();
		},
	);
};

export default fp(todoRoutesPlugin, { name: 'todo-routes' });
