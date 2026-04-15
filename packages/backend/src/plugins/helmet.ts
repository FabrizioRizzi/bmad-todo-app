import helmet from '@fastify/helmet';
import fp from 'fastify-plugin';
import { env } from '../config/env.js';

export default fp(
	async (fastify) => {
		await fastify.register(helmet, {
			contentSecurityPolicy: env.enableDocumentation
				? false
				: {
						directives: {
							defaultSrc: ["'self'"],
							baseUri: ["'self'"],
							fontSrc: ["'self'", 'data:'],
							imgSrc: ["'self'", 'data:'],
							objectSrc: ["'none'"],
							scriptSrc: ["'self'"],
							styleSrc: ["'self'", "'unsafe-inline'"],
							upgradeInsecureRequests: [],
						},
					},
		});
	},
	{ name: 'helmet' },
);
