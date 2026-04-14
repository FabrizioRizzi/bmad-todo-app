import { fileURLToPath } from 'node:url';
import { drizzle } from 'drizzle-orm/postgres-js';
import { migrate } from 'drizzle-orm/postgres-js/migrator';
import postgres from 'postgres';

export default async function setupTestDb() {
	const databaseUrl =
		process.env.DATABASE_URL_TEST?.trim() ||
		process.env.DATABASE_URL?.trim() ||
		'postgresql://postgres:postgres@localhost:5433/bmad_todo_test';

	const client = postgres(databaseUrl, { max: 1 });

	try {
		const db = drizzle(client);
		await migrate(db, {
			migrationsFolder: fileURLToPath(new URL('../schema/migrations', import.meta.url)),
		});
	} finally {
		await client.end();
	}
}
