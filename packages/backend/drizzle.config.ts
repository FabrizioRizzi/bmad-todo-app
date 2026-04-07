import { fileURLToPath } from 'node:url';
import { config } from 'dotenv';
import { defineConfig } from 'drizzle-kit';

config({ path: fileURLToPath(new URL('.env', import.meta.url)) });

const databaseUrl = process.env.DATABASE_URL?.trim();
if (!databaseUrl) {
	throw new Error('DATABASE_URL is required for Drizzle Kit (generate / migrate).');
}

export default defineConfig({
	schema: './src/schema/todos.ts',
	out: './src/schema/migrations',
	dialect: 'postgresql',
	dbCredentials: {
		url: databaseUrl,
	},
});
