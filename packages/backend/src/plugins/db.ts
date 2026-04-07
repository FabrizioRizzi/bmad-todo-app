import type { PostgresJsDatabase } from 'drizzle-orm/postgres-js';
import { drizzle } from 'drizzle-orm/postgres-js';
import type { FastifyInstance } from 'fastify';
import fp from 'fastify-plugin';
import postgres from 'postgres';
import { env } from '../config/env.js';
import * as schema from '../schema/todos.js';

declare module 'fastify' {
	interface FastifyInstance {
		db: PostgresJsDatabase<typeof schema>;
	}
}

export default fp(
	async (fastify: FastifyInstance) => {
		const client = postgres(env.DATABASE_URL);
		const db = drizzle(client, { schema });

		fastify.decorate('db', db);

		fastify.addHook('onClose', async () => {
			await client.end();
		});
	},
	{ name: 'db' },
);
