import fp from 'fastify-plugin';
import {
	hasZodFastifySchemaValidationErrors,
	isResponseSerializationError,
} from 'fastify-type-provider-zod';
import { env } from '../config/env.js';

type ErrorWithStatus = Error & { statusCode?: number };

const STATUS_TO_ERROR: Record<number, string> = {
	400: 'Bad Request',
	401: 'Unauthorized',
	403: 'Forbidden',
	404: 'Not Found',
	405: 'Method Not Allowed',
	409: 'Conflict',
	422: 'Unprocessable Entity',
	429: 'Too Many Requests',
};

function errorPhraseForStatus(statusCode: number): string {
	if (statusCode >= 500) return 'Internal Server Error';
	return STATUS_TO_ERROR[statusCode] ?? 'Error';
}

function asErrorWithStatus(error: unknown): ErrorWithStatus {
	if (error instanceof Error) {
		return error as ErrorWithStatus;
	}
	return Object.assign(new Error(typeof error === 'string' ? error : 'Unknown error'), {
		statusCode: 500,
	});
}

export default fp(
	async (fastify) => {
		fastify.setErrorHandler((error, _request, reply) => {
			if (hasZodFastifySchemaValidationErrors(error)) {
				const details = error.validation.map((v) => v.message);
				return reply.status(400).send({
					statusCode: 400,
					error: 'Bad Request',
					message: `Validation error: ${details.join('; ')}`,
				});
			}

			if (isResponseSerializationError(error)) {
				fastify.log.error(error, 'Response serialization error');
				return reply.status(500).send({
					statusCode: 500,
					error: 'Internal Server Error',
					message: 'Response validation failed',
				});
			}

			const err = asErrorWithStatus(error);
			const statusCode = err.statusCode ?? 500;
			const errorName = errorPhraseForStatus(statusCode);

			if (statusCode >= 500) {
				fastify.log.error(err);
			}

			return reply.status(statusCode).send({
				statusCode,
				error: errorName,
				message:
					env.NODE_ENV === 'production' && statusCode >= 500
						? 'Internal Server Error'
						: err.message,
			});
		});
	},
	{ name: 'error-handler' },
);
