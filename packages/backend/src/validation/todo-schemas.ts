import { z } from 'zod';

export const createTodoBodySchema = z.object({
	description: z.string(),
	isCompleted: z.boolean().optional().default(false),
	dueDate: z.union([z.iso.date(), z.null()]).optional(),
});

export const todoResponseSchema = z.object({
	id: z.uuid(),
	description: z.string(),
	isCompleted: z.boolean(),
	createdAt: z.iso.datetime(),
	dueDate: z.string().nullable(),
});

export const todoListResponseSchema = z.array(todoResponseSchema);

/** POST /api/todos when description is empty or whitespace only (exact epic error shape). */
export const descriptionRequiredErrorSchema = z.object({
	statusCode: z.literal(400),
	error: z.literal('Bad Request'),
	message: z.literal('Description is required'),
});

/** Global handler shape for malformed body / wrong types (message prefixed with "Validation error: "). */
export const zodBodyValidationErrorSchema = z.object({
	statusCode: z.literal(400),
	error: z.literal('Bad Request'),
	message: z.string(),
});

/** POST /api/todos — 400 responses: trim validation (exact message) or Zod structural validation. */
export const postTodo400ResponseSchema = z.union([
	descriptionRequiredErrorSchema,
	zodBodyValidationErrorSchema,
]);

export type CreateTodoBody = z.infer<typeof createTodoBodySchema>;
export type TodoResponse = z.infer<typeof todoResponseSchema>;
export type TodoListResponse = z.infer<typeof todoListResponseSchema>;
