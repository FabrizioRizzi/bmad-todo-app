import { asc } from 'drizzle-orm';
import fp from 'fastify-plugin';
import type { FastifyPluginAsyncZod } from 'fastify-type-provider-zod';
import { todos } from '../schema/todos.js';
import {
	createTodoBodySchema,
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
};

export default fp(todoRoutesPlugin, { name: 'todo-routes' });
