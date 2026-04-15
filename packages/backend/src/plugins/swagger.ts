import swagger from '@fastify/swagger';
import swaggerUi from '@fastify/swagger-ui';
import fp from 'fastify-plugin';
import { jsonSchemaTransform } from 'fastify-type-provider-zod';
import { env } from '../config/env.js';

export default fp(
	async (fastify) => {
		await fastify.register(swagger, {
			openapi: {
				info: {
					title: 'BMad Todo API',
					description: 'RESTful API for the BMad Todo application',
					version: '1.0.0',
				},
			},
			transform: jsonSchemaTransform,
		});

		if (env.enableDocumentation) {
			await fastify.register(swaggerUi, {
				routePrefix: '/documentation',
			});
		}
	},
	{ name: 'swagger' },
);
