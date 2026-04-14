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
		const databaseUrl =
			env.NODE_ENV === 'test' ? (env.DATABASE_URL_TEST ?? env.DATABASE_URL) : env.DATABASE_URL;
		const client = postgres(databaseUrl);
		const db = drizzle(client, { schema });

		fastify.decorate('db', db);

		fastify.addHook('onClose', async () => {
			await client.end();
		});
	},
	{ name: 'db' },
);
