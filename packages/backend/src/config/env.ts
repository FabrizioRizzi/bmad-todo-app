import { fileURLToPath } from 'node:url';
import { config } from 'dotenv';
import { z } from 'zod';

config({ path: fileURLToPath(new URL('../../.env', import.meta.url)) });

function parseOptionalBoolean(value: string | undefined): boolean | undefined {
	if (value === undefined) return undefined;
	const normalized = value.trim().toLowerCase();
	if (normalized === 'true') return true;
	if (normalized === 'false') return false;
	return undefined;
}

const envSchema = z
	.object({
		DATABASE_URL: z.string().min(1, 'DATABASE_URL is required'),
		DATABASE_URL_TEST: z.string().optional(),
		PORT: z.coerce.number().default(3000),
		NODE_ENV: z.enum(['development', 'production', 'test']).default('development'),
		ALLOWED_ORIGINS: z.string().optional(),
		ENABLE_DOCUMENTATION: z.string().optional(),
	})
	.superRefine((data, ctx) => {
		if (
			data.ENABLE_DOCUMENTATION !== undefined &&
			parseOptionalBoolean(data.ENABLE_DOCUMENTATION) === undefined
		) {
			ctx.addIssue({
				code: 'custom',
				message: 'ENABLE_DOCUMENTATION must be set to true or false',
				path: ['ENABLE_DOCUMENTATION'],
			});
		}
		if (data.NODE_ENV !== 'production') return;
		const origins =
			data.ALLOWED_ORIGINS?.split(',')
				.map((s) => s.trim())
				.filter(Boolean) ?? [];
		if (origins.length === 0) {
			ctx.addIssue({
				code: 'custom',
				message:
					'ALLOWED_ORIGINS is required when NODE_ENV is production (comma-separated origins)',
				path: ['ALLOWED_ORIGINS'],
			});
		}
	});

export type Env = z.infer<typeof envSchema> & {
	allowedOriginsList: string[];
	enableDocumentation: boolean;
};

const _env = envSchema.parse(process.env);

export const env: Env = {
	..._env,
	allowedOriginsList: (_env.ALLOWED_ORIGINS ?? '')
		.split(',')
		.map((s) => s.trim())
		.filter(Boolean),
	enableDocumentation:
		parseOptionalBoolean(_env.ENABLE_DOCUMENTATION) ?? _env.NODE_ENV !== 'production',
};
