import Fastify from 'fastify';
import {
	serializerCompiler,
	validatorCompiler,
	type ZodTypeProvider,
} from 'fastify-type-provider-zod';
import corsPlugin from './plugins/cors.js';
import errorHandlerPlugin from './plugins/error-handler.js';
import helmetPlugin from './plugins/helmet.js';
import swaggerPlugin from './plugins/swagger.js';

export async function buildApp(opts: { logger?: boolean } = {}) {
	const app = Fastify({
		logger: opts.logger ?? true,
	}).withTypeProvider<ZodTypeProvider>();

	app.setValidatorCompiler(validatorCompiler);
	app.setSerializerCompiler(serializerCompiler);

	await app.register(corsPlugin);
	await app.register(helmetPlugin);
	await app.register(swaggerPlugin);
	await app.register(errorHandlerPlugin);

	return app;
}
