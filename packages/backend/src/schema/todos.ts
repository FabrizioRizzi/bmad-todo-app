import { boolean, date, pgTable, text, timestamp, uuid } from 'drizzle-orm/pg-core';

export const todos = pgTable('todos', {
	id: uuid('id').primaryKey().defaultRandom(),
	description: text('description').notNull(),
	isCompleted: boolean('is_completed').default(false).notNull(),
	createdAt: timestamp('created_at').defaultNow().notNull(),
	dueDate: date('due_date'),
	userId: uuid('user_id'),
});
