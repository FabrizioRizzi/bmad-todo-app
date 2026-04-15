import cors from '@fastify/cors';
import fp from 'fastify-plugin';
import { env } from '../config/env.js';

export default fp(
	async (fastify) => {
		const allowlist = env.NODE_ENV === 'production' ? env.allowedOriginsList : null;

		await fastify.register(cors, {
			origin: (origin, cb) => {
				if (allowlist === null) {
					cb(null, true);
					return;
				}
				if (!origin) {
					cb(null, false);
					return;
				}
				cb(null, allowlist.includes(origin));
			},
			credentials: true,
		});
	},
	{ name: 'cors' },
);
