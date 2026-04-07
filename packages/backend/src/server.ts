import { buildApp } from './app.js';
import { env } from './config/env.js';
import dbPlugin from './plugins/db.js';

async function start() {
	const app = await buildApp();

	await app.register(dbPlugin);

	await app.listen({ port: env.PORT, host: '0.0.0.0' });
}

start().catch((err) => {
	console.error('Failed to start server:', err);
	process.exit(1);
});
