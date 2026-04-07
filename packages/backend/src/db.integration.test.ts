import { sql } from 'drizzle-orm';
import { afterAll, beforeAll, describe, expect, it } from 'vitest';
import { buildApp } from './app.js';
import dbPlugin from './plugins/db.js';

describe('database integration', () => {
	let app: Awaited<ReturnType<typeof buildApp>>;

	beforeAll(async () => {
		app = await buildApp({ logger: false });
		await app.register(dbPlugin);
		await app.ready();
	});

	afterAll(async () => {
		await app.close();
	});

	it('executes a trivial query through the Drizzle pool', async () => {
		const rows = await app.db.execute(sql`SELECT 1 AS one`);
		expect(rows[0]).toEqual({ one: 1 });
	});
});
