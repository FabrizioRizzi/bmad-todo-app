/**
 * Dev helper: replace all todos with 3 active + 1 completed (filter / layout testing).
 * Requires DATABASE_URL and migrated DB. Run: pnpm --filter backend db:seed:demo
 */
import { drizzle } from 'drizzle-orm/postgres-js';
import postgres from 'postgres';
import { env } from '../config/env.js';
import { todos } from '../schema/todos.js';

const client = postgres(env.DATABASE_URL);
const db = drizzle(client, { schema: { todos } });

try {
	await db.delete(todos);
	await db.insert(todos).values([
		{
			description: 'Active task one',
			isCompleted: false,
			createdAt: new Date('2026-01-01T12:00:00.000Z'),
		},
		{
			description: 'Active task two',
			isCompleted: false,
			createdAt: new Date('2026-01-02T12:00:00.000Z'),
		},
		{
			description: 'Active task three',
			isCompleted: false,
			createdAt: new Date('2026-01-03T12:00:00.000Z'),
		},
		{
			description: 'Completed task',
			isCompleted: true,
			createdAt: new Date('2026-01-04T12:00:00.000Z'),
		},
	]);
	console.log('Seeded 3 active + 1 completed todos.');
} finally {
	await client.end();
}
